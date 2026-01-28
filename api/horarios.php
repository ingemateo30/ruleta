<?php
require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/db.php';

// Inicializar seguridad - Requiere autenticacion y rol Admin o SuperAdmin
$currentUser = initApiSecurity(true, ['0', '1']);

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$uriParts = explode('/', trim(parse_url($uri, PHP_URL_PATH), '/'));

try {
    $db = Database::getInstance()->getConnection();

    // GET /api/horarios.php/listar - Listar todos los horarios
    if ($method === 'GET' && (end($uriParts) === 'listar' || end($uriParts) === 'horarios.php')) {
        $stmt = $db->query("
            SELECT h.NUM, h.DESCRIPCION, h.HORA, h.ESTADO,
                   COUNT(DISTINCT hj.RADICADO) as TOTAL_JUGADAS
            FROM horariojuego h
            LEFT JOIN hislottojuego hj ON h.NUM = hj.CODIGOJ AND hj.ESTADOP = 'A'
            GROUP BY h.NUM, h.DESCRIPCION, h.HORA, h.ESTADO
            ORDER BY h.HORA ASC
        ");

        $horarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Formatear estado
        foreach ($horarios as &$horario) {
            $horario['ESTADO_TEXTO'] = $horario['ESTADO'] === 'A' ? 'Activo' : 'Inactivo';
        }

        echo json_encode([
            'success' => true,
            'data' => $horarios
        ]);
    }

    // GET /api/horarios.php/activos - Listar horarios activos
    elseif ($method === 'GET' && end($uriParts) === 'activos') {
        $stmt = $db->query("
            SELECT NUM, DESCRIPCION, HORA, ESTADO
            FROM horariojuego
            WHERE ESTADO = 'A'
            ORDER BY HORA ASC
        ");

        $horarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $horarios
        ]);
    }

    // GET /api/horarios.php/obtener/{num} - Obtener un horario por NUM
    elseif ($method === 'GET' && strpos($uri, '/obtener/') !== false) {
        $num = end($uriParts);

        $stmt = $db->prepare("SELECT * FROM horariojuego WHERE NUM = ?");
        $stmt->execute([$num]);

        $horario = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($horario) {
            // Obtener estadísticas de este horario
            $stmt = $db->prepare("
                SELECT
                    COUNT(DISTINCT hj.RADICADO) as total_jugadas,
                    COALESCE(SUM(hj.VALOR), 0) as total_apostado
                FROM hislottojuego hj
                WHERE hj.CODIGOJ = ? AND hj.ESTADOP = 'A'
            ");
            $stmt->execute([$num]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            $horario['estadisticas'] = $stats;

            echo json_encode([
                'success' => true,
                'data' => $horario
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Horario no encontrado'
            ]);
        }
    }

    // POST /api/horarios.php/crear - Crear nuevo horario
    elseif ($method === 'POST' && end($uriParts) === 'crear') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['descripcion']) || empty($data['hora'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Descripción y hora son requeridos'
            ]);
            exit;
        }

        // Validar formato de hora (HH:MM:SS o HH:MM)
        if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', $data['hora'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Formato de hora inválido. Use HH:MM o HH:MM:SS'
            ]);
            exit;
        }

        // Verificar si ya existe un horario a esa hora
        $stmt = $db->prepare("SELECT COUNT(*) FROM horariojuego WHERE HORA = ?");
        $stmt->execute([$data['hora']]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Ya existe un horario configurado para esa hora'
            ]);
            exit;
        }

        // Obtener el siguiente NUM
        $stmt = $db->query("SELECT MAX(NUM) as max_num FROM horariojuego");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $nuevoNum = ($result['max_num'] ?? 0) + 1;

        // Insertar
        $stmt = $db->prepare("
            INSERT INTO horariojuego (NUM, DESCRIPCION, HORA, ESTADO)
            VALUES (?, ?, ?, ?)
        ");

        $result = $stmt->execute([
            $nuevoNum,
            $data['descripcion'],
            $data['hora'],
            $data['estado'] ?? 'A'
        ]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Horario creado exitosamente',
                'num' => $nuevoNum
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al crear horario'
            ]);
        }
    }

    // PUT /api/horarios.php/actualizar/{num} - Actualizar horario
    elseif ($method === 'PUT' && strpos($uri, '/actualizar/') !== false) {
        $num = end($uriParts);
        $data = json_decode(file_get_contents('php://input'), true);

        $fields = [];
        $values = [];

        if (isset($data['descripcion'])) {
            $fields[] = "DESCRIPCION = ?";
            $values[] = $data['descripcion'];
        }

        if (isset($data['hora'])) {
            // Validar formato
            if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', $data['hora'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Formato de hora inválido'
                ]);
                exit;
            }

            // Verificar que no exista otra con esa hora
            $stmt = $db->prepare("SELECT COUNT(*) FROM horariojuego WHERE HORA = ? AND NUM != ?");
            $stmt->execute([$data['hora'], $num]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Ya existe otro horario con esa hora'
                ]);
                exit;
            }

            $fields[] = "HORA = ?";
            $values[] = $data['hora'];
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

        $values[] = $num;
        $sql = "UPDATE horariojuego SET " . implode(', ', $fields) . " WHERE NUM = ?";

        $stmt = $db->prepare($sql);
        $result = $stmt->execute($values);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Horario actualizado exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al actualizar horario'
            ]);
        }
    }

    // DELETE /api/horarios.php/eliminar/{num} - Eliminar horario (cambiar estado)
    elseif ($method === 'DELETE' && strpos($uri, '/eliminar/') !== false) {
        $num = end($uriParts);

        // Verificar si hay jugadas asociadas
        $stmt = $db->prepare("SELECT COUNT(*) FROM hislottojuego WHERE CODIGOJ = ?");
        $stmt->execute([$num]);
        $count = $stmt->fetchColumn();

        if ($count > 0) {
            // Solo cambiar estado a inactivo
            $stmt = $db->prepare("UPDATE horariojuego SET ESTADO = 'I' WHERE NUM = ?");
            $result = $stmt->execute([$num]);

            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Horario desactivado (tiene jugadas asociadas)'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error al desactivar horario'
                ]);
            }
        } else {
            // Eliminar completamente
            $stmt = $db->prepare("DELETE FROM horariojuego WHERE NUM = ?");
            $result = $stmt->execute([$num]);

            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Horario eliminado exitosamente'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error al eliminar horario'
                ]);
            }
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
