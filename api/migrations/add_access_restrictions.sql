-- ============================================================
-- Migración: Restricciones de Acceso y Días Sin Sorteo
-- Descripción: Permite al administrador restringir el acceso
--              de usuarios por fecha, día o rango de horas.
--              También permite marcar días sin sorteos.
-- ============================================================

-- Tabla: restricciones_acceso
-- Almacena las reglas de restricción de acceso configuradas por el admin.
-- Una restricción aplica si TODOS los criterios presentes coinciden.
--
-- TIPO: 'TODOS' = aplica a todos los usuarios (excepto SuperAdmin)
--       'USUARIO' = aplica solo al usuario con USUARIO_ID indicado
--
-- Criterios de coincidencia (todos los presentes deben cumplirse):
--  - FECHA_INICIO / FECHA_FIN : rango de fechas (si solo FECHA_INICIO = día exacto)
--  - DIA_SEMANA               : días de la semana separados por coma (1=Lun...7=Dom, ISO)
--  - HORA_INICIO / HORA_FIN   : franja horaria diaria

CREATE TABLE IF NOT EXISTS `restricciones_acceso` (
  `ID`              int(11)       NOT NULL AUTO_INCREMENT,
  `TIPO`            varchar(10)   NOT NULL DEFAULT 'TODOS'   COMMENT 'TODOS | USUARIO',
  `USUARIO_ID`      varchar(20)   DEFAULT NULL               COMMENT 'NULL para TODOS',
  `FECHA_INICIO`    date          DEFAULT NULL               COMMENT 'Fecha inicio (o fecha exacta si no hay fin)',
  `FECHA_FIN`       date          DEFAULT NULL               COMMENT 'Fecha fin (NULL = mismo día que inicio)',
  `DIA_SEMANA`      varchar(20)   DEFAULT NULL               COMMENT 'Días ISO separados por coma: 1=Lun,7=Dom',
  `HORA_INICIO`     time          DEFAULT NULL               COMMENT 'Hora inicio restricción',
  `HORA_FIN`        time          DEFAULT NULL               COMMENT 'Hora fin restricción',
  `MOTIVO`          varchar(255)  DEFAULT NULL,
  `ACTIVO`          char(1)       NOT NULL DEFAULT 'A'       COMMENT 'A=Activo, I=Inactivo',
  `CREADO_POR`      varchar(50)   DEFAULT NULL,
  `FECHA_CREACION`  datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  KEY `idx_tipo`    (`TIPO`),
  KEY `idx_usuario` (`USUARIO_ID`),
  KEY `idx_activo`  (`ACTIVO`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Restricciones de acceso al sistema por fecha/hora/usuario';


-- Tabla: dias_sin_sorteo
-- Fechas en las que no se realizan sorteos.
-- La ruleta pública mostrará un aviso especial en esas fechas.

CREATE TABLE IF NOT EXISTS `dias_sin_sorteo` (
  `ID`              int(11)       NOT NULL AUTO_INCREMENT,
  `FECHA`           date          NOT NULL,
  `MOTIVO`          varchar(255)  DEFAULT NULL,
  `ACTIVO`          char(1)       NOT NULL DEFAULT 'A'  COMMENT 'A=Activo, I=Inactivo',
  `CREADO_POR`      varchar(50)   DEFAULT NULL,
  `FECHA_CREACION`  datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uq_fecha` (`FECHA`),
  KEY `idx_activo`  (`ACTIVO`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Días en que no hay sorteos (feriados, mantenimiento, etc.)';
