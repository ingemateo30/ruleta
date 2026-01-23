<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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

    // GET /api/parametros.php/listar - Listar todos los parámetros
    if ($method === 'GET' && (end($uriParts) === 'listar' || end($uriParts) === 'parametros.php')) {
        $stmt = $db->query("
            SELECT CODIGO, NOMBRE, VALOR
            FROM parametros
            ORDER BY CODIGO ASC
        ");

        $parametros = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Agregar descripción a cada parámetro
        foreach ($parametros as &$param) {
            switch ($param['NOMBRE']) {
                case 'MINIMOAPUESTA':
                    $param['DESCRIPCION'] = 'Valor mínimo permitido para una apuesta';
                    $param['TIPO'] = 'number';
                    break;
                case 'MAXIMOAPUESTA':
                    $param['DESCRIPCION'] = 'Valor máximo permitido para una apuesta';
                    $param['TIPO'] = 'number';
                    break;
                case 'COMISIONSISTEMATIZACION':
                    $param['DESCRIPCION'] = 'Porcentaje de comisión por sistematización';
                    $param['TIPO'] = 'percentage';
                    break;
                case 'COMISIONADMINISTRACION':
                    $param['DESCRIPCION'] = 'Porcentaje de comisión administrativa';
                    $param['TIPO'] = 'percentage';
                    break;
                case 'PORCENTAJEGANANCIA':
                    $param['DESCRIPCION'] = '% de ganancia de la sucursal sobre ventas';
                    $param['TIPO'] = 'percentage';
                    break;
                case 'PUNTOSPAGO':
                    $param['DESCRIPCION'] = 'Multiplicador para calcular premio (ej: 30x)';
                    $param['TIPO'] = 'number';
                    break;
                default:
                    $param['DESCRIPCION'] = 'Parámetro del sistema';
                    $param['TIPO'] = 'text';
            }
        }

        echo json_encode([
            'success' => true,
            'data' => $parametros
        ]);
    }

    // GET /api/parametros.php/obtener/{codigo} - Obtener un parámetro por código
    elseif ($method === 'GET' && strpos($uri, '/obtener/') !== false) {
        $codigo = end($uriParts);

        $stmt = $db->prepare("SELECT * FROM parametros WHERE CODIGO = ?");
        $stmt->execute([$codigo]);

        $parametro = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($parametro) {
            echo json_encode([
                'success' => true,
                'data' => $parametro
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Parámetro no encontrado'
            ]);
        }
    }

    // PUT /api/parametros.php/actualizar/{codigo} - Actualizar parámetro
    elseif ($method === 'PUT' && strpos($uri, '/actualizar/') !== false) {
        $codigo = end($uriParts);
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['valor'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'El valor es requerido'
            ]);
            exit;
        }

        // Validaciones específicas
        $valor = $data['valor'];

        // Obtener el nombre del parámetro
        $stmt = $db->prepare("SELECT NOMBRE FROM parametros WHERE CODIGO = ?");
        $stmt->execute([$codigo]);
        $param = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$param) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Parámetro no encontrado'
            ]);
            exit;
        }

        // Validaciones según el tipo de parámetro
        if (in_array($param['NOMBRE'], ['MINIMOAPUESTA', 'MAXIMOAPUESTA', 'PUNTOSPAGO'])) {
            if (!is_numeric($valor) || $valor < 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'El valor debe ser un número positivo'
                ]);
                exit;
            }
        }

        if (strpos($param['NOMBRE'], 'COMISION') !== false || strpos($param['NOMBRE'], 'PORCENTAJE') !== false) {
            if (!is_numeric($valor) || $valor < 0 || $valor > 100) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'El porcentaje debe estar entre 0 y 100'
                ]);
                exit;
            }
        }

        // Validación especial: mínimo debe ser menor que máximo
        if ($param['NOMBRE'] === 'MINIMOAPUESTA') {
            $stmt = $db->prepare("SELECT VALOR FROM parametros WHERE NOMBRE = 'MAXIMOAPUESTA'");
            $stmt->execute();
            $maxApuesta = $stmt->fetchColumn();
            if ($valor >= $maxApuesta) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'El mínimo debe ser menor que el máximo de apuesta'
                ]);
                exit;
            }
        }

        if ($param['NOMBRE'] === 'MAXIMOAPUESTA') {
            $stmt = $db->prepare("SELECT VALOR FROM parametros WHERE NOMBRE = 'MINIMOAPUESTA'");
            $stmt->execute();
            $minApuesta = $stmt->fetchColumn();
            if ($valor <= $minApuesta) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'El máximo debe ser mayor que el mínimo de apuesta'
                ]);
                exit;
            }
        }

        // Actualizar
        $stmt = $db->prepare("UPDATE parametros SET VALOR = ? WHERE CODIGO = ?");
        $result = $stmt->execute([$valor, $codigo]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Parámetro actualizado exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al actualizar parámetro'
            ]);
        }
    }

    // POST /api/parametros.php/crear - Crear nuevo parámetro
    elseif ($method === 'POST' && end($uriParts) === 'crear') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['nombre']) || !isset($data['valor'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Nombre y valor son requeridos'
            ]);
            exit;
        }

        // Verificar si ya existe
        $stmt = $db->prepare("SELECT COUNT(*) FROM parametros WHERE NOMBRE = ?");
        $stmt->execute([$data['nombre']]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Ya existe un parámetro con ese nombre'
            ]);
            exit;
        }

        // Obtener el siguiente código
        $stmt = $db->query("SELECT MAX(CODIGO) as max_codigo FROM parametros");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $nuevoCodigo = ($result['max_codigo'] ?? 0) + 1;

        // Insertar
        $stmt = $db->prepare("INSERT INTO parametros (CODIGO, NOMBRE, VALOR) VALUES (?, ?, ?)");
        $result = $stmt->execute([$nuevoCodigo, $data['nombre'], $data['valor']]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Parámetro creado exitosamente',
                'codigo' => $nuevoCodigo
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al crear parámetro'
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
