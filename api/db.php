<?php
/**
 * Archivo de conexión a la base de datos
 * Carga las variables de entorno desde .env y crea la conexión PDO
 */

// Cargar variables de entorno desde .env (misma carpeta)
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Ignorar comentarios y líneas vacías
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        
        // Separar clave y valor
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remover comillas si existen
            $value = trim($value, '"\'');
            
            $_ENV[$key] = $value;
            putenv($key . '=' . $value);
        }
    }
}

// Configuración de la base de datos desde variables de entorno
// En Docker: DB_HOST=db (configurado en docker-compose.yml)
// Localmente: usar 127.0.0.1 para forzar TCP/IP en lugar de socket Unix
$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'if0_40919233_lottoa';
$dbuser = getenv('DB_USER') ?: 'root';
$dbpass = getenv('DB_PASS') ?: '123';
$port = getenv('DB_PORT') ?: '3306';

/**
 * Obtiene la conexión PDO a la base de datos
 * 
 * @return PDO|null Retorna la conexión PDO o null si hay error
 * @throws PDOException Si hay un error de conexión
 */
function getDBConnection() {
    global $host, $port, $dbname, $dbuser, $dbpass;
    
    static $pdo = null;
    
    // Si ya existe una conexión, reutilizarla
    if ($pdo !== null) {
        return $pdo;
    }
    
    try {
        // Construir el DSN
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
        
        // Opciones de PDO
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 5,
            PDO::ATTR_PERSISTENT => false
        ];
        
        // Crear la conexión
        $pdo = new PDO($dsn, $dbuser, $dbpass, $options);
        
        return $pdo;
        
    } catch (PDOException $e) {
        // Log del error (en producción, usar un sistema de logging apropiado)
        error_log("Error de conexión a la base de datos: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Prueba la conexión a la base de datos
 * 
 * @return bool True si la conexión es exitosa, false en caso contrario
 */
function testDBConnection() {
    try {
        $pdo = getDBConnection();
        $pdo->query("SELECT 1");
        return true;
    } catch (PDOException $e) {
        return false;
    }
}
?>
