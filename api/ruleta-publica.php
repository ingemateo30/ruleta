<?php
/**
 * API Publica para la Ruleta - No requiere autenticacion
 *
 * Endpoints disponibles:
 * - GET /api/ruleta-publica.php/proximo-sorteo - Obtener informacion del proximo sorteo
 * - GET /api/ruleta-publica.php/ultimo-resultado - Obtener el ultimo resultado
 * - GET /api/ruleta-publica.php/resultados-hoy - Obtener todos los resultados de hoy
 */

require_once __DIR__ . '/auth_middleware.php';

// Inicializar seguridad SIN requerir autenticacion (endpoint publico)
initApiSecurity(false);

require_once __DIR__ . '/db.php';

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Verifica si una fecha dada está marcada como día sin sorteos.
 *
 * @param PDO    $conn       Conexión activa
 * @param string $fecha      Fecha en formato Y-m-d
 * @return array|null        null si hay sorteos, o ['sin_sorteos'=>true, 'motivo'=>'...']
 */
function checkDiaSinSorteo($conn, $fecha) {
    try {
        $stmt = $conn->prepare("
            SELECT MOTIVO FROM dias_sin_sorteo
            WHERE FECHA = ? AND ACTIVO = 'A'
            LIMIT 1
        ");
        $stmt->execute([$fecha]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            return [
                'sin_sorteos' => true,
                'motivo'      => $row['MOTIVO'] ?: 'No hay sorteos programados para este día'
            ];
        }
        return null;
    } catch (Exception $e) {
        return null;
    }
}

try {
    $conn = getDBConnection();

    if (!$conn) {
        sendResponse(['success' => false, 'error' => 'Error de conexión'], 500);
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_SERVER['PATH_INFO'] ?? '/';
    $segments = array_filter(explode('/', $path));
    $action = $segments[1] ?? '';

    // GET: Próximo sorteo
    if ($method === 'GET' && $action === 'proximo-sorteo') {
        $esManana = false;

        // Obtener hora actual del servidor de base de datos (más consistente)
        $stmtHora = $conn->query("SELECT CURTIME() as hora_actual, CURDATE() as fecha_actual");
        $tiempoServidor = $stmtHora->fetch(PDO::FETCH_ASSOC);
        $horaActual = $tiempoServidor['hora_actual'];
        $fechaActual = $tiempoServidor['fecha_actual'];

        // Verificar si hoy es un día sin sorteos
        $diaSinSorteo = checkDiaSinSorteo($conn, $fechaActual);
        if ($diaSinSorteo) {
            sendResponse([
                'success' => true,
                'sin_sorteos' => true,
                'motivo'      => $diaSinSorteo['motivo'],
                'data' => [
                    'proximo_sorteo'   => null,
                    'ultimo_resultado' => null,
                    'hora_servidor'    => $horaActual,
                    'fecha_servidor'   => $fechaActual
                ]
            ]);
        }

        // Buscar el próximo horario que aún no ha pasado hoy
        // Usamos TIME_TO_SEC para calcular segundos de forma precisa
        $stmt = $conn->prepare("
            SELECT
                h.NUM,
                h.DESCRIPCION,
                h.HORA,
                TIME_TO_SEC(TIMEDIFF(h.HORA, CURTIME())) as segundos_faltantes
            FROM horariojuego h
            WHERE h.ESTADO = 'A'
            AND h.HORA > CURTIME()
            ORDER BY h.HORA ASC
            LIMIT 1
        ");
        $stmt->execute();
        $proximo = $stmt->fetch(PDO::FETCH_ASSOC);

        // Si no hay más sorteos hoy, obtener el primero de mañana
        if (!$proximo) {
            $esManana = true;

            // Calcular segundos hasta el primer sorteo de mañana
            // Segundos restantes del día actual + segundos hasta el horario de mañana
            $stmt = $conn->prepare("
                SELECT
                    h.NUM,
                    h.DESCRIPCION,
                    h.HORA,
                    (TIME_TO_SEC('24:00:00') - TIME_TO_SEC(CURTIME())) + TIME_TO_SEC(h.HORA) as segundos_faltantes
                FROM horariojuego h
                WHERE h.ESTADO = 'A'
                ORDER BY h.HORA ASC
                LIMIT 1
            ");
            $stmt->execute();
            $proximo = $stmt->fetch(PDO::FETCH_ASSOC);
        }
 
        // Verificar si ya hay un resultado para el horario actual (el más reciente ya jugado)
        // Solo mostrar resultados cuya hora de sorteo + 1 minuto ya haya pasado
        $stmt = $conn->prepare("
            SELECT
                g.CODIGOA,
                g.ANIMAL,
                g.CODIGOH,
                h.DESCRIPCION as horario,
                h.HORA
            FROM ingresarganadores g
            JOIN horariojuego h ON g.CODIGOH = h.NUM
            WHERE g.FECHA = CURDATE()
            AND g.ESTADO = 'A'
            AND ADDTIME(h.HORA, '00:01:00') <= CURTIME()
            ORDER BY h.HORA DESC
            LIMIT 1
        ");
        $stmt->execute();
        $ultimoResultado = $stmt->fetch(PDO::FETCH_ASSOC);

        sendResponse([
            'success' => true,
            'data' => [
                'proximo_sorteo' => $proximo ? [
                    'codigo' => (int)$proximo['NUM'],
                    'descripcion' => $proximo['DESCRIPCION'],
                    'hora' => $proximo['HORA'],
                    'segundos_faltantes' => max(0, (int)$proximo['segundos_faltantes']),
                    'es_manana' => $esManana
                ] : null,
                'ultimo_resultado' => $ultimoResultado ? [
                    'codigo_animal' => (int)$ultimoResultado['CODIGOA'],
                    'animal' => $ultimoResultado['ANIMAL'],
                    'horario' => $ultimoResultado['horario'],
                    'hora' => $ultimoResultado['HORA']
                ] : null,
                'hora_servidor' => $horaActual,
                'fecha_servidor' => $fechaActual
            ]
        ]);
    }

    // GET: Último resultado
    elseif ($method === 'GET' && $action === 'ultimo-resultado') {
        $hoy = date('Y-m-d');

        $stmt = $conn->prepare("
            SELECT
                g.CODIGOA,
                g.ANIMAL,
                g.CODIGOH,
                g.FECHA,
                h.DESCRIPCION as horario,
                h.HORA,
                l.COLOR
            FROM ingresarganadores g
            JOIN horariojuego h ON g.CODIGOH = h.NUM
            LEFT JOIN lottoruleta l ON g.CODIGOA = l.NUM
            WHERE g.FECHA = :fecha
            AND g.ESTADO = 'A'
            ORDER BY h.HORA DESC
            LIMIT 1
        ");
        $stmt->execute(['fecha' => $hoy]);
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

        sendResponse([
            'success' => true,
            'data' => $resultado ? [
                'codigo_animal' => (int)$resultado['CODIGOA'],
                'animal' => $resultado['ANIMAL'],
                'horario' => $resultado['horario'],
                'hora' => $resultado['HORA'],
                'color' => $resultado['COLOR']
            ] : null
        ]);
    }

    // GET: Todos los resultados de hoy
    elseif ($method === 'GET' && $action === 'resultados-hoy') {
        $hoy = date('Y-m-d');

        $stmt = $conn->prepare("
            SELECT
                g.CODIGOA,
                g.ANIMAL,
                g.CODIGOH,
                h.DESCRIPCION as horario,
                h.HORA,
                l.COLOR
            FROM ingresarganadores g
            JOIN horariojuego h ON g.CODIGOH = h.NUM
            LEFT JOIN lottoruleta l ON g.CODIGOA = l.NUM
            WHERE g.FECHA = :fecha
            AND g.ESTADO = 'A'
            ORDER BY h.HORA ASC
        ");
        $stmt->execute(['fecha' => $hoy]);
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Formatear resultados
        $resultadosFormateados = array_map(function($r) {
            return [
                'codigo_animal' => (int)$r['CODIGOA'],
                'animal' => $r['ANIMAL'],
                'codigo_horario' => (int)$r['CODIGOH'],
                'horario' => $r['horario'],
                'hora' => $r['HORA'],
                'color' => $r['COLOR']
            ];
        }, $resultados);

        // Obtener todos los horarios activos para saber cuáles faltan
        $stmt = $conn->query("
            SELECT NUM, DESCRIPCION, HORA
            FROM horariojuego
            WHERE ESTADO = 'A'
            ORDER BY HORA ASC
        ");
        $horarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendResponse([
            'success' => true,
            'data' => [
                'resultados' => $resultadosFormateados,
                'horarios' => $horarios,
                'fecha' => $hoy
            ]
        ]);
    }

    // GET: Horarios del día con estado
    elseif ($method === 'GET' && $action === 'horarios') {
        // Usar fecha del parámetro si se proporciona, sino usar fecha actual del servidor MySQL
        $stmtFecha = $conn->query("SELECT CURDATE() as fecha_actual, CURTIME() as hora_actual");
        $tiempoServer = $stmtFecha->fetch(PDO::FETCH_ASSOC);

        $hoy = isset($_GET['fecha']) && !empty($_GET['fecha']) ? $_GET['fecha'] : $tiempoServer['fecha_actual'];
        $esHoy = ($hoy === $tiempoServer['fecha_actual']);

        // Verificar si la fecha consultada es un día sin sorteos
        $diaSinSorteo = checkDiaSinSorteo($conn, $hoy);
        if ($diaSinSorteo) {
            sendResponse([
                'success'     => true,
                'sin_sorteos' => true,
                'motivo'      => $diaSinSorteo['motivo'],
                'data'        => []
            ]);
        }

        // Usar la hora del servidor MySQL para consistencia
        $stmt = $conn->prepare("
            SELECT
                h.NUM,
                h.DESCRIPCION,
                h.HORA,
                g.CODIGOA,
                g.ANIMAL,
                l.COLOR,
                CASE
                    WHEN g.CODIGOA IS NOT NULL THEN 'JUGADO'
                    WHEN :esHoy = 1 AND h.HORA <= CURTIME() THEN 'PENDIENTE'
                    WHEN :esHoy2 = 0 THEN 'PENDIENTE'
                    ELSE 'PROXIMO'
                END as estado
            FROM horariojuego h
            LEFT JOIN ingresarganadores g ON h.NUM = g.CODIGOH AND g.FECHA = :fecha AND g.ESTADO = 'A'
            LEFT JOIN lottoruleta l ON g.CODIGOA = l.NUM
            WHERE h.ESTADO = 'A'
            ORDER BY h.HORA ASC
        ");
        $stmt->execute([
            'fecha' => $hoy,
            'esHoy' => $esHoy ? 1 : 0,
            'esHoy2' => $esHoy ? 1 : 0
        ]);
        $horarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendResponse([
            'success' => true,
            'data' => $horarios
        ]);
    }

    else {
        sendResponse([
            'success' => false,
            'error' => 'Endpoint no encontrado',
            'endpoints_disponibles' => [
                'GET /api/ruleta-publica.php/proximo-sorteo',
                'GET /api/ruleta-publica.php/ultimo-resultado',
                'GET /api/ruleta-publica.php/resultados-hoy',
                'GET /api/ruleta-publica.php/horarios'
            ]
        ], 404);
    }

} catch (Exception $e) {
    sendResponse([
        'success' => false,
        'error' => 'Error del servidor: ' . $e->getMessage()
    ], 500);
}
