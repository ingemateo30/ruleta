import { apiClient } from './client';
import type {
  HorariosJugadasResponse,
  ConsultarJugadasResponse,
  RecientesJugadasResponse,
  VoucherResponse,
} from './types';

/**
 * Servicio para interactuar con el endpoint de listar-jugadas
 */
class ListarJugadasService {
  private readonly baseEndpoint = '/listar-jugadas.php';

  /**
   * Obtiene todos los horarios de juego para usar como filtro
   */
  async obtenerHorarios(): Promise<HorariosJugadasResponse> {
    try {
      const response = await apiClient.get<HorariosJugadasResponse>(
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
   * Consulta jugadas por fecha y código de juego (horario)
   */
  async consultarJugadas(
    fecha: string,
    codigoJuego: string
  ): Promise<ConsultarJugadasResponse> {
    try {
      // Construir URL con query params manualmente
      const params = new URLSearchParams({
        fecha,
        codigoJuego,
      });
      const response = await apiClient.get<ConsultarJugadasResponse>(
        `${this.baseEndpoint}/consultar?${params.toString()}`
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
   * Obtiene las jugadas más recientes del día actual
   */
  async obtenerRecientes(limite: number = 20): Promise<RecientesJugadasResponse> {
    try {
      const response = await apiClient.get<RecientesJugadasResponse>(
        `${this.baseEndpoint}/recientes?limite=${limite}`
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
   * Obtiene los datos de un juego específico para reimpresión de voucher
   */
  async obtenerDatosVoucher(radicado: string): Promise<VoucherResponse> {
    try {
      const response = await apiClient.get<VoucherResponse>(
        `${this.baseEndpoint}/voucher/${radicado}`
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
export const listarJugadasService = new ListarJugadasService();
