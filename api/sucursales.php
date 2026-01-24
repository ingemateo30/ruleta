<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$uriParts = explode('/', trim(parse_url($uri, PHP_URL_PATH), '/'));

try {
    $db = Database::getInstance()->getConnection();

    // GET /api/sucursales.php/listar - Listar todas las sucursales
    if ($method === 'GET' && (end($uriParts) === 'listar' || end($uriParts) === 'sucursales.php')) {
        $stmt = $db->query("
            SELECT b.CODIGO, b.BODEGA, b.DIRECCION, b.TELEFONO, b.EMAIL, b.NIT, b.RESPONSABLE, b.ESTADO,
                   COUNT(DISTINCT s.ID) as TOTAL_USUARIOS
            FROM bodegas b
            LEFT JOIN seguridad s ON b.CODIGO = s.CODBODEGA AND s.ESTADO = 'A'
            GROUP BY b.CODIGO, b.BODEGA, b.DIRECCION, b.TELEFONO, b.EMAIL, b.NIT, b.RESPONSABLE, b.ESTADO
            ORDER BY b.CODIGO ASC
        ");

        $sucursales = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $sucursales
        ]);
    }

    // GET /api/sucursales.php/obtener/{codigo} - Obtener una sucursal por código
    elseif ($method === 'GET' && strpos($uri, '/obtener/') !== false) {
        $codigo = end($uriParts);

        $stmt = $db->prepare("SELECT * FROM bodegas WHERE CODIGO = ?");
        $stmt->execute([$codigo]);

        $sucursal = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($sucursal) {
            // Obtener usuarios de esta sucursal
            $stmt = $db->prepare("
                SELECT ID, NICK, TIPO, CAJA, ESTADO
                FROM seguridad
                WHERE CODBODEGA = ?
                ORDER BY TIPO ASC, NICK ASC
            ");
            $stmt->execute([$codigo]);
            $sucursal['usuarios'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'data' => $sucursal
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Sucursal no encontrada'
            ]);
        }
    }

    // POST /api/sucursales.php/crear - Crear nueva sucursal
    elseif ($method === 'POST' && end($uriParts) === 'crear') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['bodega'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'El nombre de la sucursal es requerido'
            ]);
            exit;
        }

        // Obtener el siguiente código
        $stmt = $db->query("SELECT MAX(CODIGO) as max_codigo FROM bodegas");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $nuevoCodigo = ($result['max_codigo'] ?? 0) + 1;

        // Insertar sucursal con todos los campos
        $stmt = $db->prepare("
            INSERT INTO bodegas (CODIGO, BODEGA, DIRECCION, TELEFONO, EMAIL, NIT, RESPONSABLE, ESTADO)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'A')
        ");
        $result = $stmt->execute([
            $nuevoCodigo,
            $data['bodega'],
            $data['direccion'] ?? null,
            $data['telefono'] ?? null,
            $data['email'] ?? null,
            $data['nit'] ?? null,
            $data['responsable'] ?? null
        ]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Sucursal creada exitosamente',
                'codigo' => $nuevoCodigo
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al crear sucursal'
            ]);
        }
    }

    // PUT /api/sucursales.php/actualizar/{codigo} - Actualizar sucursal
    elseif ($method === 'PUT' && strpos($uri, '/actualizar/') !== false) {
        $codigo = end($uriParts);
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['bodega'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'El nombre de la sucursal es requerido'
            ]);
            exit;
        }

        $stmt = $db->prepare("
            UPDATE bodegas
            SET BODEGA = ?,
                DIRECCION = ?,
                TELEFONO = ?,
                EMAIL = ?,
                NIT = ?,
                RESPONSABLE = ?
            WHERE CODIGO = ?
        ");
        $result = $stmt->execute([
            $data['bodega'],
            $data['direccion'] ?? null,
            $data['telefono'] ?? null,
            $data['email'] ?? null,
            $data['nit'] ?? null,
            $data['responsable'] ?? null,
            $codigo
        ]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Sucursal actualizada exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al actualizar sucursal'
            ]);
        }
    }

    // DELETE /api/sucursales.php/eliminar/{codigo} - Eliminar sucursal
    elseif ($method === 'DELETE' && strpos($uri, '/eliminar/') !== false) {
        $codigo = end($uriParts);

        // Verificar si hay usuarios asociados
        $stmt = $db->prepare("SELECT COUNT(*) FROM seguridad WHERE CODBODEGA = ?");
        $stmt->execute([$codigo]);
        $count = $stmt->fetchColumn();

        if ($count > 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => "No se puede eliminar. Hay {$count} usuario(s) asociado(s) a esta sucursal"
            ]);
            exit;
        }

        // Verificar si hay jugadas asociadas
        $stmt = $db->prepare("SELECT COUNT(*) FROM jugarlotto WHERE SUCURSAL = ?");
        $stmt->execute([$codigo]);
        $count = $stmt->fetchColumn();

        if ($count > 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => "No se puede eliminar. Hay jugadas registradas para esta sucursal"
            ]);
            exit;
        }

        $stmt = $db->prepare("DELETE FROM bodegas WHERE CODIGO = ?");
        $result = $stmt->execute([$codigo]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Sucursal eliminada exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al eliminar sucursal'
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
