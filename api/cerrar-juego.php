<?php
require_once 'auth_middleware.php';
require_once 'db.php';

// Inicializar seguridad - Requiere autenticacion (cualquier usuario logueado)
$currentUser = initApiSecurity(true, ['0', '1', '2']);

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$uriParts = explode('/', trim(parse_url($uri, PHP_URL_PATH), '/'));

try {
    $db = Database::getInstance()->getConnection();

    // GET /api/cerrar-juego.php/verificar - Verificar estado de un juego
    if ($method === 'GET' && end($uriParts) === 'verificar') {
        $codigoHorario = $_GET['codigo_horario'] ?? '';
        $fecha = $_GET['fecha'] ?? date('Y-m-d');

        if (empty($codigoHorario)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Debe proporcionar el código de horario'
            ]);
            exit;
        }

        // Verificar si ya está cerrado
        $stmt = $db->prepare("
            SELECT * FROM cierrejuego
            WHERE CODIGOH = ? AND FECHA = ?
        ");
        $stmt->execute([$codigoHorario, $fecha]);
        $cierre = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($cierre) {
            echo json_encode([
                'success' => true,
                'cerrado' => true,
                'data' => $cierre
            ]);
            exit;
        }

        // Obtener información del horario
        $stmt = $db->prepare("SELECT * FROM horariojuego WHERE NUM = ?");
        $stmt->execute([$codigoHorario]);
        $horario = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$horario) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Horario no encontrado'
            ]);
            exit;
        }

        // Calcular totales
        $stmt = $db->prepare("
            SELECT
                COUNT(DISTINCT h.RADICADO) as total_jugadas,
                COALESCE(SUM(h.VALOR), 0) as total_apostado
            FROM hislottojuego h
            JOIN jugarlotto j ON h.RADICADO = j.RADICADO
            WHERE h.CODIGOJ = ?
            AND DATE(j.FECHA) = ?
            AND h.ESTADOP = 'A'
            AND h.ESTADOC = 'A'
        ");
        $stmt->execute([$codigoHorario, $fecha]);
        $totales = $stmt->fetch(PDO::FETCH_ASSOC);

        // Verificar si hay animal ganador registrado
        $stmt = $db->prepare("
            SELECT * FROM ingresarganadores
            WHERE CODIGOH = ? AND FECHA = ?
        ");
        $stmt->execute([$codigoHorario, $fecha]);
        $ganador = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'cerrado' => false,
            'data' => [
                'horario' => $horario,
                'totales' => $totales,
                'ganador' => $ganador
            ]
        ]);
    }

    // POST /api/cerrar-juego.php/ejecutar - Cerrar un juego (por sucursal o global)
    elseif ($method === 'POST' && end($uriParts) === 'ejecutar') {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validaciones
        if (empty($data['codigo_horario']) || empty($data['fecha']) || empty($data['usuario'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Código de horario, fecha y usuario son requeridos'
            ]);
            exit;
        }

        $codigoHorario = $data['codigo_horario'];
        $fecha = $data['fecha'];
        $usuario = $data['usuario'];
        $codigoSucursal = $data['codigo_sucursal'] ?? null; // Opcional: cierre por sucursal

        $db->beginTransaction();

        try {
            // Verificar si ya está cerrado (considerando sucursal si aplica)
            $sqlCheck = "SELECT ID FROM cierrejuego WHERE CODIGOH = ? AND FECHA = ?";
            $paramsCheck = [$codigoHorario, $fecha];
            if ($codigoSucursal) {
                $sqlCheck .= " AND CODIGO_SUCURSAL = ?";
                $paramsCheck[] = $codigoSucursal;
            }
            $stmt = $db->prepare($sqlCheck);
            $stmt->execute($paramsCheck);
            if ($stmt->fetch()) {
                $db->rollBack();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Este juego ya fue cerrado' . ($codigoSucursal ? ' para esta sucursal' : '')
                ]);
                exit;
            }

            // Obtener horario
            $stmt = $db->prepare("SELECT * FROM horariojuego WHERE NUM = ?");
            $stmt->execute([$codigoHorario]);
            $horario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$horario) {
                $db->rollBack();
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Horario no encontrado'
                ]);
                exit;
            }

            // Verificar que haya animal ganador registrado
            $stmt = $db->prepare("
                SELECT * FROM ingresarganadores
                WHERE CODIGOH = ? AND FECHA = ?
            ");
            $stmt->execute([$codigoHorario, $fecha]);
            $ganador = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$ganador) {
                $db->rollBack();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Debe registrar el animal ganador antes de cerrar el juego'
                ]);
                exit;
            }

            // Calcular total apostado (por sucursal si aplica)
            $sqlTotal = "
                SELECT COALESCE(SUM(h.VALOR), 0) as total
                FROM hislottojuego h
                JOIN jugarlotto j ON h.RADICADO = j.RADICADO
                WHERE h.CODIGOJ = ?
                AND DATE(j.FECHA) = ?
                AND h.ESTADOP = 'A'
                AND h.ESTADOC = 'A'
            ";
            $paramsTotal = [$codigoHorario, $fecha];
            if ($codigoSucursal) {
                $sqlTotal .= " AND j.SUCURSAL = ?";
                $paramsTotal[] = $codigoSucursal;
            }
            $stmt = $db->prepare($sqlTotal);
            $stmt->execute($paramsTotal);
            $totalApostado = (float) $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Calcular total apostado al animal ganador (para calcular pagos)
            $sqlGanador = "
                SELECT COALESCE(SUM(h.VALOR), 0) as total
                FROM hislottojuego h
                JOIN jugarlotto j ON h.RADICADO = j.RADICADO
                WHERE h.CODIGOJ = ?
                AND DATE(j.FECHA) = ?
                AND h.CODANIMAL = ?
                AND h.ESTADOP = 'A'
                AND h.ESTADOC = 'A'
            ";
            $paramsGanador = [$codigoHorario, $fecha, $ganador['CODIGOA']];
            if ($codigoSucursal) {
                $sqlGanador .= " AND j.SUCURSAL = ?";
                $paramsGanador[] = $codigoSucursal;
            }
            $stmt = $db->prepare($sqlGanador);
            $stmt->execute($paramsGanador);
            $totalApostadoGanador = (float) $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Obtener parámetros
            $stmt = $db->query("SELECT NOMBRE, VALOR FROM parametros");
            $parametros = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

            $puntosPago = (float) ($parametros['PUNTOSPAGO'] ?? 30);
            $porcentajeAdminSucursal = (float) ($parametros['PORCENTAJEADMINSUCURSAL'] ?? 7); // 7% para admin sucursal
            $porcentajeSistematizacion = (float) ($parametros['COMISIONSISTEMATIZACION'] ?? 20); // 20% sistemas
            $porcentajeAdministracion = (float) ($parametros['COMISIONADMINISTRACION'] ?? 80); // 80% administración

            /**
             * CÁLCULOS SEGÚN REQUISITOS:
             * 1. Total de ventas diarias (total apostado)
             * 2. Pago admin sucursal = total apostado * 7%
             * 3. Pago a ganadores = apostado al ganador * puntos de pago
             * 4. Total de ingresos = Total ventas - Pago admin sucursal - Pagos a ganadores
             * 5. Del total de ingresos: 20% sistemas, 80% administración
             */

            // Pago a ganadores (apostado al animal ganador * puntos de pago)
            $totalPagoGanadores = $totalApostadoGanador * $puntosPago;

            // Pago admin sucursal (7% del total apostado)
            $pagoAdminSucursal = ($totalApostado * $porcentajeAdminSucursal) / 100;

            // Total de ingresos netos (después de pagar admin sucursal y ganadores)
            $totalIngresosNetos = $totalApostado - $pagoAdminSucursal - $totalPagoGanadores;

            // Si los ingresos netos son negativos, ajustar a 0
            if ($totalIngresosNetos < 0) {
                $totalIngresosNetos = 0;
            }

            // Del total de ingresos: 20% sistemas, 80% administración
            $comisionSistemas = ($totalIngresosNetos * $porcentajeSistematizacion) / 100;
            $comisionAdministracion = ($totalIngresosNetos * $porcentajeAdministracion) / 100;

            // Utilidad bruta (antes de distribución)
            $utilidadBruta = $totalApostado - $totalPagoGanadores;

            // Obtener nombre de sucursal si aplica
            $nombreSucursal = null;
            if ($codigoSucursal) {
                $stmt = $db->prepare("SELECT BODEGA FROM bodegas WHERE CODIGO = ?");
                $stmt->execute([$codigoSucursal]);
                $sucursalData = $stmt->fetch(PDO::FETCH_ASSOC);
                $nombreSucursal = $sucursalData['BODEGA'] ?? 'Sucursal ' . $codigoSucursal;
            }

            // Insertar cierre
            $stmt = $db->prepare("
                INSERT INTO cierrejuego (
                    CODIGOH, HORAJUEGO, FECHA,
                    CODIGO_SUCURSAL, NOMBRE_SUCURSAL,
                    TOTAL_APOSTADO, TOTAL_PAGADO, UTILIDAD,
                    PAGO_ADMIN_SUCURSAL, COMISION_SISTEMA, COMISION_ADMIN,
                    TOTAL_INGRESOS_NETOS,
                    CODANIMAL_GANADOR, ANIMAL_GANADOR,
                    ESTADO, FECHA_CIERRE, USUARIO_CIERRE, OBSERVACIONES
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'C', NOW(), ?, ?)
            ");

            $stmt->execute([
                $codigoHorario,
                $horario['DESCRIPCION'],
                $fecha,
                $codigoSucursal,
                $nombreSucursal,
                $totalApostado,
                $totalPagoGanadores,
                $utilidadBruta,
                $pagoAdminSucursal,
                $comisionSistemas,
                $comisionAdministracion,
                $totalIngresosNetos,
                $ganador['CODIGOA'],
                $ganador['ANIMAL'],
                $usuario,
                $data['observaciones'] ?? null
            ]);

            $cierreId = $db->lastInsertId();

            $db->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Juego cerrado exitosamente' . ($nombreSucursal ? " para $nombreSucursal" : ''),
                'data' => [
                    'cierre_id' => $cierreId,
                    'sucursal' => $nombreSucursal,
                    'total_apostado' => $totalApostado,
                    'total_pagado_ganadores' => $totalPagoGanadores,
                    'pago_admin_sucursal_7_porciento' => $pagoAdminSucursal,
                    'total_ingresos_netos' => $totalIngresosNetos,
                    'comision_sistemas_20_porciento' => $comisionSistemas,
                    'comision_administracion_80_porciento' => $comisionAdministracion,
                    'utilidad_bruta' => $utilidadBruta,
                    'animal_ganador' => $ganador['ANIMAL']
                ]
            ]);

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    // GET /api/cerrar-juego.php/listar - Listar cierres
    elseif ($method === 'GET' && end($uriParts) === 'listar') {
        $fechaInicio = $_GET['fecha_inicio'] ?? '';
        $fechaFin = $_GET['fecha_fin'] ?? '';

        $sql = "
            SELECT
                c.*,
                h.DESCRIPCION as NOMBRE_HORARIO,
                h.HORA
            FROM cierrejuego c
            JOIN horariojuego h ON c.CODIGOH = h.NUM
            WHERE 1=1
        ";

        $params = [];

        if (!empty($fechaInicio)) {
            $sql .= " AND c.FECHA >= ?";
            $params[] = $fechaInicio;
        }

        if (!empty($fechaFin)) {
            $sql .= " AND c.FECHA <= ?";
            $params[] = $fechaFin;
        }

        $sql .= " ORDER BY c.FECHA DESC, h.HORA DESC LIMIT 100";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $cierres = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $cierres
        ]);
    }

    // GET /api/cerrar-juego.php/estadisticas - Estadísticas de cierres
    elseif ($method === 'GET' && end($uriParts) === 'estadisticas') {
        $fecha = $_GET['fecha'] ?? date('Y-m-d');

        $stmt = $db->prepare("
            SELECT
                COUNT(*) as total_cierres,
                COALESCE(SUM(TOTAL_APOSTADO), 0) as total_apostado,
                COALESCE(SUM(TOTAL_PAGADO), 0) as total_pagado,
                COALESCE(SUM(UTILIDAD), 0) as total_utilidad,
                COALESCE(SUM(COMISION_ADMIN), 0) as total_comision_admin,
                COALESCE(SUM(COMISION_SISTEMA), 0) as total_comision_sistema,
                COALESCE(SUM(GANANCIA_SUCURSAL), 0) as total_ganancia_sucursal
            FROM cierrejuego
            WHERE FECHA = ?
        ");
        $stmt->execute([$fecha]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        // Horarios pendientes de cierre
        $stmt = $db->prepare("
            SELECT h.NUM, h.DESCRIPCION, h.HORA
            FROM horariojuego h
            WHERE h.ESTADO = 'A'
            AND NOT EXISTS (
                SELECT 1 FROM cierrejuego c
                WHERE c.CODIGOH = h.NUM AND c.FECHA = ?
            )
            ORDER BY h.HORA ASC
        ");
        $stmt->execute([$fecha]);
        $pendientes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => [
                'resumen' => $stats,
                'pendientes' => $pendientes
            ]
        ]);
    }

    // GET /api/cerrar-juego.php/detalle/{id} - Ver detalle de un cierre
    elseif ($method === 'GET' && strpos($uri, '/detalle/') !== false) {
        $id = end($uriParts);

        $stmt = $db->prepare("
            SELECT c.*, h.DESCRIPCION as NOMBRE_HORARIO, h.HORA
            FROM cierrejuego c
            JOIN horariojuego h ON c.CODIGOH = h.NUM
            WHERE c.ID = ?
        ");
        $stmt->execute([$id]);
        $cierre = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$cierre) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Cierre no encontrado'
            ]);
            exit;
        }

        // Obtener detalles de jugadas
        $stmt = $db->prepare("
            SELECT
                j.RADICADO,
                j.SUCURSAL,
                b.BODEGA as NOMBRE_SUCURSAL,
                h.CODANIMAL,
                h.ANIMAL,
                h.VALOR,
                CASE WHEN h.CODANIMAL = ? THEN 'GANADOR' ELSE 'PERDEDOR' END as RESULTADO
            FROM jugarlotto j
            JOIN hislottojuego h ON j.RADICADO = h.RADICADO
            LEFT JOIN bodegas b ON j.SUCURSAL = b.CODIGO
            WHERE h.CODIGOJ = ?
            AND DATE(j.FECHA) = ?
            AND h.ESTADOP = 'A'
            AND h.ESTADOC = 'A'
            ORDER BY j.RADICADO, h.CODANIMAL
        ");
        $stmt->execute([$cierre['CODANIMAL_GANADOR'], $cierre['CODIGOH'], $cierre['FECHA']]);
        $jugadas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => [
                'cierre' => $cierre,
                'jugadas' => $jugadas
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
