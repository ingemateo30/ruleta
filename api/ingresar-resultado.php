<?php
/**
 * API Endpoint: Ingresar Resultados de Lotto Animal
 *
 * Replica la funcionalidad del formulario FrmDIngresarResultado.java
 * Permite registrar cual animal resulto ganador en un horario y fecha especificos
 *
 * Endpoints disponibles:
 * - GET  /ingresar-resultado/animales          - Listar animales para seleccionar ganador
 * - GET  /ingresar-resultado/horarios          - Listar horarios de juego
 * - POST /ingresar-resultado/guardar           - Registrar animal ganador
 */

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

// Inicializar seguridad - Solo Admin y SuperAdmin pueden ingresar resultados
$currentUser = initApiSecurity(true, ['0', '1']);

/**
 * Responde con JSON y código de estado HTTP
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Maneja errores y responde con mensaje apropiado
 */
function sendError($message, $statusCode = 400, $details = null) {
    $response = [
        'success' => false,
        'error' => $message
    ];
    if ($details !== null) {
        $response['details'] = $details;
    }
    sendResponse($response, $statusCode);
}

/**
 * Lista todos los animales de la ruleta activos
 * Replica: MostrarTabla()
 */
function listarAnimales($conn) {
    try {
        $stmt = $conn->query(
            "SELECT NUM, CODIGOJUEGO, VALOR, COLOR 
             FROM lottoruleta 
             WHERE ESTADO = 'A' 
             ORDER BY NUM"
        );
        
        $animales = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'data' => $animales,
            'count' => count($animales)
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => 'Error al listar animales',
            'details' => $e->getMessage()
        ];
    }
}

/**
 * Lista todos los horarios de juego activos
 * Replica: MostrarTablaJuegos()
 */
function listarHorarios($conn) {
    try {
        $stmt = $conn->query(
            "SELECT NUM, DESCRIPCION, HORA 
             FROM horariojuego 
             WHERE ESTADO = 'A' 
             ORDER BY NUM"
        );
        
        $horarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'data' => $horarios,
            'count' => count($horarios)
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => 'Error al listar horarios',
            'details' => $e->getMessage()
        ];
    }
}

/**
 * Registra el resultado ganador
 * Replica: Guardar()
 */
function guardarResultado($conn, $data) {
    try {
        // Validar datos requeridos
        $required = ['codigoAnimal', 'nombreAnimal', 'codigoHorario', 'descripcionHorario', 'fecha'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return [
                    'success' => false,
                    'error' => "Campo requerido: $field"
                ];
            }
        }

        // Insertar en ingresarganadores
        // NOTA: Se usa DESCRIOCIONH respetando el nombre de la columna en el esquema SQL (posible typo original)
        $stmt = $conn->prepare(
            "INSERT INTO ingresarganadores (CODIGOA, ANIMAL, CODIGOH, DESCRIOCIONH, FECHA, ESTADO) 
             VALUES (:codigoA, :animal, :codigoH, :descH, :fecha, 'A')"
        );

        $stmt->execute([
            'codigoA' => $data['codigoAnimal'],
            'animal'  => $data['nombreAnimal'],
            'codigoH' => $data['codigoHorario'],
            'descH'   => $data['descripcionHorario'],
            'fecha'   => $data['fecha']
        ]);

        return [
            'success' => true,
            'message' => "Resultado ingresado correctamente para la fecha {$data['fecha']}"
        ];

    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => 'Error al guardar el resultado',
            'details' => $e->getMessage()
        ];
    }
}

/**
 * Lista los resultados históricos (ganadores) agrupados por fecha
 */
function listarResultados($conn, $fecha_inicio = null, $fecha_fin = null) {
    try {
        $sql = "
            SELECT
                g.CODIGOA,
                g.ANIMAL,
                g.CODIGOH,
                g.DESCRIOCIONH,
                g.FECHA,
                h.HORA,
                l.NUM as NUMERO_ANIMAL,
                l.COLOR
            FROM ingresarganadores g
            LEFT JOIN horariojuego h ON g.CODIGOH = h.NUM
            LEFT JOIN lottoruleta l ON g.CODIGOA = l.NUM
            WHERE g.ESTADO = 'A'
        ";

        $params = [];

        if ($fecha_inicio) {
            $sql .= " AND g.FECHA >= :fecha_inicio";
            $params['fecha_inicio'] = $fecha_inicio;
        }

        if ($fecha_fin) {
            $sql .= " AND g.FECHA <= :fecha_fin";
            $params['fecha_fin'] = $fecha_fin;
        }

        $sql .= " ORDER BY g.FECHA DESC, h.HORA DESC";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Agrupar por fecha
        $agrupados = [];
        foreach ($resultados as $r) {
            $fecha = $r['FECHA'];
            if (!isset($agrupados[$fecha])) {
                $agrupados[$fecha] = [
                    'fecha' => $fecha,
                    'sorteos' => []
                ];
            }
            $agrupados[$fecha]['sorteos'][] = [
                'hora' => $r['HORA'],
                'animal' => $r['ANIMAL'],
                'numero' => (int)$r['NUMERO_ANIMAL'],
                'color' => $r['COLOR'],
                'codigoHorario' => $r['CODIGOH'],
                'descripcionHorario' => $r['DESCRIOCIONH']
            ];
        }

        return [
            'success' => true,
            'data' => array_values($agrupados),
            'count' => count($resultados)
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => 'Error al listar resultados',
            'details' => $e->getMessage()
        ];
    }
}

// ==================== RUTEO DE PETICIONES ====================

try {
    $conn = getDBConnection();

    if (!$conn) {
        sendError('Error de conexión a la base de datos', 500);
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_SERVER['PATH_INFO'] ?? '/';

    $segments = array_filter(explode('/', $path));
    $action = $segments[1] ?? '';

    // GET: Listar animales
    if ($method === 'GET' && $action === 'animales') {
        $result = listarAnimales($conn);
        sendResponse($result, $result['success'] ? 200 : 400);
    }

    // GET: Listar horarios
    elseif ($method === 'GET' && $action === 'horarios') {
        $result = listarHorarios($conn);
        sendResponse($result, $result['success'] ? 200 : 400);
    }

    // GET: Listar resultados históricos
    elseif ($method === 'GET' && $action === 'listar') {
        $fecha_inicio = $_GET['fecha_inicio'] ?? null;
        $fecha_fin = $_GET['fecha_fin'] ?? null;
        $result = listarResultados($conn, $fecha_inicio, $fecha_fin);
        sendResponse($result, $result['success'] ? 200 : 400);
    }

    // POST: Guardar resultado
    elseif ($method === 'POST' && $action === 'guardar') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            sendError('JSON inválido', 400);
        }

        $result = guardarResultado($conn, $data);
        sendResponse($result, $result['success'] ? 201 : 400);
    }

    else {
        sendError('Endpoint no encontrado', 404, [
            'available_endpoints' => [
                'GET /ingresar-resultado/animales',
                'GET /ingresar-resultado/horarios',
                'GET /ingresar-resultado/listar',
                'POST /ingresar-resultado/guardar'
            ]
        ]);
    }

} catch (Exception $e) {
    sendError('Error interno del servidor', 500, $e->getMessage());
}
