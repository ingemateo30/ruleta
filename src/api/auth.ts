import { apiClient, ApiError } from './client';
import type { 
  LoginRequest, 
  LoginResponse, 
  User, 
  Setup2FAResponse,
  Activate2FARequest,
  Activate2FAResponse,
  Disable2FARequest,
  Disable2FAResponse
} from './types';

/**
 * Servicio de autenticación
 */
class AuthService {
  private readonly STORAGE_KEY = 'user';

  /**
   * Inicia sesión con usuario y contraseña (y código 2FA si es necesario)
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        '/login.php',
        {
          username: credentials.username,
          password: credentials.password,
          totpCode: credentials.totpCode,
        }
      );

      // Si el login es exitoso, guardar el usuario en localStorage
      if (response.success && response.user) {
        this.saveUser(response.user);
      }

      return response;
    } catch (error) {
      // Manejar errores de la API
      if (error instanceof ApiError) {
        const responseData = error.response as Record<string, unknown> | undefined;
        return {
          success: false,
          message: error.message,
          code: responseData?.code as string | undefined,
        };
      }
      return {
        success: false,
        message: 'Error inesperado al iniciar sesión',
      };
    }
  }

  /**
   * Configura 2FA para el usuario actual - genera secreto y QR
   */
  async setup2FA(): Promise<Setup2FAResponse> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return {
          success: false,
          message: 'No hay usuario autenticado',
        };
      }

      const response = await apiClient.post<Setup2FAResponse>(
        '/setup_2fa.php',
        {},
        {
          headers: {
            'X-User-Id': user.id.toString(),
          },
        }
      );

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          message: error.message,
        };
      }
      return {
        success: false,
        message: 'Error al configurar 2FA',
      };
    }
  }

  /**
   * Activa 2FA verificando el código generado
   */
  async activate2FA(request: Activate2FARequest): Promise<Activate2FAResponse> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return {
          success: false,
          message: 'No hay usuario autenticado',
        };
      }

      const response = await apiClient.post<Activate2FAResponse>(
        '/activate_2fa.php',
        request,
        {
          headers: {
            'X-User-Id': user.id.toString(),
          },
        }
      );

      // Si se activa exitosamente, actualizar el usuario
      if (response.success) {
        user.has2FA = true;
        this.saveUser(user);
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          message: error.message,
        };
      }
      return {
        success: false,
        message: 'Error al activar 2FA',
      };
    }
  }

  /**
   * Desactiva 2FA verificando la contraseña
   */
  async disable2FA(request: Disable2FARequest): Promise<Disable2FAResponse> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return {
          success: false,
          message: 'No hay usuario autenticado',
        };
      }

      const response = await apiClient.post<Disable2FAResponse>(
        '/disable_2fa.php',
        request,
        {
          headers: {
            'X-User-Id': user.id.toString(),
          },
        }
      );

      // Si se desactiva exitosamente, actualizar el usuario
      if (response.success) {
        user.has2FA = false;
        this.saveUser(user);
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          message: error.message,
        };
      }
      return {
        success: false,
        message: 'Error al desactivar 2FA',
      };
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Obtiene el usuario actual desde localStorage
   */
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.STORAGE_KEY);
      if (!userStr) {
        return null;
      }
      const user = JSON.parse(userStr) as User;
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Verifica si el usuario tiene 2FA activado
   */
  has2FAEnabled(): boolean {
    const user = this.getCurrentUser();
    return user?.has2FA === true;
  }

  /**
   * Guarda el usuario en localStorage
   */
  private saveUser(user: User): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }
}

// Instancia única del servicio de autenticación
export const authService = new AuthService();