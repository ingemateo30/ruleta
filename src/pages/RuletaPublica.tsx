import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Timer, Trophy, Clock, Loader2, Calendar, Search, HelpCircle, CalendarOff } from "lucide-react";
import { apiClient } from "@/api/client";
import { getAnimalByNombre, animals as ANIMALS } from "@/constants/animals";
import logoLottoAnimal from "@/logo/LOGO LOTTO ANIMAL PNG.png";
import { format } from "date-fns";

interface ProximoSorteo {
  codigo: number;
  descripcion: string;
  hora: string;
  segundos_faltantes: number;
  es_manana?: boolean;
}

interface Resultado {
  codigo_animal: number;
  animal: string;
  horario: string;
  hora: string;
  color?: string;
}

interface HorarioConEstado {
  NUM: number;
  DESCRIPCION: string;
  HORA: string;
  CODIGOA?: number;
  ANIMAL?: string;
  COLOR?: string;
  estado: 'JUGADO' | 'PENDIENTE' | 'PROXIMO';
}

const RuletaPublica = () => {
  const [proximoSorteo, setProximoSorteo] = useState<ProximoSorteo | null>(null);
  const [ultimoResultado, setUltimoResultado] = useState<Resultado | null>(null);
  const [horarios, setHorarios] = useState<HorarioConEstado[]>([]);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animalAnimacion, setAnimalAnimacion] = useState<string>("");
  const [mostrarGanador, setMostrarGanador] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fechaFiltro, setFechaFiltro] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mostrarInterrogacion, setMostrarInterrogacion] = useState(false);
  const [modoPrueba, setModoPrueba] = useState(false);
  // Estado para día sin sorteo
  const [sinSorteoHoy, setSinSorteoHoy] = useState(false);
  const [motivoSinSorteo, setMotivoSinSorteo] = useState<string>("");
  const [sinSorteoFiltro, setSinSorteoFiltro] = useState(false);
  const [motivoSinSorteoFiltro, setMotivoSinSorteoFiltro] = useState<string>("");

  const animacionEnProgreso = useRef(false);
  const ultimoResultadoConocidoId = useRef<string | null>(null);
  const timerGanadorRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Calcula los segundos transcurridos desde la hora del sorteo.
   * Usa solo la hora (HH:MM:SS) comparada contra la hora local actual.
   */
  const calcularSegundosPasados = (horaStr: string): number => {
    if (!horaStr) return 0;
    const [hh, mm, ss] = horaStr.split(':').map(Number);
    const ahora = new Date();
    const horaSorteo = new Date();
    horaSorteo.setHours(hh, mm || 0, ss || 0, 0);
    const diff = Math.floor((ahora.getTime() - horaSorteo.getTime()) / 1000);
    return diff;
  };

  /**
   * Inicia el temporizador de 15 minutos para mostrar/ocultar el ganador.
   * Empieza desde los segundos ya transcurridos.
   */
  const iniciarTimerGanador = useCallback((resultado: Resultado) => {
    if (timerGanadorRef.current) {
      clearInterval(timerGanadorRef.current);
      timerGanadorRef.current = null;
    }

    const segundosPasados = calcularSegundosPasados(resultado.hora);

    if (segundosPasados >= 900) {
      setMostrarInterrogacion(true);
      setMostrarGanador(false);
      return;
    }

    setMostrarGanador(true);
    setMostrarInterrogacion(false);

    let contador = segundosPasados;
    timerGanadorRef.current = setInterval(() => {
      contador += 1;
      if (contador >= 900) {
        setMostrarInterrogacion(true);
        setMostrarGanador(false);
        if (timerGanadorRef.current) {
          clearInterval(timerGanadorRef.current);
          timerGanadorRef.current = null;
        }
      }
    }, 1000);
  }, []);

  // Cargar datos iniciales y actualizar cada 10 segundos
  const cargarDatos = useCallback(async (fechaParam?: string) => {
    try {
      const fechaConsulta = fechaParam || fechaFiltro;
      const [proximoRes, horariosRes] = await Promise.all([
        apiClient.get('/ruleta-publica.php/proximo-sorteo'),
        apiClient.get('/ruleta-publica.php/horarios', { params: { fecha: fechaConsulta } })
      ]);

      // Verificar si hoy es día sin sorteo
      if (proximoRes.sin_sorteos) {
        setSinSorteoHoy(true);
        setMotivoSinSorteo(proximoRes.motivo || 'No hay sorteos programados para hoy');
        setProximoSorteo(null);
        setUltimoResultado(null);
        setSegundosRestantes(0);
      } else if (proximoRes.success && proximoRes.data) {
        setSinSorteoHoy(false);
        setMotivoSinSorteo('');
        const nuevoSorteo = proximoRes.data.proximo_sorteo;
        setProximoSorteo(nuevoSorteo);

        if (!animacionEnProgreso.current) {
          const nuevoSegundos = nuevoSorteo?.segundos_faltantes || 0;
          setSegundosRestantes(nuevoSegundos);
        }

        if (proximoRes.data.ultimo_resultado) {
          const nuevoResultado: Resultado = proximoRes.data.ultimo_resultado;
          // Identificador único por animal + hora de sorteo
          const nuevoId = `${nuevoResultado.animal}-${nuevoResultado.hora}`;

          if (!animacionEnProgreso.current) {
            // Si es un resultado diferente al último conocido, disparar animación
            if (nuevoId !== ultimoResultadoConocidoId.current) {
              ultimoResultadoConocidoId.current = nuevoId;
              // Solo animar si hay un resultado nuevo y la animación no está en curso
              iniciarAnimacionConGanador(nuevoResultado);
            } else {
              // Mismo resultado, solo actualizar estado del timer si no está animando
              setUltimoResultado(nuevoResultado);
            }
          }
        } else {
          // Sin resultado: mostrar interrogación
          if (!animacionEnProgreso.current) {
            setMostrarInterrogacion(true);
            setMostrarGanador(false);
          }
        }
      }

      // Verificar si la fecha filtrada es día sin sorteo
      if (horariosRes.sin_sorteos) {
        setSinSorteoFiltro(true);
        setMotivoSinSorteoFiltro(horariosRes.motivo || 'No hay sorteos en esta fecha');
        setHorarios([]);
      } else if (horariosRes.success && horariosRes.data) {
        setSinSorteoFiltro(false);
        setMotivoSinSorteoFiltro('');
        setHorarios(horariosRes.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fechaFiltro, iniciarTimerGanador]);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(() => cargarDatos(), 10000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  // Activar modo de prueba con Ctrl + Shift + T
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        setModoPrueba(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Contador regresivo sincronizado con servidor
  useEffect(() => {
    if (segundosRestantes <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSegundosRestantes(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [segundosRestantes]);

  // Cleanup del timer al desmontar
  useEffect(() => {
    return () => {
      if (timerGanadorRef.current) {
        clearInterval(timerGanadorRef.current);
      }
    };
  }, []);

  // Función para probar la animación con un ganador aleatorio
  const probarAnimacion = () => {
    if (animacionEnProgreso.current) return;
    const animalAleatorio = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const ganadorPrueba: Resultado = {
      codigo_animal: parseInt(animalAleatorio.codigo),
      animal: animalAleatorio.nombre,
      horario: 'PRUEBA',
      hora: '00:00:00'
    };
    iniciarAnimacionConGanador(ganadorPrueba);
  };

  // Animacion de la ruleta con un ganador específico
  const iniciarAnimacionConGanador = (ganadorReal: Resultado | null) => {
    if (animacionEnProgreso.current) return;

    animacionEnProgreso.current = true;
    setIsAnimating(true);
    setMostrarGanador(false);
    setMostrarInterrogacion(false);

    const animalesRuleta = [...ANIMALS];

    const indiceGanador = ganadorReal
      ? animalesRuleta.findIndex(a => a.nombre.toLowerCase() === ganadorReal!.animal.toLowerCase())
      : 0;

    const vueltasCompletas = 3;
    const totalAnimales = animalesRuleta.length;
    // Si no encuentra el animal, aterrizar en el primero de la siguiente vuelta
    const indiceDestino = indiceGanador >= 0 ? indiceGanador : 0;
    const animalesARecorrer = (vueltasCompletas * totalAnimales) + indiceDestino;

    let animalActual = 0;
    let velocidad = 50;
    const velocidadFinal = 300;
    const aceleracion = 1.02;

    const animarSiguiente = () => {
      if (animalActual >= animalesARecorrer) {
        // Animación completada
        if (ganadorReal) {
          setAnimalAnimacion(ganadorReal.animal);
          setUltimoResultado(ganadorReal);

          setTimeout(() => {
            setIsAnimating(false);
            animacionEnProgreso.current = false;
            // Iniciar timer de 15 minutos para el ganador
            iniciarTimerGanador(ganadorReal);
          }, 300);
        } else {
          setIsAnimating(false);
          setMostrarInterrogacion(true);
          setTimeout(() => {
            animacionEnProgreso.current = false;
          }, 300);
        }
        return;
      }

      const indice = animalActual % totalAnimales;
      setAnimalAnimacion(animalesRuleta[indice].nombre);

      const progreso = animalActual / animalesARecorrer;
      if (progreso > 0.7) {
        velocidad = Math.min(velocidad * aceleracion, velocidadFinal);
      } else if (progreso > 0.5) {
        velocidad = Math.min(velocidad * 1.01, velocidadFinal * 0.7);
      }

      animalActual++;
      setTimeout(animarSiguiente, velocidad);
    };

    animarSiguiente();
  };

  const formatTiempo = (segundos: number): string => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;

    if (horas > 0) {
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  const formatHora = (hora: string): string => {
    if (!hora) return "";
    const partes = hora.split(":");
    if (partes.length < 2) return hora;
    const h = parseInt(partes[0], 10);
    const minutos = partes[1];
    const ampm = h >= 12 ? "PM" : "AM";
    const horas12 = h % 12 || 12;
    return `${horas12}:${minutos} ${ampm}`;
  };

  const handleBuscarFecha = () => {
    cargarDatos(fechaFiltro);
  };

  // Verificar si se puede mostrar el resultado (con buffer post-sorteo de 1 minuto)
  const puedeVerResultado = (horario: HorarioConEstado): boolean => {
    if (horario.estado !== 'JUGADO') return false;

    const now = new Date();
    const hoy = format(now, 'yyyy-MM-dd');

    if (fechaFiltro !== hoy) return true;

    const [horaH, minH, segH] = (horario.HORA || '00:00:00').split(':').map(Number);
    const horaSorteo = new Date();
    horaSorteo.setHours(horaH, minH || 0, segH || 0, 0);
    horaSorteo.setMinutes(horaSorteo.getMinutes() + 1);

    return now >= horaSorteo;
  };

  const animalEnAnimacion = getAnimalByNombre(animalAnimacion);
  const animalGanador = ultimoResultado ? getAnimalByNombre(ultimoResultado.animal) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header con logo grande y titulo */}
        <div className="text-center py-6">
          <img
            src={logoLottoAnimal}
            alt="Lotto Animal"
            className="h-32 sm:h-40 mx-auto mb-4"
          />
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Lotto Animal
          </h1>
          <p className="text-xl sm:text-2xl text-yellow-400 font-semibold mt-1">
            Una hora para ganar
          </p>
          {modoPrueba && (
            <div className="mt-4 space-y-2">
              <Badge className="bg-orange-500 text-white">
                Modo de Prueba Activado (Ctrl+Shift+T para desactivar)
              </Badge>
              <div>
                <Button
                  onClick={probarAnimacion}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isAnimating}
                >
                  🎯 Probar Animación de Ruleta
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Banner: Día sin sorteos */}
        {sinSorteoHoy && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-orange-500/20 border-2 border-orange-400/50 p-6 text-center backdrop-blur-md"
          >
            <CalendarOff className="h-12 w-12 text-orange-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-1">Hoy no hay sorteos</h2>
            <p className="text-orange-200 text-base">{motivoSinSorteo}</p>
          </motion.div>
        )}

        {/* Seccion principal - Reloj y Ultimo ganador */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contador regresivo parametrizado */}
          <Card className="bg-black/30 backdrop-blur-md border-white/10">
            <CardHeader className="text-center">
              <CardTitle className="text-white flex items-center justify-center gap-2 text-xl">
                <Timer className="h-6 w-6 text-yellow-400" />
                {sinSorteoHoy ? 'Sin Sorteos Hoy' : 'Proximo Sorteo'}
              </CardTitle>
              {!sinSorteoHoy && proximoSorteo && (
                <>
                  <p className="text-white/90 text-base font-semibold">
                    {proximoSorteo.descripcion}
                  </p>
                  <p className="text-yellow-400 text-lg font-bold">
                    {formatHora(proximoSorteo.hora)}
                  </p>
                  {proximoSorteo.es_manana && (
                    <p className="text-white/50 text-xs">(Manana)</p>
                  )}
                </>
              )}
            </CardHeader>
            <CardContent className="text-center">
              {sinSorteoHoy ? (
                <div className="py-8">
                  <CalendarOff className="h-16 w-16 text-orange-400 mx-auto mb-3 opacity-70" />
                  <p className="text-white/60 text-sm">No hay sorteos programados para hoy</p>
                </div>
              ) : (
                <>
                  <div className="text-7xl font-bold text-white font-mono tracking-wider mb-4">
                    {formatTiempo(segundosRestantes)}
                  </div>
                  <p className="text-white/60 text-sm">
                    {segundosRestantes > 0 ? 'Tiempo restante para el sorteo' : isAnimating ? 'Sorteo en curso...' : 'Esperando proximo sorteo'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Ganador */}
          <Card className="bg-black/30 backdrop-blur-md border-white/10 overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
              <AnimatePresence mode="wait">
                {isAnimating ? (
                  <motion.div
                    key="animacion"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="text-center"
                  >
                    <motion.div className="relative">
                      {animalEnAnimacion && (
                        <img
                          src={animalEnAnimacion.imagen}
                          alt="Animacion"
                          className="w-48 h-48 object-contain mx-auto"
                        />
                      )}
                    </motion.div>
                    <p className="text-white text-2xl font-bold mt-4 animate-pulse">
                      Seleccionando ganador...
                    </p>
                  </motion.div>
                ) : mostrarGanador && ultimoResultado ? (
                  <motion.div
                    key="ganador"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="text-center"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {animalGanador && (
                          <img
                            src={animalGanador.imagen}
                            alt={ultimoResultado.animal}
                            className="w-48 h-48 object-contain mx-auto"
                          />
                        )}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute -top-4 -right-4"
                      >
                        <Trophy className="h-12 w-12 text-yellow-400" />
                      </motion.div>
                    </div>
                    <h2 className="text-4xl font-bold text-white mt-4">
                      {ultimoResultado.animal}
                    </h2>
                    <Badge className="mt-2 text-lg px-4 py-1 bg-yellow-500 text-black">
                      #{animalGanador?.codigo || '??'}
                    </Badge>
                    <p className="text-white/70 mt-2">
                      Sorteo: {ultimoResultado.horario}
                    </p>
                  </motion.div>
                ) : mostrarInterrogacion ? (
                  <motion.div
                    key="interrogacion"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [-5, 5, -5]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="relative"
                    >
                      <div className="w-48 h-48 mx-auto flex items-center justify-center bg-red-500/20 rounded-full border-4 border-red-500">
                        <HelpCircle className="h-32 w-32 text-red-500" strokeWidth={2.5} />
                      </div>
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mt-6">
                      ¿Quién será el próximo ganador?
                    </h2>
                    <p className="text-white/60 mt-2">
                      Esperando próximo sorteo...
                    </p>
                  </motion.div>
                ) : (
                  <div className="text-center text-white/60">
                    <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Esperando primer sorteo del día</p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Filtro por fecha */}
        <Card className="bg-black/30 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Buscar Resultados por Fecha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="fecha" className="text-white/70 mb-2 block">
                  Seleccionar Fecha
                </Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fechaFiltro}
                  onChange={(e) => setFechaFiltro(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <Button
                onClick={handleBuscarFecha}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Horarios del dia */}
        <Card className="bg-black/30 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              Sorteos del Dia - {format(new Date(fechaFiltro + 'T00:00:00'), 'dd/MM/yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sinSorteoFiltro ? (
              <div className="text-center py-10">
                <CalendarOff className="h-14 w-14 text-orange-400 mx-auto mb-3 opacity-80" />
                <p className="text-white text-lg font-semibold">No hay sorteos para esta fecha</p>
                <p className="text-white/50 text-sm mt-1">{motivoSinSorteoFiltro}</p>
              </div>
            ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {horarios.map((horario) => {
                const animalData = horario.ANIMAL ? getAnimalByNombre(horario.ANIMAL) : null;
                const mostrarResultado = puedeVerResultado(horario);

                return (
                  <div
                    key={horario.NUM}
                    className={`p-3 rounded-lg text-center transition-all ${
                      horario.estado === 'JUGADO'
                        ? 'bg-green-500/20 border border-green-500/30'
                        : horario.estado === 'PENDIENTE'
                          ? 'bg-yellow-500/20 border border-yellow-500/30'
                          : 'bg-blue-500/20 border border-blue-500/30'
                    }`}
                  >
                    <Badge
                      className={`mb-2 ${
                        horario.estado === 'JUGADO'
                          ? 'bg-green-500'
                          : horario.estado === 'PENDIENTE'
                            ? 'bg-yellow-500 text-black'
                            : 'bg-blue-500'
                      }`}
                    >
                      {formatHora(horario.HORA)}
                    </Badge>
                    {mostrarResultado && animalData ? (
                      <>
                        <img
                          src={animalData.imagen}
                          alt={horario.ANIMAL || ''}
                          className="w-12 h-12 mx-auto my-1 object-contain"
                        />
                        <p className="text-white text-xs font-medium truncate">
                          {horario.ANIMAL}
                        </p>
                        <p className="text-white/60 text-[10px]">
                          #{animalData.codigo}
                        </p>
                      </>
                    ) : (
                      <div className="py-4">
                        <p className="text-white/60 text-xs">
                          {horario.estado === 'PENDIENTE'
                            ? 'Por jugar'
                            : horario.estado === 'JUGADO' && !mostrarResultado
                              ? 'Esperando resultado'
                              : 'Proximo'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-white/40 text-sm">
            Lotto Animal - Sorteos automaticos cada hora
          </p>
        </div>
      </div>
    </div>
  );
};

export default RuletaPublica;
