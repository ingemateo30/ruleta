<?php
/**
 * API Endpoint: Anular Juego de Lotto Animal
 * 
 * Replica la funcionalidad del formulario FrmDAnularJuego.java
 * Permite buscar un juego por radicado y fecha para proceder con su anulación
 * 
 * Endpoints disponibles:
 * - GET  /anular-juego/buscar                 - Buscar juego por radicado y fecha
 * - POST /anular-juego/ejecutar               - Ejecutar anulación del juego
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejo de peticiones OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/db.php';

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
 * Busca un juego y sus detalles por radicado y fecha
 */
function buscarJuego($conn, $radicado, $fecha) {
    try {
        if (empty($radicado) || empty($fecha)) {
            return [
                'success' => false,
                'error' => 'Radicado y fecha son requeridos'
            ];
        }

        // 1. Buscar en jugarlotto (Cabecera)
        $stmtJuego = $conn->prepare(
            "SELECT RADICADO, FECHA, HORA, SUCURSAL, TOTALJUEGO, ESTADO 
             FROM jugarlotto 
             WHERE RADICADO = :radicado AND FECHA = :fecha"
        );
        $stmtJuego->execute(['radicado' => $radicado, 'fecha' => $fecha]);
        $juego = $stmtJuego->fetch(PDO::FETCH_ASSOC);

        if (!$juego) {
            return [
                'success' => false,
                'error' => 'No se encontró ningún juego con ese radicado en la fecha especificada'
            ];
        }

        // 2. Buscar en hislottojuego (Detalles de apuestas)
        $stmtDetalles = $conn->prepare(
            "SELECT CODANIMAL, ANIMAL, VALOR, DESJUEGO, HORAJUEGO, ESTADOP 
             FROM hislottojuego 
             WHERE RADICADO = :radicado AND FECHA = :fecha"
        );
        $stmtDetalles->execute(['radicado' => $radicado, 'fecha' => $fecha]);
        $detalles = $stmtDetalles->fetchAll(PDO::FETCH_ASSOC);

        return [
            'success' => true,
            'data' => [
                'cabecera' => $juego,
                'detalles' => $detalles
            ]
        ];
        
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => 'Error al buscar el juego',
            'details' => $e->getMessage()
        ];
    }
}

/**
 * Anula un juego cambiando su estado
 */
function ejecutarAnulacion($conn, $radicado, $fecha) {
    try {
        if (empty($radicado) || empty($fecha)) {
            return [
                'success' => false,
                'error' => 'Radicado y fecha son requeridos para anular'
            ];
        }

        // Iniciar transacción
        $conn->beginTransaction();

        // 1. Actualizar jugarlotto
        $stmtUpdJuego = $conn->prepare(
            "UPDATE jugarlotto 
             SET ESTADO = 'I' 
             WHERE RADICADO = :radicado AND FECHA = :fecha AND ESTADO = 'A'"
        );
        $stmtUpdJuego->execute(['radicado' => $radicado, 'fecha' => $fecha]);

        if ($stmtUpdJuego->rowCount() === 0) {
            $conn->rollBack();
            return [
                'success' => false,
                'error' => 'El juego no existe o ya está anulado'
            ];
        }

        // 2. Actualizar hislottojuego
        $stmtUpdHis = $conn->prepare(
            "UPDATE hislottojuego 
             SET ESTADOP = 'I', ESTADOC = 'I' 
             WHERE RADICADO = :radicado AND FECHA = :fecha"
        );
        $stmtUpdHis->execute(['radicado' => $radicado, 'fecha' => $fecha]);

        $conn->commit();

        return [
            'success' => true,
            'message' => "Juego con Radicado: $radicado ha sido anulado correctamente"
        ];

    } catch (PDOException $e) {
        $conn->rollBack();
        return [
            'success' => false,
            'error' => 'Error al anular el juego',
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
    
    // GET: Buscar juego
    if ($method === 'GET' && $action === 'buscar') {
        $radicado = $_GET['radicado'] ?? null;
        $fecha = $_GET['fecha'] ?? null;
        $result = buscarJuego($conn, $radicado, $fecha);
        sendResponse($result, $result['success'] ? 200 : 400);
    }
    
    // POST: Ejecutar anulación
    elseif ($method === 'POST' && $action === 'ejecutar') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        $radicado = $data['radicado'] ?? null;
        $fecha = $data['fecha'] ?? null;
        
        $result = ejecutarAnulacion($conn, $radicado, $fecha);
        sendResponse($result, $result['success'] ? 200 : 400);
    }
    
    else {
        sendError('Endpoint no encontrado', 404, [
            'available_endpoints' => [
                'GET /anular-juego/buscar?radicado=X&fecha=YYYY-MM-DD',
                'POST /anular-juego/ejecutar'
            ]
        ]);
    }
    
} catch (Exception $e) {
    sendError('Error interno del servidor', 500, $e->getMessage());
}
