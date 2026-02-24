<?php
require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/TOTP.php';

// Inicializar seguridad SIN requerir autenticacion (endpoint publico de login)
initApiSecurity(false);

// Solo permitir método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Incluir el archivo de conexión a la base de datos
require_once __DIR__ . '/db.php';

/**
 * Desencripta una contraseña que fue encriptada con CryptoJS AES
 * Compatible con CryptoJS.AES.encrypt(password, secretKey)
 */
function decryptAESPassword($encryptedPassword, $secretKey) {
    // CryptoJS usa un formato especial: "Salted__" + salt (8 bytes) + ciphertext
    $data = base64_decode($encryptedPassword);

    // Verificar que comienza con "Salted__"
    if (substr($data, 0, 8) !== "Salted__") {
        return false;
    }

    // Extraer salt y ciphertext
    $salt = substr($data, 8, 8);
    $ciphertext = substr($data, 16);

    // Derivar key e IV usando el método de CryptoJS (EVP_BytesToKey)
    $keyAndIv = evpBytesToKey($secretKey, $salt);
    $key = $keyAndIv['key'];
    $iv = $keyAndIv['iv'];

    // Desencriptar
    $decrypted = openssl_decrypt($ciphertext, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

    return $decrypted;
}

/**
 * Implementación de EVP_BytesToKey compatible con CryptoJS
 */
function evpBytesToKey($password, $salt) {
    $keySize = 32; // 256 bits
    $ivSize = 16;  // 128 bits
    $totalSize = $keySize + $ivSize;

    $derivedBytes = '';
    $block = '';

    while (strlen($derivedBytes) < $totalSize) {
        $block = md5($block . $password . $salt, true);
        $derivedBytes .= $block;
    }

    return [
        'key' => substr($derivedBytes, 0, $keySize),
        'iv' => substr($derivedBytes, $keySize, $ivSize)
    ];
}

// Clave secreta (debe coincidir con la del frontend)
define('AES_SECRET_KEY', 'L0tt0An1m4l_S3cur3_K3y_2024!');

// Obtener datos del POST
$data = json_decode(file_get_contents('php://input'), true);

// Validar que se recibieron los datos necesarios
if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Usuario y contraseña son requeridos']);
    exit();
}

$username = trim($data['username']);
$encryptedPassword = trim($data['password']);
$totpCode = isset($data['totpCode']) ? trim($data['totpCode']) : null;

// Desencriptar la contraseña
$password = decryptAESPassword($encryptedPassword, AES_SECRET_KEY);

// Si la desencriptación falla, intentar usar la contraseña directamente (compatibilidad)
if ($password === false) {
    $password = $encryptedPassword;
}

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
    $stmt = $pdo->prepare("SELECT s.ID, s.NOMBRE, s.NICK, s.CLAVE, s.TIPO, s.CAJA, s.CODBODEGA, s.ESTADO, 
                           s.TOTP_SECRET, s.TOTP_ENABLED, b.BODEGA as SUCURSAL
                           FROM seguridad s
                           LEFT JOIN bodegas b ON s.CODBODEGA = b.CODIGO
                           WHERE s.NICK = :nick AND s.CLAVE = :clave AND (s.ESTADO = '1' OR s.ESTADO = 'A')");
    
    $stmt->bindParam(':nick', $username, PDO::PARAM_STR);
    $stmt->bindParam(':clave', $password, PDO::PARAM_STR);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        // Verificar restricciones de acceso activas (antes de 2FA)
        $restriccion = checkAccessRestriction($user, $pdo);
        if ($restriccion) {
            http_response_code(403);
            echo json_encode([
                'success'  => false,
                'message'  => $restriccion['motivo'],
                'code'     => 'ACCESS_RESTRICTED'
            ]);
            exit();
        }

        // Verificar si el usuario tiene 2FA activado
        if ($user['TOTP_ENABLED'] == 1 && !empty($user['TOTP_SECRET'])) {
            // 2FA está activado - se requiere código TOTP
            
            if (empty($totpCode)) {
                // No se proporcionó código TOTP - solicitar
                http_response_code(200);
                echo json_encode([
                    'success' => false,
                    'requires2FA' => true,
                    'message' => 'Se requiere código de autenticación de dos factores',
                    'userId' => $user['ID'] // Temporal para segundo paso
                ]);
                exit();
            }
            
            // Verificar código TOTP
            if (!TOTP::verifyCode($totpCode, $user['TOTP_SECRET'])) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'requires2FA' => true,
                    'message' => 'Código de autenticación incorrecto'
                ]);
                exit();
            }
            
            // Código TOTP correcto - continuar con login
        }
        
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
                'sucursal' => $user['SUCURSAL'] ?? 'Sin sucursal',
                'estado' => $user['ESTADO'],
                'has2FA' => ($user['TOTP_ENABLED'] == 1)
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