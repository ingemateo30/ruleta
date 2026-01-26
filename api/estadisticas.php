<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

    // GET /api/estadisticas.php/dashboard - Estadísticas completas para dashboard
    if ($method === 'GET' && end($uriParts) === 'dashboard') {
        $fecha = $_GET['fecha'] ?? date('Y-m-d');

        // KPIs principales
        $stmt = $db->prepare("
            SELECT
                COUNT(DISTINCT RADICADO) as total_tickets,
                COALESCE(SUM(CASE WHEN ESTADO = 'A' THEN TOTALJUEGO ELSE 0 END), 0) as total_ventas,
                COALESCE(SUM(CASE WHEN ESTADO = 'C' THEN TOTALJUEGO ELSE 0 END), 0) as total_cancelado
            FROM jugarlotto
            WHERE DATE(FECHA) = ?
        ");
        $stmt->execute([$fecha]);
        $kpis = $stmt->fetch(PDO::FETCH_ASSOC);

        // Total pagado
        $stmt = $db->prepare("
            SELECT COALESCE(SUM(VALOR_GANADO), 0) as total_pagado
            FROM pagos
            WHERE FECHA = ? AND ESTADO = 'A'
        ");
        $stmt->execute([$fecha]);
        $pagos = $stmt->fetch(PDO::FETCH_ASSOC);

        $kpis['total_pagado'] = $pagos['total_pagado'];
        $kpis['utilidad_neta'] = $kpis['total_ventas'] - $kpis['total_pagado'];

        // Ventas por hora del día
        $stmt = $db->prepare("
            SELECT
                HOUR(HORA) as hora,
                COUNT(DISTINCT RADICADO) as tickets,
                COALESCE(SUM(TOTALJUEGO), 0) as ventas
            FROM jugarlotto
            WHERE DATE(FECHA) = ? AND ESTADO = 'A'
            GROUP BY HOUR(HORA)
            ORDER BY hora ASC
        ");
        $stmt->execute([$fecha]);
        $ventasPorHora = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Top 5 animales más jugados del día
        $stmt = $db->prepare("
            SELECT
                l.VALOR as animal,
                l.COLOR as color,
                COUNT(DISTINCT hj.RADICADO) as jugadas,
                COALESCE(SUM(hj.VALOR), 0) as apostado
            FROM hislottojuego hj
            JOIN jugarlotto j ON hj.RADICADO = j.RADICADO
            JOIN lottoruleta l ON hj.CODANIMAL = l.NUM
            WHERE DATE(j.FECHA) = ? AND hj.ESTADOP = 'A' AND j.ESTADO = 'A'
            GROUP BY l.NUM, l.VALOR, l.COLOR
            ORDER BY apostado DESC
            LIMIT 5
        ");
        $stmt->execute([$fecha]);
        $topAnimales = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Últimos ganadores
        $stmt = $db->prepare("
            SELECT
                g.CODIGOA,
                g.ANIMAL,
                g.FECHA,
                h.DESCRIPCION as horario,
                h.HORA,
                l.COLOR
            FROM ingresarganadores g
            JOIN horariojuego h ON g.CODIGOH = h.NUM
            LEFT JOIN lottoruleta l ON g.CODIGOA = l.NUM
            WHERE g.FECHA = ?
            ORDER BY h.HORA DESC
            LIMIT 5
        ");
        $stmt->execute([$fecha]);
        $ultimosGanadores = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Próximos horarios
        $stmt = $db->prepare("
            SELECT
                h.NUM,
                h.DESCRIPCION,
                h.HORA,
                h.ESTADO,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM ingresarganadores g
                        WHERE g.CODIGOH = h.NUM AND g.FECHA = ?
                    ) THEN 'JUGADO'
                    WHEN h.HORA < CURTIME() THEN 'PENDIENTE'
                    ELSE 'PROXIMO'
                END as estado_juego
            FROM horariojuego h
            WHERE h.ESTADO = 'A'
            ORDER BY h.HORA ASC
            LIMIT 10
        ");
        $stmt->execute([$fecha]);
        $proximosHorarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Ventas por sucursal del día
        $stmt = $db->prepare("
            SELECT
                b.BODEGA as sucursal,
                COUNT(DISTINCT j.RADICADO) as tickets,
                COALESCE(SUM(j.TOTALJUEGO), 0) as ventas
            FROM bodegas b
            LEFT JOIN jugarlotto j ON b.CODIGO = j.SUCURSAL
                AND DATE(j.FECHA) = ?
                AND j.ESTADO = 'A'
            GROUP BY b.CODIGO, b.BODEGA
            ORDER BY ventas DESC
        ");
        $stmt->execute([$fecha]);
        $ventasPorSucursal = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => [
                'kpis' => $kpis,
                'ventas_por_hora' => $ventasPorHora,
                'top_animales' => $topAnimales,
                'ultimos_ganadores' => $ultimosGanadores,
                'proximos_horarios' => $proximosHorarios,
                'ventas_por_sucursal' => $ventasPorSucursal
            ]
        ]);
    }

    // GET /api/estadisticas.php/tendencias - Tendencias de ventas
    elseif ($method === 'GET' && end($uriParts) === 'tendencias') {
        $dias = $_GET['dias'] ?? 7;

        // Ventas por día
        $stmt = $db->prepare("
            SELECT
                DATE(FECHA) as fecha,
                COUNT(DISTINCT RADICADO) as tickets,
                COALESCE(SUM(CASE WHEN ESTADO = 'A' THEN TOTALJUEGO ELSE 0 END), 0) as ventas
            FROM jugarlotto
            WHERE DATE(FECHA) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(FECHA)
            ORDER BY fecha ASC
        ");
        $stmt->execute([$dias]);
        $ventasPorDia = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Comparación con período anterior
        $stmt = $db->prepare("
            SELECT
                COALESCE(SUM(CASE WHEN ESTADO = 'A' THEN TOTALJUEGO ELSE 0 END), 0) as ventas_periodo_actual
            FROM jugarlotto
            WHERE DATE(FECHA) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ");
        $stmt->execute([$dias]);
        $periodoActual = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $db->prepare("
            SELECT
                COALESCE(SUM(CASE WHEN ESTADO = 'A' THEN TOTALJUEGO ELSE 0 END), 0) as ventas_periodo_anterior
            FROM jugarlotto
            WHERE DATE(FECHA) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            AND DATE(FECHA) < DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ");
        $stmt->execute([$dias * 2, $dias]);
        $periodoAnterior = $stmt->fetch(PDO::FETCH_ASSOC);

        $cambio = 0;
        if ($periodoAnterior['ventas_periodo_anterior'] > 0) {
            $cambio = (($periodoActual['ventas_periodo_actual'] - $periodoAnterior['ventas_periodo_anterior']) / $periodoAnterior['ventas_periodo_anterior']) * 100;
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'ventas_por_dia' => $ventasPorDia,
                'comparacion' => [
                    'periodo_actual' => $periodoActual['ventas_periodo_actual'],
                    'periodo_anterior' => $periodoAnterior['ventas_periodo_anterior'],
                    'cambio_porcentual' => round($cambio, 2)
                ]
            ]
        ]);
    }

    // GET /api/estadisticas.php/animales - Estadísticas de animales
    elseif ($method === 'GET' && end($uriParts) === 'animales') {
        $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-d', strtotime('-7 days'));
        $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-d');

        // Animales más jugados
        $stmt = $db->prepare("
            SELECT
                l.NUM,
                l.VALOR as animal,
                l.COLOR,
                COUNT(DISTINCT hj.RADICADO) as total_jugadas,
                COALESCE(SUM(hj.VALOR), 0) as total_apostado,
                (
                    SELECT COUNT(*)
                    FROM ingresarganadores g
                    WHERE g.CODIGOA = l.NUM
                    AND g.FECHA >= ?
                    AND g.FECHA <= ?
                ) as veces_ganador
            FROM lottoruleta l
            LEFT JOIN hislottojuego hj ON l.NUM = hj.CODANIMAL
            LEFT JOIN jugarlotto j ON hj.RADICADO = j.RADICADO
                AND DATE(j.FECHA) >= ?
                AND DATE(j.FECHA) <= ?
                AND j.ESTADO = 'A'
                AND hj.ESTADOP = 'A'
            GROUP BY l.NUM, l.VALOR, l.COLOR
            ORDER BY total_apostado DESC
        ");
        $stmt->execute([$fechaInicio, $fechaFin, $fechaInicio, $fechaFin]);
        $animales = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calcular ROI (retorno sobre inversión) para cada animal
        $stmt = $db->query("SELECT VALOR FROM parametros WHERE NOMBRE = 'PUNTOSPAGO'");
        $puntosPago = $stmt->fetchColumn() ?? 30;

        foreach ($animales as &$animal) {
            $potencialPago = $animal['total_apostado'] * $puntosPago;
            $animal['potencial_pago'] = $potencialPago;
            $animal['roi'] = $animal['total_apostado'] > 0
                ? round((($animal['total_apostado'] - $potencialPago) / $animal['total_apostado']) * 100, 2)
                : 0;
        }

        echo json_encode([
            'success' => true,
            'data' => $animales
        ]);
    }

    // GET /api/estadisticas.php/horarios - Estadísticas por horario
    elseif ($method === 'GET' && end($uriParts) === 'horarios') {
        $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-d', strtotime('-7 days'));
        $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-d');

        $stmt = $db->prepare("
            SELECT
                h.NUM,
                h.DESCRIPCION as horario,
                h.HORA,
                COUNT(DISTINCT hj.RADICADO) as total_jugadas,
                COALESCE(SUM(hj.VALOR), 0) as total_apostado,
                COALESCE(AVG(hj.VALOR), 0) as promedio_apuesta,
                COUNT(DISTINCT DATE(j.FECHA)) as dias_activos
            FROM horariojuego h
            LEFT JOIN hislottojuego hj ON h.NUM = hj.CODIGOJ
            LEFT JOIN jugarlotto j ON hj.RADICADO = j.RADICADO
                AND DATE(j.FECHA) >= ?
                AND DATE(j.FECHA) <= ?
                AND j.ESTADO = 'A'
                AND hj.ESTADOP = 'A'
            GROUP BY h.NUM, h.DESCRIPCION, h.HORA
            ORDER BY total_apostado DESC
        ");
        $stmt->execute([$fechaInicio, $fechaFin]);
        $horarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $horarios
        ]);
    }

    // GET /api/estadisticas.php/sucursales - Estadísticas por sucursal
    elseif ($method === 'GET' && end($uriParts) === 'sucursales') {
        $fechaInicio = $_GET['fecha_inicio'] ?? date('Y-m-d', strtotime('-7 days'));
        $fechaFin = $_GET['fecha_fin'] ?? date('Y-m-d');

        $stmt = $db->prepare("
            SELECT
                b.CODIGO,
                b.BODEGA as sucursal,
                COUNT(DISTINCT j.RADICADO) as total_tickets,
                COALESCE(SUM(CASE WHEN j.ESTADO = 'A' THEN j.TOTALJUEGO ELSE 0 END), 0) as total_ventas,
                COALESCE(SUM(CASE WHEN j.ESTADO = 'C' THEN j.TOTALJUEGO ELSE 0 END), 0) as total_cancelado,
                COUNT(DISTINCT j.USUARIO) as usuarios_activos,
                COUNT(DISTINCT DATE(j.FECHA)) as dias_activos
            FROM bodegas b
            LEFT JOIN jugarlotto j ON b.CODIGO = j.SUCURSAL
                AND DATE(j.FECHA) >= ?
                AND DATE(j.FECHA) <= ?
            GROUP BY b.CODIGO, b.BODEGA
            ORDER BY total_ventas DESC
        ");
        $stmt->execute([$fechaInicio, $fechaFin]);
        $sucursales = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calcular promedio diario
        foreach ($sucursales as &$sucursal) {
            $sucursal['promedio_diario'] = $sucursal['dias_activos'] > 0
                ? round($sucursal['total_ventas'] / $sucursal['dias_activos'], 2)
                : 0;
        }

        echo json_encode([
            'success' => true,
            'data' => $sucursales
        ]);
    }

    // GET /api/estadisticas.php/resumen-general - Resumen general del sistema
    elseif ($method === 'GET' && end($uriParts) === 'resumen-general') {
        // Total de registros
        $stats = [];

        $stmt = $db->query("SELECT COUNT(*) as total FROM seguridad WHERE ESTADO = 'A'");
        $stats['usuarios_activos'] = $stmt->fetchColumn();

        $stmt = $db->query("SELECT COUNT(*) as total FROM bodegas");
        $stats['total_sucursales'] = $stmt->fetchColumn();

        $stmt = $db->query("SELECT COUNT(*) as total FROM horariojuego WHERE ESTADO = 'A'");
        $stats['horarios_activos'] = $stmt->fetchColumn();

        $stmt = $db->query("SELECT COUNT(*) as total FROM lottoruleta WHERE ESTADO = 'A'");
        $stats['animales_activos'] = $stmt->fetchColumn();

        // Totales históricos
        $stmt = $db->query("SELECT COUNT(DISTINCT RADICADO) as total FROM jugarlotto");
        $stats['total_jugadas_historico'] = $stmt->fetchColumn();

        $stmt = $db->query("SELECT COALESCE(SUM(TOTALJUEGO), 0) as total FROM jugarlotto WHERE ESTADO = 'A'");
        $stats['total_ventas_historico'] = $stmt->fetchColumn();

        $stmt = $db->query("SELECT COUNT(*) as total FROM ingresarganadores");
        $stats['total_sorteos_realizados'] = $stmt->fetchColumn();

        $stmt = $db->query("SELECT COALESCE(SUM(VALOR_GANADO), 0) as total FROM pagos WHERE ESTADO = 'A'");
        $stats['total_pagado_historico'] = $stmt->fetchColumn();

        // Promedios
        $stmt = $db->query("
            SELECT
                COALESCE(AVG(TOTALJUEGO), 0) as promedio_ticket,
                COALESCE(MAX(TOTALJUEGO), 0) as ticket_maximo,
                COALESCE(MIN(TOTALJUEGO), 0) as ticket_minimo
            FROM jugarlotto
            WHERE ESTADO = 'A'
        ");
        $promedios = $stmt->fetch(PDO::FETCH_ASSOC);

        $stats = array_merge($stats, $promedios);

        echo json_encode([
            'success' => true,
            'data' => $stats
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
