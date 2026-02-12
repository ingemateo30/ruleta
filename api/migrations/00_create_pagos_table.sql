-- =====================================================
-- MIGRACION: Crear tabla pagos si no existe
-- Fecha: 2026-02-12
-- Descripcion: Tabla para registrar pagos a ganadores
-- =====================================================

CREATE TABLE IF NOT EXISTS pagos (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    RADICADO VARCHAR(20) NOT NULL,
    FECHA DATE NOT NULL,
    HORA TIME NOT NULL,
    CODANIMAL INT NOT NULL,
    ANIMAL VARCHAR(50) NOT NULL,
    CODIGOJ INT NOT NULL,
    HORAJUEGO VARCHAR(50),
    VALOR_APOSTADO DECIMAL(10,2) NOT NULL,
    VALOR_GANADO DECIMAL(10,2) NOT NULL,
    SUCURSAL INT NOT NULL,
    USUARIO VARCHAR(50) NOT NULL,
    ESTADO VARCHAR(1) DEFAULT 'A',
    FECHA_PAGO DATETIME NOT NULL,
    OBSERVACIONES TEXT,
    INDEX idx_radicado (RADICADO),
    INDEX idx_fecha (FECHA),
    INDEX idx_sucursal (SUCURSAL),
    INDEX idx_estado (ESTADO),
    INDEX idx_codigoj_fecha_sucursal (CODIGOJ, FECHA, SUCURSAL),
    FOREIGN KEY (SUCURSAL) REFERENCES bodegas(CODIGO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
