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
}

// Instancia única del servicio
export const anularJuegoService = new AnularJuegoService();
