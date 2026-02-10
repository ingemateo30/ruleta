import { apiClient } from './client';
import type {
  BuscarJuegoResponse,
  AnularJuegoRequest,
  AnularJuegoResponse,
} from './types';

/**
 * Servicio para interactuar con el endpoint de anular-juego
 */
class AnularJuegoService {
  private readonly baseEndpoint = '/anular-juego.php';

  /**
   * Busca un juego por radicado y fecha
   */
  async buscarJuego(radicado: string, fecha: string): Promise<BuscarJuegoResponse> {
    try {
      // Construir URL con query params manualmente ya que el endpoint PHP espera GET params
      const params = new URLSearchParams({
        radicado,
        fecha,
      });
      const response = await apiClient.get<BuscarJuegoResponse>(
        `${this.baseEndpoint}/buscar?${params.toString()}`
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
   * Ejecuta la anulación de un juego
   */
  async ejecutarAnulacion(
    data: AnularJuegoRequest
  ): Promise<AnularJuegoResponse> {
    try {
      const response = await apiClient.post<AnularJuegoResponse>(
        `${this.baseEndpoint}/ejecutar`,
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

  async listarAnulados(params: {
    fecha_inicio?: string;
    fecha_fin?: string;
    sucursal?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params.fecha_inicio) queryParams.set('fecha_inicio', params.fecha_inicio);
      if (params.fecha_fin) queryParams.set('fecha_fin', params.fecha_fin);
      if (params.sucursal) queryParams.set('sucursal', params.sucursal);
      const response = await apiClient.get<any>(
        `${this.baseEndpoint}/anulados?${queryParams.toString()}`
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
export const anularJuegoService = new AnularJuegoService();
