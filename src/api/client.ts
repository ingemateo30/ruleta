import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import type { ApiResponse } from './types';
import { API_CONFIG } from './config';

// Clase de error personalizada para errores de API
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Crear instancia de Axios configurada
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Interceptor de solicitudes (opcional, para agregar tokens, etc.)
axiosInstance.interceptors.request.use(
  (config) => {
    // Aquí puedes agregar tokens de autenticación si es necesario
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas para manejo centralizado de errores
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Manejar errores de Axios
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      const status = error.response.status;
      const data = error.response.data as { message?: string } | undefined;
      const message = data?.message || error.message || `Error ${status}`;
      
      throw new ApiError(message, status, error.response.data);
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió respuesta
      throw new ApiError(
        'No se recibió respuesta del servidor',
        0,
        error.request
      );
    } else {
      // Algo pasó al configurar la solicitud
      throw new ApiError(
        `Error al configurar la solicitud: ${error.message}`,
        0,
        error
      );
    }
  }
);

// Cliente base para realizar peticiones HTTP usando Axios
class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(instance: AxiosInstance = axiosInstance) {
    this.axiosInstance = instance;
  }

  /**
   * Realiza una petición GET
   */
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(endpoint, config);
    return response.data;
  }

  /**
   * Realiza una petición POST
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.post<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * Realiza una petición PUT
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.put<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * Realiza una petición DELETE
   */
  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(endpoint, config);
    return response.data;
  }

  /**
   * Realiza una petición PATCH
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.patch<T>(endpoint, data, config);
    return response.data;
  }
}

// Instancia única del cliente API
export const apiClient = new ApiClient();

// Exportar la instancia de Axios por si se necesita acceso directo
export { axiosInstance };
