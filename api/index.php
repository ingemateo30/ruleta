<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejo de preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$endpoints = [
    'test_connection' => '/api/test_connection.php',
    'login' => '/api/login.php',
    'realizar_juego' => '/api/realizar-juego.php',
    'listar_jugadas' => '/api/listar-jugadas.php',
    'ingresar_resultado' => '/api/ingresar-resultado.php',
    'anular_juego' => '/api/anular-juego.php',
];

echo json_encode([
    'success' => true,
    'message' => 'API Ruleta - Sistema de Gestión de Apuestas',
    'version' => '1.0.0',
    'endpoints' => $endpoints,
    'documentation' => 'Accede a cada endpoint para más información'
], JSON_PRETTY_PRINT);
?>
