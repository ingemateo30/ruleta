<?php
require_once 'auth_middleware.php';
require_once 'db.php';

// Solo admin y superadmin pueden cerrar juegos
$currentUser = initApiSecurity(true, ['0', '1']);

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$uriParts = explode('/', trim(parse_url($uri, PHP_URL_PATH), '/'));

try {
    $db = Database::getInstance()->getConnection();

    // GET /api/cerrar-juego.php/verificar - Verificar estado de un juego
    if ($method === 'GET' && end($uriParts) === 'verificar') {
        $codigoHorario = $_GET['codigo_horario'] ?? '';
        $fecha = $_GET['fecha'] ?? date('Y-m-d');
        $codigoSucursal = $_GET['codigo_sucursal'] ?? null;

        if (empty($codigoHorario)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Debe proporcionar el código de horario'
            ]);
            exit;
        }

        // Verificar si ya está cerrado
        $sqlCheck = "SELECT * FROM cierrejuego WHERE CODIGOH = ? AND FECHA = ?";
        $paramsCheck = [$codigoHorario, $fecha];
        if ($codigoSucursal) {
            $sqlCheck .= " AND CODIGO_SUCURSAL = ?";
            $paramsCheck[] = $codigoSucursal;
        }
        $stmt = $db->prepare($sqlCheck);
        $stmt->execute($paramsCheck);
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

        // Calcular totales (con filtro de sucursal opcional)
        $sqlTotales = "
            SELECT
                COUNT(DISTINCT h.RADICADO) as total_jugadas,
                COALESCE(SUM(h.VALOR), 0) as total_apostado
            FROM hislottojuego h
            JOIN jugarlotto j ON h.RADICADO = j.RADICADO
            WHERE h.CODIGOJ = ?
            AND DATE(j.FECHA) = ?
            AND h.ESTADOP = 'A'
            AND h.ESTADOC = 'A'
        ";
        $paramsTotales = [$codigoHorario, $fecha];
        if ($codigoSucursal) {
            $sqlTotales .= " AND j.SUCURSAL = ?";
            $paramsTotales[] = $codigoSucursal;
        }
        $stmt = $db->prepare($sqlTotales);
        $stmt->execute($paramsTotales);
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

    // POST /api/cerrar-juego.php/ejecutar - Cerrar juegos del día
    elseif ($method === 'POST' && end($uriParts) === 'ejecutar') {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validaciones
        if (empty($data['fecha']) || empty($data['usuario'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Fecha y usuario son requeridos'
            ]);
            exit;
        }

        $fecha = $data['fecha'];
        $usuario = $data['usuario'];
        $codigoSucursal = $data['codigo_sucursal'] ?? null;

        $db->beginTransaction();

        try {
            // Obtener parámetros
            $stmt = $db->query("SELECT NOMBRE, VALOR FROM parametros");
            $parametros = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

            $puntosPago = (float) ($parametros['PUNTOSPAGO'] ?? 30);
            $porcentajeAdminSucursal = (float) ($parametros['PORCENTAJEADMINSUCURSAL'] ?? 7);

            // Obtener todos los horarios con ganadores registrados del día
            $stmt = $db->prepare("
                SELECT DISTINCT
                    h.NUM as CODIGOH,
                    h.DESCRIPCION,
                    h.HORA,
                    g.CODIGOA,
                    g.ANIMAL
                FROM horariojuego h
                JOIN ingresarganadores g ON h.NUM = g.CODIGOH
                WHERE g.FECHA = ?
                AND h.ESTADO = 'A'
                ORDER BY h.HORA ASC
            ");
            $stmt->execute([$fecha]);
            $horariosConGanador = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($horariosConGanador)) {
                $db->rollBack();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'No hay horarios con resultado registrado para esta fecha'
                ]);
                exit;
            }

            $cierresRealizados = [];
            $errores = [];

            // Procesar cada horario
            foreach ($horariosConGanador as $horario) {
                $codigoHorario = $horario['CODIGOH'];

                // Si se especifica sucursal, procesar solo esa sucursal
                // Si no, procesar cada sucursal por separado
                if ($codigoSucursal) {
                    $sucursalesAProcesar = [$codigoSucursal];
                } else {
                    // Obtener todas las sucursales ACTIVAS que tienen jugadas en este horario
                    $sqlSucursales = "
                        SELECT DISTINCT j.SUCURSAL
                        FROM jugarlotto j
                        JOIN hislottojuego h ON j.RADICADO = h.RADICADO
                        JOIN bodegas b ON j.SUCURSAL = b.CODIGO
                        WHERE h.CODIGOJ = ?
                        AND DATE(j.FECHA) = ?
                        AND h.ESTADOP = 'A'
                        AND h.ESTADOC = 'A'
                        AND b.ESTADO = 'A'
                    ";
                    $stmt = $db->prepare($sqlSucursales);
                    $stmt->execute([$codigoHorario, $fecha]);
                    $sucursalesAProcesar = $stmt->fetchAll(PDO::FETCH_COLUMN);
                }

                // Procesar cada sucursal
                foreach ($sucursalesAProcesar as $sucursal) {
                    // Verificar si ya está cerrado
                    $stmt = $db->prepare("
                        SELECT ID FROM cierrejuego
                        WHERE CODIGOH = ? AND FECHA = ? AND CODIGO_SUCURSAL = ?
                    ");
                    $stmt->execute([$codigoHorario, $fecha, $sucursal]);
                    if ($stmt->fetch()) {
                        continue; // Ya está cerrado, saltar
                    }

                    // Calcular total apostado por sucursal
                    $stmt = $db->prepare("
                        SELECT COALESCE(SUM(h.VALOR), 0) as total
                        FROM hislottojuego h
                        JOIN jugarlotto j ON h.RADICADO = j.RADICADO
                        WHERE h.CODIGOJ = ?
                        AND DATE(j.FECHA) = ?
                        AND j.SUCURSAL = ?
                        AND h.ESTADOP = 'A'
                        AND h.ESTADOC = 'A'
                    ");
                    $stmt->execute([$codigoHorario, $fecha, $sucursal]);
                    $totalApostado = (float) $stmt->fetch(PDO::FETCH_ASSOC)['total'];

                    if ($totalApostado == 0) {
                        continue; // No hay apuestas en esta sucursal
                    }

                    // Calcular total apostado al animal ganador (para pagos potenciales)
                    $stmt = $db->prepare("
                        SELECT COALESCE(SUM(h.VALOR), 0) as total
                        FROM hislottojuego h
                        JOIN jugarlotto j ON h.RADICADO = j.RADICADO
                        WHERE h.CODIGOJ = ?
                        AND DATE(j.FECHA) = ?
                        AND j.SUCURSAL = ?
                        AND h.CODANIMAL = ?
                        AND h.ESTADOP = 'A'
                        AND h.ESTADOC = 'A'
                    ");
                    $stmt->execute([$codigoHorario, $fecha, $sucursal, $horario['CODIGOA']]);
                    $totalApostadoGanador = (float) $stmt->fetch(PDO::FETCH_ASSOC)['total'];

                    // Calcular pagos YA realizados
                    $stmt = $db->prepare("
                        SELECT COALESCE(SUM(VALOR_GANADO), 0) as total
                        FROM pagos
                        WHERE CODIGOJ = ?
                        AND FECHA = ?
                        AND SUCURSAL = ?
                        AND ESTADO = 'A'
                    ");
                    $stmt->execute([$codigoHorario, $fecha, $sucursal]);
                    $totalPagadoReal = (float) $stmt->fetch(PDO::FETCH_ASSOC)['total'];

                    // CÁLCULOS FINANCIEROS
                    // Pago potencial a ganadores (lo que DEBERÍA pagarse)
                    $pagoPotencialGanadores = $totalApostadoGanador * $puntosPago;

                    // Pago admin sucursal (7% del total apostado)
                    $pagoAdminSucursal = ($totalApostado * $porcentajeAdminSucursal) / 100;

                    // Utilidad proyectada (basada en pagos potenciales)
                    $utilidadProyectada = $totalApostado - $pagoAdminSucursal - $pagoPotencialGanadores;

                    // Utilidad real (basada en pagos realizados hasta ahora)
                    $utilidadReal = $totalApostado - $pagoAdminSucursal - $totalPagadoReal;

                    // Pagos pendientes (diferencia entre lo que se debe pagar y lo ya pagado)
                    $pagosPendientes = $pagoPotencialGanadores - $totalPagadoReal;

                    // Obtener nombre de sucursal
                    $stmt = $db->prepare("SELECT BODEGA FROM bodegas WHERE CODIGO = ?");
                    $stmt->execute([$sucursal]);
                    $sucursalData = $stmt->fetch(PDO::FETCH_ASSOC);
                    $nombreSucursal = $sucursalData['BODEGA'] ?? 'Sucursal ' . $sucursal;

                    // Insertar cierre
                    $stmt = $db->prepare("
                        INSERT INTO cierrejuego (
                            CODIGOH, HORAJUEGO, FECHA,
                            CODIGO_SUCURSAL, NOMBRE_SUCURSAL,
                            TOTAL_APOSTADO,
                            PAGO_POTENCIAL_GANADORES,
                            TOTAL_PAGADO_REAL,
                            PAGOS_PENDIENTES,
                            PAGO_ADMIN_SUCURSAL,
                            UTILIDAD_PROYECTADA,
                            UTILIDAD_REAL,
                            CODANIMAL_GANADOR,
                            ANIMAL_GANADOR,
                            ESTADO,
                            FECHA_CIERRE,
                            USUARIO_CIERRE,
                            OBSERVACIONES
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'C', NOW(), ?, ?)
                    ");

                    $stmt->execute([
                        $codigoHorario,
                        $horario['DESCRIPCION'],
                        $fecha,
                        $sucursal,
                        $nombreSucursal,
                        $totalApostado,
                        $pagoPotencialGanadores,
                        $totalPagadoReal,
                        $pagosPendientes,
                        $pagoAdminSucursal,
                        $utilidadProyectada,
                        $utilidadReal,
                        $horario['CODIGOA'],
                        $horario['ANIMAL'],
                        $usuario,
                        $data['observaciones'] ?? null
                    ]);

                    $cierresRealizados[] = [
                        'horario' => $horario['DESCRIPCION'],
                        'sucursal' => $nombreSucursal,
                        'total_apostado' => $totalApostado,
                        'pago_potencial' => $pagoPotencialGanadores,
                        'pagado_real' => $totalPagadoReal,
                        'pendiente' => $pagosPendientes,
                        'utilidad_proyectada' => $utilidadProyectada,
                        'utilidad_real' => $utilidadReal
                    ];
                }
            }

            if (empty($cierresRealizados)) {
                $db->rollBack();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'No hay juegos pendientes de cierre para esta fecha' . 
                                 ($codigoSucursal ? ' y sucursal' : '')
                ]);
                exit;
            }

            $db->commit();

            // Calcular resumen
            $resumen = array_reduce($cierresRealizados, function($acc, $cierre) {
                $acc['total_apostado'] += $cierre['total_apostado'];
                $acc['total_pago_potencial'] += $cierre['pago_potencial'];
                $acc['total_pagado_real'] += $cierre['pagado_real'];
                $acc['total_pendiente'] += $cierre['pendiente'];
                $acc['utilidad_proyectada_total'] += $cierre['utilidad_proyectada'];
                $acc['utilidad_real_total'] += $cierre['utilidad_real'];
                return $acc;
            }, [
                'total_apostado' => 0,
                'total_pago_potencial' => 0,
                'total_pagado_real' => 0,
                'total_pendiente' => 0,
                'utilidad_proyectada_total' => 0,
                'utilidad_real_total' => 0
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Cierres realizados exitosamente',
                'data' => [
                    'cantidad_cierres' => count($cierresRealizados),
                    'cierres' => $cierresRealizados,
                    'resumen' => $resumen
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
        $sucursal = $_GET['sucursal'] ?? '';

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

        if (!empty($sucursal)) {
            $sql .= " AND c.CODIGO_SUCURSAL = ?";
            $params[] = $sucursal;
        }

        $sql .= " ORDER BY c.FECHA DESC, h.HORA DESC LIMIT 500";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $cierres = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $cierres
        ]);
    }

    // GET /api/cerrar-juego.php/pendientes - Horarios pendientes de cierre
    elseif ($method === 'GET' && end($uriParts) === 'pendientes') {
        $fecha = $_GET['fecha'] ?? date('Y-m-d');

        $stmt = $db->prepare("
            SELECT
                h.NUM,
                h.DESCRIPCION,
                h.HORA,
                g.ANIMAL as ANIMAL_GANADOR,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM cierrejuego c
                        WHERE c.CODIGOH = h.NUM AND c.FECHA = ?
                    ) THEN 'CERRADO'
                    ELSE 'PENDIENTE'
                END as ESTADO
            FROM horariojuego h
            LEFT JOIN ingresarganadores g ON h.NUM = g.CODIGOH AND g.FECHA = ?
            WHERE h.ESTADO = 'A'
            ORDER BY h.HORA ASC
        ");
        $stmt->execute([$fecha, $fecha]);
        $horarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $horarios
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