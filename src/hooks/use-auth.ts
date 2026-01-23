import { useState, useEffect } from 'react';
import { authService } from '@/api';
import type { User } from '@/api';

/**
 * Hook personalizado para manejar la autenticación
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario al montar el componente
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ username, password });
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true, user: response.user };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };
};
