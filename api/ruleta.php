<?php
require_once 'auth_middleware.php';
require_once 'db.php';

// Inicializar seguridad - Solo Admin y SuperAdmin
$currentUser = initApiSecurity(true, ['0', '1']);

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$uriParts = explode('/', trim(parse_url($uri, PHP_URL_PATH), '/'));

try {
    $db = Database::getInstance()->getConnection();

    // GET /api/ruleta.php/listar - Listar todos los animales con estadísticas
    if ($method === 'GET' && (end($uriParts) === 'listar' || end($uriParts) === 'ruleta.php')) {
        $stmt = $db->query("
            SELECT
                l.NUM,
                l.CODIGOJUEGO,
                l.VALOR as NOMBRE,
                l.COLOR,
                l.ESTADO,
                COUNT(DISTINCT h.RADICADO) as TOTAL_JUGADAS,
                COALESCE(SUM(h.VALOR), 0) as TOTAL_APOSTADO,
                (SELECT COUNT(*) FROM ingresarganadores WHERE CODIGOA = l.NUM) as VECES_GANADOR
            FROM lottoruleta l
            LEFT JOIN hislottojuego h ON l.NUM = h.CODANIMAL AND h.ESTADOP = 'A'
            GROUP BY l.NUM, l.CODIGOJUEGO, l.VALOR, l.COLOR, l.ESTADO
            ORDER BY l.NUM ASC
        ");

        $animales = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Formatear estado
        foreach ($animales as &$animal) {
            $animal['ESTADO_TEXTO'] = $animal['ESTADO'] === 'A' ? 'Activo' : 'Inactivo';
        }

        echo json_encode([
            'success' => true,
            'data' => $animales
        ]);
    }

    // GET /api/ruleta.php/activos - Listar solo animales activos
    elseif ($method === 'GET' && end($uriParts) === 'activos') {
        $stmt = $db->query("
            SELECT NUM, CODIGOJUEGO, VALOR as NOMBRE, COLOR, ESTADO
            FROM lottoruleta
            WHERE ESTADO = 'A'
            ORDER BY NUM ASC
        ");

        $animales = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $animales
        ]);
    }

    // GET /api/ruleta.php/obtener/{num} - Obtener un animal por NUM
    elseif ($method === 'GET' && strpos($uri, '/obtener/') !== false) {
        $num = end($uriParts);

        $stmt = $db->prepare("SELECT * FROM lottoruleta WHERE NUM = ?");
        $stmt->execute([$num]);

        $animal = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($animal) {
            // Obtener estadísticas detalladas
            $stmt = $db->prepare("
                SELECT
                    COUNT(DISTINCT hj.RADICADO) as total_jugadas,
                    COALESCE(SUM(hj.VALOR), 0) as total_apostado,
                    COUNT(DISTINCT DATE(j.FECHA)) as dias_jugado
                FROM hislottojuego hj
                JOIN jugarlotto j ON hj.RADICADO = j.RADICADO
                WHERE hj.CODANIMAL = ? AND hj.ESTADOP = 'A'
            ");
            $stmt->execute([$num]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Veces que ganó
            $stmt = $db->prepare("
                SELECT COUNT(*) as veces_ganador
                FROM ingresarganadores
                WHERE CODIGOA = ?
            ");
            $stmt->execute([$num]);
            $ganador = $stmt->fetch(PDO::FETCH_ASSOC);

            $animal['estadisticas'] = array_merge($stats, $ganador);

            echo json_encode([
                'success' => true,
                'data' => $animal
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Animal no encontrado'
            ]);
        }
    }

    // PUT /api/ruleta.php/actualizar/{num} - Actualizar animal
    elseif ($method === 'PUT' && strpos($uri, '/actualizar/') !== false) {
        $num = end($uriParts);
        $data = json_decode(file_get_contents('php://input'), true);

        $fields = [];
        $values = [];

        if (isset($data['codigojuego'])) {
            $fields[] = "CODIGOJUEGO = ?";
            $values[] = $data['codigojuego'];
        }

        if (isset($data['valor'])) {
            $fields[] = "VALOR = ?";
            $values[] = $data['valor'];
        }

        if (isset($data['color'])) {
            $fields[] = "COLOR = ?";
            $values[] = $data['color'];
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
        $sql = "UPDATE lottoruleta SET " . implode(', ', $fields) . " WHERE NUM = ?";

        $stmt = $db->prepare($sql);
        $result = $stmt->execute($values);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Animal actualizado exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al actualizar animal'
            ]);
        }
    }

    // PUT /api/ruleta.php/activar/{num} - Activar animal
    elseif ($method === 'PUT' && strpos($uri, '/activar/') !== false) {
        $num = end($uriParts);

        $stmt = $db->prepare("UPDATE lottoruleta SET ESTADO = 'A' WHERE NUM = ?");
        $result = $stmt->execute([$num]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Animal activado exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al activar animal'
            ]);
        }
    }

    // PUT /api/ruleta.php/desactivar/{num} - Desactivar animal
    elseif ($method === 'PUT' && strpos($uri, '/desactivar/') !== false) {
        $num = end($uriParts);

        $stmt = $db->prepare("UPDATE lottoruleta SET ESTADO = 'I' WHERE NUM = ?");
        $result = $stmt->execute([$num]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Animal desactivado exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al desactivar animal'
            ]);
        }
    }

    // PUT /api/ruleta.php/activar-todos - Activar todos los animales
    elseif ($method === 'PUT' && end($uriParts) === 'activar-todos') {
        $stmt = $db->prepare("UPDATE lottoruleta SET ESTADO = 'A'");
        $result = $stmt->execute();

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Todos los animales activados exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al activar animales'
            ]);
        }
    }

    // PUT /api/ruleta.php/desactivar-todos - Desactivar todos los animales
    elseif ($method === 'PUT' && end($uriParts) === 'desactivar-todos') {
        $stmt = $db->prepare("UPDATE lottoruleta SET ESTADO = 'I'");
        $result = $stmt->execute();

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Todos los animales desactivados exitosamente'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al desactivar animales'
            ]);
        }
    }

    // GET /api/ruleta.php/estadisticas - Obtener estadísticas generales
    elseif ($method === 'GET' && end($uriParts) === 'estadisticas') {
        // Total de animales activos/inactivos
        $stmt = $db->query("
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN ESTADO = 'A' THEN 1 ELSE 0 END) as activos,
                SUM(CASE WHEN ESTADO = 'I' THEN 1 ELSE 0 END) as inactivos
            FROM lottoruleta
        ");
        $totales = $stmt->fetch(PDO::FETCH_ASSOC);

        // Animal más jugado
        $stmt = $db->query("
            SELECT
                l.NUM,
                l.VALOR as NOMBRE,
                COUNT(DISTINCT h.RADICADO) as total_jugadas,
                COALESCE(SUM(h.VALOR), 0) as total_apostado
            FROM lottoruleta l
            JOIN hislottojuego h ON l.NUM = h.CODANIMAL
            WHERE h.ESTADOP = 'A'
            GROUP BY l.NUM, l.VALOR
            ORDER BY total_apostado DESC
            LIMIT 1
        ");
        $masJugado = $stmt->fetch(PDO::FETCH_ASSOC);

        // Animal que más ganó
        $stmt = $db->query("
            SELECT
                l.NUM,
                l.VALOR as NOMBRE,
                COUNT(*) as veces_ganador
            FROM lottoruleta l
            JOIN ingresarganadores g ON l.NUM = g.CODIGOA
            GROUP BY l.NUM, l.VALOR
            ORDER BY veces_ganador DESC
            LIMIT 1
        ");
        $masGanador = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => [
                'totales' => $totales,
                'mas_jugado' => $masJugado ?? null,
                'mas_ganador' => $masGanador ?? null
            ]
        ]);
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
