<?php
require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/TOTP.php';
require_once __DIR__ . '/db.php';

// Inicializar seguridad REQUIRIENDO autenticación
initApiSecurity(false);

// Solo permitir método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}



$userId = $_SERVER['HTTP_X_USER_ID'] ?? null;
$data = json_decode(file_get_contents('php://input'), true);

if (!$userId || !isset($data['code'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit();
}

$code = trim($data['code']);

try {
    $pdo = getDBConnection();
    
    // Obtener secreto del usuario
    $stmt = $pdo->prepare("SELECT TOTP_SECRET, TOTP_ENABLED FROM seguridad WHERE ID = :id");
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !$user['TOTP_SECRET']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => '2FA no configurado']);
        exit();
    }
    
    // Verificar el código
    if (TOTP::verifyCode($code, $user['TOTP_SECRET'])) {
        // Activar 2FA
        $stmt = $pdo->prepare("UPDATE seguridad SET TOTP_ENABLED = 1 WHERE ID = :id");
        $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => '2FA activado correctamente'
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Código incorrecto'
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
}
?>