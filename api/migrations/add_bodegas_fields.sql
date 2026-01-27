-- =====================================================
-- SCRIPT DE MIGRACION - Sistema Lotto Animal
-- Fecha: 2026-01-27
-- Descripcion: Agregar campos adicionales a la tabla bodegas
-- =====================================================

-- =====================================================
-- TABLA BODEGAS (Sucursales) - Agregar campos faltantes
-- =====================================================

-- Agregar campo CELULAR
ALTER TABLE bodegas
ADD COLUMN IF NOT EXISTS CELULAR VARCHAR(20) NULL AFTER TELEFONO;

-- Agregar campo CIUDAD
ALTER TABLE bodegas
ADD COLUMN IF NOT EXISTS CIUDAD VARCHAR(100) NULL AFTER RESPONSABLE;

-- Agregar campo HORARIO_APERTURA
ALTER TABLE bodegas
ADD COLUMN IF NOT EXISTS HORARIO_APERTURA VARCHAR(10) NULL AFTER CIUDAD;

-- Agregar campo HORARIO_CIERRE
ALTER TABLE bodegas
ADD COLUMN IF NOT EXISTS HORARIO_CIERRE VARCHAR(10) NULL AFTER HORARIO_APERTURA;

-- Agregar campo OBSERVACIONES
ALTER TABLE bodegas
ADD COLUMN IF NOT EXISTS OBSERVACIONES TEXT NULL AFTER HORARIO_CIERRE;

-- =====================================================
-- FIN DE MIGRACION
-- =====================================================
