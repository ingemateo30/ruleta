<?php
require_once 'auth_middleware.php';
require_once 'db.php';

// Inicializar seguridad - Requiere autenticacion y rol Admin o SuperAdmin.
// Se omite la verificación de restricciones activas ($checkRestrictions = false) para que el
// Admin siempre pueda gestionar usuarios sin quedar bloqueado por restricciones propias.
$currentUser = initApiSecurity(true, ['0', '1'], false);

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$uriParts = explode('/', trim(parse_url($uri, PHP_URL_PATH), '/'));

try {
    $db = Database::getInstance()->getConnection();

    // GET /api/usuarios.php/listar - Listar todos los usuarios
    if ($method === 'GET' && (end($uriParts) === 'listar' || end($uriParts) === 'usuarios.php')) {
        
        // Si es SuperAdmin (tipo 0), puede ver todos los usuarios
        // Si es Admin (tipo 1), solo puede ver usuarios tipo 1 y 2 (no SuperAdmins)
        if ($currentUser['TIPO'] == '0') {
            // SuperAdmin ve todos
            $stmt = $db->query("
                SELECT s.ID, s.NOMBRE, s.NICK, s.TIPO, s.CAJA, s.CODBODEGA, s.ESTADO,
                       b.BODEGA as NOMBRE_SUCURSAL
                FROM seguridad s
                LEFT JOIN bodegas b ON s.CODBODEGA = b.CODIGO
                ORDER BY s.ID DESC
            ");
        } else {
            // Admin solo ve usuarios tipo 1 (Admin) y 2 (Operario)
            $stmt = $db->query("
                SELECT s.ID, s.NOMBRE, s.NICK, s.TIPO, s.CAJA, s.CODBODEGA, s.ESTADO,
                       b.BODEGA as NOMBRE_SUCURSAL
                FROM seguridad s
                LEFT JOIN bodegas b ON s.CODBODEGA = b.CODIGO
                WHERE s.TIPO IN ('1', '2')
                ORDER BY s.ID DESC
            ");
        }

        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Mapear tipo de usuario
        foreach ($usuarios as &$usuario) {
            switch($usuario['TIPO']) {
                case '0':
                    $usuario['TIPO_NOMBRE'] = 'SuperAdministrador';
                    break;
                case '1':
                    $usuario['TIPO_NOMBRE'] = 'Administrador';
                    break;
                case '2':
                    $usuario['TIPO_NOMBRE'] = 'Operario';
                    break;
                default:
                    $usuario['TIPO_NOMBRE'] = 'Desconocido';
            }
        }

        echo json_encode([
            'success' => true,
            'data' => $usuarios
        ]);
    }

    // GET /api/usuarios.php/obtener/{id} - Obtener un usuario por ID
    elseif ($method === 'GET' && strpos($uri, '/obtener/') !== false) {
        $id = end($uriParts);

        // Primero obtener el usuario
        $stmt = $db->prepare("
            SELECT s.ID, s.NICK, s.CLAVE, s.TIPO, s.CAJA, s.CODBODEGA, s.ESTADO,
                   b.BODEGA as NOMBRE_SUCURSAL
            FROM seguridad s
            LEFT JOIN bodegas b ON s.CODBODEGA = b.CODIGO
            WHERE s.ID = ?
        ");
        $stmt->execute([$id]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$usuario) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ]);
            exit;
        }

        // Si el usuario actual es Admin (tipo 1) y está intentando ver un SuperAdmin (tipo 0)
        if ($currentUser['TIPO'] == '1' && $usuario['TIPO'] == '0') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'No tiene permisos para ver este usuario'
            ]);
            exit;
        }

        switch($usuario['TIPO']) {
            case '0':
                $usuario['TIPO_NOMBRE'] = 'SuperAdministrador';
                break;
            case '1':
                $usuario['TIPO_NOMBRE'] = 'Administrador';
                break;
            case '2':
                $usuario['TIPO_NOMBRE'] = 'Operario';
                break;
            default:
                $usuario['TIPO_NOMBRE'] = 'Desconocido';
        }

        echo json_encode([
            'success' => true,
            'data' => $usuario
        ]);
    }

    // POST /api/usuarios.php/crear - Crear nuevo usuario
    elseif ($method === 'POST' && end($uriParts) === 'crear') {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validaciones
        if (empty($data['nick']) || empty($data['clave']) || empty($data['tipo'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Nick, clave y tipo son requeridos'
            ]);
            exit;
        }

        // Un Admin (tipo 1) no puede crear SuperAdmins (tipo 0)
        if ($currentUser['TIPO'] == '1' && $data['tipo'] == '0') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'No tiene permisos para crear SuperAdministradores'
            ]);
            exit;
        }

        // Verificar si el nick ya existe
        $stmt = $db->prepare("SELECT COUNT(*) FROM seguridad WHERE NICK = ?");
        $stmt->execute([$data['nick']]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'El nick de usuario ya existe'
            ]);
            exit;
        }

        // Generar ID único
        $stmt = $db->query("SELECT MAX(CAST(ID AS UNSIGNED)) as max_id FROM seguridad");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $nuevoId = ($result['max_id'] ?? 0) + 1;

        // Insertar usuario
        $stmt = $db->prepare("
            INSERT INTO seguridad (ID, NOMBRE, NICK, CLAVE, TIPO, CAJA, CODBODEGA, ESTADO)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $result = $stmt->execute([
            $nuevoId,
            $data['nombre'] ?? $data['nick'],
            $data['nick'],
            $data['clave'],
            $data['tipo'],
            $data['caja'] ?? 1,
            $data['codbodega'] ?? 1,
            $data['estado'] ?? 'A'
        ]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Usuario creado exitosamente',
                'id' => $nuevoId
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al crear usuario'
            ]);
        }
    }

    // PUT /api/usuarios.php/actualizar/{id} - Actualizar usuario
    elseif ($method === 'PUT' && strpos($uri, '/actualizar/') !== false) {
        $id = end($uriParts);
        $data = json_decode(file_get_contents('php://input'), true);

        // Verificar que el usuario a actualizar existe y obtener su tipo
        $stmt = $db->prepare("SELECT TIPO FROM seguridad WHERE ID = ?");
        $stmt->execute([$id]);
        $usuarioActual = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$usuarioActual) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ]);
            exit;
        }

        // Un Admin (tipo 1) no puede modificar SuperAdmins (tipo 0)
        if ($currentUser['TIPO'] == '1' && $usuarioActual['TIPO'] == '0') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'No tiene permisos para modificar este usuario'
            ]);
            exit;
        }

        // Un Admin (tipo 1) no puede cambiar el tipo a SuperAdmin (tipo 0)
        if ($currentUser['TIPO'] == '1' && isset($data['tipo']) && $data['tipo'] == '0') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'No tiene permisos para asignar el rol de SuperAdministrador'
            ]);
            exit;
        }

        // Construir query dinámicamente
        $fields = [];
        $values = [];

        if (isset($data['nick'])) {
            $fields[] = "NICK = ?";
            $values[] = $data['nick'];
        }
        if (isset($data['clave']) && !empty($data['clave'])) {
            $fields[] = "CLAVE = ?";
            $values[] = $data['clave'];
        }
        if (isset($data['tipo'])) {
            $fields[] = "TIPO = ?";
            $values[] = $data['tipo'];
        }
        if (isset($data['caja'])) {
            $fields[] = "CAJA = ?";
            $values[] = $data['caja'];
        }
        if (isset($data['codbodega'])) {
            $fields[] = "CODBODEGA = ?";
            $values[] = $data['codbodega'];
        }
        if (isset($data['estado'])) {
            $fields[] = "ESTADO = ?";
            $values[] = $data['estado'];
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'No hay campos para actualizar'
            ]);
            exit;
        }

        $values[] = $id;
        $sql = "UPDATE seguridad SET " . implode(', ', $fields) . " WHERE ID = ?";

        $stmt = $db->prepare($sql);
        $result = $stmt->execute($values);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Usuario actualizado exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al actualizar usuario'
            ]);
        }
    }

    // DELETE /api/usuarios.php/eliminar/{id} - Eliminar usuario (cambiar estado a inactivo)
    elseif ($method === 'DELETE' && strpos($uri, '/eliminar/') !== false) {
        $id = end($uriParts);

        // Verificar que el usuario existe y obtener su tipo
        $stmt = $db->prepare("SELECT TIPO FROM seguridad WHERE ID = ?");
        $stmt->execute([$id]);
        $usuarioActual = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$usuarioActual) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ]);
            exit;
        }

        // Un Admin (tipo 1) no puede eliminar SuperAdmins (tipo 0)
        if ($currentUser['TIPO'] == '1' && $usuarioActual['TIPO'] == '0') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'No tiene permisos para eliminar este usuario'
            ]);
            exit;
        }

        $stmt = $db->prepare("UPDATE seguridad SET ESTADO = 'I' WHERE ID = ?");
        $result = $stmt->execute([$id]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Usuario desactivado exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al desactivar usuario'
            ]);
        }
    }

    else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Endpoint no encontrado'
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error del servidor: ' . $e->getMessage()
    ]);
}