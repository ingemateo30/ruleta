<?php
require_once 'auth_middleware.php';
require_once 'db.php';
date_default_timezone_set('America/Bogota');
// Inicializar seguridad - Requiere autenticacion y rol Admin o SuperAdmin
$currentUser = initApiSecurity(true, ['0', '1']);

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$uriParts = explode('/', trim(parse_url($uri, PHP_URL_PATH), '/'));

try {
    $db = Database::getInstance()->getConnection();

    // GET /api/informes.php/juegos - Informe de juegos/apuestas
    if ($method === 'GET' && end($uriParts) === 'juegos') {
        $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-d');
        $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-d');
        $sucursal = $_GET['sucursal'] ?? '';
        $horario = $_GET['horario'] ?? '';

        $sql = "
            SELECT
                j.RADICADO,
                j.FECHA,
                j.HORA,
                j.SUCURSAL,
                b.BODEGA as NOMBRE_SUCURSAL,
                COALESCE(SUM(hj.VALOR), 0) as TOTALJUEGO,
                j.USUARIO,
                j.ESTADO,
                GROUP_CONCAT(DISTINCT h.DESCRIPCION ORDER BY h.HORA SEPARATOR ', ') as HORARIO,
                COUNT(DISTINCT hj.CODANIMAL) as CANTIDAD_ANIMALES,
                GROUP_CONCAT(
                    DISTINCT CONCAT(hj.ANIMAL, ' ($', REPLACE(FORMAT(hj.VALOR, 0), ',', '.'), ')')
                    SEPARATOR ', '
                ) as DETALLE_ANIMALES
            FROM jugarlotto j
            LEFT JOIN bodegas b ON j.SUCURSAL = b.CODIGO
            LEFT JOIN hislottojuego hj ON j.RADICADO = hj.RADICADO AND hj.ESTADOP = 'A'
            LEFT JOIN horariojuego h ON hj.CODIGOJ = h.NUM
            WHERE DATE(j.FECHA) >= ? AND DATE(j.FECHA) <= ?
        ";

        $params = [$fechaInicio, $fechaFin];

        if (!empty($sucursal)) {
            $sql .= " AND j.SUCURSAL = ?";
            $params[] = $sucursal;
        }

        if (!empty($horario)) {
            $sql .= " AND hj.CODIGOJ = ?";
            $params[] = $horario;
        }

        $sql .= " GROUP BY j.RADICADO, j.FECHA, j.HORA, j.SUCURSAL, b.BODEGA, j.USUARIO, j.ESTADO";
        $sql .= " ORDER BY j.FECHA DESC, j.HORA DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $juegos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calcular totales
        $totalApostado = array_sum(array_column($juegos, 'TOTALJUEGO'));
        $totalJuegos = count($juegos);
        $juegosActivos = count(array_filter($juegos, fn($j) => $j['ESTADO'] === 'A'));
        $juegosCancelados = count(array_filter($juegos, fn($j) => $j['ESTADO'] === 'C'));

        echo json_encode([
            'success' => true,
            'data' => [
                'juegos' => $juegos,
                'resumen' => [
                    'total_juegos' => $totalJuegos,
                    'juegos_activos' => $juegosActivos,
                    'juegos_cancelados' => $juegosCancelados,
                    'total_apostado' => $totalApostado,
                    'promedio_apuesta' => $totalJuegos > 0 ? $totalApostado / $totalJuegos : 0
                ]
            ]
        ]);
    }

    // GET /api/informes.php/ventas - Informe de ventas del día
    elseif ($method === 'GET' && end($uriParts) === 'ventas') {
        $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-d');
        $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-d');
        $sucursal = $_GET['sucursal'] ?? '';

        // Ventas por sucursal
        $sql = "
            SELECT
                b.CODIGO,
                b.BODEGA as SUCURSAL,
                DATE(j.FECHA) as FECHA,
                COUNT(DISTINCT j.RADICADO) as TOTAL_TICKETS,
                COUNT(DISTINCT CASE WHEN j.ESTADO = 'A' THEN j.RADICADO END) as TICKETS_ACTIVOS,
                COUNT(DISTINCT CASE WHEN j.ESTADO = 'I' THEN j.RADICADO END) as TICKETS_ANULADOS,
                COALESCE(SUM(CASE WHEN j.ESTADO = 'A' THEN j.TOTALJUEGO ELSE 0 END), 0) as VENTAS_ACTIVAS,
                COALESCE(SUM(CASE WHEN j.ESTADO = 'I' THEN j.TOTALJUEGO ELSE 0 END), 0) as VENTAS_ANULADAS,
                COALESCE(SUM(CASE WHEN j.ESTADO = 'C' THEN j.TOTALJUEGO ELSE 0 END), 0) as VENTAS_CANCELADAS,
                COALESCE(SUM(CASE WHEN j.ESTADO = 'A' THEN j.TOTALJUEGO ELSE 0 END), 0) as TOTAL_VENTAS,
                COUNT(DISTINCT j.USUARIO) as USUARIOS_VENDIERON
            FROM bodegas b
            LEFT JOIN jugarlotto j ON b.CODIGO = j.SUCURSAL
                AND DATE(j.FECHA) >= ?
                AND DATE(j.FECHA) <= ?
        ";

        $params = [$fechaInicio, $fechaFin];

        if (!empty($sucursal) && $sucursal !== '0') {
            $sql .= " AND b.CODIGO = ?";
            $params[] = $sucursal;
        }

        $sql .= " GROUP BY b.CODIGO, b.BODEGA, DATE(j.FECHA)";
        $sql .= " ORDER BY FECHA DESC, TOTAL_VENTAS DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Tickets anulados con detalle
        $sql = "
            SELECT
                j.RADICADO,
                j.FECHA,
                j.HORA,
                j.SUCURSAL,
                b.BODEGA as NOMBRE_SUCURSAL,
                j.TOTALJUEGO,
                j.USUARIO,
                j.MOTIVO_ANULACION,
                j.FECHA_ANULACION,
                j.USUARIO_ANULACION
            FROM jugarlotto j
            LEFT JOIN bodegas b ON j.SUCURSAL = b.CODIGO
            WHERE j.ESTADO = 'I'
            AND DATE(j.FECHA) >= ?
            AND DATE(j.FECHA) <= ?
        ";

        $params = [$fechaInicio, $fechaFin];

        if (!empty($sucursal) && $sucursal !== '0') {
            $sql .= " AND j.SUCURSAL = ?";
            $params[] = $sucursal;
        }

        $sql .= " ORDER BY j.FECHA_ANULACION DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $ticketsAnulados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Ventas por horario
        $sql = "
            SELECT
                h.NUM,
                h.DESCRIPCION as HORARIO,
                h.HORA,
                COUNT(DISTINCT hj.RADICADO) as TOTAL_JUGADAS,
                COALESCE(SUM(hj.VALOR), 0) as TOTAL_APOSTADO
            FROM hislottojuego hj
INNER JOIN jugarlotto j ON hj.RADICADO = j.RADICADO
INNER JOIN horariojuego h ON hj.CODIGOJ = h.NUM
WHERE DATE(j.FECHA) >= ?
    AND DATE(j.FECHA) <= ?
                AND j.ESTADO = 'A'
                AND hj.ESTADOP = 'A'
        ";

        $params = [$fechaInicio, $fechaFin];

        if (!empty($sucursal) && $sucursal !== '0') {
            $sql .= " AND j.SUCURSAL = ?";
            $params[] = $sucursal;
        }

        $sql .= " GROUP BY h.NUM, h.DESCRIPCION, h.HORA";
        $sql .= " ORDER BY h.HORA ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $ventasPorHorario = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Totales generales
        $totalVentas = array_sum(array_column($ventas, 'TOTAL_VENTAS'));
        $totalTickets = array_sum(array_column($ventas, 'TOTAL_TICKETS'));
        $totalAnulado = array_sum(array_column($ventas, 'VENTAS_ANULADAS'));
        $totalCancelado = array_sum(array_column($ventas, 'VENTAS_CANCELADAS'));
        $ticketsAnuladosTotal = array_sum(array_column($ventas, 'TICKETS_ANULADOS'));

        echo json_encode([
            'success' => true,
            'data' => [
                'ventas_por_sucursal' => $ventas,
                'ventas_por_horario' => $ventasPorHorario,
                'tickets_anulados' => $ticketsAnulados,
                'resumen' => [
                    'total_ventas' => $totalVentas,
                    'total_tickets' => $totalTickets,
                    'total_anulado' => $totalAnulado,
                    'total_cancelado' => $totalCancelado,
                    'tickets_anulados' => $ticketsAnuladosTotal,
                    'ventas_netas' => $totalVentas - $totalCancelado
                ]
            ]
        ]);
    }

    // GET /api/informes.php/resultados - Informe de resultados/ganadores
    elseif ($method === 'GET' && end($uriParts) === 'resultados') {
        $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-d');
        $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-d');

        // Resultados por fecha y horario
        $sql = "
            SELECT
                g.FECHA,
                g.CODIGOH,
                h.DESCRIPCION as HORARIO,
                h.HORA,
                g.CODIGOA,
                g.ANIMAL,
                l.COLOR,
                -- Calcular cuánto se apostó al ganador
                (
                    SELECT COALESCE(SUM(hj.VALOR), 0)
                    FROM hislottojuego hj
                    JOIN jugarlotto j ON hj.RADICADO = j.RADICADO
                    WHERE hj.CODANIMAL = g.CODIGOA
                    AND hj.CODIGOJ = g.CODIGOH
                    AND DATE(j.FECHA) = g.FECHA
                    AND hj.ESTADOP = 'A'
                    AND hj.ESTADOC = 'A'
                ) as TOTAL_APOSTADO_GANADOR,
                -- Calcular total apostado en ese horario
                (
                    SELECT COALESCE(SUM(hj.VALOR), 0)
                    FROM hislottojuego hj
                    JOIN jugarlotto j ON hj.RADICADO = j.RADICADO
                    WHERE hj.CODIGOJ = g.CODIGOH
                    AND DATE(j.FECHA) = g.FECHA
                    AND hj.ESTADOP = 'A'
                    AND hj.ESTADOC = 'A'
                ) as TOTAL_APOSTADO,
                -- Contar jugadas ganadoras
                (
                    SELECT COUNT(DISTINCT hj.RADICADO)
                    FROM hislottojuego hj
                    JOIN jugarlotto j ON hj.RADICADO = j.RADICADO
                    WHERE hj.CODANIMAL = g.CODIGOA
                    AND hj.CODIGOJ = g.CODIGOH
                    AND DATE(j.FECHA) = g.FECHA
                    AND hj.ESTADOP = 'A'
                    AND hj.ESTADOC = 'A'
                ) as TICKETS_GANADORES
            FROM ingresarganadores g
            JOIN horariojuego h ON g.CODIGOH = h.NUM
            LEFT JOIN lottoruleta l ON g.CODIGOA = l.NUM
            WHERE g.FECHA >= ? AND g.FECHA <= ?
            ORDER BY g.FECHA DESC, h.HORA DESC
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute([$fechaInicio, $fechaFin]);
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Obtener parámetro de puntos de pago
        $stmt = $db->query("SELECT VALOR FROM parametros WHERE NOMBRE = 'PUNTOSPAGO'");
        $puntosPago = $stmt->fetchColumn() ?? 30;

        // Calcular totales pagados
        foreach ($resultados as &$resultado) {
            $resultado['TOTAL_A_PAGAR'] = $resultado['TOTAL_APOSTADO_GANADOR'] * $puntosPago;
            $resultado['UTILIDAD'] = $resultado['TOTAL_APOSTADO'] - $resultado['TOTAL_A_PAGAR'];
        }

        // Estadísticas de animales ganadores
        $sql = "
            SELECT
                l.NUM,
                l.VALOR as ANIMAL,
                l.COLOR,
                COUNT(*) as VECES_GANADOR,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ingresarganadores WHERE FECHA >= ? AND FECHA <= ?), 2) as PORCENTAJE
            FROM ingresarganadores g
            JOIN lottoruleta l ON g.CODIGOA = l.NUM
            WHERE g.FECHA >= ? AND g.FECHA <= ?
            GROUP BY l.NUM, l.VALOR, l.COLOR
            ORDER BY VECES_GANADOR DESC
            LIMIT 10
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute([$fechaInicio, $fechaFin, $fechaInicio, $fechaFin]);
        $animalesMasGanadores = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => [
                'resultados' => $resultados,
                'animales_mas_ganadores' => $animalesMasGanadores,
                'puntos_pago' => $puntosPago
            ]
        ]);
    }

    // GET /api/informes.php/pagos - Informe de pagos realizados
    elseif ($method === 'GET' && end($uriParts) === 'pagos') {
        $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-d');
        $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-d');
        $sucursal = $_GET['sucursal'] ?? '';

        $sql = "
            SELECT
                p.ID,
                p.RADICADO,
                p.FECHA_OLD AS FECHA,
                p.HORA_OLD,
                p.CODANIMAL,
                p.ANIMAL,
                p.HORAJUEGO,
                p.VALOR_APOSTADO,
                p.VALOR_GANADO,
                p.SUCURSAL,
                b.BODEGA as NOMBRE_SUCURSAL,
                p.USUARIO_PAGO AS USUARIO,
                p.FECHA_PAGO,
                p.OBSERVACIONES,
                p.ESTADO
            FROM pagos p
            LEFT JOIN bodegas b ON p.SUCURSAL = b.CODIGO
            WHERE DATE(p.FECHA_PAGO) >= ? AND DATE(p.FECHA_PAGO) <= ?
        ";

        $params = [$fechaInicio, $fechaFin];

        if (!empty($sucursal)) {
            $sql .= " AND p.SUCURSAL = ?";
            $params[] = $sucursal;
        }

        $sql .= " ORDER BY p.FECHA_PAGO DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $pagos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Resumen por sucursal
        $sql = "
            SELECT
                b.BODEGA as SUCURSAL,
                COUNT(*) as TOTAL_PAGOS,
                COALESCE(SUM(p.VALOR_GANADO), 0) as TOTAL_PAGADO,
                COALESCE(AVG(p.VALOR_GANADO), 0) as PROMEDIO_PAGO
            FROM pagos p
            JOIN bodegas b ON p.SUCURSAL = b.CODIGO
            WHERE DATE(p.FECHA_PAGO) >= ? AND DATE(p.FECHA_PAGO) <= ? AND p.ESTADO = 'A'
        ";

        $params = [$fechaInicio, $fechaFin];

        if (!empty($sucursal)) {
            $sql .= " AND p.SUCURSAL = ?";
            $params[] = $sucursal;
        }

        $sql .= " GROUP BY b.CODIGO, b.BODEGA";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $resumenPorSucursal = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Totales
        $totalPagado = array_sum(array_column($resumenPorSucursal, 'TOTAL_PAGADO'));
        $totalPagos = array_sum(array_column($resumenPorSucursal, 'TOTAL_PAGOS'));

        echo json_encode([
            'success' => true,
            'data' => [
                'pagos' => $pagos,
                'resumen_por_sucursal' => $resumenPorSucursal,
                'totales' => [
                    'total_pagado' => $totalPagado,
                    'total_pagos' => $totalPagos,
                    'promedio_pago' => $totalPagos > 0 ? $totalPagado / $totalPagos : 0
                ]
            ]
        ]);
    }

    // GET /api/informes.php/animales - Informe de animales más jugados
    elseif ($method === 'GET' && end($uriParts) === 'animales') {
        $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-d');
        $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-d');

        $sql = "
            SELECT
                l.NUM,
                l.CODIGOJUEGO,
                l.VALOR as ANIMAL,
                l.COLOR,
                COUNT(DISTINCT hj.RADICADO) as TOTAL_JUGADAS,
                COALESCE(SUM(hj.VALOR), 0) as TOTAL_APOSTADO,
                COALESCE(AVG(hj.VALOR), 0) as PROMEDIO_APUESTA,
                (
                    SELECT COUNT(*)
                    FROM ingresarganadores g
                    WHERE g.CODIGOA = l.NUM
                    AND g.FECHA >= ?
                    AND g.FECHA <= ?
                ) as VECES_GANADOR
            FROM lottoruleta l
            LEFT JOIN hislottojuego hj ON l.NUM = hj.CODANIMAL
            LEFT JOIN jugarlotto j ON hj.RADICADO = j.RADICADO
                AND DATE(j.FECHA) >= ?
                AND DATE(j.FECHA) <= ?
                AND j.ESTADO = 'A'
                AND hj.ESTADOP = 'A'
            GROUP BY l.NUM, l.CODIGOJUEGO, l.VALOR, l.COLOR
            ORDER BY TOTAL_APOSTADO DESC
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute([$fechaInicio, $fechaFin, $fechaInicio, $fechaFin]);
        $animales = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calcular porcentajes
        $totalApostado = array_sum(array_column($animales, 'TOTAL_APOSTADO'));

        foreach ($animales as &$animal) {
            $animal['PORCENTAJE'] = $totalApostado > 0
                ? round(($animal['TOTAL_APOSTADO'] / $totalApostado) * 100, 2)
                : 0;
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'animales' => $animales,
                'total_apostado' => $totalApostado
            ]
        ]);
    }

     // GET /api/informes.php/conteo-animales - Conteo de jugadas por animal (general y por sucursal)
    elseif ($method === 'GET' && end($uriParts) === 'conteo-animales') {
        $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-d');
        $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-d');
        $sucursal = $_GET['sucursal'] ?? '';
 
        // Conteo general por animal
        $sql = "
            SELECT
                l.NUM,
                l.CODIGOJUEGO,
                l.VALOR as ANIMAL,
                l.COLOR,
                COUNT(*) as TOTAL_JUGADAS,
                COALESCE(SUM(hj.VALOR), 0) as TOTAL_APOSTADO
            FROM hislottojuego hj
            JOIN jugarlotto j ON hj.RADICADO = j.RADICADO AND hj.FECHA = j.FECHA
            JOIN lottoruleta l ON hj.CODANIMAL = l.CODIGOJUEGO
            WHERE j.FECHA >= ? AND j.FECHA <= ?
            AND j.ESTADO = 'A'
            AND hj.ESTADOP = 'A'
        ";
 
        $params = [$fechaInicio, $fechaFin];
 
        if (!empty($sucursal) && $sucursal !== '0') {
            $sql .= " AND j.SUCURSAL = ?";
            $params[] = $sucursal;
        }
 
        $sql .= " GROUP BY l.NUM, l.CODIGOJUEGO, l.VALOR, l.COLOR";
        $sql .= " ORDER BY TOTAL_JUGADAS DESC";
 
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $conteo = $stmt->fetchAll(PDO::FETCH_ASSOC);
 
        // Conteo por sucursal (si no se filtró por sucursal)
        $conteoPorSucursal = [];
        if (empty($sucursal) || $sucursal === '0') {
            $sql = "
                SELECT
                    b.BODEGA as SUCURSAL,
                    l.CODIGOJUEGO,
                    l.VALOR as ANIMAL,
                    COUNT(*) as TOTAL_JUGADAS,
                    COALESCE(SUM(hj.VALOR), 0) as TOTAL_APOSTADO
                FROM hislottojuego hj
                JOIN jugarlotto j ON hj.RADICADO = j.RADICADO AND hj.FECHA = j.FECHA
                JOIN lottoruleta l ON hj.CODANIMAL = l.CODIGOJUEGO
                JOIN bodegas b ON j.SUCURSAL = b.CODIGO
                WHERE j.FECHA >= ? AND j.FECHA <= ?
                AND j.ESTADO = 'A'
                AND hj.ESTADOP = 'A'
                GROUP BY b.CODIGO, b.BODEGA, l.NUM, l.CODIGOJUEGO, l.VALOR
                ORDER BY b.BODEGA, TOTAL_JUGADAS DESC
            ";
            $stmt = $db->prepare($sql);
            $stmt->execute([$fechaInicio, $fechaFin]);
            $conteoPorSucursal = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
 
        $totalJugadas = array_sum(array_column($conteo, 'TOTAL_JUGADAS'));
        $totalApostado = array_sum(array_column($conteo, 'TOTAL_APOSTADO'));
 
        echo json_encode([
            'success' => true,
            'data' => [
                'conteo' => $conteo,
                'conteo_por_sucursal' => $conteoPorSucursal,
                'resumen' => [
                    'total_jugadas' => $totalJugadas,
                    'total_apostado' => $totalApostado
                ]
            ]
        ]);
    }
 
    // GET /api/informes.php/cierres - Informe de cierres de juegos
    elseif ($method === 'GET' && end($uriParts) === 'cierres') {
        $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-d');
        $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-d');
        $sucursal = $_GET['sucursal'] ?? '';

        // Obtener parámetros de comisión
        $stmtParams = $db->query("SELECT NOMBRE, VALOR FROM parametros WHERE NOMBRE IN ('PORCENTAJEADMINSUCURSAL','COMISIONSISTEMATIZACION','COMISIONADMINISTRACION')");
        $parametros = [];
        while ($row = $stmtParams->fetch(PDO::FETCH_ASSOC)) {
            $parametros[$row['NOMBRE']] = floatval($row['VALOR']);
        }
        $porcentajeSistema      = $parametros['COMISIONSISTEMATIZACION'] ?? 20;
        $porcentajeAdminEmpresa = $parametros['COMISIONADMINISTRACION'] ?? 80;

        $sql = "
            SELECT
                c.CODIGOH,
                c.FECHA,
                c.CODIGO_SUCURSAL,
                c.NOMBRE_SUCURSAL,
                c.TOTAL_APOSTADO,
                c.PAGO_ADMIN_SUCURSAL AS GANANCIA_SUCURSAL,
                c.TOTAL_PAGADO_REAL,
                c.PAGO_POTENCIAL_GANADORES,
                c.PAGOS_PENDIENTES,
                c.UTILIDAD_PROYECTADA,
                c.UTILIDAD_REAL AS UTILIDAD,
                c.CODANIMAL_GANADOR,
                c.ANIMAL_GANADOR,
                c.ESTADO,
                c.FECHA_CIERRE,
                c.USUARIO_CIERRE,
                h.DESCRIPCION AS NOMBRE_HORARIO,
                h.HORA
            FROM cierrejuego c
            JOIN horariojuego h ON c.CODIGOH = h.NUM
            WHERE c.FECHA >= ? AND c.FECHA <= ?
        ";

        $params = [$fechaInicio, $fechaFin];

        if (!empty($sucursal) && $sucursal !== '0') {
            $sql .= " AND c.CODIGO_SUCURSAL = ?";
            $params[] = $sucursal;
        }

        $sql .= " ORDER BY c.FECHA DESC, h.HORA DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $cierres = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calcular comisiones derivadas para cada cierre
        // Utilidad = total_apostado - pago_admin_sucursal(7%) - pagos_ganadores
        // Del total de ingresos netos: 20% sistemas y 80% administración
        foreach ($cierres as &$cierre) {
            $utilidad = floatval($cierre['UTILIDAD']);
            $cierre['COMISION_SISTEMA'] = round($utilidad > 0 ? $utilidad * ($porcentajeSistema / 100) : 0, 2);
            $cierre['COMISION_ADMIN']   = round($utilidad > 0 ? $utilidad * ($porcentajeAdminEmpresa / 100) : 0, 2);
        }
        unset($cierre);

        // Resumen global
        $totalApostado          = array_sum(array_column($cierres, 'TOTAL_APOSTADO'));
        $totalPagadoReal        = array_sum(array_column($cierres, 'TOTAL_PAGADO_REAL'));
        $totalGananciaSucursal  = array_sum(array_column($cierres, 'GANANCIA_SUCURSAL'));
        $totalUtilidad          = array_sum(array_column($cierres, 'UTILIDAD'));
        $totalComisionSistema   = array_sum(array_column($cierres, 'COMISION_SISTEMA'));
        $totalComisionAdmin     = array_sum(array_column($cierres, 'COMISION_ADMIN'));

        // Resumen por sede
        $resumenPorSede = [];
        foreach ($cierres as $cierre) {
            $key = $cierre['CODIGO_SUCURSAL'];
            if (!isset($resumenPorSede[$key])) {
                $resumenPorSede[$key] = [
                    'CODIGO_SUCURSAL'   => $cierre['CODIGO_SUCURSAL'],
                    'NOMBRE_SUCURSAL'   => $cierre['NOMBRE_SUCURSAL'],
                    'TOTAL_CIERRES'     => 0,
                    'TOTAL_APOSTADO'    => 0,
                    'TOTAL_PAGADO'      => 0,
                    'GANANCIA_SUCURSAL' => 0,
                    'UTILIDAD'          => 0,
                    'COMISION_SISTEMA'  => 0,
                    'COMISION_ADMIN'    => 0,
                ];
            }
            $resumenPorSede[$key]['TOTAL_CIERRES']++;
            $resumenPorSede[$key]['TOTAL_APOSTADO']    += floatval($cierre['TOTAL_APOSTADO']);
            $resumenPorSede[$key]['TOTAL_PAGADO']      += floatval($cierre['TOTAL_PAGADO_REAL']);
            $resumenPorSede[$key]['GANANCIA_SUCURSAL'] += floatval($cierre['GANANCIA_SUCURSAL']);
            $resumenPorSede[$key]['UTILIDAD']          += floatval($cierre['UTILIDAD']);
            $resumenPorSede[$key]['COMISION_SISTEMA']  += floatval($cierre['COMISION_SISTEMA']);
            $resumenPorSede[$key]['COMISION_ADMIN']    += floatval($cierre['COMISION_ADMIN']);
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'cierres' => $cierres,
                'porcentajes' => [
                    'admon_sucursal' => $parametros['PORCENTAJEADMINSUCURSAL'] ?? 7,
                    'sistemas' => $porcentajeSistema,
                    'administracion' => $porcentajeAdminEmpresa
                ],
                'resumen' => [
                    'total_cierres'         => count($cierres),
                    'total_apostado'        => round($totalApostado, 2),
                    'total_pagado'          => round($totalPagadoReal, 2),
                    'total_utilidad'        => round($totalUtilidad, 2),
                    'total_ganancia_sucursal' => round($totalGananciaSucursal, 2),
                    'total_comision_sistema' => round($totalComisionSistema, 2),
                    'total_comision_admin'  => round($totalComisionAdmin, 2)
                ],
                'resumen_por_sede' => array_values($resumenPorSede)
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