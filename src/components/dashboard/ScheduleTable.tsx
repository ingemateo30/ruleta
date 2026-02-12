import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, CheckCircle, Timer, AlertCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/api/client";
import { useAuth } from "@/hooks/use-auth";

interface HorarioConEstado {
  NUM: number;
  DESCRIPCION: string;
  HORA: string;
  CODIGOA?: number;
  ANIMAL?: string;
  COLOR?: string;
  estado: 'JUGADO' | 'PENDIENTE' | 'PROXIMO';
}

const estadoBadges: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; text: string }> = {
  JUGADO: {
    variant: "secondary",
    icon: <CheckCircle className="h-3 w-3" />,
    text: "Completado",
  },
  PENDIENTE: {
    variant: "destructive",
    icon: <AlertCircle className="h-3 w-3" />,
    text: "Pendiente",
  },
  PROXIMO: {
    variant: "default",
    icon: <Timer className="h-3 w-3 animate-pulse" />,
    text: "Próximo",
  },
};

const ScheduleTable = () => {
  const { user } = useAuth();
  const esOperario = String(user?.tipo) === '2';
  
  const [horarios, setHorarios] = useState<HorarioConEstado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [horaActual, setHoraActual] = useState(new Date());

  useEffect(() => {
    cargarHorarios();
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      cargarHorarios();
      setHoraActual(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarHorarios = async () => {
    try {
      const response = await apiClient.get('/ruleta-publica.php/horarios');
      if (response.success && response.data) {
        setHorarios(response.data);
      }
    } catch (error) {
      console.error('Error al cargar horarios:', error);
    } finally {
      setIsLoading(false);
    }
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

  // Función para determinar si se puede ver el ganador (aplica para todos los usuarios)
  const puedeVerGanador = (horaJuego: string): boolean => {
    try {
      const ahora = horaActual;
      const [horas, minutos, segundos] = horaJuego.split(':').map(Number);

      // Crear fecha del sorteo con la hora del día actual
      const horaSorteo = new Date();
      horaSorteo.setHours(horas, minutos, segundos || 0, 0);

      // Todos (admin y operario) solo pueden ver si ya pasó la hora del sorteo
      return ahora >= horaSorteo;
    } catch (error) {
      console.error('Error al validar hora:', error);
      return false; // En caso de error, no mostrar
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Horarios de Apuestas
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground text-xs sm:text-sm">Sorteo</TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm">Hora</TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm">Ganador</TableHead>
                <TableHead className="text-muted-foreground text-right text-xs sm:text-sm">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {horarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No hay horarios configurados
                  </TableCell>
                </TableRow>
              ) : (
                horarios.map((horario) => {
                  const mostrarGanador = puedeVerGanador(horario.HORA);
                  
                  // Si tiene ganador pero aún no es hora de mostrarlo, forzar estado PENDIENTE
                  let estadoReal = horario.estado;
                  if (horario.ANIMAL && !mostrarGanador) {
                    estadoReal = 'PENDIENTE';
                  }
                  
                  const estadoConfig = estadoBadges[estadoReal];
                  
                  return (
                    <TableRow 
                      key={horario.NUM} 
                      className={`${estadoReal === "PROXIMO" ? "bg-primary/5" : ""}`}
                    >
                      <TableCell className="font-medium text-xs sm:text-sm">
                        {horario.DESCRIPCION}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {formatHora(horario.HORA)}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {horario.ANIMAL && mostrarGanador ? (
                          <span className="flex items-center gap-1">
                            <span 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: horario.COLOR || '#gray' }}
                            />
                            {horario.ANIMAL}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {!mostrarGanador && horario.ANIMAL ? (
                              <span className="flex items-center gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                Pendiente
                              </span>
                            ) : (
                              '-'
                            )}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={estadoConfig.variant}
                          className="text-[10px] sm:text-xs flex items-center gap-1 w-fit ml-auto"
                        >
                          {estadoConfig.icon}
                          {estadoConfig.text}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduleTable;