// Exportar todos los servicios y tipos de la API
export { apiClient, ApiError, axiosInstance } from './client';
export { authService } from './auth';
export { realizarJuegoService } from './realizar-juego';
export { anularJuegoService } from './anular-juego';
export { listarJugadasService } from './listar-jugadas';
export { ingresarResultadoService } from './ingresar-resultado';
export { API_CONFIG, getApiBaseUrl } from './config';
export type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  User,
  ApiErrorResponse,
  AnimalAPI,
  HorarioAPI,
  ParametrosAPI,
  ConsecutivoResponse,
  AnimalesResponse,
  HorariosResponse,
  ParametrosResponse,
  JuegoItem,
  GuardarJuegoRequest,
  GuardarJuegoResponse,
  CabeceraJuego,
  DetalleJuego,
  BuscarJuegoResponse,
  AnularJuegoRequest,
  AnularJuegoResponse,
  HorarioJugada,
  HorariosJugadasResponse,
  JugadaListada,
  ConsultarJugadasResponse,
  AnimalResultado,
  HorarioResultado,
  AnimalesResultadoResponse,
  HorariosResultadoResponse,
  GuardarResultadoRequest,
  GuardarResultadoResponse,
} from './types';
