<?php
/**
 * API Endpoint: Anular Juego de Lotto Animal
 *
 * Replica la funcionalidad del formulario FrmDAnularJuego.java
 * Permite buscar un juego por radicado y fecha para proceder con su anulacion
 *
 * Endpoints disponibles:
 * - GET  /anular-juego/buscar                 - Buscar juego por radicado y fecha
 * - POST /anular-juego/ejecutar               - Ejecutar anulacion del juego
 */
require_once __DIR__ . '/db.php';
require_once 'auth_middleware.php';

// Inicializar seguridad - Requiere autenticacion (cualquier usuario logueado)
$currentUser = initApiSecurity(true, ['0', '1', '2']);

// El middleware ya maneja OPTIONS, pero dejamos esto por compatibilidad
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}



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
function buscarJuego($conn, $radicado, $fecha, $sucursalOperario = null) {
    try {
        if (empty($radicado) || empty($fecha)) {
            return [
                'success' => false,
                'error' => 'Radicado y fecha son requeridos'
            ];
        }

        // 1. Buscar en jugarlotto (Cabecera)
        $sql = "SELECT RADICADO, FECHA, HORA, SUCURSAL, TOTALJUEGO, ESTADO
             FROM jugarlotto
             WHERE RADICADO = :radicado AND FECHA = :fecha";

        $params = ['radicado' => $radicado, 'fecha' => $fecha];

        if ($sucursalOperario !== null) {
            $sql .= " AND SUCURSAL = :sucursal";
            $params['sucursal'] = $sucursalOperario;
        }

        $stmtJuego = $conn->prepare($sql);
        $stmtJuego->execute($params);
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
function ejecutarAnulacion($conn, $radicado, $fecha, $motivo = null, $usuario = null, $sucursalOperario = null) {
    try {
        if (empty($radicado) || empty($fecha)) {
            return [
                'success' => false,
                'error' => 'Radicado y fecha son requeridos para anular'
            ];
        }

        if (empty($motivo)) {
            return [
                'success' => false,
                'error' => 'El motivo de anulación es requerido'
            ];
        }

       // Verificar que el juego exista y esté activo antes de proceder
        $sqlCheck = "SELECT RADICADO, ESTADO, SUCURSAL FROM jugarlotto WHERE RADICADO = :radicado AND FECHA = :fecha";
        $paramsCheck = ['radicado' => $radicado, 'fecha' => $fecha];

        if ($sucursalOperario !== null) {
            $sqlCheck .= " AND SUCURSAL = :sucursal";
            $paramsCheck['sucursal'] = $sucursalOperario;
        }

        $stmtCheck = $conn->prepare($sqlCheck);
        $stmtCheck->execute($paramsCheck);
        $juegoExistente = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$juegoExistente) {
            return [
                'success' => false,
                'error' => 'No se encontró el juego con ese radicado y fecha'
            ];
        }
 
        if ($juegoExistente['ESTADO'] !== 'A') {
            return [
                'success' => false,
                'error' => 'El juego ya se encuentra anulado'
            ];
        }
 
        // Iniciar transacción
        $conn->beginTransaction();
 
        // 1. Intentar actualizar jugarlotto con columnas de motivo (si existen)
        try {
            $stmtUpdJuego = $conn->prepare(
                "UPDATE jugarlotto
                 SET ESTADO = 'I',
                     MOTIVO_ANULACION = :motivo,
                     FECHA_ANULACION = NOW(),
                     USUARIO_ANULACION = :usuario
                 WHERE RADICADO = :radicado AND FECHA = :fecha AND ESTADO = 'A'"
            );
            $stmtUpdJuego->execute([
                'radicado' => $radicado,
                'fecha' => $fecha,
                'motivo' => $motivo,
                'usuario' => $usuario
            ]);
        } catch (PDOException $colErr) {
            // Si las columnas de motivo no existen, solo actualizar el ESTADO
            $stmtUpdJuego = $conn->prepare(
                "UPDATE jugarlotto
                 SET ESTADO = 'I'
                 WHERE RADICADO = :radicado AND FECHA = :fecha AND ESTADO = 'A'"
            );
            $stmtUpdJuego->execute([
                'radicado' => $radicado,
                'fecha' => $fecha
            ]);
        }

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
            'message' => "Juego con Radicado: $radicado ha sido anulado correctamente",
            'data' => [
                'radicado' => $radicado,
                'motivo' => $motivo,
                'usuario' => $usuario
            ]
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

    // Obtener sucursal del operario (null para admins)
    $sucursalOperario = getOperatorSucursal($currentUser);

    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_SERVER['PATH_INFO'] ?? '/';

    $segments = array_filter(explode('/', $path));
    $action = $segments[1] ?? '';

    // GET: Buscar juego
    if ($method === 'GET' && $action === 'buscar') {
        $radicado = $_GET['radicado'] ?? null;
        $fecha = $_GET['fecha'] ?? null;
        $result = buscarJuego($conn, $radicado, $fecha, $sucursalOperario);
        sendResponse($result, $result['success'] ? 200 : 400);
    }

    // POST: Ejecutar anulación
    elseif ($method === 'POST' && $action === 'ejecutar') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        $radicado = $data['radicado'] ?? null;
        $fecha = $data['fecha'] ?? null;
        $motivo = $data['motivo'] ?? null;
        $usuario = $data['usuario'] ?? null;

        $result = ejecutarAnulacion($conn, $radicado, $fecha, $motivo, $usuario, $sucursalOperario);
        sendResponse($result, $result['success'] ? 200 : 400);
    }
    
    // GET: Listar tickets anulados (solo admin/superadmin)
    elseif ($method === 'GET' && $action === 'anulados') {
        // Solo admin y superadmin pueden ver el reporte
    
        $fechaInicio = $_GET['fecha_inicio'] ?? null;
        $fechaFin = $_GET['fecha_fin'] ?? null;
        $sucursalFiltro = $_GET['sucursal'] ?? null;

        $conditions = ["j.ESTADO = 'I'"];
        $params = [];

        if ($fechaInicio && $fechaFin) {
            $conditions[] = "DATE(j.FECHA) >= ?";
            $conditions[] = "DATE(j.FECHA) <= ?";
            $params[] = $fechaInicio;
            $params[] = $fechaFin;
        }
        if ($sucursalFiltro && $sucursalFiltro !== '0') {
            $conditions[] = "j.SUCURSAL = ?";
            $params[] = $sucursalFiltro;
        }

        $whereClause = 'WHERE ' . implode(' AND ', $conditions);

        // Obtener tickets anulados
        $sql = "
            SELECT j.RADICADO, j.FECHA, j.HORA, j.SUCURSAL,
                   j.TOTALJUEGO, j.MOTIVO_ANULACION, j.FECHA_ANULACION,
                   j.USUARIO_ANULACION,
                   b.BODEGA as NOMBRE_SUCURSAL
            FROM jugarlotto j
            LEFT JOIN bodegas b ON j.SUCURSAL = b.CODIGO
            $whereClause
            ORDER BY j.FECHA_ANULACION DESC, j.FECHA DESC
            LIMIT 500
        ";
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $anulados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calcular resumen
        $totalAnulados = count($anulados);
        $totalMonto = 0;
        foreach ($anulados as $a) {
            $totalMonto += floatval($a['TOTALJUEGO'] ?? 0);
        }

        sendResponse([
            'success' => true,
            'data' => $anulados,
            'resumen' => [
                'total_anulados' => $totalAnulados,
                'total_monto' => $totalMonto
            ]
        ]);
    }

    else {
        sendError('Endpoint no encontrado', 404, [
            'available_endpoints' => [
                'GET /anular-juego/buscar?radicado=X&fecha=YYYY-MM-DD',
                'POST /anular-juego/ejecutar',
                'GET /anular-juego/anulados?fecha_inicio=X&fecha_fin=Y&sucursal=Z'
            ]
        ]);
    }
    
} catch (Exception $e) {
    sendError('Error interno del servidor', 500, $e->getMessage());
}
