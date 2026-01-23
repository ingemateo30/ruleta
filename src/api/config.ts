/**
 * Configuración de la API
 */

// Determinar la URL base según el entorno
export const getApiBaseUrl = (): string => {
  // En desarrollo, usar localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:8080/api';
  }
  
  // En producción, usar ruta relativa
  return '/api';
};

// Configuración exportada
export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json',
  },
} as const;
