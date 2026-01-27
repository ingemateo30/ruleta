import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Timer, Trophy, Clock, Loader2, Calendar, Search } from "lucide-react";
import { apiClient } from "@/api/client";
import { getAnimalByNumero, animals as ANIMALS } from "@/constants/animals";
import logoLottoAnimal from "@/logo/LOGO LOTTO ANIMAL PNG.png";
import { format } from "date-fns";
;

interface ProximoSorteo {
  codigo: number;
  descripcion: string;
  hora: string;
  segundos_faltantes: number;
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
  const [animalAnimacion, setAnimalAnimacion] = useState<number>(0);
  const [mostrarGanador, setMostrarGanador] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fechaFiltro, setFechaFiltro] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [ganadorPreCargado, setGanadorPreCargado] = useState<Resultado | null>(null);

  // Reference to track animation state
  const animacionEnProgreso = useRef(false);
  const [modoTest, setModoTest] = useState(false);

  const simularSorteo = () => {
    if (confirm('¿Deseas simular un sorteo de prueba?')) {
      iniciarAnimacion();
    }
  };

  // Cargar datos iniciales y actualizar cada 10 segundos
  const cargarDatos = useCallback(async (fechaParam?: string) => {
    try {
      const fechaConsulta = fechaParam || fechaFiltro;
      const [proximoRes, horariosRes] = await Promise.all([
        apiClient.get('/ruleta-publica.php/proximo-sorteo'),
        apiClient.get('/ruleta-publica.php/horarios', { params: { fecha: fechaConsulta } })
      ]);

      if (proximoRes.success && proximoRes.data) {
        setProximoSorteo(proximoRes.data.proximo_sorteo);

        // Only update countdown if not animating
        if (!animacionEnProgreso.current) {
          setSegundosRestantes(proximoRes.data.proximo_sorteo?.segundos_faltantes || 0);
        }

        if (proximoRes.data.ultimo_resultado) {
          // Don't update ultimo resultado during animation
          if (!animacionEnProgreso.current) {
            setUltimoResultado(proximoRes.data.ultimo_resultado);
          }
        }
      }

      if (horariosRes.success && horariosRes.data) {
        setHorarios(horariosRes.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fechaFiltro]);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(() => cargarDatos(), 10000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  // Contador regresivo
  useEffect(() => {
    if (segundosRestantes <= 0) return;

    const timer = setInterval(() => {
      setSegundosRestantes(prev => {
        if (prev <= 1) {
          // Iniciar animacion cuando llegue a 0
          if (!animacionEnProgreso.current) {
            iniciarAnimacion();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [segundosRestantes]);

  // Animacion de la ruleta - CORREGIDA para no mostrar animal incorrecto
  const iniciarAnimacion = async () => {
    if (animacionEnProgreso.current) return;

    animacionEnProgreso.current = true;
    setIsAnimating(true);
    setMostrarGanador(false);

    // PRIMERO: Cargar el ganador real del servidor antes de animar
    let ganadorReal: Resultado | null = null;

    // Esperar un momento para que el servidor tenga el resultado
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await apiClient.get('/ruleta-publica.php/proximo-sorteo');
      if (response.success && response.data?.ultimo_resultado) {
        ganadorReal = response.data.ultimo_resultado;
        setGanadorPreCargado(ganadorReal);
      }
    } catch (error) {
      console.error('Error al cargar ganador:', error);
    }

    // Si no hay ganador, intentar de nuevo
    if (!ganadorReal) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        const response = await apiClient.get('/ruleta-publica.php/proximo-sorteo');
        if (response.success && response.data?.ultimo_resultado) {
          ganadorReal = response.data.ultimo_resultado;
          setGanadorPreCargado(ganadorReal);
        }
      } catch (error) {
        console.error('Error al cargar ganador (retry):', error);
      }
    }

    // Crear array de animales EXCLUYENDO al ganador para la animacion
    const animalesParaAnimacion = ganadorReal
      ? ANIMALS.filter(a => a.numero !== ganadorReal!.codigo_animal)
      : ANIMALS;

    // Animacion de cambio rapido de animales
    const duracionAnimacion = 4000; // 4 segundos
    const intervaloCambio = 80; // Cambiar cada 80ms
    let tiempoTranscurrido = 0;

   const animacionInterval = setInterval(() => {
  tiempoTranscurrido += intervaloCambio;

  // Animal aleatorio (NUNCA el ganador)
  const randomIndex = Math.floor(Math.random() * animalesParaAnimacion.length);
  setAnimalAnimacion(animalesParaAnimacion[randomIndex].numero);

  // Entrar en fase lenta (último 30%)
  if (tiempoTranscurrido > duracionAnimacion * 0.7) {
    clearInterval(animacionInterval);

    let contadorLento = 0;
    const maxCambiosLentos = 5;

    const slowInterval = setInterval(() => {
      contadorLento++;

      const randomIndex = Math.floor(
        Math.random() * animalesParaAnimacion.length
      );
      setAnimalAnimacion(animalesParaAnimacion[randomIndex].numero);

      if (contadorLento >= maxCambiosLentos) {
        clearInterval(slowInterval);

        // Mostrar ganador real directamente
        if (ganadorReal) {
          setAnimalAnimacion(ganadorReal.codigo_animal);
          setUltimoResultado(ganadorReal);
        }

        // Pausa corta y luego celebración
        setTimeout(() => {
          setMostrarGanador(true);
          setIsAnimating(false);
          setGanadorPreCargado(null);

          // Recargar datos
          cargarDatos();

          // Reset del estado de animación
          setTimeout(() => {
            animacionEnProgreso.current = false;
          }, 3000);
        }, 200);
      }
    }, intervaloCambio);
  }
}, intervaloCambio);
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
    const horas = parseInt(partes[0], 10);
    const minutos = partes[1];
    const ampm = horas >= 12 ? "PM" : "AM";
    const horas12 = horas % 12 || 12;
    return `${horas12}:${minutos} ${ampm}`;
  };

  const handleBuscarFecha = () => {
    cargarDatos(fechaFiltro);
  };

  // Determinar si mostrar resultado basado en la hora
  const puedeVerResultado = (horario: HorarioConEstado): boolean => {
    if (horario.estado !== 'JUGADO') return false;

    const now = new Date();
    const hoy = format(now, 'yyyy-MM-dd');

    // Si es otro dia, siempre mostrar
    if (fechaFiltro !== hoy) return true;

    // Si es hoy, verificar que ya paso la hora del sorteo
    const horaActual = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    return horario.HORA <= horaActual;
  };

  const animalEnAnimacion = getAnimalByNumero(animalAnimacion);
  const animalGanador = ultimoResultado ? getAnimalByNumero(ultimoResultado.codigo_animal) : null;

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
        {/* Header con logo */}
        <div className="text-center py-4">
          <img
            src={logoLottoAnimal}
            alt="Lotto Animal"
            className="h-20 mx-auto mb-2"
          />
          <p className="text-white/70 text-lg">Sorteos en vivo</p>
        </div>

        {/* Seccion principal - Ruleta y Contador */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contador regresivo */}
          <Card className="bg-black/30 backdrop-blur-md border-white/10">
            <CardHeader className="text-center">
              <CardTitle className="text-white flex items-center justify-center gap-2 text-xl">
                <Timer className="h-6 w-6 text-yellow-400" />
                Proximo Sorteo
              </CardTitle>
              {proximoSorteo && (
                <>
                  <p className="text-white/90 text-base font-semibold">
                    {proximoSorteo.descripcion}
                  </p>
                  <p className="text-white/70 text-sm">
                    Hora: {formatHora(proximoSorteo.hora)}
                  </p>
                </>
              )}
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-7xl font-bold text-white font-mono tracking-wider mb-4">
                {formatTiempo(segundosRestantes)}
              </div>
              <p className="text-white/60 text-sm">
                {segundosRestantes > 0 ? 'Tiempo restante para el sorteo' : isAnimating ? 'Sorteo en curso...' : 'Esperando proximo sorteo'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/30 backdrop-blur-md border-yellow-400/50">
            <CardContent className="p-4">
              <Button
                onClick={simularSorteo}
                variant="outline"
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
                disabled={isAnimating}
              >
                🎰 SIMULAR SORTEO (TEST)
              </Button>
            </CardContent>
          </Card>
          {/* Ruleta / Animal */}
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
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                      className="relative"
                    >
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
                      #{ultimoResultado.codigo_animal.toString().padStart(2, '0')}
                    </Badge>
                    <p className="text-white/70 mt-2">
                      Sorteo: {ultimoResultado.horario}
                    </p>
                  </motion.div>
                ) : ultimoResultado ? (
                  <motion.div
                    key="ultimo"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <p className="text-white/60 text-sm mb-2">Ultimo Ganador</p>
                    {animalGanador && (
                      <img
                        src={animalGanador.imagen}
                        alt={ultimoResultado.animal}
                        className="w-40 h-40 object-contain mx-auto opacity-80"
                      />
                    )}
                    <h2 className="text-3xl font-bold text-white mt-2">
                      {ultimoResultado.animal}
                    </h2>
                    <Badge className="mt-2 bg-white/20 text-white">
                      #{ultimoResultado.codigo_animal.toString().padStart(2, '0')}
                    </Badge>
                    <p className="text-white/50 text-sm mt-2">
                      {ultimoResultado.horario} - {formatHora(ultimoResultado.hora)}
                    </p>
                  </motion.div>
                ) : (
                  <div className="text-center text-white/60">
                    <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Esperando primer sorteo del dia</p>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {horarios.map((horario) => {
                const animalData = horario.CODIGOA ? getAnimalByNumero(parseInt(horario.CODIGOA.toString())) : null;
                const mostrarResultado = puedeVerResultado(horario);

                return (
                  <div
                    key={horario.NUM}
                    className={`p-3 rounded-lg text-center transition-all ${horario.estado === 'JUGADO'
                      ? 'bg-green-500/20 border border-green-500/30'
                      : horario.estado === 'PENDIENTE'
                        ? 'bg-yellow-500/20 border border-yellow-500/30'
                        : 'bg-blue-500/20 border border-blue-500/30'
                      }`}
                  >
                    <Badge
                      className={`mb-2 ${horario.estado === 'JUGADO'
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
                          #{horario.CODIGOA?.toString().padStart(2, '0')}
                        </p>
                      </>
                    ) : (
                      <div className="py-4">
                        <p className="text-white/60 text-xs">
                          {horario.estado === 'PENDIENTE' ? 'Por jugar' :
                           horario.estado === 'JUGADO' && !mostrarResultado ? 'Esperando hora' : 'Proximo'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-white/40 text-sm">
            Lotto Animal - Sorteos automaticos cada horario
          </p>
        </div>
      </div>
    </div>
  );
};

export default RuletaPublica;
