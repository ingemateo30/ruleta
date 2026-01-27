<?php
/**
 * API Pública para la Ruleta - No requiere autenticación
 *
 * Endpoints disponibles:
 * - GET /api/ruleta-publica.php/proximo-sorteo - Obtener información del próximo sorteo
 * - GET /api/ruleta-publica.php/ultimo-resultado - Obtener el último resultado
 * - GET /api/ruleta-publica.php/resultados-hoy - Obtener todos los resultados de hoy
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/db.php';

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
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
        $ahora = date('H:i:s');
        $hoy = date('Y-m-d');
 $esManana = false;
 
        // Buscar el próximo horario que aún no ha pasado
        $stmt = $conn->prepare("
            SELECT
                h.NUM,
                h.DESCRIPCION,
                h.HORA,
                TIMESTAMPDIFF(SECOND, NOW(), CONCAT(:fecha, ' ', h.HORA)) as segundos_faltantes
            FROM horariojuego h
            WHERE h.ESTADO = 'A'
            AND h.HORA > :ahora
            ORDER BY h.HORA ASC
            LIMIT 1
        ");
        $stmt->execute(['fecha' => $hoy, 'ahora' => $ahora]);
        $proximo = $stmt->fetch(PDO::FETCH_ASSOC);
 
        // Si no hay más sorteos hoy, obtener el primero de mañana
        if (!$proximo) {
            $esManana = true;
            $manana = date('Y-m-d', strtotime('+1 day'));
            $stmt = $conn->prepare("
                SELECT
                    h.NUM,
                    h.DESCRIPCION,
                    h.HORA,
                    TIMESTAMPDIFF(SECOND, NOW(), CONCAT(:fecha, ' ', h.HORA)) as segundos_faltantes
                FROM horariojuego h
                WHERE h.ESTADO = 'A'
                ORDER BY h.HORA ASC
                LIMIT 1
            ");
            $stmt->execute(['fecha' => $manana]);
            $proximo = $stmt->fetch(PDO::FETCH_ASSOC);
        }
 
        // Verificar si ya hay un resultado para el horario actual (el más reciente ya jugado)
        $stmt = $conn->prepare("
            SELECT
                g.CODIGOA,
                g.ANIMAL,
                g.CODIGOH,
                h.DESCRIPCION as horario,
                h.HORA
            FROM ingresarganadores g
            JOIN horariojuego h ON g.CODIGOH = h.NUM
            WHERE g.FECHA = :fecha
            AND g.ESTADO = 'A'
            ORDER BY h.HORA DESC
            LIMIT 1
        ");
        $stmt->execute(['fecha' => $hoy]);
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
                'hora_servidor' => date('H:i:s'),
                'fecha_servidor' => $hoy
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
        // Usar fecha del parámetro si se proporciona, sino usar fecha actual
        $hoy = isset($_GET['fecha']) && !empty($_GET['fecha']) ? $_GET['fecha'] : date('Y-m-d');
        $ahora = date('H:i:s');

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
                    WHEN h.HORA <= :ahora THEN 'PENDIENTE'
                    ELSE 'PROXIMO'
                END as estado
            FROM horariojuego h
            LEFT JOIN ingresarganadores g ON h.NUM = g.CODIGOH AND g.FECHA = :fecha AND g.ESTADO = 'A'
            LEFT JOIN lottoruleta l ON g.CODIGOA = l.NUM
            WHERE h.ESTADO = 'A'
            ORDER BY h.HORA ASC
        ");
        $stmt->execute(['fecha' => $hoy, 'ahora' => $ahora]);
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
