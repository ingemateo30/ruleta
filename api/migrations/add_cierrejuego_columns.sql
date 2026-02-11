-- =====================================================
-- MIGRACION: Agregar columnas faltantes a tabla cierrejuego
-- Fecha: 2026-02-11
-- Descripcion: Agregar columnas para mejor tracking de pagos
-- =====================================================

-- Agregar columnas para tracking detallado de pagos
ALTER TABLE cierrejuego
ADD COLUMN IF NOT EXISTS PAGO_POTENCIAL_GANADORES DECIMAL(15,2) DEFAULT 0 AFTER TOTAL_APOSTADO,
ADD COLUMN IF NOT EXISTS TOTAL_PAGADO_REAL DECIMAL(15,2) DEFAULT 0 AFTER PAGO_POTENCIAL_GANADORES,
ADD COLUMN IF NOT EXISTS PAGOS_PENDIENTES DECIMAL(15,2) DEFAULT 0 AFTER TOTAL_PAGADO_REAL,
ADD COLUMN IF NOT EXISTS UTILIDAD_PROYECTADA DECIMAL(15,2) DEFAULT 0 AFTER PAGOS_PENDIENTES,
ADD COLUMN IF NOT EXISTS UTILIDAD_REAL DECIMAL(15,2) DEFAULT 0 AFTER UTILIDAD_PROYECTADA;

-- Actualizar la constraint unique para permitir multiples cierres por horario/fecha/sucursal
-- Primero eliminamos la constraint antigua si existe
ALTER TABLE cierrejuego DROP INDEX IF EXISTS unique_horario_fecha;

-- Agregar nueva constraint unique que incluye sucursal
ALTER TABLE cierrejuego
ADD UNIQUE KEY IF NOT EXISTS unique_horario_fecha_sucursal (CODIGOH, FECHA, CODIGO_SUCURSAL);

-- Nota: Si las columnas ya existen, la clausula IF NOT EXISTS las omitira
