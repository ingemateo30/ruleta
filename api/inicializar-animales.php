<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/db.php';

try {
    $db = Database::getInstance()->getConnection();

    // Lista de animales con su numeración
    $animales = [
        ['num' => 0, 'codigo' => '00', 'valor' => 'Ballena', 'color' => '#1E3A8A'],
        ['num' => 1, 'codigo' => '01', 'valor' => 'Carnero', 'color' => '#7C2D12'],
        ['num' => 2, 'codigo' => '02', 'valor' => 'Toro', 'color' => '#991B1B'],
        ['num' => 3, 'codigo' => '03', 'valor' => 'Cienpies', 'color' => '#166534'],
        ['num' => 4, 'codigo' => '04', 'valor' => 'Alacran', 'color' => '#854D0E'],
        ['num' => 5, 'codigo' => '05', 'valor' => 'Leon', 'color' => '#CA8A04'],
        ['num' => 6, 'codigo' => '06', 'valor' => 'Rana', 'color' => '#15803D'],
        ['num' => 7, 'codigo' => '07', 'valor' => 'Perico', 'color' => '#0891B2'],
        ['num' => 8, 'codigo' => '08', 'valor' => 'Raton', 'color' => '#6B7280'],
        ['num' => 9, 'codigo' => '09', 'valor' => 'Aguila', 'color' => '#78350F'],
        ['num' => 10, 'codigo' => '10', 'valor' => 'Tigre', 'color' => '#EA580C'],
        ['num' => 11, 'codigo' => '11', 'valor' => 'Gato', 'color' => '#F59E0B'],
        ['num' => 12, 'codigo' => '12', 'valor' => 'Caballo', 'color' => '#92400E'],
        ['num' => 13, 'codigo' => '13', 'valor' => 'Mono', 'color' => '#A16207'],
        ['num' => 14, 'codigo' => '14', 'valor' => 'Paloma', 'color' => '#9CA3AF'],
        ['num' => 15, 'codigo' => '15', 'valor' => 'Zorro', 'color' => '#DC2626'],
        ['num' => 16, 'codigo' => '16', 'valor' => 'Oso', 'color' => '#4B5563'],
        ['num' => 17, 'codigo' => '17', 'valor' => 'Pavo', 'color' => '#7C3AED'],
        ['num' => 18, 'codigo' => '18', 'valor' => 'Burro', 'color' => '#6B7280'],
        ['num' => 19, 'codigo' => '19', 'valor' => 'Hormiga', 'color' => '#1F2937'],
        ['num' => 20, 'codigo' => '20', 'valor' => 'Cerdo', 'color' => '#EC4899'],
        ['num' => 21, 'codigo' => '21', 'valor' => 'Gallo', 'color' => '#B91C1C'],
        ['num' => 22, 'codigo' => '22', 'valor' => 'Camello', 'color' => '#D97706'],
        ['num' => 23, 'codigo' => '23', 'valor' => 'Cebra', 'color' => '#374151'],
        ['num' => 24, 'codigo' => '24', 'valor' => 'Iguana', 'color' => '#059669'],
        ['num' => 25, 'codigo' => '25', 'valor' => 'Gallina', 'color' => '#F59E0B'],
        ['num' => 26, 'codigo' => '26', 'valor' => 'Vaca', 'color' => '#1F2937'],
        ['num' => 27, 'codigo' => '27', 'valor' => 'Perro', 'color' => '#78350F'],
        ['num' => 28, 'codigo' => '28', 'valor' => 'Condor', 'color' => '#1E3A8A'],
        ['num' => 29, 'codigo' => '29', 'valor' => 'Elefante', 'color' => '#6B7280'],
        ['num' => 30, 'codigo' => '30', 'valor' => 'Caiman', 'color' => '#166534'],
        ['num' => 31, 'codigo' => '31', 'valor' => 'Capibara', 'color' => '#92400E'],
        ['num' => 32, 'codigo' => '32', 'valor' => 'Ardilla', 'color' => '#A16207'],
        ['num' => 33, 'codigo' => '33', 'valor' => 'Pescado', 'color' => '#0284C7'],
        ['num' => 34, 'codigo' => '34', 'valor' => 'Venado', 'color' => '#78350F'],
        ['num' => 35, 'codigo' => '35', 'valor' => 'Jirafa', 'color' => '#FBBF24'],
        ['num' => 36, 'codigo' => '36', 'valor' => 'Culebra', 'color' => '#15803D'],
    ];

    // Limpiar tabla existente
    $db->exec("DELETE FROM lottoruleta");

    // Insertar animales
    $stmt = $db->prepare("
        INSERT INTO lottoruleta (NUM, CODIGOJUEGO, VALOR, COLOR, ESTADO)
        VALUES (?, ?, ?, ?, 'A')
    ");

    $insertados = 0;
    foreach ($animales as $animal) {
        $stmt->execute([
            $animal['num'],
            $animal['codigo'],
            $animal['valor'],
            $animal['color']
        ]);
        $insertados++;
    }

    echo json_encode([
        'success' => true,
        'message' => "Se insertaron {$insertados} animales correctamente",
        'data' => $animales
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
