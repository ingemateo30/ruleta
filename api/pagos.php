<?php
require_once 'auth_middleware.php';
require_once 'db.php';

// Cualquier usuario autenticado puede acceder
$currentUser = initApiSecurity(true, ['0', '1', '2']);

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$uriParts = explode('/', trim(parse_url($uri, PHP_URL_PATH), '/'));

// Obtener sucursal del operario (null para admins)
$sucursalOperario = getOperatorSucursal($currentUser);

try {
    $db = Database::getInstance()->getConnection();

    // GET /api/pagos.php/buscar-ganadores - Buscar jugadas ganadoras
    if ($method === 'GET' && end($uriParts) === 'buscar-ganadores') {
        $radicado = $_GET['radicado'] ?? '';
        $fecha = $_GET['fecha'] ?? '';

        if (empty($radicado) && empty($fecha)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Debe proporcionar radicado o fecha'
            ]);
            exit;
        }

        $sql = "
           SELECT DISTINCT
                j.RADICADO,
                j.FECHA as FECHA_JUGADA,
                j.HORA as HORA_JUGADA,
                j.SUCURSAL,
                b.BODEGA as NOMBRE_SUCURSAL,
                j.USUARIO,
                h.CODANIMAL,
                h.ANIMAL,
                h.VALOR as VALOR_APOSTADO,
                h.CODIGOJ,
                h.HORAJUEGO,
                h.DESJUEGO,
                g.CODIGOA as ANIMAL_GANADOR,
                g.ANIMAL as NOMBRE_GANADOR,
                g.FECHA as FECHA_SORTEO,
                p.PUNTOSPAGO,
                (h.VALOR * p.PUNTOSPAGO) as VALOR_GANADO,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM pagos
                        WHERE RADICADO = j.RADICADO
                        AND CODANIMAL = h.CODANIMAL
                        AND CODIGOJ = h.CODIGOJ
                        AND FECHA_SORTEO = g.FECHA
                        AND ESTADO = 'A'
                    ) THEN 'PAGADO'
                    ELSE 'PENDIENTE'
                END as ESTADO_PAGO,
                pg.FECHA_PAGO,
                pg.USUARIO_PAGO
            FROM jugarlotto j
            JOIN hislottojuego h ON j.RADICADO = h.RADICADO AND h.FECHA = j.FECHA
            JOIN ingresarganadores g ON h.CODANIMAL = g.CODIGOA
                AND h.CODIGOJ = g.CODIGOH
                AND DATE(j.FECHA) = g.FECHA
            LEFT JOIN bodegas b ON j.SUCURSAL = b.CODIGO
            LEFT JOIN pagos pg ON j.RADICADO = pg.RADICADO
                AND h.CODANIMAL = pg.CODANIMAL
                AND h.CODIGOJ = pg.CODIGOJ
                AND g.FECHA = pg.FECHA_SORTEO
                AND pg.ESTADO = 'A'
            CROSS JOIN (SELECT VALOR as PUNTOSPAGO FROM parametros WHERE NOMBRE = 'PUNTOSPAGO' LIMIT 1) p
            WHERE j.ESTADO = 'A'
            AND h.ESTADOP = 'A'
            AND h.ESTADOC = 'A'
        ";

        $params = [];

        // Filtro por sucursal para operarios
        if ($sucursalOperario !== null) {
            $sql .= " AND j.SUCURSAL = ?";
            $params[] = $sucursalOperario;
        }

        if (!empty($radicado)) {
            $sql .= " AND j.RADICADO = ?";
            $params[] = $radicado;
        } else {
            $sql .= " AND DATE(g.FECHA) = ?";
            $params[] = $fecha;
        }

        $sql .= " ORDER BY g.FECHA DESC, j.HORA DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $ganadores = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $ganadores
        ]);
    }

    // POST /api/pagos.php/realizar-pago - Realizar pago a ganador
    elseif ($method === 'POST' && end($uriParts) === 'realizar-pago') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['radicado']) || empty($data['usuario'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Radicado y usuario son requeridos'
            ]);
            exit;
        }

        $db->beginTransaction();

        try {
            // Buscar jugadas ganadoras pendientes de pago
            $sqlPago = "
                SELECT DISTINCT
                    j.RADICADO,
                    j.FECHA as FECHA_JUGADA,
                    j.HORA as HORA_JUGADA,
                    j.SUCURSAL,
                    j.USUARIO as USUARIO_JUGADA,
                    h.CODANIMAL,
                    h.ANIMAL,
                    h.VALOR as VALOR_APOSTADO,
                    h.CODIGOJ,
                    h.HORAJUEGO,
                    g.FECHA as FECHA_SORTEO,
                    p.PUNTOSPAGO,
                    (h.VALOR * p.PUNTOSPAGO) as VALOR_GANADO
                FROM jugarlotto j
                JOIN hislottojuego h ON j.RADICADO = h.RADICADO AND h.FECHA = j.FECHA
                JOIN ingresarganadores g ON h.CODANIMAL = g.CODIGOA
                    AND h.CODIGOJ = g.CODIGOH
                    AND DATE(j.FECHA) = g.FECHA
                CROSS JOIN (SELECT VALOR as PUNTOSPAGO FROM parametros WHERE NOMBRE = 'PUNTOSPAGO' LIMIT 1) p
                WHERE j.RADICADO = ?
                AND j.ESTADO = 'A'
                AND h.ESTADOP = 'A'
                AND h.ESTADOC = 'A'
                AND NOT EXISTS (
                    SELECT 1 FROM pagos
                    WHERE RADICADO = j.RADICADO
                    AND CODANIMAL = h.CODANIMAL
                    AND CODIGOJ = h.CODIGOJ
                    AND FECHA_SORTEO = g.FECHA
                    AND ESTADO = 'A'
                )
            ";
            $paramsPago = [$data['radicado']];

            if ($sucursalOperario !== null) {
                $sqlPago .= " AND j.SUCURSAL = ?";
                $paramsPago[] = $sucursalOperario;
            }

            $stmt = $db->prepare($sqlPago);
            $stmt->execute($paramsPago);
            $ganadores = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($ganadores)) {
                $db->rollBack();
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'No hay jugadas ganadoras pendientes de pago para este radicado'
                ]);
                exit;
            }

            // Verificar que no hayan pasado más de 3 días
            $fechaSorteo = $ganadores[0]['FECHA_SORTEO'];
            $fechaLimite = date('Y-m-d', strtotime($fechaSorteo . ' +3 days'));
            $hoy = date('Y-m-d');

            if ($hoy > $fechaLimite) {
                $db->rollBack();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'El plazo de 3 días para cobrar este premio ha expirado'
                ]);
                exit;
            }

            $totalPagado = 0;
            $pagoIds = [];

            // Registrar cada pago con trazabilidad completa
            foreach ($ganadores as $ganador) {
                $stmt = $db->prepare("
                    INSERT INTO pagos (
                        RADICADO,
                        FECHA_JUGADA,
                        HORA_JUGADA,
                        FECHA_SORTEO,
                        CODANIMAL,
                        ANIMAL,
                        CODIGOJ,
                        HORAJUEGO,
                        VALOR_APOSTADO,
                        VALOR_GANADO,
                        SUCURSAL,
                        USUARIO_PAGO,
                        ESTADO,
                        FECHA_PAGO,
                        OBSERVACIONES
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'A', NOW(), ?)
                ");

                $stmt->execute([
                    $ganador['RADICADO'],
                    $ganador['FECHA_JUGADA'],
                    $ganador['HORA_JUGADA'],
                    $ganador['FECHA_SORTEO'],
                    $ganador['CODANIMAL'],
                    $ganador['ANIMAL'],
                    $ganador['CODIGOJ'],
                    $ganador['HORAJUEGO'],
                    $ganador['VALOR_APOSTADO'],
                    $ganador['VALOR_GANADO'],
                    $ganador['SUCURSAL'],
                    $data['usuario'],
                    $data['observaciones'] ?? null
                ]);

                $pagoId = $db->lastInsertId();
                $pagoIds[] = $pagoId;
                $totalPagado += $ganador['VALOR_GANADO'];

                // Actualizar el cierre correspondiente (incrementar pagos reales, reducir pendientes)
                $stmt = $db->prepare("
                    UPDATE cierrejuego
                    SET
                        TOTAL_PAGADO_REAL = TOTAL_PAGADO_REAL + ?,
                        PAGOS_PENDIENTES = PAGOS_PENDIENTES - ?,
                        UTILIDAD_REAL = UTILIDAD_REAL - ?
                    WHERE CODIGOH = ?
                    AND FECHA = ?
                    AND CODIGO_SUCURSAL = ?
                ");
                $stmt->execute([
                    $ganador['VALOR_GANADO'],
                    $ganador['VALOR_GANADO'],
                    $ganador['VALOR_GANADO'],
                    $ganador['CODIGOJ'],
                    $ganador['FECHA_SORTEO'],
                    $ganador['SUCURSAL']
                ]);
            }

            $db->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Pago realizado exitosamente',
                'data' => [
                    'pago_ids' => $pagoIds,
                    'total_pagado' => $totalPagado,
                    'cantidad_pagos' => count($pagoIds),
                    'fecha_sorteo' => $fechaSorteo,
                    'dias_restantes' => max(0, (strtotime($fechaLimite) - strtotime($hoy)) / 86400)
                ]
            ]);

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    // GET /api/pagos.php/listar - Listar todos los pagos
    elseif ($method === 'GET' && end($uriParts) === 'listar') {
        $fechaInicio = $_GET['fecha_inicio'] ?? '';
        $fechaFin = $_GET['fecha_fin'] ?? '';
        $sucursal = $_GET['sucursal'] ?? '';

        $sql = "
            SELECT
                p.*,
                b.BODEGA as NOMBRE_SUCURSAL
            FROM pagos p
            LEFT JOIN bodegas b ON p.SUCURSAL = b.CODIGO
            WHERE p.ESTADO = 'A'
        ";

        $params = [];

        if ($sucursalOperario !== null) {
            $sql .= " AND p.SUCURSAL = ?";
            $params[] = $sucursalOperario;
        }

        if (!empty($fechaInicio)) {
            $sql .= " AND p.FECHA_PAGO >= ?";
            $params[] = $fechaInicio;
        }

        if (!empty($fechaFin)) {
            $sql .= " AND p.FECHA_PAGO <= ?";
            $params[] = $fechaFin;
        }

        if (!empty($sucursal) && $sucursalOperario === null) {
            $sql .= " AND p.SUCURSAL = ?";
            $params[] = $sucursal;
        }

        $sql .= " ORDER BY p.FECHA_PAGO DESC LIMIT 500";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $pagos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $pagos
        ]);
    }

    // GET /api/pagos.php/estadisticas - Estadísticas de pagos
    elseif ($method === 'GET' && end($uriParts) === 'estadisticas') {
        $fecha = $_GET['fecha'] ?? date('Y-m-d');

        $sqlStats = "
            SELECT
                COUNT(*) as total_pagos,
                COUNT(DISTINCT RADICADO) as total_radicados,
                COALESCE(SUM(VALOR_GANADO), 0) as total_pagado,
                COALESCE(AVG(VALOR_GANADO), 0) as promedio_pago
            FROM pagos
            WHERE DATE(FECHA_PAGO) = ?
            AND ESTADO = 'A'
        ";
        $paramsStats = [$fecha];

        if ($sucursalOperario !== null) {
            $sqlStats .= " AND SUCURSAL = ?";
            $paramsStats[] = $sucursalOperario;
        }

        $stmt = $db->prepare($sqlStats);
        $stmt->execute($paramsStats);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $stats
        ]);
    }

    // GET /api/pagos.php/proximos-a-vencer - Pagos que están próximos a vencer (3 días)
    elseif ($method === 'GET' && end($uriParts) === 'proximos-a-vencer') {
        $sql = "
            SELECT DISTINCT
                j.RADICADO,
                j.FECHA as FECHA_JUGADA,
                g.FECHA as FECHA_SORTEO,
                DATE_ADD(g.FECHA, INTERVAL 3 DAY) as FECHA_LIMITE,
                DATEDIFF(DATE_ADD(g.FECHA, INTERVAL 3 DAY), CURDATE()) as DIAS_RESTANTES,
                j.SUCURSAL,
                b.BODEGA as NOMBRE_SUCURSAL,
                COALESCE(SUM(h.VALOR * p.PUNTOSPAGO), 0) as TOTAL_A_PAGAR
            FROM jugarlotto j
            JOIN hislottojuego h ON j.RADICADO = h.RADICADO AND h.FECHA = j.FECHA
            JOIN ingresarganadores g ON h.CODANIMAL = g.CODIGOA
                AND h.CODIGOJ = g.CODIGOH
                AND DATE(j.FECHA) = g.FECHA
            LEFT JOIN bodegas b ON j.SUCURSAL = b.CODIGO
            CROSS JOIN (SELECT VALOR as PUNTOSPAGO FROM parametros WHERE NOMBRE = 'PUNTOSPAGO' LIMIT 1) p
            WHERE j.ESTADO = 'A'
            AND h.ESTADOP = 'A'
            AND h.ESTADOC = 'A'
            AND NOT EXISTS (
                SELECT 1 FROM pagos
                WHERE RADICADO = j.RADICADO
                AND CODANIMAL = h.CODANIMAL
                AND CODIGOJ = h.CODIGOJ
                AND FECHA_SORTEO = g.FECHA
                AND ESTADO = 'A'
            )
            AND DATEDIFF(DATE_ADD(g.FECHA, INTERVAL 3 DAY), CURDATE()) >= 0
            AND DATEDIFF(DATE_ADD(g.FECHA, INTERVAL 3 DAY), CURDATE()) <= 1
        ";

        $params = [];

        if ($sucursalOperario !== null) {
            $sql .= " AND j.SUCURSAL = ?";
            $params[] = $sucursalOperario;
        }

        $sql .= " GROUP BY j.RADICADO, j.FECHA, g.FECHA, j.SUCURSAL, b.BODEGA
                  ORDER BY DIAS_RESTANTES ASC, TOTAL_A_PAGAR DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $proximosAVencer = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $proximosAVencer
        ]);
    }

    else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Endpoint no encontrado'
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error del servidor: ' . $e->getMessage()
    ]);
}