<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/TOTP.php';

// Inicializar seguridad REQUIRIENDO autenticación
initApiSecurity(false);

// Solo permitir método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}


// Obtener usuario autenticado del header
$userId = $_SERVER['HTTP_X_USER_ID'] ?? null;

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

try {
    $pdo = getDBConnection();
    
    // Obtener información del usuario
    $stmt = $pdo->prepare("SELECT ID, NOMBRE, NICK FROM seguridad WHERE ID = :id");
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        exit();
    }
    
    // Verificar si ya tiene una columna para 2FA en la base de datos
    // Si no existe, necesitarás agregar las columnas: TOTP_SECRET y TOTP_ENABLED a la tabla seguridad
    
    // Generar nuevo secreto TOTP
    $secret = TOTP::generateSecret();
    
    // Guardar el secreto temporalmente (aún no activado)
    $stmt = $pdo->prepare("UPDATE seguridad SET TOTP_SECRET = :secret, TOTP_ENABLED = 0 WHERE ID = :id");
    $stmt->bindParam(':secret', $secret, PDO::PARAM_STR);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    // Generar URL para código QR
    $issuer = "Lotto Animal";
    $account = $user['NICK'];
    $qrUrl = TOTP::getQRCodeUrl($secret, $issuer, $account);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Secreto 2FA generado',
        'secret' => $secret,
        'qrUrl' => $qrUrl,
        'issuer' => $issuer,
        'account' => $account
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
}
?>