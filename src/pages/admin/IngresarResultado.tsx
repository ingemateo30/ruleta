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
import { Trophy, Loader2, Search, X, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { ingresarResultadoService } from "@/api";
import type { AnimalResultado, HorarioResultado } from "@/api";
import { animals, getAnimalByNumero, getAnimalByNombre, type Animal } from "@/constants/animals";

interface AnimalMapeado extends Animal {
  codigoJuego: string;
}

const IngresarResultado = () => {
  const [animalesAPI, setAnimalesAPI] = useState<AnimalMapeado[]>([]);
  const [horariosAPI, setHorariosAPI] = useState<HorarioResultado[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalMapeado | null>(null);
  const [selectedHorario, setSelectedHorario] = useState("");
  const [fecha, setFecha] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Cargar animales
        const animalesRes = await ingresarResultadoService.obtenerAnimales();
        if (animalesRes.success && animalesRes.data) {
          const animalesMapeados = animalesRes.data
            .map((animalAPI: AnimalResultado) => {
              if (!animalAPI.CODIGOJUEGO || animalAPI.CODIGOJUEGO.trim() === '') {
                return null;
              }
              
              const animalLocal = getAnimalByNumero(animalAPI.NUM) || 
                                 getAnimalByNombre(animalAPI.VALOR);
              
              return {
                numero: animalAPI.NUM,
                nombre: animalAPI.VALOR,
                imagen: animalLocal?.imagen || "",
                color: animalAPI.COLOR,
                codigoJuego: animalAPI.CODIGOJUEGO.trim(),
              } as AnimalMapeado;
            })
            .filter((animal): animal is AnimalMapeado => animal !== null);
          
          setAnimalesAPI(animalesMapeados);
        } else {
          toast({
            title: "Error",
            description: animalesRes.error || "Error al cargar animales",
            variant: "destructive",
          });
        }

        // Cargar horarios
        const horariosRes = await ingresarResultadoService.obtenerHorarios();
        if (horariosRes.success && horariosRes.data) {
          setHorariosAPI(horariosRes.data);
        } else {
          toast({
            title: "Error",
            description: horariosRes.error || "Error al cargar horarios",
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

  // Establecer fecha actual por defecto (usando fecha local, no UTC)
  useEffect(() => {
    const now = new Date();
    const hoy = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setFecha(hoy);
  }, []);

  const handleGuardarResultado = async () => {
    if (!selectedAnimal || !selectedHorario || !fecha) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      });
      return;
    }

    const horarioSeleccionado = horariosAPI.find(h => h.NUM.toString() === selectedHorario);
    if (!horarioSeleccionado) {
      toast({
        title: "Error",
        description: "Horario no válido",
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);
    try {
      const response = await ingresarResultadoService.guardarResultado({
        codigoAnimal: selectedAnimal.codigoJuego,
        nombreAnimal: selectedAnimal.nombre,
        codigoHorario: horarioSeleccionado.NUM,
        descripcionHorario: horarioSeleccionado.DESCRIPCION,
        fecha: fecha,
      });

      if (response.success) {
        toast({
          title: "¡Resultado guardado!",
          description: response.message || "El resultado ha sido registrado correctamente",
        });
        // Limpiar selección
        setSelectedAnimal(null);
        setSelectedHorario("");
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al guardar el resultado",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar el resultado",
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  // Filtrar animales según el término de búsqueda
  const filteredAnimals = animalesAPI.filter((animal) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    
    const numeroStr = animal.numero.toString();
    const numeroPadded = numeroStr.padStart(2, "0");
    const codigoJuego = animal.codigoJuego.toLowerCase();
    const nombreLower = animal.nombre.toLowerCase();
    
    return (
      numeroStr.includes(search) ||
      numeroPadded.includes(search) ||
      codigoJuego.includes(search) ||
      nombreLower.includes(search) ||
      nombreLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search)
    );
  });

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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Ingresar Resultado
          </h1>
          <p className="text-muted-foreground">
            Seleccione el animal ganador, horario y fecha del sorteo
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selector de Animal */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Seleccione el Animal Ganador</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {filteredAnimals.length} de {animalesAPI.length}
                </Badge>
              </div>
              {/* Buscador */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o número (ej: león, 5, 05)..."
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
                        <span className="text-xs font-bold">#{animal.numero.toString().padStart(2, "0")}</span>
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
              <CardTitle>Detalles del Resultado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAnimal && (
                <div className="bg-accent/50 rounded-lg p-4 text-center border-2 border-yellow-500/30">
                  {selectedAnimal.imagen && (
                    <img 
                      src={selectedAnimal.imagen} 
                      alt={selectedAnimal.nombre}
                      className="w-20 h-20 mx-auto object-contain"
                    />
                  )}
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <p className="font-bold text-foreground">
                      #{selectedAnimal.numero.toString().padStart(2, "0")} - {selectedAnimal.nombre}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Animal Ganador</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha del Sorteo
                </Label>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horario
                </Label>
                <Select value={selectedHorario} onValueChange={setSelectedHorario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione horario" />
                  </SelectTrigger>
                  <SelectContent>
                    {horariosAPI.map((h) => (
                      <SelectItem key={h.NUM} value={h.NUM.toString()}>
                        {h.DESCRIPCION} - {h.HORA}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleGuardarResultado}
                disabled={guardando || !selectedAnimal || !selectedHorario || !fecha}
                size="lg"
              >
                {guardando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Guardar Resultado
                  </>
                )}
              </Button>

              {selectedAnimal && selectedHorario && fecha && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <p className="text-muted-foreground">Resumen:</p>
                  <p className="font-medium">
                    <span className="text-muted-foreground">Animal:</span> {selectedAnimal.nombre}
                  </p>
                  <p className="font-medium">
                    <span className="text-muted-foreground">Horario:</span>{" "}
                    {horariosAPI.find(h => h.NUM.toString() === selectedHorario)?.DESCRIPCION}
                  </p>
                  <p className="font-medium">
                    <span className="text-muted-foreground">Fecha:</span> {fecha}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IngresarResultado;
