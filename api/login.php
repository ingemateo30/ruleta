<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Solo permitir método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Incluir el archivo de conexión a la base de datos
require_once __DIR__ . '/db.php';

// Obtener datos del POST
$data = json_decode(file_get_contents('php://input'), true);

// Validar que se recibieron los datos necesarios
if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Usuario y contraseña son requeridos']);
    exit();
}

$username = trim($data['username']);
$password = trim($data['password']);

// Validar que no estén vacíos
if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Usuario y contraseña no pueden estar vacíos']);
    exit();
}

try {
    // Obtener la conexión a la base de datos
    $pdo = getDBConnection();
    
    // Consultar usuario en la tabla seguridad con JOIN a bodegas para obtener sucursal
    $stmt = $pdo->prepare("SELECT s.ID, s.NOMBRE, s.NICK, s.CLAVE, s.TIPO, s.CAJA, s.CODBODEGA, s.ESTADO, b.BODEGA as SUCURSAL
                           FROM seguridad s
                           LEFT JOIN bodegas b ON s.CODBODEGA = b.CODIGO
                           WHERE s.NICK = :nick AND s.CLAVE = :clave AND s.ESTADO = 1");
    
    $stmt->bindParam(':nick', $username, PDO::PARAM_STR);
    $stmt->bindParam(':clave', $password, PDO::PARAM_STR);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        // Login exitoso - Devolver todos los valores importantes
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Login exitoso',
            'user' => [
                'id' => $user['ID'],
                'nombre' => $user['NOMBRE'],
                'nick' => $user['NICK'],
                'tipo' => $user['TIPO'],
                'caja' => $user['CAJA'],
                'codigoSucursal' => $user['CODBODEGA'],
                'nombreSucursal' => $user['SUCURSAL'] ?? 'Sin sucursal',
                'estado' => $user['ESTADO']
            ]
        ]);
    } else {
        // Credenciales incorrectas
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Usuario o contraseña incorrectos'
        ]);
    }
    
} catch (PDOException $e) {
    // Error de conexión o consulta
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al conectar con la base de datos: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    // Otro tipo de error
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error inesperado: ' . $e->getMessage()
    ]);
}
?>
