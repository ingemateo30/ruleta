<?php
/**
 * Script para ejecutar migraciones de base de datos
 *
 * Este script ejecuta todas las migraciones SQL pendientes en orden.
 *
 * Uso:
 *   php run_migrations.php
 */

require_once __DIR__ . '/../db.php';

echo "=================================================\n";
echo "  Sistema Lotto Animal - Ejecutor de Migraciones\n";
echo "=================================================\n\n";

try {
    $db = Database::getInstance()->getConnection();

    // Lista de migraciones en orden de ejecución
    $migrations = [
        '00_create_pagos_table.sql',
        'add_cierrejuego_columns.sql',
        'update_schema.sql'
    ];

    $migrationsDir = __DIR__;
    $totalMigrations = count($migrations);
    $executed = 0;
    $errors = 0;

    echo "Encontradas {$totalMigrations} migraciones...\n\n";

    foreach ($migrations as $migration) {
        $filePath = $migrationsDir . '/' . $migration;

        if (!file_exists($filePath)) {
            echo "⚠️  ADVERTENCIA: Archivo no encontrado: {$migration}\n";
            continue;
        }

        echo "Ejecutando: {$migration}...\n";

        try {
            $sql = file_get_contents($filePath);

            // Dividir por punto y coma y ejecutar cada statement
            $statements = array_filter(
                array_map('trim', explode(';', $sql)),
                function($stmt) {
                    // Ignorar comentarios y statements vacíos
                    return !empty($stmt) &&
                           !preg_match('/^\s*--/', $stmt) &&
                           !preg_match('/^\s*$/', $stmt);
                }
            );

            foreach ($statements as $statement) {
                if (trim($statement)) {
                    $db->exec($statement);
                }
            }

            echo "✓ Completada: {$migration}\n\n";
            $executed++;

        } catch (PDOException $e) {
            // Algunas migraciones pueden fallar si ya se ejecutaron (ej: ALTER TABLE ADD COLUMN IF NOT EXISTS)
            // Esto es esperado y no debe detener el proceso
            $errorMsg = $e->getMessage();

            // Errores que podemos ignorar
            if (strpos($errorMsg, 'Duplicate column') !== false ||
                strpos($errorMsg, 'Duplicate key') !== false ||
                strpos($errorMsg, 'already exists') !== false) {
                echo "⚠️  Ya aplicada: {$migration}\n";
                echo "   (Esto es normal si la migración ya se ejecutó previamente)\n\n";
                $executed++;
            } else {
                echo "❌ ERROR en {$migration}: {$errorMsg}\n\n";
                $errors++;
            }
        }
    }

    echo "=================================================\n";
    echo "Resumen:\n";
    echo "  Total migraciones: {$totalMigrations}\n";
    echo "  Ejecutadas exitosamente: {$executed}\n";
    echo "  Errores: {$errors}\n";
    echo "=================================================\n";

    if ($errors === 0) {
        echo "\n✓ ¡Todas las migraciones completadas exitosamente!\n";
        exit(0);
    } else {
        echo "\n⚠️  Algunas migraciones tuvieron errores. Revise los mensajes arriba.\n";
        exit(1);
    }

} catch (Exception $e) {
    echo "\n❌ ERROR FATAL: " . $e->getMessage() . "\n";
    exit(1);
}
