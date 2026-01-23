<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$uriParts = explode('/', trim(parse_url($uri, PHP_URL_PATH), '/'));

try {
    $db = Database::getInstance()->getConnection();

    // GET /api/pagos.php/buscar-ganadores - Buscar jugadas ganadoras por radicado o fecha
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
            SELECT
                j.RADICADO,
                j.FECHA,
                j.HORA,
                j.SUCURSAL,
                b.BODEGA as NOMBRE_SUCURSAL,
                j.USUARIO,
                h.CODANIMAL,
                h.ANIMAL,
                h.VALOR as VALOR_APOSTADO,
                h.CODIGOJ,
                h.HORAJUEGO,
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
                        AND ESTADO = 'A'
                    ) THEN 'PAGADO'
                    ELSE 'PENDIENTE'
                END as ESTADO_PAGO
            FROM jugarlotto j
            JOIN hislottojuego h ON j.RADICADO = h.RADICADO
            JOIN ingresarganadores g ON h.CODANIMAL = g.CODIGOA
                AND h.CODIGOJ = g.CODIGOH
                AND DATE(j.FECHA) = g.FECHA
            LEFT JOIN bodegas b ON j.SUCURSAL = b.CODIGO
            CROSS JOIN (SELECT VALOR as PUNTOSPAGO FROM parametros WHERE NOMBRE = 'PUNTOSPAGO') p
            WHERE j.ESTADO = 'A'
            AND h.ESTADOP = 'A'
            AND h.ESTADOC = 'A'
        ";

        if (!empty($radicado)) {
            $sql .= " AND j.RADICADO = ?";
            $params = [$radicado];
        } else {
            $sql .= " AND DATE(j.FECHA) = ?";
            $params = [$fecha];
        }

        $sql .= " ORDER BY j.FECHA DESC, j.HORA DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $ganadores = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $ganadores
        ]);
    }

    // GET /api/pagos.php/verificar-ganador - Verificar si una jugada es ganadora
    elseif ($method === 'GET' && end($uriParts) === 'verificar-ganador') {
        $radicado = $_GET['radicado'] ?? '';

        if (empty($radicado)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Debe proporcionar el radicado'
            ]);
            exit;
        }

        // Buscar la jugada
        $stmt = $db->prepare("
            SELECT j.*, b.BODEGA as NOMBRE_SUCURSAL
            FROM jugarlotto j
            LEFT JOIN bodegas b ON j.SUCURSAL = b.CODIGO
            WHERE j.RADICADO = ? AND j.ESTADO = 'A'
        ");
        $stmt->execute([$radicado]);
        $jugada = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$jugada) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Jugada no encontrada o anulada'
            ]);
            exit;
        }

        // Buscar detalles y verificar si hay ganadores
        $stmt = $db->prepare("
            SELECT
                h.*,
                g.CODIGOA as ANIMAL_GANADOR,
                g.ANIMAL as NOMBRE_GANADOR,
                p.PUNTOSPAGO,
                (h.VALOR * p.PUNTOSPAGO) as VALOR_GANADO,
                CASE
                    WHEN g.CODIGOA IS NOT NULL THEN 'GANADOR'
                    ELSE 'PERDEDOR'
                END as RESULTADO,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM pagos
                        WHERE RADICADO = h.RADICADO
                        AND CODANIMAL = h.CODANIMAL
                        AND CODIGOJ = h.CODIGOJ
                        AND ESTADO = 'A'
                    ) THEN 'PAGADO'
                    ELSE 'PENDIENTE'
                END as ESTADO_PAGO
            FROM hislottojuego h
            LEFT JOIN ingresarganadores g ON h.CODANIMAL = g.CODIGOA
                AND h.CODIGOJ = g.CODIGOH
                AND DATE(?) = g.FECHA
            CROSS JOIN (SELECT VALOR as PUNTOSPAGO FROM parametros WHERE NOMBRE = 'PUNTOSPAGO') p
            WHERE h.RADICADO = ?
            AND h.ESTADOP = 'A'
            AND h.ESTADOC = 'A'
        ");
        $stmt->execute([$jugada['FECHA'], $radicado]);
        $detalles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calcular totales
        $totalApostado = array_sum(array_column($detalles, 'VALOR'));
        $totalGanado = 0;
        $hayGanador = false;

        foreach ($detalles as $detalle) {
            if ($detalle['RESULTADO'] === 'GANADOR') {
                $totalGanado += $detalle['VALOR_GANADO'];
                $hayGanador = true;
            }
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'jugada' => $jugada,
                'detalles' => $detalles,
                'resumen' => [
                    'total_apostado' => $totalApostado,
                    'total_ganado' => $totalGanado,
                    'hay_ganador' => $hayGanador,
                    'cantidad_apuestas' => count($detalles)
                ]
            ]
        ]);
    }

    // POST /api/pagos.php/realizar-pago - Realizar pago a ganador
    elseif ($method === 'POST' && end($uriParts) === 'realizar-pago') {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validaciones
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
            $stmt = $db->prepare("
                SELECT
                    j.RADICADO,
                    j.FECHA,
                    j.HORA,
                    j.SUCURSAL,
                    j.USUARIO as USUARIO_JUGADA,
                    h.CODANIMAL,
                    h.ANIMAL,
                    h.VALOR as VALOR_APOSTADO,
                    h.CODIGOJ,
                    h.HORAJUEGO,
                    p.PUNTOSPAGO,
                    (h.VALOR * p.PUNTOSPAGO) as VALOR_GANADO
                FROM jugarlotto j
                JOIN hislottojuego h ON j.RADICADO = h.RADICADO
                JOIN ingresarganadores g ON h.CODANIMAL = g.CODIGOA
                    AND h.CODIGOJ = g.CODIGOH
                    AND DATE(j.FECHA) = g.FECHA
                CROSS JOIN (SELECT VALOR as PUNTOSPAGO FROM parametros WHERE NOMBRE = 'PUNTOSPAGO') p
                WHERE j.RADICADO = ?
                AND j.ESTADO = 'A'
                AND h.ESTADOP = 'A'
                AND h.ESTADOC = 'A'
                AND NOT EXISTS (
                    SELECT 1 FROM pagos
                    WHERE RADICADO = j.RADICADO
                    AND CODANIMAL = h.CODANIMAL
                    AND CODIGOJ = h.CODIGOJ
                    AND ESTADO = 'A'
                )
            ");
            $stmt->execute([$data['radicado']]);
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

            $totalPagado = 0;
            $pagoIds = [];

            // Registrar cada pago
            foreach ($ganadores as $ganador) {
                $stmt = $db->prepare("
                    INSERT INTO pagos (
                        RADICADO, FECHA, HORA, CODANIMAL, ANIMAL,
                        CODIGOJ, HORAJUEGO, VALOR_APOSTADO, VALOR_GANADO,
                        SUCURSAL, USUARIO, ESTADO, FECHA_PAGO, OBSERVACIONES
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'A', NOW(), ?)
                ");

                $stmt->execute([
                    $ganador['RADICADO'],
                    $ganador['FECHA'],
                    $ganador['HORA'],
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

                $pagoIds[] = $db->lastInsertId();
                $totalPagado += $ganador['VALOR_GANADO'];
            }

            $db->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Pago realizado exitosamente',
                'data' => [
                    'pago_ids' => $pagoIds,
                    'total_pagado' => $totalPagado,
                    'cantidad_pagos' => count($pagoIds)
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
            WHERE 1=1
        ";

        $params = [];

        if (!empty($fechaInicio)) {
            $sql .= " AND p.FECHA >= ?";
            $params[] = $fechaInicio;
        }

        if (!empty($fechaFin)) {
            $sql .= " AND p.FECHA <= ?";
            $params[] = $fechaFin;
        }

        if (!empty($sucursal)) {
            $sql .= " AND p.SUCURSAL = ?";
            $params[] = $sucursal;
        }

        $sql .= " ORDER BY p.FECHA_PAGO DESC LIMIT 100";

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

        $stmt = $db->prepare("
            SELECT
                COUNT(*) as total_pagos,
                COUNT(DISTINCT RADICADO) as total_radicados,
                COALESCE(SUM(VALOR_GANADO), 0) as total_pagado,
                COALESCE(AVG(VALOR_GANADO), 0) as promedio_pago,
                COALESCE(MAX(VALOR_GANADO), 0) as pago_maximo,
                COALESCE(MIN(VALOR_GANADO), 0) as pago_minimo
            FROM pagos
            WHERE FECHA = ? AND ESTADO = 'A'
        ");
        $stmt->execute([$fecha]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        // Pagos por sucursal
        $stmt = $db->prepare("
            SELECT
                b.BODEGA,
                COUNT(*) as total_pagos,
                COALESCE(SUM(p.VALOR_GANADO), 0) as total_pagado
            FROM pagos p
            JOIN bodegas b ON p.SUCURSAL = b.CODIGO
            WHERE p.FECHA = ? AND p.ESTADO = 'A'
            GROUP BY b.CODIGO, b.BODEGA
        ");
        $stmt->execute([$fecha]);
        $porSucursal = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => [
                'resumen' => $stats,
                'por_sucursal' => $porSucursal
            ]
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
