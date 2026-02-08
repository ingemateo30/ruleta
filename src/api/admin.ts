import {apiClient} from './client';
import { ApiResponse } from './types';


interface UserData {
  nick: string;
    clave: string;
    tipo: number;
    caja?: string;
    codbodega?: number;
    estado?: string;
}
interface CerrarJuegoListarParams {
  fecha_inicio?: string;
  fecha_fin?: string;
  sucursal?: string;
}
// ============= USUARIOS =============
export const usuariosAPI = {
  listar: async () => {
    return await apiClient.get<ApiResponse>('/usuarios.php/listar');
  },

  obtener: async (id: number) => {
    return await apiClient.get<ApiResponse>(`/usuarios.php/obtener/${id}`);
  },

  crear: async (data: {
    nick: string;
    clave: string;
    tipo: number;
    caja?: string;
    codbodega?: number;
    estado?: string;
  }) => {
    return await apiClient.post<ApiResponse>('/usuarios.php/crear', data);
  },

  actualizar: async (id: number, data: UserData) => {
    return await apiClient.put<ApiResponse>(`/usuarios.php/actualizar/${id}`, data);
  },

  eliminar: async (id: number) => {
    return await apiClient.delete<ApiResponse>(`/usuarios.php/eliminar/${id}`);
  },
};

// ============= SUCURSALES =============
export interface SucursalData {
  bodega: string;
}

export const sucursalesAPI = {
  listar: async () => {
    return await apiClient.get<ApiResponse>('/sucursales.php/listar');
  },

  obtener: async (codigo: number) => {
    return await apiClient.get<ApiResponse>(`/sucursales.php/obtener/${codigo}`);
  },

  crear: async (data: SucursalData) => {
    return await apiClient.post<ApiResponse>('/sucursales.php/crear', data);
  },

  actualizar: async (codigo: number, data: SucursalData) => {
    return await apiClient.put<ApiResponse>(`/sucursales.php/actualizar/${codigo}`, data);
  },

  eliminar: async (codigo: number) => {
    return await apiClient.delete<ApiResponse>(`/sucursales.php/eliminar/${codigo}`);
  },
};

// ============= PARÁMETROS =============
export const parametrosAPI = {
  listar: async () => {
    return await apiClient.get<ApiResponse>('/parametros.php/listar');
  },

  obtener: async (codigo: number) => {
    return await apiClient.get<ApiResponse>(`/parametros.php/obtener/${codigo}`);
  },

  actualizar: async (codigo: number, data: { valor: string }) => {
    return await apiClient.put<ApiResponse>(`/parametros.php/actualizar/${codigo}`, data);
  },

  crear: async (data: { nombre: string; valor: string }) => {
    return await apiClient.post<ApiResponse>('/parametros.php/crear', data);
  },
};

interface horarioData {
  descripcion: string;
  hora: string;
  estado?: string;
}

// ============= HORARIOS =============
export const horariosAPI = {
  listar: async () => {
    return await apiClient.get<ApiResponse>('/horarios.php/listar');
  },

  activos: async () => {
    return await apiClient.get<ApiResponse>('/horarios.php/activos');
  },

  obtener: async (num: number) => {
    return await apiClient.get<ApiResponse>(`/horarios.php/obtener/${num}`);
  },

  crear: async (data: {
    descripcion: string;
    hora: string;
    estado?: string;
  }) => {
    return await apiClient.post<ApiResponse>('/horarios.php/crear', data);
  },

  actualizar: async (num: number, data: horarioData) => {
    return await apiClient.put<ApiResponse>(`/horarios.php/actualizar/${num}`, data);
  },

  eliminar: async (num: number) => {
    return await apiClient.delete<ApiResponse>(`/horarios.php/eliminar/${num}`);
  },
};

// ============= RULETA (ANIMALES) =============
export const ruletaAPI = {
  listar: async () => {
    return await apiClient.get<ApiResponse>('/ruleta.php/listar');
  },

  activos: async () => {
    return await apiClient.get<ApiResponse>('/ruleta.php/activos');
  },

  obtener: async (num: number) => {
    return await apiClient.get<ApiResponse>(`/ruleta.php/obtener/${num}`);
  },

  activar: async (num: number) => {
    return await apiClient.put<ApiResponse>(`/ruleta.php/activar/${num}`);
  },

  desactivar: async (num: number) => {
    return await apiClient.put<ApiResponse>(`/ruleta.php/desactivar/${num}`);
  },

  activarTodos: async () => {
    return await apiClient.put<ApiResponse>('/ruleta.php/activar-todos');
  },

  desactivarTodos: async () => {
    return await apiClient.put<ApiResponse>('/ruleta.php/desactivar-todos');
  },

  estadisticas: async () => {
    return await apiClient.get<ApiResponse>('/ruleta.php/estadisticas');
  },
};

// ============= PAGOS =============
export const pagosAPI = {
  proximosAVencer: async () => {
    return await apiClient.get('/pagos.php/proximos-a-vencer');
  },
  
  buscarGanadores: async (params: { radicado?: string; fecha?: string }) => {
    return await apiClient.get('/pagos.php/buscar-ganadores', { params });
  },
  
  realizarPago: async (data: { radicado: string; usuario: string }) => {
    return await apiClient.post('/pagos.php/realizar-pago', data);
  },
};

// ============= CERRAR JUEGO =============
export const cerrarJuegoAPI = {
  pendientes: async (params: { fecha: string }) => {
    return await apiClient.get('/cerrar-juego.php/pendientes', { params });
  },
  
  ejecutar: async (data: {
    fecha: string;
    usuario: string;
    codigo_sucursal?: number;
  }) => {
    return await apiClient.post('/cerrar-juego.php/ejecutar', data);
  },
  
 listar: async (params: CerrarJuegoListarParams) => {
    return await apiClient.get('/cerrar-juego.php/listar', { params });
  },
};

 

// ============= INFORMES =============
export const informesAPI = {
  juegos: async (params: {
    fecha_inicio: string;
    fecha_fin: string;
    sucursal?: string;
    horario?: string;
  }) => {
    return await apiClient.get<ApiResponse>('/informes.php/juegos', { params });
  },

  ventas: async (params: {
    fecha_inicio: string;
    fecha_fin: string;
    sucursal?: string;
  }) => {
    return await apiClient.get<ApiResponse>('/informes.php/ventas', { params });
  },

  resultados: async (params: { fecha_inicio: string; fecha_fin: string }) => {
    return await apiClient.get<ApiResponse>('/informes.php/resultados', { params });
  },

  pagos: async (params: {
    fecha_inicio: string;
    fecha_fin: string;
    sucursal?: string;
  }) => {
    return await apiClient.get<ApiResponse>('/informes.php/pagos', { params });
  },

  animales: async (params: { fecha_inicio: string; fecha_fin: string }) => {
    return await apiClient.get<ApiResponse>('/informes.php/animales', { params });
  },

  cierres: async (params: { fecha_inicio: string; fecha_fin: string }) => {
    return await apiClient.get<ApiResponse>('/informes.php/cierres', { params });
  },

   conteoAnimales: async (params: {
    fecha_inicio: string;
    fecha_fin: string;
    sucursal?: string;
  }) => {
    return await apiClient.get<ApiResponse>('/informes.php/conteo-animales', { params });
  },
};

// ============= ESTADÍSTICAS =============
export const estadisticasAPI = {
  dashboard: async (fecha?: string) => {
    return await apiClient.get<ApiResponse>('/estadisticas.php/dashboard', {
      params: { fecha },
    });
  },

  tendencias: async (dias?: number) => {
    return await apiClient.get<ApiResponse>('/estadisticas.php/tendencias', {
      params: { dias },
    });
  },

  animales: async (params: { fecha_inicio: string; fecha_fin: string }) => {
    return await apiClient.get<ApiResponse>('/estadisticas.php/animales', { params });
  },

  horarios: async (params: { fecha_inicio: string; fecha_fin: string }) => {
    return await apiClient.get<ApiResponse>('/estadisticas.php/horarios', { params });
  },

  sucursales: async (params: { fecha_inicio: string; fecha_fin: string }) => {
    return await apiClient.get<ApiResponse>('/estadisticas.php/sucursales', { params });
  },

  resumenGeneral: async () => {
    return await apiClient.get<ApiResponse>('/estadisticas.php/resumen-general');
  },
};
