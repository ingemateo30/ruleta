<?php
/**
 * Middleware de Autenticacion y Seguridad
 *
 * Este archivo proporciona funciones para validar la autenticacion
 * y aplicar medidas de seguridad en las APIs.
 */

// Configuracion de seguridad
define('AUTH_TOKEN_HEADER', 'X-Auth-Token');
define('AUTH_USER_HEADER', 'X-Auth-User');
define('MAX_REQUEST_SIZE', 1024 * 1024); // 1MB
define('RATE_LIMIT_REQUESTS', 100);
define('RATE_LIMIT_WINDOW', 60); // segundos

/**
 * Configura los headers de seguridad para las respuestas
 */
function setSecurityHeaders() {
    // CORS - Permitir solicitudes desde origenes conocidos
    $allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8080'
    ];

    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        // En desarrollo, permitir cualquier origen
        header('Access-Control-Allow-Origin: *');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token, X-Auth-User, Authorization');
    header('Access-Control-Allow-Credentials: true');
    header('Content-Type: application/json; charset=utf-8');

    // Headers de seguridad adicionales
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');

    // Prevenir cache de respuestas sensibles
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
}

/**
 * Maneja las solicitudes OPTIONS (preflight)
 */
function handleOptionsRequest() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Valida que el usuario este autenticado
 * Verifica el token de autenticacion en los headers
 *
 * @param bool $required Si es true, termina con error si no hay autenticacion
 * @return array|null Datos del usuario si esta autenticado, null si no
 */
function validateAuthentication($required = true) {
    $headers = getallheaders();

    // Buscar token en headers (case-insensitive)
    $token = null;
    $userId = null;

    foreach ($headers as $key => $value) {
        $keyLower = strtolower($key);
        if ($keyLower === strtolower(AUTH_TOKEN_HEADER)) {
            $token = $value;
        }
        if ($keyLower === strtolower(AUTH_USER_HEADER)) {
            $userId = $value;
        }
    }

    // Tambien verificar en Authorization Bearer
    if (!$token && isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
            $token = $matches[1];
        }
    }

    if (!$token || !$userId) {
        if ($required) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'No autorizado. Se requiere autenticacion.',
                'code' => 'AUTH_REQUIRED'
            ]);
            exit();
        }
        return null;
    }

    // Validar el token (el token es el ID del usuario encriptado)
    // Por ahora validamos que el usuario exista en la BD
    try {
        require_once __DIR__ . '/db.php';
        $db = Database::getInstance()->getConnection();

        $stmt = $db->prepare("
            SELECT ID, NOMBRE, NICK, TIPO, CAJA, CODBODEGA, ESTADO
            FROM seguridad
            WHERE ID = ? AND (ESTADO = 'A' OR ESTADO = '1')
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            if ($required) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Usuario no valido o inactivo.',
                    'code' => 'INVALID_USER'
                ]);
                exit();
            }
            return null;
        }

        return $user;

    } catch (Exception $e) {
        if ($required) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error de validacion de autenticacion.',
                'code' => 'AUTH_ERROR'
            ]);
            exit();
        }
        return null;
    }
}

/**
 * Valida que el usuario tenga el rol requerido
 *
 * @param array $user Datos del usuario
 * @param array $allowedRoles Roles permitidos ('0' = SuperAdmin, '1' = Admin, '2' = Operario)
 * @return bool
 */
function validateRole($user, $allowedRoles) {
    if (!$user || !isset($user['TIPO'])) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Acceso denegado. Permisos insuficientes.',
            'code' => 'FORBIDDEN'
        ]);
        exit();
    }

    $userType = strval($user['TIPO']);

    if (!in_array($userType, $allowedRoles)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Acceso denegado. No tiene permisos para esta operacion.',
            'code' => 'FORBIDDEN'
        ]);
        exit();
    }

    return true;
}

/**
 * Sanitiza una cadena para prevenir XSS
 *
 * @param string $input
 * @return string
 */
function sanitizeInput($input) {
    if (is_string($input)) {
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }
    return $input;
}

/**
 * Sanitiza recursivamente un array de datos
 *
 * @param array $data
 * @return array
 */
function sanitizeData($data) {
    if (is_array($data)) {
        return array_map('sanitizeData', $data);
    }
    return sanitizeInput($data);
}

/**
 * Valida el tamano de la solicitud
 */
function validateRequestSize() {
    $contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int)$_SERVER['CONTENT_LENGTH'] : 0;

    if ($contentLength > MAX_REQUEST_SIZE) {
        http_response_code(413);
        echo json_encode([
            'success' => false,
            'message' => 'Solicitud demasiado grande.',
            'code' => 'REQUEST_TOO_LARGE'
        ]);
        exit();
    }
}

/**
 * Obtiene y valida los datos JSON del cuerpo de la solicitud
 *
 * @return array|null
 */
function getJsonInput() {
    $input = file_get_contents('php://input');

    if (empty($input)) {
        return [];
    }

    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Datos JSON invalidos.',
            'code' => 'INVALID_JSON'
        ]);
        exit();
    }

    return sanitizeData($data);
}

/**
 * Registra un intento de acceso para auditoria
 *
 * @param string $action Accion realizada
 * @param array|null $user Usuario que realiza la accion
 * @param array $data Datos adicionales
 */
function logAccess($action, $user = null, $data = []) {
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'action' => $action,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'user_id' => $user ? ($user['ID'] ?? 'unknown') : 'anonymous',
        'data' => $data
    ];

    // En produccion, esto deberia ir a una tabla de logs o archivo
    // Por ahora, lo dejamos preparado
    error_log(json_encode($logEntry));
}

/**
 * Genera un token CSRF
 *
 * @return string
 */
function generateCsrfToken() {
    if (!isset($_SESSION)) {
        session_start();
    }

    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

/**
 * Valida un token CSRF
 *
 * @param string $token
 * @return bool
 */
function validateCsrfToken($token) {
    if (!isset($_SESSION)) {
        session_start();
    }

    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Determina si el usuario es un operario y retorna su codigo de sucursal.
 * Para SuperAdmin y Admin retorna null (pueden ver todo).
 *
 * @param array|null $user Datos del usuario autenticado
 * @return string|null Codigo de sucursal del operario, o null si no aplica
 */
function getOperatorSucursal($user) {
    if (!$user) return null;
    // Solo los operarios (TIPO='2') tienen restriccion por sucursal
    if (strval($user['TIPO']) === '2') {
        return $user['CODBODEGA'] ?? null;
    }
    return null;
}

/**
 * Verifica si el usuario tiene una restricción de acceso activa en el momento actual.
 *
 * Los SuperAdmins (TIPO = '0') nunca son bloqueados por restricciones.
 * Evalúa las restricciones de tipo 'TODOS' y las específicas para el usuario.
 * Una restricción aplica cuando TODOS los criterios presentes coinciden:
 *   - Fecha/rango de fechas (FECHA_INICIO / FECHA_FIN)
 *   - Día de la semana (DIA_SEMANA, lista ISO: 1=Lun ... 7=Dom)
 *   - Franja horaria (HORA_INICIO / HORA_FIN)
 *
 * @param array $user      Datos del usuario autenticado
 * @param PDO   $db        Conexión activa a la base de datos
 * @return array|null      null si no hay restricción, o ['bloqueado'=>true, 'motivo'=>...] si la hay
 */
function checkAccessRestriction($user, $db) {
    if (!$user) return null;

    // SuperAdmin nunca es bloqueado
    if (strval($user['TIPO']) === '0') return null;

    try {
        // Obtener fecha y hora actuales del servidor de base de datos
        $stmtNow = $db->query("SELECT CURDATE() as fecha_hoy, CURTIME() as hora_ahora, DAYOFWEEK(CURDATE()) as dia_mysql");
        $now = $stmtNow->fetch(PDO::FETCH_ASSOC);
        if (!$now) return null;

        $fechaHoy  = $now['fecha_hoy'];
        $horaAhora = $now['hora_ahora'];
        // MySQL DAYOFWEEK: 1=Dom,2=Lun,...,7=Sab → convertir a ISO: 1=Lun...7=Dom
        $diaISO    = ($now['dia_mysql'] == 1) ? 7 : ($now['dia_mysql'] - 1);

        // Traer restricciones activas que apliquen a todos o a este usuario
        $stmt = $db->prepare("
            SELECT ID, TIPO, FECHA_INICIO, FECHA_FIN, DIA_SEMANA, HORA_INICIO, HORA_FIN, MOTIVO
            FROM restricciones_acceso
            WHERE ACTIVO = 'A'
              AND (TIPO = 'TODOS' OR (TIPO = 'USUARIO' AND USUARIO_ID = ?))
        ");
        $stmt->execute([$user['ID']]);
        $restricciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($restricciones as $r) {
            $aplica = true;

            // --- Criterio de fecha ---
            if (!empty($r['FECHA_INICIO'])) {
                if ($fechaHoy < $r['FECHA_INICIO']) {
                    $aplica = false;
                } elseif (!empty($r['FECHA_FIN']) && $fechaHoy > $r['FECHA_FIN']) {
                    $aplica = false;
                }
            }

            // --- Criterio de día de la semana ---
            if ($aplica && !empty($r['DIA_SEMANA'])) {
                $diasPermitidos = array_map('trim', explode(',', $r['DIA_SEMANA']));
                if (!in_array((string)$diaISO, $diasPermitidos)) {
                    $aplica = false;
                }
            }

            // --- Criterio de horario ---
            if ($aplica && !empty($r['HORA_INICIO']) && !empty($r['HORA_FIN'])) {
                if ($horaAhora < $r['HORA_INICIO'] || $horaAhora > $r['HORA_FIN']) {
                    $aplica = false;
                }
            }

            if ($aplica) {
                return [
                    'bloqueado' => true,
                    'motivo'    => $r['MOTIVO'] ?: 'Acceso restringido por el administrador'
                ];
            }
        }

        return null;

    } catch (Exception $e) {
        // Si hay error al verificar restricciones, no bloquear (fail open para no romper el servicio)
        error_log('Error al verificar restricciones de acceso: ' . $e->getMessage());
        return null;
    }
}

/**
 * Inicializa la seguridad para un endpoint de API
 *
 * @param bool  $requireAuth           Si se requiere autenticacion
 * @param array $allowedRoles          Roles permitidos (vacio = todos los autenticados)
 * @param bool  $checkRestrictions     Si se deben verificar restricciones de acceso activas.
 *                                     Pasar false en endpoints de gestión de restricciones para
 *                                     evitar que el Admin quede bloqueado mientras las administra.
 * @return array|null Usuario autenticado o null
 */
function initApiSecurity($requireAuth = false, $allowedRoles = [], $checkRestrictions = true) {
    setSecurityHeaders();
    handleOptionsRequest();
    validateRequestSize();

    $user = null;

    if ($requireAuth) {
        $user = validateAuthentication(true);

        if (!empty($allowedRoles)) {
            validateRole($user, $allowedRoles);
        }

        // Verificar restricciones de acceso activas para el usuario
        if ($user && $checkRestrictions) {
            try {
                $db = Database::getInstance()->getConnection();
                $restriccion = checkAccessRestriction($user, $db);
                if ($restriccion) {
                    http_response_code(403);
                    echo json_encode([
                        'success' => false,
                        'message' => $restriccion['motivo'],
                        'code'    => 'ACCESS_RESTRICTED'
                    ]);
                    exit();
                }
            } catch (Exception $e) {
                // No bloquear si hay error de conexión al verificar restricciones
                error_log('Error en checkAccessRestriction: ' . $e->getMessage());
            }
        }
    }

    return $user;
}
