<?php
/**
 * API Endpoint: Listar Jugadas de Lotto Animal
 *
 * Replica la funcionalidad del formulario FrmDListarJugadas.java
 * Permite consultar el historial de jugadas por fecha y horario
 *
 * Endpoints disponibles:
 * - GET  /listar-jugadas/horarios             - Listar horarios de juego para el filtro
 * - GET  /listar-jugadas/consultar            - Consultar jugadas por fecha y horario
 * - GET  /listar-jugadas/recientes            - Obtener las ultimas jugadas del dia actual
 * - GET  /listar-jugadas/voucher/{radicado}   - Obtener datos estructurados para reimpresion de voucher
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth_middleware.php';

// Inicializar seguridad - Requiere autenticacion (cualquier usuario logueado)
$currentUser = initApiSecurity(true, ['0', '1', '2']);

// El middleware ya maneja OPTIONS, pero dejamos esto por compatibilidad
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}



/**
 * Responde con JSON y código de estado HTTP
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Maneja errores y responde con mensaje apropiado
 */
function sendError($message, $statusCode = 400, $details = null) {
    $response = [
        'success' => false,
        'error' => $message
    ];
    if ($details !== null) {
        $response['details'] = $details;
    }
    sendResponse($response, $statusCode);
}

/**
 * Lista todos los horarios de juego
 * Replica: ListarHorJuegos()
 */
function listarHorarios($conn) {
    try {
        $stmt = $conn->query(
            "SELECT NUM, DESCRIPCION
             FROM horariojuego
             WHERE ESTADO = 'A'
             ORDER BY NUM"
        );
        
        $horarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'data' => $horarios,
            'count' => count($horarios)
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => 'Error al listar horarios',
            'details' => $e->getMessage()
        ];
    }
}

/**
 * Consulta las jugadas realizadas en una fecha y horario específicos
 * Replica: ListarJuegos()
 */
function consultarJugadas($conn, $fecha, $codigoJuego, $sucursalOperario = null) {
    try {
        if (empty($fecha)) {
            return [
                'success' => false,
                'error' => 'La fecha es requerida'
            ];
        }

        if (empty($codigoJuego)) {
            return [
                'success' => false,
                'error' => 'El código de juego (horario) es requerido'
            ];
        }

        $sql = "SELECT hj.RADICADO, hj.CODANIMAL, hj.ANIMAL, hj.VALOR, hj.SUCURSAL,
                    COALESCE(b.BODEGA, hj.SUCURSAL) AS NOMBRE_SUCURSAL,
                    hj.HORA, hj.ESTADOP, hj.HORAJUEGO, hj.DESJUEGO, hj.FECHA
             FROM hislottojuego hj
             LEFT JOIN bodegas b ON hj.SUCURSAL = b.CODIGO
             WHERE hj.CODIGOJ = :codigoJuego AND hj.FECHA = :fecha";

        $params = [
            'codigoJuego' => $codigoJuego,
            'fecha' => $fecha
        ];

        if ($sucursalOperario !== null) {
            $sql .= " AND hj.SUCURSAL = :sucursal";
            $params['sucursal'] = $sucursalOperario;
        }

        $sql .= " ORDER BY hj.HORA DESC";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        $jugadas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Formatear valores numéricos para coincidir con el formato Java si es necesario
        // En Java: Convertir.format(ConeBD.RstBD.getDouble("VALOR"))
        foreach ($jugadas as &$jugada) {
            $jugada['VALOR_FORMATEADO'] = number_format($jugada['VALOR'], 2, '.', ',');
            $jugada['VALOR'] = floatval($jugada['VALOR']);
        }
        
        return [
            'success' => true,
            'data' => $jugadas,
            'count' => count($jugadas),
            'filters' => [
                'fecha' => $fecha,
                'codigoJuego' => $codigoJuego
            ]
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => 'Error al consultar jugadas',
            'details' => $e->getMessage()
        ];
    }
}

/**
 * Obtiene las jugadas más recientes del día actual
 */
function obtenerJugadasRecientes($conn, $limite = 20, $sucursalOperario = null) {
    try {
        $fechaActual = date('Y-m-d');

        $sql = "SELECT hj.RADICADO, hj.CODANIMAL, hj.ANIMAL, hj.VALOR, hj.SUCURSAL,
                    COALESCE(b.BODEGA, hj.SUCURSAL) AS NOMBRE_SUCURSAL,
                    hj.HORA, hj.ESTADOP, hj.DESJUEGO, hj.HORAJUEGO, hj.FECHA
             FROM hislottojuego hj
             LEFT JOIN bodegas b ON hj.SUCURSAL = b.CODIGO
             WHERE hj.FECHA = :fecha";

        if ($sucursalOperario !== null) {
            $sql .= " AND hj.SUCURSAL = :sucursal";
        }

        $sql .= " ORDER BY hj.HORA DESC, hj.RADICADO DESC LIMIT :limite";

        $stmt = $conn->prepare($sql);
        $stmt->bindValue(':fecha', $fechaActual, PDO::PARAM_STR);
        if ($sucursalOperario !== null) {
            $stmt->bindValue(':sucursal', $sucursalOperario, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limite', (int)$limite, PDO::PARAM_INT);
        $stmt->execute();
        
        $jugadas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($jugadas as &$jugada) {
            $jugada['VALOR'] = floatval($jugada['VALOR']);
        }
        
        return [
            'success' => true,
            'data' => $jugadas,
            'count' => count($jugadas),
            'fecha' => $fechaActual
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => 'Error al obtener jugadas recientes',
            'details' => $e->getMessage()
        ];
    }
}

/**
 * Valida si se puede reimprimir un ticket (solo operarios)
 * - No permite reimpresión de fechas pasadas
 * - No permite reimpresión si el horario del juego ya pasó
 * @param string $fechaTicket Fecha del ticket (Y-m-d)
 * @param array $juegos Array de juegos con HORAJUEGO
 * @return array ['permitido' => bool, 'motivo' => string|null]
 */
function validarReimpresionOperario($fechaTicket, $juegos) {
    // Usar zona horaria de Colombia
    date_default_timezone_set('America/Bogota');

    $fechaActual = date('Y-m-d');
    $horaActual = date('H:i:s');

    // 1. No permitir fechas pasadas
    if ($fechaTicket < $fechaActual) {
        return [
            'permitido' => false,
            'motivo' => 'No se puede reimprimir tickets de fechas pasadas'
        ];
    }

    // 2. Si es del día actual, verificar que ningún juego haya vencido
    if ($fechaTicket === $fechaActual) {
        foreach ($juegos as $juego) {
            $horaJuego = $juego['HORAJUEGO'] ?? null;
            if ($horaJuego) {
                // Normalizar formato de hora (puede venir como HH:MM o HH:MM:SS)
                $horaJuegoNormalizada = strlen($horaJuego) === 5 ? $horaJuego . ':00' : $horaJuego;

                // Si la hora del juego ya pasó, no permitir
                if ($horaJuegoNormalizada <= $horaActual) {
                    return [
                        'permitido' => false,
                        'motivo' => "El horario de juego ({$horaJuego}) ya venció. No se puede reimprimir."
                    ];
                }
            }
        }
    }

    // 3. Si es fecha futura o todos los horarios están vigentes, permitir
    return ['permitido' => true, 'motivo' => null];
}

/**
 * Obtiene los datos de un juego específico formateados para el voucher
 * Permite la reimpresión con la misma estructura que realizar-juego/guardar
 * SEGURIDAD: Operarios no pueden reimprimir tickets de fechas pasadas o con horarios vencidos
 */
function obtenerDatosVoucher($conn, $radicado, $sucursalOperario = null, $esOperario = false) {
    try {
        if (empty($radicado)) {
            return ['success' => false, 'error' => 'El número de radicado es requerido'];
        }

        // 1. Obtener datos de la tabla principal
        $sql = "SELECT jl.RADICADO, jl.FECHA, jl.HORA, jl.SUCURSAL as CODIGO_SUCURSAL, jl.TOTALJUEGO, b.BODEGA as NOMBRE_SUCURSAL
             FROM jugarlotto jl
             LEFT JOIN bodegas b ON jl.SUCURSAL = b.CODIGO
             WHERE jl.RADICADO = :radicado";

        $params = ['radicado' => $radicado];

        if ($sucursalOperario !== null) {
            $sql .= " AND jl.SUCURSAL = :sucursal";
            $params['sucursal'] = $sucursalOperario;
        }

        $stmtPrincipal = $conn->prepare($sql);
        $stmtPrincipal->execute($params);
        $datosPrincipal = $stmtPrincipal->fetch(PDO::FETCH_ASSOC);

        if (!$datosPrincipal) {
            return ['success' => false, 'error' => 'No se encontró el radicado especificado'];
        }

        // 2. Obtener detalle de los animales jugados
        $stmtDetalle = $conn->prepare(
            "SELECT CODANIMAL, ANIMAL, VALOR, CODIGOJ, HORAJUEGO, DESJUEGO
             FROM hislottojuego
             WHERE RADICADO = :radicado"
        );
        $stmtDetalle->execute(['radicado' => $radicado]);
        $detalles = $stmtDetalle->fetchAll(PDO::FETCH_ASSOC);

        // 3. SEGURIDAD: Si es operario, validar restricciones de tiempo
        if ($esOperario) {
            $validacion = validarReimpresionOperario($datosPrincipal['FECHA'], $detalles);
            if (!$validacion['permitido']) {
                return [
                    'success' => false,
                    'error' => $validacion['motivo'],
                    'codigo' => 'REIMPRESION_NO_PERMITIDA'
                ];
            }
        }

        // 4. Formatear a la estructura del voucher
        $juegosVoucher = [];
        foreach ($detalles as $juego) {
            $juegosVoucher[] = [
                'codigoAnimal' => $juego['CODANIMAL'],
                'nombreAnimal' => $juego['ANIMAL'],
                'valor' => floatval($juego['VALOR']),
                'codigoHorario' => $juego['CODIGOJ'],
                'horaJuego' => $juego['HORAJUEGO'],
                'descripcionHorario' => $juego['DESJUEGO']
            ];
        }

        return [
            'success' => true,
            'data' => [
                'radicado' => $datosPrincipal['RADICADO'],
                'fecha' => $datosPrincipal['FECHA'],
                'hora' => $datosPrincipal['HORA'],
                'codigoSucursal' => $datosPrincipal['CODIGO_SUCURSAL'],
                'nombreSucursal' => $datosPrincipal['NOMBRE_SUCURSAL'] ?? 'Sucursal ' . $datosPrincipal['CODIGO_SUCURSAL'],
                'juegos' => $juegosVoucher,
                'total' => floatval($datosPrincipal['TOTALJUEGO']),
                'cantidad_juegos' => count($juegosVoucher)
            ]
        ];
    } catch (PDOException $e) {
        return [
            'success' => false,
            'error' => 'Error al obtener datos del voucher',
            'details' => $e->getMessage()
        ];
    }
}

// ==================== RUTEO DE PETICIONES ====================

try {
    $conn = getDBConnection();

    if (!$conn) {
        sendError('Error de conexión a la base de datos', 500);
    }

    // Obtener sucursal del operario (null para admins)
    $sucursalOperario = getOperatorSucursal($currentUser);

    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_SERVER['PATH_INFO'] ?? '/';

    // Parsear la ruta
    $segments = array_filter(explode('/', $path));
    $action = $segments[1] ?? '';
    $param = $segments[2] ?? '';

    // GET: Listar horarios
    if ($method === 'GET' && $action === 'horarios') {
        $result = listarHorarios($conn);
        sendResponse($result, $result['success'] ? 200 : 400);
    }

    // GET: Consultar jugadas
    elseif ($method === 'GET' && $action === 'consultar') {
        $fecha = $_GET['fecha'] ?? null;
        $codigoJuego = $_GET['codigoJuego'] ?? null;

        $result = consultarJugadas($conn, $fecha, $codigoJuego, $sucursalOperario);
        sendResponse($result, $result['success'] ? 200 : 400);
    }

    // GET: Listar jugadas recientes del día
    elseif ($method === 'GET' && $action === 'recientes') {
        $limite = $_GET['limite'] ?? 20;
        $result = obtenerJugadasRecientes($conn, $limite, $sucursalOperario);
        sendResponse($result, $result['success'] ? 200 : 400);
    }

    // GET: Datos para Voucher (Reimpresión)
    // SEGURIDAD: Los operarios tienen restricciones de tiempo para reimprimir
    elseif ($method === 'GET' && $action === 'voucher' && !empty($param)) {
        // Determinar si el usuario es operario (TIPO='2')
        $esOperario = isset($currentUser['TIPO']) && strval($currentUser['TIPO']) === '2';
        $result = obtenerDatosVoucher($conn, $param, $sucursalOperario, $esOperario);
        sendResponse($result, $result['success'] ? 200 : ((isset($result['codigo']) && $result['codigo'] === 'REIMPRESION_NO_PERMITIDA') ? 403 : 404));    }
    
    // Ruta no encontrada
    else {
        sendError('Endpoint no encontrado', 404, [
            'method' => $method,
            'path' => $path,
            'available_endpoints' => [
                'GET /listar-jugadas/horarios',
                'GET /listar-jugadas/consultar?fecha=YYYY-MM-DD&codigoJuego=N',
                'GET /listar-jugadas/recientes',
                'GET /listar-jugadas/voucher/{radicado}'
            ]
        ]);
    }
    
} catch (Exception $e) {
    sendError('Error interno del servidor', 500, $e->getMessage());
}