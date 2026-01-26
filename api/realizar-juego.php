<?php
/**
 * API Endpoint: Realizar Juego de Lotto Animal
 * 
 * Replica la funcionalidad del formulario FrmDRealizarJuego.java
 * Maneja todas las operaciones para crear y guardar juegos de lotería de animales
 * 
 * Endpoints disponibles:
 * - GET  /realizar-juego/consecutivo          - Obtener próximo número de radicado
 * - GET  /realizar-juego/animales             - Listar todos los animales activos
 * - GET  /realizar-juego/horarios             - Listar horarios de juego activos
 * - GET  /realizar-juego/parametros           - Obtener parámetros mínimo y máximo
 * - GET  /realizar-juego/animal/{codigo}      - Buscar animal por código
 * - POST /realizar-juego/guardar              - Guardar juego completo con historial
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
 * Obtiene el consecutivo del próximo radicado
 * Replica: ConsecutivoRadicado()
 */
function obtenerConsecutivo($conn) {
    try {
        $stmt = $conn->query("SELECT MAX(NUM) AS CONSECUTIVO FROM jugarlotto");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $consecutivo = ($result['CONSECUTIVO'] ?? 0) + 1;
        
        // Formatear con ceros a la izquierda (8 dígitos)
        $radicado = str_pad($consecutivo, 8, '0', STR_PAD_LEFT);
        
        return [
            'success' => true,
            'data' => [
                'consecutivo' => $consecutivo,
                'radicado' => $radicado
            ]
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => 'Error al obtener consecutivo',
            'details' => $e->getMessage()
        ];
    }
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
        
        // Formatear hora para mejor visualización
        foreach ($horarios as &$horario) {
            if (isset($horario['HORA'])) {
                $horario['HORA_FORMATEADA'] = substr($horario['HORA'], 0, 8);
            }
        }
        
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
 * Obtiene los parámetros de apuesta mínima y máxima
 * Replica: ParametroMinimoJ() y ParametroMaximoJ()
 */
function obtenerParametros($conn) {
    try {
        // Parámetro 3: Mínimo
        $stmtMin = $conn->query("SELECT VALOR FROM parametros WHERE CODIGO = 3");
        $minimo = $stmtMin->fetch(PDO::FETCH_ASSOC);
        
        // Parámetro 2: Máximo
        $stmtMax = $conn->query("SELECT VALOR FROM parametros WHERE CODIGO = 2");
        $maximo = $stmtMax->fetch(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'data' => [
                'minimo' => floatval($minimo['VALOR'] ?? 0),
                'maximo' => floatval($maximo['VALOR'] ?? 0)
            ]
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => 'Error al obtener parámetros',
            'details' => $e->getMessage()
        ];
    }
}

/**
 * Busca un animal por su código
 * Replica: BuscarAnimal()
 */
function buscarAnimal($conn, $codigo) {
    try {
        $stmt = $conn->prepare(
            "SELECT CODIGOJUEGO, VALOR, NUM, COLOR 
             FROM lottoruleta 
             WHERE CODIGOJUEGO = :codigo AND ESTADO = 'A'"
        );
        $stmt->execute(['codigo' => $codigo]);
        
        $animal = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$animal) {
            return [
                'success' => false,
                'error' => 'Animal no encontrado'
            ];
        }
        
        return [
            'success' => true,
            'data' => $animal
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => 'Error al buscar animal',
            'details' => $e->getMessage()
        ];
    }
}

/**
 * Valida los datos del juego antes de guardar
 */
function validarJuego($juegos, $minimo, $maximo) {
    $errores = [];
    
    if (empty($juegos)) {
        $errores[] = 'Debe agregar al menos un juego';
    }
    
    foreach ($juegos as $index => $juego) {
        if (!isset($juego['codigoAnimal']) || $juego['codigoAnimal'] === '' || $juego['codigoAnimal'] === null) {
            $errores[] = "Juego #" . ($index + 1) . ": Código de animal requerido";
        }
        
        if (!isset($juego['codigoHorario']) || $juego['codigoHorario'] === '' || $juego['codigoHorario'] === null) {
            $errores[] = "Juego #" . ($index + 1) . ": Horario requerido";
        }
        
        $valor = floatval($juego['valor'] ?? 0);
        if ($valor < $minimo) {
            $errores[] = "Juego #" . ($index + 1) . ": El valor $valor es inferior al mínimo permitido ($minimo)";
        }
        
        if ($valor > $maximo) {
            $errores[] = "Juego #" . ($index + 1) . ": El valor $valor es superior al máximo permitido ($maximo)";
        }
    }
    
    return $errores;
}

/**
 * Guarda el juego completo en la base de datos
 * Replica: Guardar() y HisGuardar()
 */
function guardarJuego($conn, $data) {
    try {
        // Validar datos requeridos
        $required = ['radicado', 'fecha', 'hora', 'sucursal', 'total', 'juegos'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                return [
                    'success' => false,
                    'error' => "Campo requerido: $field"
                ];
            }
        }
        
        // Validar específicamente sucursal (no puede estar vacía)
        if (empty($data['sucursal']) || trim($data['sucursal']) === '') {
            return [
                'success' => false,
                'error' => 'El código de sucursal es obligatorio para guardar el juego'
            ];
        }
        
        // Obtener parámetros para validación
        $parametros = obtenerParametros($conn);
        if (!$parametros['success']) {
            return $parametros;
        }
        
        $minimo = $parametros['data']['minimo'];
        $maximo = $parametros['data']['maximo'];
        
        // Validar juegos
        $errores = validarJuego($data['juegos'], $minimo, $maximo);
        if (!empty($errores)) {
            return [
                'success' => false,
                'error' => 'Errores de validación',
                'details' => $errores
            ];
        }
        
        // Iniciar transacción
        $conn->beginTransaction();
        
        try {
            // Obtener el consecutivo para NUM
            $stmtMax = $conn->query("SELECT MAX(NUM) AS CONSECUTIVO FROM jugarlotto");
            $resultMax = $stmtMax->fetch(PDO::FETCH_ASSOC);
            $num = ($resultMax['CONSECUTIVO'] ?? 0) + 1;
            
            // 1. Insertar en jugarlotto (tabla principal)
            $stmtJuego = $conn->prepare(
                "INSERT INTO jugarlotto 
                 (NUM, RADICADO, FECHA, HORA, SUCURSAL, TOTALJUEGO, USUARIO, ESTADO) 
                 VALUES (:num, :radicado, :fecha, :hora, :sucursal, :total, :usuario, 'A')"
            );
            
            $stmtJuego->execute([
                'num' => $num,
                'radicado' => $data['radicado'],
                'fecha' => $data['fecha'],
                'hora' => $data['hora'],
                'sucursal' => $data['sucursal'],
                'total' => floatval($data['total']),
                'usuario' => $data['usuario'] ?? $data['sucursal'] // Usuario que realiza la jugada
            ]);
            
            // 2. Insertar cada juego en hislottojuego (historial)
            $stmtHis = $conn->prepare(
                "INSERT INTO hislottojuego 
                 (RADICADO, CODANIMAL, ANIMAL, VALOR, CODIGOJ, HORAJUEGO, 
                  DESJUEGO, SUCURSAL, FECHA, HORA, ESTADOP, ESTADOC) 
                 VALUES (:radicado, :codAnimal, :animal, :valor, :codigoJ, 
                         :horaJuego, :desJuego, :sucursal, :fecha, :hora, 'A', 'A')"
            );
            
            foreach ($data['juegos'] as $juego) {
                $stmtHis->execute([
                    'radicado' => $data['radicado'],
                    'codAnimal' => $juego['codigoAnimal'],
                    'animal' => $juego['nombreAnimal'],
                    'valor' => floatval($juego['valor']),
                    'codigoJ' => $juego['codigoHorario'],
                    'horaJuego' => $juego['horaJuego'],
                    'desJuego' => $juego['descripcionHorario'],
                    'sucursal' => $data['sucursal'],
                    'fecha' => $data['fecha'],
                    'hora' => $data['hora']
                ]);
            }
            
            // Confirmar transacción
            $conn->commit();
            
            // Obtener nombre de la sucursal (Tabla bodegas según el esquema)
            $stmtSucursal = $conn->prepare(
                "SELECT BODEGA FROM bodegas WHERE CODIGO = :codigo"
            );
            $stmtSucursal->execute(['codigo' => $data['sucursal']]);
            $sucursalData = $stmtSucursal->fetch(PDO::FETCH_ASSOC);
            $nombreSucursal = $sucursalData['BODEGA'] ?? 'Sucursal ' . $data['sucursal'];
            
            // Preparar datos para el voucher
            $juegosVoucher = [];
            foreach ($data['juegos'] as $juego) {
                $juegosVoucher[] = [
                    'codigoAnimal' => $juego['codigoAnimal'],
                    'nombreAnimal' => $juego['nombreAnimal'],
                    'valor' => floatval($juego['valor']),
                    'codigoHorario' => $juego['codigoHorario'],
                    'horaJuego' => $juego['horaJuego'],
                    'descripcionHorario' => $juego['descripcionHorario']
                ];
            }
            
            return [
                'success' => true,
                'message' => "Juego Lotto Animal con Radicado: {$data['radicado']} almacenado correctamente",
                'data' => [
                    'radicado' => $data['radicado'],
                    'fecha' => $data['fecha'],
                    'hora' => $data['hora'],
                    'codigoSucursal' => $data['sucursal'],
                    'nombreSucursal' => $nombreSucursal,
                    'juegos' => $juegosVoucher,
                    'total' => floatval($data['total']),
                    'cantidad_juegos' => count($data['juegos'])
                ]
            ];
            
        } catch (PDOException $e) {
            // Revertir transacción en caso de error si aún está activa
            if ($conn->inTransaction()) {
                $conn->rollBack();
            }
            throw $e;
        }
        
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => 'Error al guardar el juego',
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
    
    // Parsear la ruta
    $segments = array_filter(explode('/', $path));
    $action = $segments[1] ?? '';
    $param = $segments[2] ?? '';
    
    // GET: Obtener consecutivo
    if ($method === 'GET' && $action === 'consecutivo') {
        $result = obtenerConsecutivo($conn);
        sendResponse($result, $result['success'] ? 200 : 400);
    }
    
    // GET: Listar animales
    elseif ($method === 'GET' && $action === 'animales') {
        $result = listarAnimales($conn);
        sendResponse($result, $result['success'] ? 200 : 400);
    }
    
    // GET: Listar horarios
    elseif ($method === 'GET' && $action === 'horarios') {
        $result = listarHorarios($conn);
        sendResponse($result, $result['success'] ? 200 : 400);
    }
    
    // GET: Obtener parámetros
    elseif ($method === 'GET' && $action === 'parametros') {
        $result = obtenerParametros($conn);
        sendResponse($result, $result['success'] ? 200 : 400);
    }
    
    // GET: Buscar animal por código
    elseif ($method === 'GET' && $action === 'animal' && !empty($param)) {
        $result = buscarAnimal($conn, $param);
        sendResponse($result, $result['success'] ? 200 : 404);
    }
    
    // POST: Guardar juego completo
    elseif ($method === 'POST' && $action === 'guardar') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendError('JSON inválido', 400, json_last_error_msg());
        }
        
        $result = guardarJuego($conn, $data);
        sendResponse($result, $result['success'] ? 201 : 400);
    }
    
    // Ruta no encontrada
    else {
        sendError('Endpoint no encontrado', 404, [
            'method' => $method,
            'path' => $path,
            'available_endpoints' => [
                'GET /realizar-juego/consecutivo',
                'GET /realizar-juego/animales',
                'GET /realizar-juego/horarios',
                'GET /realizar-juego/parametros',
                'GET /realizar-juego/animal/{codigo}',
                'POST /realizar-juego/guardar'
            ]
        ]);
    }
    
} catch (Exception $e) {
    sendError('Error interno del servidor', 500, $e->getMessage());
}
