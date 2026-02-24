<?php
/**
 * API de Restricciones de Acceso y Días Sin Sorteo
 *
 * Endpoints:
 *  -- Restricciones de Acceso --
 *  GET  /restricciones.php/listar           - Listar todas las restricciones
 *  GET  /restricciones.php/obtener/{id}     - Obtener una restricción
 *  POST /restricciones.php/crear            - Crear restricción
 *  PUT  /restricciones.php/actualizar/{id}  - Actualizar restricción
 *  DELETE /restricciones.php/eliminar/{id}  - Eliminar restricción
 *
 *  -- Días Sin Sorteo --
 *  GET  /restricciones.php/dias-sin-sorteo/listar          - Listar días sin sorteo
 *  POST /restricciones.php/dias-sin-sorteo/crear           - Crear día sin sorteo
 *  PUT  /restricciones.php/dias-sin-sorteo/actualizar/{id} - Actualizar
 *  DELETE /restricciones.php/dias-sin-sorteo/eliminar/{id} - Eliminar
 */

require_once 'auth_middleware.php';
require_once 'db.php';
date_default_timezone_set('America/Bogota');

// Solo Admin y SuperAdmin pueden gestionar restricciones
$currentUser = initApiSecurity(true, ['0', '1']);

$method  = $_SERVER['REQUEST_METHOD'];
$uri     = $_SERVER['REQUEST_URI'];
$path    = parse_url($uri, PHP_URL_PATH);
// Separar la parte del path relativa al archivo
$parts   = array_values(array_filter(explode('/', $path)));

// Detectar sub-recurso: dias-sin-sorteo o restricciones
// Estructura esperada: [..., restricciones.php, {accion | dias-sin-sorteo, accion}]
$fileIndex = array_search('restricciones.php', $parts);
$subParts  = $fileIndex !== false ? array_slice($parts, $fileIndex + 1) : [];

$isDiasSinSorteo = (isset($subParts[0]) && $subParts[0] === 'dias-sin-sorteo');

try {
    $db = Database::getInstance()->getConnection();

    // ================================================================
    //  DÍAS SIN SORTEO
    // ================================================================
    if ($isDiasSinSorteo) {
        $action = $subParts[1] ?? '';
        $idParam = $subParts[2] ?? null;

        // GET /restricciones.php/dias-sin-sorteo/listar
        if ($method === 'GET' && $action === 'listar') {
            $stmt = $db->query("
                SELECT d.ID, d.FECHA, d.MOTIVO, d.ACTIVO, d.CREADO_POR, d.FECHA_CREACION
                FROM dias_sin_sorteo d
                ORDER BY d.FECHA DESC
            ");
            $dias = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $dias]);
        }

        // GET /restricciones.php/dias-sin-sorteo/proximos
        elseif ($method === 'GET' && $action === 'proximos') {
            $stmt = $db->query("
                SELECT d.ID, d.FECHA, d.MOTIVO, d.ACTIVO, d.CREADO_POR, d.FECHA_CREACION
                FROM dias_sin_sorteo d
                WHERE d.FECHA >= CURDATE() AND d.ACTIVO = 'A'
                ORDER BY d.FECHA ASC
            ");
            $dias = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $dias]);
        }

        // POST /restricciones.php/dias-sin-sorteo/crear
        elseif ($method === 'POST' && $action === 'crear') {
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['fecha'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'La fecha es requerida']);
                exit;
            }

            // Validar formato de fecha
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['fecha'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Formato de fecha inválido. Use YYYY-MM-DD']);
                exit;
            }

            // Verificar si ya existe
            $stmt = $db->prepare("SELECT ID FROM dias_sin_sorteo WHERE FECHA = ?");
            $stmt->execute([$data['fecha']]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // Reactivar si estaba inactivo
                $stmt = $db->prepare("UPDATE dias_sin_sorteo SET ACTIVO = 'A', MOTIVO = ?, CREADO_POR = ? WHERE FECHA = ?");
                $stmt->execute([
                    $data['motivo'] ?? null,
                    $currentUser['NICK'],
                    $data['fecha']
                ]);
                echo json_encode(['success' => true, 'message' => 'Día sin sorteo actualizado', 'id' => $existing['ID']]);
            } else {
                $stmt = $db->prepare("
                    INSERT INTO dias_sin_sorteo (FECHA, MOTIVO, ACTIVO, CREADO_POR)
                    VALUES (?, ?, 'A', ?)
                ");
                $stmt->execute([
                    $data['fecha'],
                    $data['motivo'] ?? null,
                    $currentUser['NICK']
                ]);
                echo json_encode(['success' => true, 'message' => 'Día sin sorteo creado', 'id' => $db->lastInsertId()]);
            }
        }

        // PUT /restricciones.php/dias-sin-sorteo/actualizar/{id}
        elseif ($method === 'PUT' && $action === 'actualizar' && $idParam) {
            $data = json_decode(file_get_contents('php://input'), true);

            $fields = [];
            $values = [];

            if (isset($data['fecha'])) {
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['fecha'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Formato de fecha inválido']);
                    exit;
                }
                $fields[] = 'FECHA = ?';
                $values[] = $data['fecha'];
            }
            if (isset($data['motivo'])) {
                $fields[] = 'MOTIVO = ?';
                $values[] = $data['motivo'];
            }
            if (isset($data['activo'])) {
                $fields[] = 'ACTIVO = ?';
                $values[] = $data['activo'];
            }

            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No hay campos para actualizar']);
                exit;
            }

            $values[] = $idParam;
            $stmt = $db->prepare("UPDATE dias_sin_sorteo SET " . implode(', ', $fields) . " WHERE ID = ?");
            $stmt->execute($values);
            echo json_encode(['success' => true, 'message' => 'Actualizado correctamente']);
        }

        // DELETE /restricciones.php/dias-sin-sorteo/eliminar/{id}
        elseif ($method === 'DELETE' && $action === 'eliminar' && $idParam) {
            $stmt = $db->prepare("DELETE FROM dias_sin_sorteo WHERE ID = ?");
            $stmt->execute([$idParam]);
            echo json_encode(['success' => true, 'message' => 'Día sin sorteo eliminado']);
        }

        else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
        }

        exit;
    }

    // ================================================================
    //  RESTRICCIONES DE ACCESO
    // ================================================================
    $action  = $subParts[0] ?? '';
    $idParam = $subParts[1] ?? null;

    // GET /restricciones.php/listar
    if ($method === 'GET' && $action === 'listar') {
        $stmt = $db->query("
            SELECT r.ID, r.TIPO, r.USUARIO_ID, r.FECHA_INICIO, r.FECHA_FIN,
                   r.DIA_SEMANA, r.HORA_INICIO, r.HORA_FIN, r.MOTIVO,
                   r.ACTIVO, r.CREADO_POR, r.FECHA_CREACION,
                   s.NICK as USUARIO_NICK, s.NOMBRE as USUARIO_NOMBRE
            FROM restricciones_acceso r
            LEFT JOIN seguridad s ON r.USUARIO_ID = s.ID
            ORDER BY r.FECHA_CREACION DESC
        ");
        $restricciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $restricciones]);
    }

    // GET /restricciones.php/obtener/{id}
    elseif ($method === 'GET' && $action === 'obtener' && $idParam) {
        $stmt = $db->prepare("
            SELECT r.*, s.NICK as USUARIO_NICK, s.NOMBRE as USUARIO_NOMBRE
            FROM restricciones_acceso r
            LEFT JOIN seguridad s ON r.USUARIO_ID = s.ID
            WHERE r.ID = ?
        ");
        $stmt->execute([$idParam]);
        $restriccion = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$restriccion) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Restricción no encontrada']);
            exit;
        }
        echo json_encode(['success' => true, 'data' => $restriccion]);
    }

    // POST /restricciones.php/crear
    elseif ($method === 'POST' && $action === 'crear') {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validación básica
        if (empty($data['tipo']) || !in_array($data['tipo'], ['TODOS', 'USUARIO'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El tipo debe ser TODOS o USUARIO']);
            exit;
        }

        if ($data['tipo'] === 'USUARIO' && empty($data['usuario_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Debe especificar el usuario cuando el tipo es USUARIO']);
            exit;
        }

        // Al menos un criterio de restricción
        $tieneCriterio = !empty($data['fecha_inicio'])
            || !empty($data['dia_semana'])
            || (!empty($data['hora_inicio']) && !empty($data['hora_fin']));

        if (!$tieneCriterio) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Debe especificar al menos un criterio: fecha, día de la semana u horario']);
            exit;
        }

        // Validar fechas
        if (!empty($data['fecha_inicio']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['fecha_inicio'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Formato de fecha_inicio inválido']);
            exit;
        }
        if (!empty($data['fecha_fin']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['fecha_fin'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Formato de fecha_fin inválido']);
            exit;
        }
        if (!empty($data['fecha_inicio']) && !empty($data['fecha_fin'])
            && $data['fecha_fin'] < $data['fecha_inicio']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'La fecha_fin debe ser mayor o igual a fecha_inicio']);
            exit;
        }

        // Validar horas
        if (!empty($data['hora_inicio']) && !preg_match('/^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/', $data['hora_inicio'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Formato de hora_inicio inválido']);
            exit;
        }
        if (!empty($data['hora_fin']) && !preg_match('/^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/', $data['hora_fin'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Formato de hora_fin inválido']);
            exit;
        }

        $stmt = $db->prepare("
            INSERT INTO restricciones_acceso
                (TIPO, USUARIO_ID, FECHA_INICIO, FECHA_FIN, DIA_SEMANA,
                 HORA_INICIO, HORA_FIN, MOTIVO, ACTIVO, CREADO_POR)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'A', ?)
        ");
        $stmt->execute([
            $data['tipo'],
            $data['tipo'] === 'USUARIO' ? $data['usuario_id'] : null,
            $data['fecha_inicio'] ?? null,
            $data['fecha_fin']    ?? null,
            $data['dia_semana']   ?? null,
            $data['hora_inicio']  ?? null,
            $data['hora_fin']     ?? null,
            $data['motivo']       ?? null,
            $currentUser['NICK']
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Restricción creada exitosamente',
            'id'      => $db->lastInsertId()
        ]);
    }

    // PUT /restricciones.php/actualizar/{id}
    elseif ($method === 'PUT' && $action === 'actualizar' && $idParam) {
        $data = json_decode(file_get_contents('php://input'), true);

        // Verificar que existe
        $stmt = $db->prepare("SELECT ID FROM restricciones_acceso WHERE ID = ?");
        $stmt->execute([$idParam]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Restricción no encontrada']);
            exit;
        }

        $fields = [];
        $values = [];

        $allowed = ['tipo', 'usuario_id', 'fecha_inicio', 'fecha_fin', 'dia_semana',
                    'hora_inicio', 'hora_fin', 'motivo', 'activo'];
        $dbMap   = ['tipo' => 'TIPO', 'usuario_id' => 'USUARIO_ID',
                    'fecha_inicio' => 'FECHA_INICIO', 'fecha_fin' => 'FECHA_FIN',
                    'dia_semana' => 'DIA_SEMANA', 'hora_inicio' => 'HORA_INICIO',
                    'hora_fin' => 'HORA_FIN', 'motivo' => 'MOTIVO', 'activo' => 'ACTIVO'];

        foreach ($allowed as $key) {
            if (array_key_exists($key, $data)) {
                $fields[] = $dbMap[$key] . ' = ?';
                $values[] = $data[$key] === '' ? null : $data[$key];
            }
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No hay campos para actualizar']);
            exit;
        }

        $values[] = $idParam;
        $stmt = $db->prepare("UPDATE restricciones_acceso SET " . implode(', ', $fields) . " WHERE ID = ?");
        $stmt->execute($values);
        echo json_encode(['success' => true, 'message' => 'Restricción actualizada exitosamente']);
    }

    // DELETE /restricciones.php/eliminar/{id}
    elseif ($method === 'DELETE' && $action === 'eliminar' && $idParam) {
        $stmt = $db->prepare("DELETE FROM restricciones_acceso WHERE ID = ?");
        $stmt->execute([$idParam]);
        echo json_encode(['success' => true, 'message' => 'Restricción eliminada exitosamente']);
    }

    else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
}
