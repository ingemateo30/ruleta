import { apiClient } from './client';
import type {
  AnimalesResponse,
  HorariosResponse,
  ParametrosResponse,
  ConsecutivoResponse,
  GuardarJuegoRequest,
  GuardarJuegoResponse,
} from './types';

/**
 * Servicio para interactuar con el endpoint de realizar-juego
 */
class RealizarJuegoService {
  private readonly baseEndpoint = '/realizar-juego.php';

  /**
   * Obtiene el próximo número consecutivo para el radicado
   */
  async obtenerConsecutivo(): Promise<ConsecutivoResponse> {
    try {
      const response = await apiClient.get<ConsecutivoResponse>(
        `${this.baseEndpoint}/consecutivo`
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Obtiene todos los animales activos de la ruleta
   */
  async obtenerAnimales(): Promise<AnimalesResponse> {
    try {
      const response = await apiClient.get<AnimalesResponse>(
        `${this.baseEndpoint}/animales`
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Obtiene todos los horarios de juego activos
   */
  async obtenerHorarios(): Promise<HorariosResponse> {
    try {
      const response = await apiClient.get<HorariosResponse>(
        `${this.baseEndpoint}/horarios`
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Obtiene los parámetros de apuesta (mínimo y máximo)
   */
  async obtenerParametros(): Promise<ParametrosResponse> {
    try {
      const response = await apiClient.get<ParametrosResponse>(
        `${this.baseEndpoint}/parametros`
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Guarda un juego completo con todos sus detalles
   */
  async guardarJuego(
    juego: GuardarJuegoRequest
  ): Promise<GuardarJuegoResponse> {
    try {
      const response = await apiClient.post<GuardarJuegoResponse>(
        `${this.baseEndpoint}/guardar`,
        juego
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }
}

// Instancia única del servicio
export const realizarJuegoService = new RealizarJuegoService();
