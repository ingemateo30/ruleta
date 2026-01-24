-- =====================================================
-- SCRIPT DE MIGRACION - Sistema Lotto Animal
-- Fecha: 2026-01-24
-- Descripcion: Agregar campos adicionales segun requisitos
-- =====================================================

-- =====================================================
-- 1. TABLA BODEGAS (Sucursales) - Agregar datos de empresa
-- =====================================================
ALTER TABLE bodegas
ADD COLUMN IF NOT EXISTS DIRECCION VARCHAR(255) NULL AFTER BODEGA,
ADD COLUMN IF NOT EXISTS TELEFONO VARCHAR(20) NULL AFTER DIRECCION,
ADD COLUMN IF NOT EXISTS EMAIL VARCHAR(100) NULL AFTER TELEFONO,
ADD COLUMN IF NOT EXISTS NIT VARCHAR(20) NULL AFTER EMAIL,
ADD COLUMN IF NOT EXISTS RESPONSABLE VARCHAR(100) NULL AFTER NIT,
ADD COLUMN IF NOT EXISTS ESTADO CHAR(1) DEFAULT 'A' AFTER RESPONSABLE;

-- =====================================================
-- 2. TABLA JUGARLOTTO - Agregar campos para anulacion con justificacion
-- =====================================================
ALTER TABLE jugarlotto
ADD COLUMN IF NOT EXISTS MOTIVO_ANULACION TEXT NULL AFTER ESTADO,
ADD COLUMN IF NOT EXISTS FECHA_ANULACION DATETIME NULL AFTER MOTIVO_ANULACION,
ADD COLUMN IF NOT EXISTS USUARIO_ANULACION VARCHAR(50) NULL AFTER FECHA_ANULACION;

-- =====================================================
-- 3. TABLA CIERREJUEGO - Agregar campos para cierre por sucursal
-- =====================================================
-- Primero verificamos si la tabla existe, si no la creamos
CREATE TABLE IF NOT EXISTS cierrejuego (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    CODIGOH INT NOT NULL,
    HORAJUEGO VARCHAR(50),
    FECHA DATE NOT NULL,
    CODIGO_SUCURSAL INT NULL,
    NOMBRE_SUCURSAL VARCHAR(100) NULL,
    TOTAL_APOSTADO DECIMAL(15,2) DEFAULT 0,
    TOTAL_PAGADO DECIMAL(15,2) DEFAULT 0,
    UTILIDAD DECIMAL(15,2) DEFAULT 0,
    PAGO_ADMIN_SUCURSAL DECIMAL(15,2) DEFAULT 0,
    COMISION_SISTEMA DECIMAL(15,2) DEFAULT 0,
    COMISION_ADMIN DECIMAL(15,2) DEFAULT 0,
    TOTAL_INGRESOS_NETOS DECIMAL(15,2) DEFAULT 0,
    GANANCIA_SUCURSAL DECIMAL(15,2) DEFAULT 0,
    CODANIMAL_GANADOR VARCHAR(10),
    ANIMAL_GANADOR VARCHAR(50),
    ESTADO CHAR(1) DEFAULT 'C',
    FECHA_CIERRE DATETIME,
    USUARIO_CIERRE VARCHAR(50),
    OBSERVACIONES TEXT,
    INDEX idx_fecha (FECHA),
    INDEX idx_horario_fecha (CODIGOH, FECHA),
    INDEX idx_sucursal (CODIGO_SUCURSAL)
);

-- Si la tabla ya existe, agregar los nuevos campos
ALTER TABLE cierrejuego
ADD COLUMN IF NOT EXISTS CODIGO_SUCURSAL INT NULL AFTER FECHA,
ADD COLUMN IF NOT EXISTS NOMBRE_SUCURSAL VARCHAR(100) NULL AFTER CODIGO_SUCURSAL,
ADD COLUMN IF NOT EXISTS PAGO_ADMIN_SUCURSAL DECIMAL(15,2) DEFAULT 0 AFTER UTILIDAD,
ADD COLUMN IF NOT EXISTS TOTAL_INGRESOS_NETOS DECIMAL(15,2) DEFAULT 0 AFTER COMISION_ADMIN;

-- =====================================================
-- 4. TABLA PARAMETROS - Agregar parametros de distribucion
-- =====================================================
-- Parametro para porcentaje admin sucursal (7%)
INSERT INTO parametros (CODIGO, NOMBRE, VALOR)
SELECT 10, 'PORCENTAJEADMINSUCURSAL', '7'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM parametros WHERE NOMBRE = 'PORCENTAJEADMINSUCURSAL');

-- Parametro para porcentaje sistematizacion (20%)
INSERT INTO parametros (CODIGO, NOMBRE, VALOR)
SELECT 11, 'COMISIONSISTEMATIZACION', '20'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM parametros WHERE NOMBRE = 'COMISIONSISTEMATIZACION');

-- Parametro para porcentaje administracion (80%)
INSERT INTO parametros (CODIGO, NOMBRE, VALOR)
SELECT 12, 'COMISIONADMINISTRACION', '80'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM parametros WHERE NOMBRE = 'COMISIONADMINISTRACION');

-- Parametro para puntos de pago
INSERT INTO parametros (CODIGO, NOMBRE, VALOR)
SELECT 13, 'PUNTOSPAGO', '30'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM parametros WHERE NOMBRE = 'PUNTOSPAGO');

-- =====================================================
-- 5. INDICES ADICIONALES PARA OPTIMIZACION
-- =====================================================
-- Indice en hislottojuego para consultas por sucursal
CREATE INDEX IF NOT EXISTS idx_hislotto_sucursal ON hislottojuego(SUCURSAL);

-- Indice en jugarlotto para consultas por estado
CREATE INDEX IF NOT EXISTS idx_jugarlotto_estado ON jugarlotto(ESTADO);

-- Indice en jugarlotto para consultas por fecha y sucursal
CREATE INDEX IF NOT EXISTS idx_jugarlotto_fecha_sucursal ON jugarlotto(FECHA, SUCURSAL);

-- =====================================================
-- 6. COMENTARIOS
-- =====================================================
-- Los calculos de cierre se realizan asi:
-- 1. Total de ventas (total apostado)
-- 2. Pago admin sucursal = Total ventas * 7%
-- 3. Pago a ganadores = Apostado al ganador * puntos de pago
-- 4. Ingresos netos = Total ventas - Pago admin sucursal - Pago ganadores
-- 5. Comision sistemas = Ingresos netos * 20%
-- 6. Comision administracion = Ingresos netos * 80%
