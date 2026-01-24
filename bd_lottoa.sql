-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 24-01-2026 a las 22:07:58
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `bd_lottoa`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bodegas`
--

CREATE TABLE `bodegas` (
  `CODIGO` int(11) NOT NULL,
  `BODEGA` varchar(100) NOT NULL DEFAULT '',
  `DIRECCION` varchar(255) DEFAULT NULL,
  `TELEFONO` varchar(20) DEFAULT NULL,
  `EMAIL` varchar(100) DEFAULT NULL,
  `NIT` varchar(20) DEFAULT NULL,
  `RESPONSABLE` varchar(100) DEFAULT NULL,
  `ESTADO` char(1) DEFAULT 'A'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `bodegas`
--

INSERT INTO `bodegas` (`CODIGO`, `BODEGA`, `DIRECCION`, `TELEFONO`, `EMAIL`, `NIT`, `RESPONSABLE`, `ESTADO`) VALUES
(1, 'SAN GIL PLAZA', NULL, NULL, NULL, NULL, NULL, 'A');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cierrejuego`
--

CREATE TABLE `cierrejuego` (
  `ID` int(11) NOT NULL,
  `CODIGOH` int(11) NOT NULL,
  `HORAJUEGO` varchar(50) NOT NULL,
  `FECHA` date NOT NULL,
  `CODIGO_SUCURSAL` int(11) DEFAULT NULL,
  `NOMBRE_SUCURSAL` varchar(100) DEFAULT NULL,
  `TOTAL_APOSTADO` decimal(12,2) DEFAULT 0.00,
  `TOTAL_PAGADO` decimal(12,2) DEFAULT 0.00,
  `UTILIDAD` decimal(12,2) DEFAULT 0.00,
  `PAGO_ADMIN_SUCURSAL` decimal(15,2) DEFAULT 0.00,
  `COMISION_ADMIN` decimal(12,2) DEFAULT 0.00,
  `TOTAL_INGRESOS_NETOS` decimal(15,2) DEFAULT 0.00,
  `COMISION_SISTEMA` decimal(12,2) DEFAULT 0.00,
  `GANANCIA_SUCURSAL` decimal(12,2) DEFAULT 0.00,
  `CODANIMAL_GANADOR` int(11) DEFAULT NULL,
  `ANIMAL_GANADOR` varchar(50) DEFAULT NULL,
  `ESTADO` varchar(1) DEFAULT 'A',
  `FECHA_CIERRE` datetime DEFAULT NULL,
  `USUARIO_CIERRE` varchar(50) DEFAULT NULL,
  `OBSERVACIONES` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `hislottojuego`
--

CREATE TABLE `hislottojuego` (
  `RADICADO` varchar(20) NOT NULL DEFAULT '',
  `CODANIMAL` varchar(20) NOT NULL DEFAULT '',
  `ANIMAL` varchar(100) NOT NULL DEFAULT '',
  `VALOR` float(9,3) NOT NULL,
  `CODIGOJ` int(11) NOT NULL,
  `HORAJUEGO` time NOT NULL,
  `DESJUEGO` varchar(500) NOT NULL DEFAULT '',
  `SUCURSAL` varchar(500) NOT NULL DEFAULT '',
  `FECHA` date NOT NULL,
  `HORA` time NOT NULL,
  `ESTADOP` varchar(2) NOT NULL DEFAULT '',
  `ESTADOC` varchar(2) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `hislottojuego`
--

INSERT INTO `hislottojuego` (`RADICADO`, `CODANIMAL`, `ANIMAL`, `VALOR`, `CODIGOJ`, `HORAJUEGO`, `DESJUEGO`, `SUCURSAL`, `FECHA`, `HORA`, `ESTADOP`, `ESTADOC`) VALUES
('00000001', '0', 'JIRAFA', 20000.000, 1, '16:04:00', 'HORA DE JUEGO 8:30', 'SAN GIL PLAZA', '2025-12-06', '20:36:50', 'A', 'A'),
('00000002', '0', 'JIRAFA', 20000.000, 1, '16:04:00', 'HORA DE JUEGO 8:30', 'SAN GIL PLAZA', '2025-12-06', '20:38:17', 'A', 'A'),
('00000003', '0', 'JIRAFA', 20000.000, 16, '00:00:01', 'HORA DE JUEGO 8:30', 'SAN GIL PLAZA', '2025-12-08', '16:29:39', 'A', 'A'),
('00000004', '00', 'LOBO', 30000.000, 1, '00:00:00', '16:04:00', 'SAN GIL PLAZA', '2025-12-08', '16:34:01', 'A', 'A'),
('00000005', '0', 'JIRAFA', 50000.000, 1, '16:04:00', 'HORA DE JUEGO 8:30', 'SAN GIL PLAZA', '2025-12-08', '16:36:11', 'A', 'A'),
('00000006', '0', 'JIRAFA', 10000.000, 1, '16:04:00', 'HORA DE JUEGO 8:30', 'SAN GIL PLAZA', '2025-12-27', '15:08:30', 'A', 'A'),
('00000007', '00', 'LOBO', 20000.000, 1, '16:04:00', 'HORA DE JUEGO 8:30', 'SAN GIL PLAZA', '2025-12-28', '18:05:38', 'A', 'A'),
('00000008', '0', 'JIRAFA', 50000.000, 1, '16:04:00', 'HORA DE JUEGO 8:30', 'SAN GIL PLAZA', '2025-12-28', '18:07:03', 'A', 'A'),
('00000009', '00', 'LOBO', 20000.000, 1, '16:04:00', 'HORA DE JUEGO 8:30', 'SAN GIL PLAZA', '2025-12-28', '18:08:20', 'A', 'A'),
('00000010', '00', 'LOBO', 30000.000, 1, '16:04:00', 'HORA DE JUEGO 8:30', 'SAN GIL PLAZA', '2025-12-28', '18:09:48', 'A', 'A'),
('00000011', '00', 'LOBO', 10000.000, 1, '16:04:00', 'HORA DE JUEGO 8:30', 'SAN GIL PLAZA', '2025-12-28', '18:10:13', 'A', 'A'),
('00000011', '0', 'JIRAFA', 30000.000, 1, '16:04:00', 'HORA DE JUEGO 8:30', 'SAN GIL PLAZA', '2025-12-28', '18:10:13', 'A', 'A'),
('00000012', '00', 'LOBO', 30000.000, 1, '16:04:00', 'HORA DE JUEGO 8:30', 'SAN GIL PLAZA', '2025-12-29', '07:09:01', 'A', 'A'),
('00000013', '0', 'JIRAFA', 15000.000, 2, '10:15:00', 'HORA DE JUEGO 10:15 AM', 'SAN GIL PLAZA', '2025-12-29', '10:14:25', 'A', 'A'),
('00000014', '00', 'LOBO', 30000.000, 3, '10:30:00', 'HORA JUEGO 10:30 AM', 'SAN GIL PLAZA', '2025-12-29', '10:24:26', 'A', 'A'),
('00000014', '0', 'JIRAFA', 20000.000, 3, '10:30:00', 'HORA JUEGO 10:30 AM', 'SAN GIL PLAZA', '2025-12-29', '10:24:26', 'A', 'A'),
('00000015', '0', 'JIRAFA', 10000.000, 2, '10:15:00', 'HORA DE JUEGO 10:15 AM', '1', '2026-01-23', '20:30:53', 'A', 'A');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horariojuego`
--

CREATE TABLE `horariojuego` (
  `NUM` int(11) NOT NULL,
  `DESCRIPCION` varchar(500) NOT NULL DEFAULT '',
  `HORA` time NOT NULL,
  `ESTADO` varchar(2) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `horariojuego`
--

INSERT INTO `horariojuego` (`NUM`, `DESCRIPCION`, `HORA`, `ESTADO`) VALUES
(1, 'HORA DE JUEGO 8:30', '16:04:00', 'A'),
(2, 'HORA DE JUEGO 10:15 AM', '10:15:00', 'A'),
(3, 'HORA JUEGO 10:30 AM', '10:30:00', 'A');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ingresarganadores`
--

CREATE TABLE `ingresarganadores` (
  `CODIGOA` varchar(5) NOT NULL DEFAULT '',
  `ANIMAL` varchar(50) NOT NULL DEFAULT '',
  `CODIGOH` int(11) NOT NULL,
  `DESCRIOCIONH` varchar(500) NOT NULL DEFAULT '',
  `FECHA` date NOT NULL,
  `ESTADO` varchar(2) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `ingresarganadores`
--

INSERT INTO `ingresarganadores` (`CODIGOA`, `ANIMAL`, `CODIGOH`, `DESCRIOCIONH`, `FECHA`, `ESTADO`) VALUES
('0', 'JIRAFA', 1, 'HORA DE JUEGO 8:30', '2025-12-08', 'A'),
('0', 'JIRAFA', 1, 'HORA DE JUEGO 8:30', '2025-12-27', 'A'),
('0', 'JIRAFA', 2, 'HORA DE JUEGO 10:15 AM', '2025-12-29', 'A'),
('00', 'LOBO', 3, 'HORA JUEGO 10:30 AM', '2025-12-29', 'A');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jugarlotto`
--

CREATE TABLE `jugarlotto` (
  `NUM` int(11) NOT NULL,
  `RADICADO` varchar(20) NOT NULL DEFAULT '',
  `FECHA` date NOT NULL,
  `HORA` time NOT NULL,
  `SUCURSAL` varchar(500) NOT NULL DEFAULT '',
  `TOTALJUEGO` float(9,3) NOT NULL,
  `USUARIO` varchar(100) NOT NULL DEFAULT '',
  `ESTADO` varchar(2) NOT NULL DEFAULT '',
  `MOTIVO_ANULACION` text DEFAULT NULL,
  `FECHA_ANULACION` datetime DEFAULT NULL,
  `USUARIO_ANULACION` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `jugarlotto`
--

INSERT INTO `jugarlotto` (`NUM`, `RADICADO`, `FECHA`, `HORA`, `SUCURSAL`, `TOTALJUEGO`, `USUARIO`, `ESTADO`, `MOTIVO_ANULACION`, `FECHA_ANULACION`, `USUARIO_ANULACION`) VALUES
(1, '00000001', '2025-12-06', '20:36:50', 'SAN GIL PLAZA', 20000.000, 'SAN GIL PLAZA', 'A', NULL, NULL, NULL),
(2, '00000002', '2025-12-06', '20:38:17', 'SAN GIL PLAZA', 20000.000, 'SAN GIL PLAZA', 'A', NULL, NULL, NULL),
(3, '00000003', '2025-12-08', '16:29:39', 'SAN GIL PLAZA', 20000.000, 'SAN GIL PLAZA', 'A', NULL, NULL, NULL),
(4, '00000004', '2025-12-08', '16:34:01', 'SAN GIL PLAZA', 30000.000, 'SAN GIL PLAZA', 'A', NULL, NULL, NULL),
(5, '00000005', '2025-12-08', '16:36:11', 'SAN GIL PLAZA', 50000.000, 'SAN GIL PLAZA', 'A', NULL, NULL, NULL),
(6, '00000006', '2025-12-27', '15:08:30', 'SAN GIL PLAZA', 10000.000, 'SAN GIL PLAZA', 'A', NULL, NULL, NULL),
(7, '00000007', '2025-12-28', '18:05:38', 'SAN GIL PLAZA', 20000.000, 'SAN GIL PLAZA', 'A', NULL, NULL, NULL),
(8, '00000008', '2025-12-28', '18:07:03', 'SAN GIL PLAZA', 50000.000, 'SAN GIL PLAZA', 'A', NULL, NULL, NULL),
(9, '00000009', '2025-12-28', '18:08:20', 'SAN GIL PLAZA', 20000.000, 'SAN GIL PLAZA', 'A', NULL, NULL, NULL),
(10, '00000010', '2025-12-28', '18:09:48', 'SAN GIL PLAZA', 30000.000, 'SAN GIL PLAZA', 'A', NULL, NULL, NULL),
(11, '00000011', '2025-12-28', '18:10:13', 'SAN GIL PLAZA', 70000.000, 'SAN GIL PLAZA', 'A', NULL, NULL, NULL),
(12, '00000012', '2025-12-29', '07:09:01', 'SAN GIL PLAZA', 30000.000, 'SAN GIL PLAZA', 'A', NULL, NULL, NULL),
(13, '00000013', '2025-12-29', '10:14:25', 'SAN GIL PLAZA', 15000.000, 'SAN GIL PLAZA', 'A', NULL, NULL, NULL),
(14, '00000014', '2025-12-29', '10:24:26', 'SAN GIL PLAZA', 50000.000, 'SAN GIL PLAZA', 'A', NULL, NULL, NULL),
(15, '00000015', '2026-01-23', '20:30:53', '1', 10000.000, '1', 'A', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lottoruleta`
--

CREATE TABLE `lottoruleta` (
  `NUM` int(11) NOT NULL,
  `CODIGOJUEGO` varchar(3) NOT NULL DEFAULT '',
  `VALOR` varchar(50) NOT NULL DEFAULT '',
  `COLOR` varchar(2) NOT NULL DEFAULT '',
  `ESTADO` varchar(2) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `lottoruleta`
--

INSERT INTO `lottoruleta` (`NUM`, `CODIGOJUEGO`, `VALOR`, `COLOR`, `ESTADO`) VALUES
(1, '00', 'LOBO', 'N', 'A'),
(2, '0', 'JIRAFA', 'R', 'A');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `ID` int(11) NOT NULL,
  `RADICADO` varchar(20) NOT NULL,
  `FECHA` date NOT NULL,
  `HORA` time NOT NULL,
  `CODANIMAL` int(11) NOT NULL,
  `ANIMAL` varchar(50) NOT NULL,
  `CODIGOJ` int(11) NOT NULL,
  `HORAJUEGO` varchar(50) DEFAULT NULL,
  `VALOR_APOSTADO` decimal(10,2) NOT NULL,
  `VALOR_GANADO` decimal(10,2) NOT NULL,
  `SUCURSAL` int(11) NOT NULL,
  `USUARIO` varchar(50) NOT NULL,
  `ESTADO` varchar(1) DEFAULT 'A',
  `FECHA_PAGO` datetime NOT NULL,
  `OBSERVACIONES` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `parametros`
--

CREATE TABLE `parametros` (
  `CODIGO` int(11) NOT NULL,
  `NOMBRE` varchar(100) NOT NULL DEFAULT '',
  `VALOR` varchar(50) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `parametros`
--

INSERT INTO `parametros` (`CODIGO`, `NOMBRE`, `VALOR`) VALUES
(1, 'PUNTOS PARA PAGO', '30'),
(2, 'VALOR MAXIMO DE JUEGO', '50000'),
(3, 'VALOR MINIMO DE JUEGO', '1000'),
(4, 'SISTEMATIZACION', '20'),
(5, 'ADMINISTRACION', '80'),
(6, 'PORCENTAJE DE GANACIA SUCURSAL', '7'),
(10, 'PORCENTAJEADMINSUCURSAL', '7'),
(11, 'COMISIONSISTEMATIZACION', '20'),
(12, 'COMISIONADMINISTRACION', '80'),
(13, 'PUNTOSPAGO', '30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `seguridad`
--

CREATE TABLE `seguridad` (
  `ID` varchar(20) NOT NULL DEFAULT '',
  `NOMBRE` varchar(100) NOT NULL DEFAULT '',
  `NICK` varchar(20) NOT NULL DEFAULT '',
  `CLAVE` varchar(20) NOT NULL DEFAULT '',
  `TIPO` varchar(2) NOT NULL DEFAULT '',
  `CAJA` int(11) NOT NULL,
  `CODBODEGA` int(11) NOT NULL,
  `ESTADO` varchar(2) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `seguridad`
--

INSERT INTO `seguridad` (`ID`, `NOMBRE`, `NICK`, `CLAVE`, `TIPO`, `CAJA`, `CODBODEGA`, `ESTADO`) VALUES
('91079581', 'OSCAR M GONZALEZ', 'ADMON', '123', '1', 1, 1, '1');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `bodegas`
--
ALTER TABLE `bodegas`
  ADD PRIMARY KEY (`CODIGO`);

--
-- Indices de la tabla `cierrejuego`
--
ALTER TABLE `cierrejuego`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `unique_horario_fecha` (`CODIGOH`,`FECHA`),
  ADD KEY `idx_fecha` (`FECHA`),
  ADD KEY `idx_horario` (`CODIGOH`),
  ADD KEY `idx_estado` (`ESTADO`);

--
-- Indices de la tabla `hislottojuego`
--
ALTER TABLE `hislottojuego`
  ADD KEY `idx_hislotto_sucursal` (`SUCURSAL`);

--
-- Indices de la tabla `horariojuego`
--
ALTER TABLE `horariojuego`
  ADD PRIMARY KEY (`NUM`);

--
-- Indices de la tabla `jugarlotto`
--
ALTER TABLE `jugarlotto`
  ADD PRIMARY KEY (`NUM`),
  ADD KEY `idx_jugarlotto_estado` (`ESTADO`),
  ADD KEY `idx_jugarlotto_fecha_sucursal` (`FECHA`,`SUCURSAL`);

--
-- Indices de la tabla `lottoruleta`
--
ALTER TABLE `lottoruleta`
  ADD PRIMARY KEY (`NUM`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `idx_radicado` (`RADICADO`),
  ADD KEY `idx_fecha` (`FECHA`),
  ADD KEY `idx_sucursal` (`SUCURSAL`),
  ADD KEY `idx_estado` (`ESTADO`);

--
-- Indices de la tabla `parametros`
--
ALTER TABLE `parametros`
  ADD PRIMARY KEY (`CODIGO`);

--
-- Indices de la tabla `seguridad`
--
ALTER TABLE `seguridad`
  ADD PRIMARY KEY (`ID`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `cierrejuego`
--
ALTER TABLE `cierrejuego`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `cierrejuego`
--
ALTER TABLE `cierrejuego`
  ADD CONSTRAINT `cierrejuego_ibfk_1` FOREIGN KEY (`CODIGOH`) REFERENCES `horariojuego` (`NUM`);

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`SUCURSAL`) REFERENCES `bodegas` (`CODIGO`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
