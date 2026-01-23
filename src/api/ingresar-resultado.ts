import { apiClient } from './client';
import type {
  AnimalesResultadoResponse,
  HorariosResultadoResponse,
  GuardarResultadoRequest,
  GuardarResultadoResponse,
} from './types';

/**
 * Servicio para interactuar con el endpoint de ingresar-resultado
 */
class IngresarResultadoService {
  private readonly baseEndpoint = '/ingresar-resultado.php';

  /**
   * Obtiene todos los animales activos para seleccionar ganador
   */
  async obtenerAnimales(): Promise<AnimalesResultadoResponse> {
    try {
      const response = await apiClient.get<AnimalesResultadoResponse>(
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
  async obtenerHorarios(): Promise<HorariosResultadoResponse> {
    try {
      const response = await apiClient.get<HorariosResultadoResponse>(
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
   * Guarda el resultado ganador
   */
  async guardarResultado(
    data: GuardarResultadoRequest
  ): Promise<GuardarResultadoResponse> {
    try {
      const response = await apiClient.post<GuardarResultadoResponse>(
        `${this.baseEndpoint}/guardar`,
        data
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
export const ingresarResultadoService = new IngresarResultadoService();
