/**
 * Utilidad para gestionar los valores más jugados
 * Almacena en localStorage los montos más frecuentes
 */

const STORAGE_KEY = 'valores_mas_jugados';
const MAX_VALUES = 6; // Máximo de valores rápidos a mostrar

interface ValorJugado {
  monto: number;
  frecuencia: number;
  ultimaVez: string; // ISO date string
}

/**
 * Obtiene los valores más jugados desde localStorage
 */
export const obtenerValoresMasJugados = (): number[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const valores: ValorJugado[] = JSON.parse(stored);
    
    // Ordenar por frecuencia (mayor a menor) y luego por última vez (más reciente primero)
    const ordenados = valores.sort((a, b) => {
      if (b.frecuencia !== a.frecuencia) {
        return b.frecuencia - a.frecuencia;
      }
      return new Date(b.ultimaVez).getTime() - new Date(a.ultimaVez).getTime();
    });

    // Retornar solo los montos de los primeros MAX_VALUES
    return ordenados.slice(0, MAX_VALUES).map(v => v.monto);
  } catch (error) {
    console.error('Error al obtener valores más jugados:', error);
    return [];
  }
};

/**
 * Registra un monto jugado (se llama cuando se confirma una jugada)
 */
export const registrarMontoJugado = (monto: number): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let valores: ValorJugado[] = stored ? JSON.parse(stored) : [];

    // Buscar si el monto ya existe
    const index = valores.findIndex(v => v.monto === monto);

    if (index >= 0) {
      // Incrementar frecuencia y actualizar última vez
      valores[index].frecuencia += 1;
      valores[index].ultimaVez = new Date().toISOString();
    } else {
      // Agregar nuevo valor
      valores.push({
        monto,
        frecuencia: 1,
        ultimaVez: new Date().toISOString(),
      });
    }

    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(valores));
  } catch (error) {
    console.error('Error al registrar monto jugado:', error);
  }
};

/**
 * Registra múltiples montos (cuando se confirma un ticket con varias jugadas)
 */
export const registrarMontosJugados = (montos: number[]): void => {
  montos.forEach(monto => registrarMontoJugado(monto));
};

/**
 * Limpia todos los valores guardados
 */
export const limpiarValoresJugados = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
