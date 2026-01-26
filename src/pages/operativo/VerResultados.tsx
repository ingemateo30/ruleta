import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Trophy, Calendar, Loader2, RefreshCw } from "lucide-react";
import { getAnimalByNumero } from "@/constants/animals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";

interface Sorteo {
  hora: string;
  animal: string;
  numero: number;
  color?: string;
  codigoHorario?: number;
  descripcionHorario?: string;
}

interface ResultadoDia {
  fecha: string;
  sorteos: Sorteo[];
}

const VerResultados = () => {
  const [resultados, setResultados] = useState<ResultadoDia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    cargarResultados();
  }, []);

  const cargarResultados = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/ingresar-resultado.php/listar', {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        }
      });

      if (response.success && response.data) {
        setResultados(response.data);
      } else {
        setResultados([]);
      }
    } catch (error: any) {
      console.error('Error al cargar resultados:', error);
      toast.error('Error al cargar los resultados');
      setResultados([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFechaLabel = (fechaStr: string): string => {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const ayer = subDays(hoy, 1);

    if (fecha.getTime() === hoy.getTime()) {
      return "Hoy";
    } else if (fecha.getTime() === ayer.getTime()) {
      return "Ayer";
    } else {
      return format(fecha, "EEEE d 'de' MMMM", { locale: es });
    }
  };

  const formatHora = (hora: string): string => {
    if (!hora) return "";
    // Convertir HH:MM:SS a HH:MM AM/PM
    const partes = hora.split(":");
    if (partes.length < 2) return hora;
    const horas = parseInt(partes[0], 10);
    const minutos = partes[1];
    const ampm = horas >= 12 ? "PM" : "AM";
    const horas12 = horas % 12 || 12;
    return `${horas12}:${minutos} ${ampm}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Eye className="h-8 w-8 text-primary" />
            Resultados
          </h1>
          <p className="text-muted-foreground">
            Consulta los animales ganadores de los sorteos anteriores
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
              <div className="flex items-end md:col-span-2">
                <Button onClick={cargarResultados} disabled={isLoading} className="w-full md:w-auto">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Cargando...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Cargando resultados...</p>
              </div>
            </CardContent>
          </Card>
        ) : resultados.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron resultados para el rango de fechas seleccionado</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          resultados.map((dia) => (
            <Card key={dia.fecha}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {formatFechaLabel(dia.fecha)}
                  <Badge variant="outline" className="ml-2">
                    {format(new Date(dia.fecha + 'T00:00:00'), 'dd/MM/yyyy')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {dia.sorteos.map((sorteo, index) => {
                    const animalData = getAnimalByNumero(sorteo.numero);
                    return (
                      <div
                        key={`${dia.fecha}-${sorteo.hora}-${index}`}
                        className="bg-accent/30 rounded-xl p-4 text-center hover:bg-accent/50 transition-colors"
                      >
                        <Badge variant="outline" className="mb-2">
                          {formatHora(sorteo.hora)}
                        </Badge>
                        {animalData && (
                          <img
                            src={animalData.imagen}
                            alt={sorteo.animal}
                            className="w-16 h-16 mx-auto my-2 object-contain"
                          />
                        )}
                        <p className="font-bold text-foreground">{sorteo.animal}</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Trophy className="h-3 w-3 text-chart-4" />
                          <span className="text-sm text-muted-foreground">
                            #{sorteo.numero?.toString().padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default VerResultados;
