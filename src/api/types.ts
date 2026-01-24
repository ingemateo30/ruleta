// Tipos para las respuestas de la API

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface User {
  id: string;
  nombre: string;
  nick: string;
  tipo: string;
  caja: number;
  codBodega?: number; // Mantener por compatibilidad
  codigoSucursal?: number; // Campo que devuelve el API
  nombreSucursal?: string; // Campo que devuelve el API
  sucursal: string;
  estado: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

// Tipos para realizar-juego
export interface AnimalAPI {
  NUM: number;
  CODIGOJUEGO: string;
  VALOR: string;
  COLOR: string;
}

export interface HorarioAPI {
  NUM: number;
  DESCRIPCION: string;
  HORA: string;
  HORA_FORMATEADA?: string;
}

export interface ParametrosAPI {
  minimo: number;
  maximo: number;
}

export interface ConsecutivoResponse {
  success: boolean;
  data?: {
    consecutivo: number;
    radicado: string;
  };
  error?: string;
}

export interface AnimalesResponse {
  success: boolean;
  data?: AnimalAPI[];
  count?: number;
  error?: string;
}

export interface HorariosResponse {
  success: boolean;
  data?: HorarioAPI[];
  count?: number;
  error?: string;
}

export interface ParametrosResponse {
  success: boolean;
  data?: ParametrosAPI;
  error?: string;
}

export interface JuegoItem {
  codigoAnimal: string;
  nombreAnimal: string;
  codigoHorario: number;
  horaJuego: string;
  descripcionHorario: string;
  valor: number;
}

export interface GuardarJuegoRequest {
  radicado: string;
  fecha: string;
  hora: string;
  sucursal: string;
  total: number;
  juegos: JuegoItem[];
}

export interface JuegoVoucher {
  codigoAnimal: string;
  nombreAnimal: string;
  valor: number;
  codigoHorario: number;
  horaJuego: string;
  descripcionHorario: string;
}

export interface GuardarJuegoResponse {
  success: boolean;
  message?: string;
  data?: {
    radicado: string;
    fecha: string;
    hora: string;
    codigoSucursal: string;
    nombreSucursal: string;
    juegos: JuegoVoucher[];
    total: number;
    cantidad_juegos: number;
  };
  error?: string;
  details?: string[];
}

// Tipos para anular-juego
export interface CabeceraJuego {
  RADICADO: string;
  FECHA: string;
  HORA: string;
  SUCURSAL: string;
  TOTALJUEGO: number;
  ESTADO: string;
}

export interface DetalleJuego {
  CODANIMAL: string;
  ANIMAL: string;
  VALOR: number;
  DESJUEGO: string;
  HORAJUEGO: string;
  ESTADOP: string;
}

export interface BuscarJuegoResponse {
  success: boolean;
  data?: {
    cabecera: CabeceraJuego;
    detalles: DetalleJuego[];
  };
  error?: string;
  details?: string;
}

export interface AnularJuegoRequest {
  radicado: string;
  fecha: string;
  motivo: string;
  usuario?: string;
}

export interface AnularJuegoResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}

// Tipos para listar-jugadas
export interface HorarioJugada {
  NUM: number;
  DESCRIPCION: string;
}

export interface HorariosJugadasResponse {
  success: boolean;
  data?: HorarioJugada[];
  count?: number;
  error?: string;
}

export interface JugadaListada {
  RADICADO: string;
  CODANIMAL: string;
  ANIMAL: string;
  VALOR: number;
  SUCURSAL: string;
  HORA: string;
  ESTADOP: string;
  VALOR_FORMATEADO?: string;
}

export interface ConsultarJugadasResponse {
  success: boolean;
  data?: JugadaListada[];
  count?: number;
  filters?: {
    fecha: string;
    codigoJuego: string;
  };
  error?: string;
  details?: string;
}

export interface RecientesJugadasResponse {
  success: boolean;
  data?: JugadaListada[];
  count?: number;
  fecha?: string;
  error?: string;
  details?: string;
}

export interface VoucherResponse {
  success: boolean;
  message?: string;
  data?: {
    radicado: string;
    fecha: string;
    hora: string;
    codigoSucursal: string;
    nombreSucursal: string;
    juegos: JuegoVoucher[];
    total: number;
    cantidad_juegos: number;
  };
  error?: string;
  details?: string;
}

// Tipos para ingresar-resultado
export interface AnimalResultado {
  NUM: number;
  CODIGOJUEGO: string;
  VALOR: string;
  COLOR: string;
}

export interface HorarioResultado {
  NUM: number;
  DESCRIPCION: string;
  HORA: string;
}

export interface AnimalesResultadoResponse {
  success: boolean;
  data?: AnimalResultado[];
  count?: number;
  error?: string;
}

export interface HorariosResultadoResponse {
  success: boolean;
  data?: HorarioResultado[];
  count?: number;
  error?: string;
}

export interface GuardarResultadoRequest {
  codigoAnimal: string;
  nombreAnimal: string;
  codigoHorario: number;
  descripcionHorario: string;
  fecha: string;
}

export interface GuardarResultadoResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}
