import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Play, Trash2, Printer, ShoppingCart, Search, X, Loader2 } from "lucide-react";
import { realizarJuegoService, authService } from "@/api";
import type { AnimalAPI, HorarioAPI } from "@/api";
import { animals, getAnimalByCodigo, getAnimalByNumero, getAnimalByNombre, type Animal } from "@/constants/animals";
import { PlayIcon } from "@/components/ui/play-icon";
import { obtenerValoresMasJugados, registrarMontosJugados } from "@/utils/valores-jugados";
import ReciboCaja from "@/components/ReciboCaja";

interface AnimalMapeado extends Animal {
  codigoJuego: string;
  horarioData?: HorarioAPI;
}

interface HorarioMapeado {
  id: string;
  label: string;
  data: HorarioAPI;
}

interface Jugada {
  id: string;
  animal: AnimalMapeado;
  horario: HorarioMapeado;
  monto: number;
}

const RealizarJugadas = () => {
  const [animalesAPI, setAnimalesAPI] = useState<AnimalMapeado[]>([]);
  const [horariosAPI, setHorariosAPI] = useState<HorarioMapeado[]>([]);
  const [parametros, setParametros] = useState<{ minimo: number; maximo: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalMapeado | null>(null);
  const [selectedHorario, setSelectedHorario] = useState("");
  const [monto, setMonto] = useState("");
  const [jugadas, setJugadas] = useState<Jugada[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [valoresRapidos, setValoresRapidos] = useState<number[]>([]);
  const [mostrarRecibo, setMostrarRecibo] = useState(false);
  const [horaActual, setHoraActual] = useState(new Date());
  const [datosRecibo, setDatosRecibo] = useState<{
    radicado: string;
    fecha: string;
    hora: string;
    sucursal: string;
    jugadas: Array<{
      codigo: string;
      animal: string;
      valor: number;
      horaJuego: string;
    }>;
    valorTotal: number;
  } | null>(null);

  // Cargar valores rápidos al inicio
  useEffect(() => {
    const valores = obtenerValoresMasJugados();
    setValoresRapidos(valores);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraActual(new Date());
    }, 60000); // Revisar cada 60 segundos
    return () => clearInterval(timer);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Cargar animales
        const animalesRes = await realizarJuegoService.obtenerAnimales();
        if (animalesRes.success && animalesRes.data) {
          const animalesMapeados = animalesRes.data
            .map((animalAPI: AnimalAPI) => {
              // Validar que el animal tenga código de juego
              if (!animalAPI.CODIGOJUEGO || animalAPI.CODIGOJUEGO.trim() === '') {
                console.warn(`Animal sin código de juego: ${animalAPI.VALOR} (NUM: ${animalAPI.NUM})`);
                return null;
              }

              const codigoJuego = animalAPI.CODIGOJUEGO.trim();

              // Buscar el animal local por CÓDIGO primero (más preciso), luego por nombre
              const animalLocal = getAnimalByCodigo(codigoJuego) ||
                getAnimalByNombre(animalAPI.VALOR);

              return {
                numero: animalAPI.NUM,
                codigo: codigoJuego, // Agregamos este campo para que coincida con la interfaz Animal
                nombre: animalAPI.VALOR,
                imagen: animalLocal?.imagen || "",
                color: animalAPI.COLOR,
                codigoJuego: codigoJuego,
              } as AnimalMapeado;
            })
            .filter((animal): animal is AnimalMapeado => animal !== null); // Filtrar nulos

          setAnimalesAPI(animalesMapeados);

          if (animalesMapeados.length === 0) {
            toast({
              title: "Advertencia",
              description: "No se encontraron animales válidos con código de juego",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Error",
            description: animalesRes.error || "Error al cargar animales",
            variant: "destructive",
          });
        }

        // Cargar horarios
        const horariosRes = await realizarJuegoService.obtenerHorarios();
        if (horariosRes.success && horariosRes.data) {
          const horariosMapeados = horariosRes.data.map((horarioAPI: HorarioAPI) => ({
            id: horarioAPI.NUM.toString(),
            label: `${horarioAPI.DESCRIPCION} - ${horarioAPI.HORA_FORMATEADA || horarioAPI.HORA}`,
            data: horarioAPI,
          }));
          setHorariosAPI(horariosMapeados);
        } else {
          toast({
            title: "Error",
            description: horariosRes.error || "Error al cargar horarios",
            variant: "destructive",
          });
        }

        // Cargar parámetros
        const parametrosRes = await realizarJuegoService.obtenerParametros();
        if (parametrosRes.success && parametrosRes.data) {
          setParametros(parametrosRes.data);
        } else {
          toast({
            title: "Error",
            description: parametrosRes.error || "Error al cargar parámetros",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al cargar datos del servidor",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const handleAddJugada = () => {
    if (!selectedAnimal || !selectedHorario || !monto) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      });
      return;
    }

    // Validar que el animal tenga código de juego
    if (!selectedAnimal.codigoJuego || selectedAnimal.codigoJuego.trim() === '') {
      toast({
        title: "Error",
        description: `El animal "${selectedAnimal.nombre}" no tiene código de juego válido`,
        variant: "destructive",
      });
      console.error('Animal sin código de juego:', selectedAnimal);
      return;
    }

    const montoNum = parseInt(monto.replace(/\./g, ''));

    // Validar que sea múltiplo de 1000
    if (montoNum % 1000 !== 0) {
      toast({
        title: "Error",
        description: "El monto debe ser múltiplo de $1.000",
        variant: "destructive",
      });
      return;
    }

    // Validar monto con parámetros
    if (parametros) {
      if (montoNum < parametros.minimo) {
        toast({
          title: "Error",
          description: `El monto mínimo es $${parametros.minimo.toLocaleString('es-CO')}`,
          variant: "destructive",
        });
        return;
      }
      if (montoNum > parametros.maximo) {
        toast({
          title: "Error",
          description: `El monto máximo es $${parametros.maximo.toLocaleString('es-CO')}`,
          variant: "destructive",
        });
        return;
      }
    }

    const horarioSeleccionado = horariosAPI.find(h => h.id === selectedHorario);
    if (!horarioSeleccionado) {
      toast({
        title: "Error",
        description: "Horario no válido",
        variant: "destructive",
      });
      return;
    }

    const nuevaJugada: Jugada = {
      id: `JUG-${Date.now()}`,
      animal: selectedAnimal,
      horario: horarioSeleccionado,
      monto: montoNum,
    };

    setJugadas([...jugadas, nuevaJugada]);
    setSelectedAnimal(null);
    setSelectedHorario("");
    setMonto("");

    toast({
      title: "Jugada agregada",
      description: `${selectedAnimal.nombre} - $${montoNum.toLocaleString('es-CO')}`,
    });
  };

  const handleRemoveJugada = (id: string) => {
    setJugadas(jugadas.filter((j) => j.id !== id));
  };

  const handleConfirmar = async () => {
    if (jugadas.length === 0) return;

    setGuardando(true);
    try {
      // Obtener consecutivo
      const consecutivoRes = await realizarJuegoService.obtenerConsecutivo();
      if (!consecutivoRes.success || !consecutivoRes.data) {
        toast({
          title: "Error",
          description: consecutivoRes.error || "Error al obtener consecutivo",
          variant: "destructive",
        });
        setGuardando(false);
        return;
      }

      const radicado = consecutivoRes.data.radicado;
      const ahora = new Date();
      // Usar fecha local en formato YYYY-MM-DD (no UTC)
      const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
      const hora = ahora.toTimeString().split(' ')[0]; // HH:MM:SS

      // Obtener código de sucursal del usuario logueado
      const usuarioActual = authService.getCurrentUser();
      const codigoSucursal = usuarioActual?.codigoSucursal || usuarioActual?.codBodega;
      if (!usuarioActual || !codigoSucursal) {
        toast({
          title: "Error",
          description: "No se pudo obtener la información de la sucursal. Por favor, inicie sesión nuevamente.",
          variant: "destructive",
        });
        setGuardando(false);
        return;
      }

      // Preparar datos del juego
      const juegoData = {
        radicado,
        fecha,
        hora,
        sucursal: codigoSucursal.toString(), // Código de sucursal del usuario
        usuario: usuarioActual?.nick || usuarioActual?.nombre || 'Sistema', // Usuario que realiza la jugada
        total: total,
        juegos: jugadas.map(jugada => {
          // Validar que el código de animal exista
          if (!jugada.animal.codigoJuego) {
            console.error('Jugada sin código de animal:', jugada);
            throw new Error(`Jugada sin código de animal: ${jugada.animal.nombre}`);
          }

          return {
            codigoAnimal: jugada.animal.codigoJuego,
            nombreAnimal: jugada.animal.nombre,
            codigoHorario: jugada.horario.data.NUM,
            horaJuego: jugada.horario.data.HORA_FORMATEADA || jugada.horario.data.HORA,
            descripcionHorario: jugada.horario.data.DESCRIPCION,
            valor: jugada.monto,
          };
        }),
      };

      // Debug: Ver qué se está enviando
      console.log('Datos del juego a enviar:', JSON.stringify(juegoData, null, 2));

      // Guardar juego
      const guardarRes = await realizarJuegoService.guardarJuego(juegoData);

      if (guardarRes.success && guardarRes.data) {
        // Registrar los montos jugados para valores rápidos
        const montos = jugadas.map(j => j.monto);
        registrarMontosJugados(montos);

        // Actualizar valores rápidos
        const nuevosValores = obtenerValoresMasJugados();
        setValoresRapidos(nuevosValores);

        // Usar los datos que devuelve el API para el recibo
        const datosReciboData = {
          radicado: guardarRes.data.radicado,
          fecha: guardarRes.data.fecha,
          hora: guardarRes.data.hora,
          sucursal: guardarRes.data.nombreSucursal || usuarioActual.sucursal || "Sucursal",
          jugadas: guardarRes.data.juegos.map(juego => ({
            codigo: juego.codigoAnimal,
            animal: juego.nombreAnimal,
            valor: juego.valor,
            horaJuego: juego.horaJuego,
          })),
          valorTotal: guardarRes.data.total,
        };

        setDatosRecibo(datosReciboData);
        setMostrarRecibo(true);

        toast({
          title: "¡Ticket emitido!",
          description: guardarRes.message || `Se registraron ${jugadas.length} jugadas correctamente. Radicado: ${radicado}`,
        });
        setJugadas([]);
      } else {
        const errorMsg = guardarRes.details
          ? guardarRes.details.join(', ')
          : guardarRes.error || "Error al guardar el juego";
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar el juego",
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  const total = jugadas.reduce((acc, j) => acc + j.monto, 0);

  // Filtrar animales según el término de búsqueda
  const filteredAnimals = animalesAPI.filter((animal) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    // Buscar por código de juego exacto (string)
    const codigoJuego = animal.codigoJuego.toLowerCase();

    // Buscar por nombre
    const nombreLower = animal.nombre.toLowerCase();

    return (
      codigoJuego.includes(search) ||
      codigoJuego === search || // Búsqueda exacta
      nombreLower.includes(search) ||
      nombreLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search) // Búsqueda sin acentos
    );
  });

  const isHorarioVencido = (horaStr: string) => {
    if (!horaStr) return false;

    try {
      const fechaHorario = new Date();
      // Asumimos que horaStr viene en formato "HH:mm" o "HH:mm:ss" (ej: "09:00:00" o "09:00")
      // Si tu API devuelve formato 12h ("09:00 PM"), necesitarás una conversión extra.
      // Esta lógica básica funciona para formato 24h estándar de SQL:

      const [horas, minutos] = horaStr.split(':').map(Number);

      fechaHorario.setHours(horas, minutos || 0, 0, 0);

      // Si la hora actual es mayor a la hora del sorteo, está vencido
      return horaActual >= fechaHorario;
    } catch (e) {
      console.error("Error al parsear hora", horaStr);
      return false;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <PlayIcon size={32} className="text-primary" />
            Realizar Jugadas
          </h1>
          <p className="text-muted-foreground">
            Seleccione el animal, horario y monto para registrar una apuesta
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selector de Animal */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Seleccione un Animal</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {filteredAnimals.length} de {animalesAPI.length}
                </Badge>
              </div>
              {/* Buscador */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o código (ej: león, 0, 00, 05)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredAnimals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No se encontraron animales con "{searchTerm}"</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => setSearchTerm("")}
                  >
                    Limpiar búsqueda
                  </Button>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto pr-2">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {filteredAnimals.map((animal) => (
                      <Button
                        key={`${animal.codigoJuego}-${animal.nombre}`}
                        variant={selectedAnimal?.codigoJuego === animal.codigoJuego ? "default" : "outline"}
                        className="h-auto flex-col py-3 gap-1 hover:scale-105 transition-transform"
                        onClick={() => setSelectedAnimal(animal)}
                      >
                        {animal.imagen && (
                          <img
                            src={animal.imagen}
                            alt={animal.nombre}
                            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                          />
                        )}
                        <span className="text-xs font-bold">#{animal.codigoJuego}</span>
                        <span className="text-[10px] leading-tight text-center">{animal.nombre}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulario */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles de Apuesta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAnimal && (
                <div className="bg-accent/50 rounded-lg p-4 text-center">
                  {selectedAnimal.imagen && (
                    <img
                      src={selectedAnimal.imagen}
                      alt={selectedAnimal.nombre}
                      className="w-20 h-20 mx-auto object-contain"
                    />
                  )}
                  <p className="font-bold text-foreground mt-2">
                    #{selectedAnimal.codigoJuego} - {selectedAnimal.nombre}
                  </p>
                  {parametros && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Rango: ${parametros.minimo.toLocaleString('es-CO')} - ${parametros.maximo.toLocaleString('es-CO')}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Horario</Label>
                <Select value={selectedHorario} onValueChange={setSelectedHorario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione horario" />
                  </SelectTrigger>
                  <SelectContent>
                    {horariosAPI.map((h) => {
                      // 4. APLICACIÓN: Verificamos si este horario específico está vencido
                      const vencido = isHorarioVencido(h.data.HORA);

                      return (
                        <SelectItem
                          key={h.id}
                          value={h.id}
                          disabled={vencido} // Bloquea la selección
                          className={vencido ? "text-muted-foreground opacity-50" : ""}
                        >
                          {h.label} {vencido ? '(Cerrado)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Monto ($)</Label>
                <Input
                  type="text"
                  placeholder="Ej: 5.000"
                  value={monto}
                  onChange={(e) => {
                    // Permitir solo números y puntos
                    let valor = e.target.value.replace(/[^\d]/g, '');

                    // Formatear con puntos de miles
                    if (valor) {
                      valor = parseInt(valor).toLocaleString('es-CO');
                    }

                    setMonto(valor);
                  }}
                  onBlur={(e) => {
                    // Al salir del campo, redondear a múltiplo de 1000
                    const valorNumerico = parseInt(e.target.value.replace(/\./g, ''));
                    if (valorNumerico && valorNumerico > 0) {
                      const redondeado = Math.round(valorNumerico / 1000) * 1000;
                      setMonto(redondeado.toLocaleString('es-CO'));
                    }
                  }}
                />
                {valoresRapidos.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs text-muted-foreground">Valores Rápidos</Label>
                    <div className="flex flex-wrap gap-2">
                      {valoresRapidos.map((valor) => (
                        <Button
                          key={valor}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                         onClick={() => setMonto(valor.toLocaleString('es-CO'))}
                        >
                          ${valor.toLocaleString('es-CO')}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={handleAddJugada}>
                Agregar Jugada
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Jugadas */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Jugadas del Ticket
            </CardTitle>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Total: ${total.toLocaleString('es-CO')}
            </Badge>
          </CardHeader>
          <CardContent>
            {jugadas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay jugadas agregadas. Seleccione un animal para comenzar.
              </p>
            ) : (
              <div className="space-y-3">
                {jugadas.map((jugada) => (
                  <div
                    key={jugada.id}
                    className="flex items-center justify-between bg-accent/30 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={jugada.animal.imagen}
                        alt={jugada.animal.nombre}
                        className="w-12 h-12 object-contain"
                      />
                      <div>
                        <p className="font-bold text-foreground">
                          #{jugada.animal.codigoJuego} - {jugada.animal.nombre}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Horario: {jugada.horario.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg text-primary">
                        ${jugada.monto.toLocaleString('es-CO')}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveJugada(jugada.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {jugadas.length > 0 && (
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    const ahora = new Date();
                    const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
                    const hora = ahora.toTimeString().split(' ')[0];
                    const usuarioActual = authService.getCurrentUser();
                    setDatosRecibo({
                      radicado: "VISTA PREVIA",
                      fecha,
                      hora,
                      sucursal: usuarioActual?.sucursal || "Sucursal",
                      jugadas: jugadas.map(j => ({
                        codigo: j.animal.codigoJuego,
                        animal: j.animal.nombre,
                        valor: j.monto,
                        horaJuego: j.horario.data.HORA_FORMATEADA || j.horario.data.HORA,
                      })),
                      valorTotal: total,
                    });
                    setMostrarRecibo(true);
                  }}
                >
                  <Printer className="h-4 w-4" />
                  Vista Previa
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleConfirmar}
                  disabled={guardando}
                >
                  {guardando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Confirmar y Emitir Ticket
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Recibo de Caja */}
      {datosRecibo && (
        <ReciboCaja
          open={mostrarRecibo}
          onClose={() => {
            setMostrarRecibo(false);
            setDatosRecibo(null);
          }}
          radicado={datosRecibo.radicado}
          fecha={datosRecibo.fecha}
          hora={datosRecibo.hora}
          sucursal={datosRecibo.sucursal}
          jugadas={datosRecibo.jugadas}
          valorTotal={datosRecibo.valorTotal}
        />
      )}
    </DashboardLayout>
  );
};

export default RealizarJugadas;