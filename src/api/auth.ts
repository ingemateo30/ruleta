import { apiClient, ApiError } from './client';
import type { LoginRequest, LoginResponse, User } from './types';

/**
 * Servicio de autenticación
 */
class AuthService {
  private readonly STORAGE_KEY = 'user';

  /**
   * Inicia sesión con usuario y contraseña
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        '/login.php',
        {
          username: credentials.username,
          password: credentials.password,
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
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: 'Error inesperado al iniciar sesión',
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
   * Guarda el usuario en localStorage
   */
  private saveUser(user: User): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }
}

// Instancia única del servicio de autenticación
export const authService = new AuthService();
