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
// ============= USUARIOS =============
export const usuariosAPI = {
  listar: async () => {
    const response = await apiClient.get('/usuarios.php/listar')as ApiResponse;
    return response.data;
  },

  obtener: async (id: number) => {
    const response = await apiClient.get(`/usuarios.php/obtener/${id}`)as ApiResponse;
    return response.data;
  },

  crear: async (data: {
    nick: string;
    clave: string;
    tipo: number;
    caja?: string;
    codbodega?: number;
    estado?: string;
  }) => {
    const response = await apiClient.post('/usuarios.php/crear', data)as ApiResponse;
    return response.data;
  },

  actualizar: async (id: number, data: UserData) => {
    const response = await apiClient.put(`/usuarios.php/actualizar/${id}`, data)as ApiResponse;
    return response.data;
  },

  eliminar: async (id: number) => {
    const response = await apiClient.delete(`/usuarios.php/eliminar/${id}`)as ApiResponse;
    return response.data;
  },
};

// ============= SUCURSALES =============
export const sucursalesAPI = {
  listar: async () => {
    const response = await apiClient.get('/sucursales.php/listar')as ApiResponse;
    return response.data;
  },

  obtener: async (codigo: number) => {
    const response = await apiClient.get(`/sucursales.php/obtener/${codigo}`)as ApiResponse;
    return response.data;
  },

  crear: async (data: { bodega: string }) => {
    const response = await apiClient.post('/sucursales.php/crear', data)as ApiResponse;
    return response.data;
  },

  actualizar: async (codigo: number, data: { bodega: string }) => {
    const response = await apiClient.put(`/sucursales.php/actualizar/${codigo}`, data)as ApiResponse;
    return response.data;
  },

  eliminar: async (codigo: number) => {
    const response = await apiClient.delete(`/sucursales.php/eliminar/${codigo}`)as ApiResponse;
    return response.data;
  },
};

// ============= PARÁMETROS =============
export const parametrosAPI = {
  listar: async () => {
    const response = await apiClient.get('/parametros.php/listar')as ApiResponse;
    return response.data;
  },

  obtener: async (codigo: number) => {
    const response = await apiClient.get(`/parametros.php/obtener/${codigo}`)as ApiResponse;
    return response.data;
  },

 actualizar: async (codigo: number, data: { valor: string }) => {
  const response = await apiClient.put(`/parametros.php/actualizar/${codigo}`, data)as ApiResponse;
  return response.data;
},

crear: async (data: { nombre: string; valor: string }) => {
  const response = await apiClient.post('/parametros.php/crear', data)as ApiResponse;
  return response.data;
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
    const response = await apiClient.get('/horarios.php/listar')as ApiResponse;
    return response.data;
  },

  activos: async () => {
    const response = await apiClient.get('/horarios.php/activos')as ApiResponse;
    return response.data;
  },

  obtener: async (num: number) => {
    const response = await apiClient.get(`/horarios.php/obtener/${num}`)as ApiResponse;
    return response.data;
  },

  crear: async (data: {
    descripcion: string;
    hora: string;
    estado?: string;
  }) => {
    const response = await apiClient.post('/horarios.php/crear', data)as ApiResponse;
    return response.data;
  },

  actualizar: async (num: number, data: horarioData) => {
    const response = await apiClient.put(`/horarios.php/actualizar/${num}`, data)as ApiResponse;
    return response.data;
  },

  eliminar: async (num: number) => {
    const response = await apiClient.delete(`/horarios.php/eliminar/${num}`)as ApiResponse;
    return response.data;
  },
};

// ============= RULETA (ANIMALES) =============
export const ruletaAPI = {
  listar: async () => {
    const response = await apiClient.get('/ruleta.php/listar')as ApiResponse;
    return response.data;
  },

  activos: async () => {
    const response = await apiClient.get('/ruleta.php/activos')as ApiResponse;
    return response.data;
  },

  obtener: async (num: number) => {
    const response = await apiClient.get(`/ruleta.php/obtener/${num}`)as ApiResponse;
    return response.data;
  },

  /*
  actualizar: async (num: number, data: any) => {
    const response = await apiClient.put(`/ruleta.php/actualizar/${num}`, data)as ApiResponse;
    return response.data;
  },
*/
  activar: async (num: number) => {
    const response = await apiClient.put(`/ruleta.php/activar/${num}`)as ApiResponse;
    return response.data;
  },

  desactivar: async (num: number) => {
    const response = await apiClient.put(`/ruleta.php/desactivar/${num}`)as ApiResponse;
    return response.data;
  },

  activarTodos: async () => {
    const response = await apiClient.put('/ruleta.php/activar-todos')as ApiResponse;
    return response.data;
  },

  desactivarTodos: async () => {
    const response = await apiClient.put('/ruleta.php/desactivar-todos')as ApiResponse;
    return response.data;
  },

  estadisticas: async () => {
    const response = await apiClient.get('/ruleta.php/estadisticas')as ApiResponse;
    return response.data;
  },
};

// ============= PAGOS =============
export const pagosAPI = {
  buscarGanadores: async (params: { radicado?: string; fecha?: string }) => {
    const response = await apiClient.get('/pagos.php/buscar-ganadores', { params })as ApiResponse;
    return response.data;
  },

  verificarGanador: async (radicado: string) => {
    const response = await apiClient.get('/pagos.php/verificar-ganador', {
      params: { radicado },
    })as ApiResponse;
    return response.data;
  },

  realizarPago: async (data: {
    radicado: string;
    usuario: string;
    observaciones?: string;
  }) => {
    const response = await apiClient.post('/pagos.php/realizar-pago', data)as ApiResponse;
    return response.data;
  },

  listar: async (params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    sucursal?: string;
  }) => {
    const response = await apiClient.get('/pagos.php/listar', { params })as ApiResponse;
    return response.data;
  },

  estadisticas: async (fecha?: string) => {
    const response = await apiClient.get('/pagos.php/estadisticas', {
      params: { fecha },
    })as ApiResponse;
    return response.data;
  },
};

// ============= CERRAR JUEGO =============
export const cerrarJuegoAPI = {
  verificar: async (params: { codigo_horario: number; fecha?: string }) => {
    const response = await apiClient.get('/cerrar-juego.php/verificar', { params })as ApiResponse;
    return response.data;
  },

  ejecutar: async (data: {
    codigo_horario: number;
    fecha: string;
    usuario: string;
    observaciones?: string;
  }) => {
    const response = await apiClient.post('/cerrar-juego.php/ejecutar', data)as ApiResponse;
    return response.data;
  },

  listar: async (params?: { fecha_inicio?: string; fecha_fin?: string }) => {
    const response = await apiClient.get('/cerrar-juego.php/listar', { params })as ApiResponse;
    return response.data;
  },

  estadisticas: async (fecha?: string) => {
    const response = await apiClient.get('/cerrar-juego.php/estadisticas', {
      params: { fecha },
    })as ApiResponse;
    return response.data;
  },

  detalle: async (id: number) => {
    const response = await apiClient.get(`/cerrar-juego.php/detalle/${id}`)as ApiResponse;
    return response.data;
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
    const response = await apiClient.get('/informes.php/juegos', { params })as ApiResponse;
    return response.data;
  },

  ventas: async (params: {
    fecha_inicio: string;
    fecha_fin: string;
    sucursal?: string;
  }) => {
    const response = await apiClient.get('/informes.php/ventas', { params })as ApiResponse;
    return response.data;
  },

  resultados: async (params: { fecha_inicio: string; fecha_fin: string }) => {
    const response = await apiClient.get('/informes.php/resultados', { params })as ApiResponse;
    return response.data;
  },

  pagos: async (params: {
    fecha_inicio: string;
    fecha_fin: string;
    sucursal?: string;
  }) => {
    const response = await apiClient.get('/informes.php/pagos', { params })as ApiResponse;
    return response.data;
  },

  animales: async (params: { fecha_inicio: string; fecha_fin: string }) => {
    const response = await apiClient.get('/informes.php/animales', { params })as ApiResponse;
    return response.data;
  },

  cierres: async (params: { fecha_inicio: string; fecha_fin: string }) => {
    const response = await apiClient.get('/informes.php/cierres', { params })as ApiResponse;
    return response.data;
  },
};

// ============= ESTADÍSTICAS =============
export const estadisticasAPI = {
  dashboard: async (fecha?: string) => {
    const response = await apiClient.get('/estadisticas.php/dashboard', {
      params: { fecha },
    })as ApiResponse;
    return response.data;
  },

  tendencias: async (dias?: number) => {
    const response = await apiClient.get('/estadisticas.php/tendencias', {
      params: { dias },
    })as ApiResponse;
    return response.data;
  },

  animales: async (params: { fecha_inicio: string; fecha_fin: string }) => {
    const response = await apiClient.get('/estadisticas.php/animales', { params })as ApiResponse;
    return response.data;
  },

  horarios: async (params: { fecha_inicio: string; fecha_fin: string }) => {
    const response = await apiClient.get('/estadisticas.php/horarios', { params })as ApiResponse;
    return response.data;
  },

  sucursales: async (params: { fecha_inicio: string; fecha_fin: string }) => {
    const response = await apiClient.get('/estadisticas.php/sucursales', { params })as ApiResponse;
    return response.data;
  },

  resumenGeneral: async () => {
    const response = await apiClient.get('/estadisticas.php/resumen-general')as ApiResponse;
    return response.data;
  },
};
