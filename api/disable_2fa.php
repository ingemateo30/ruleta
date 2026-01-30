<?php
require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/TOTP.php';

// Inicializar seguridad REQUIRIENDO autenticación
initApiSecurity(true);

// Solo permitir método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

require_once __DIR__ . '/db.php';

$userId = $_SERVER['HTTP_X_USER_ID'] ?? null;
$data = json_decode(file_get_contents('php://input'), true);

if (!$userId || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit();
}

$password = trim($data['password']);

try {
    $pdo = getDBConnection();
    
    // Verificar contraseña del usuario
    $stmt = $pdo->prepare("SELECT CLAVE FROM seguridad WHERE ID = :id");
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || $user['CLAVE'] !== $password) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
        exit();
    }
    
    // Desactivar 2FA
    $stmt = $pdo->prepare("UPDATE seguridad SET TOTP_SECRET = NULL, TOTP_ENABLED = 0 WHERE ID = :id");
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => '2FA desactivado correctamente'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
}
?>