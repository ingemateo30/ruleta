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
import { Trophy, TrendingUp, Loader2 } from "lucide-react";
import { getAnimalByNombre } from "@/constants/animals";
import { estadisticasAPI } from "@/api/admin";
import { useAuth } from "@/hooks/use-auth";
import { USER_TYPES } from "@/api/types";

interface Winner {
  animal: string;
  numero: number;
  horario: string;
  hora: string;
  color?: string;
}

const WinnersTable = () => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Los operarios no tienen acceso a este endpoint
  const isOperario = String(user?.tipo) === USER_TYPES.OPERARIO;

  useEffect(() => {
    // Los operarios no tienen acceso a estadísticas
    if (isOperario) {
      setIsLoading(false);
      return;
    }

    cargarGanadores();
    // Actualizar cada 60 segundos
    const interval = setInterval(cargarGanadores, 60000);
    return () => clearInterval(interval);
  }, [isOperario]);

  const cargarGanadores = async () => {
    try {
      const response = await estadisticasAPI.dashboard();
      if (response.success && response.data?.ultimos_ganadores) {
        const ganadoresFormateados = response.data.ultimos_ganadores.map((g: any) => ({
          animal: g.ANIMAL,
          numero: parseInt(g.CODIGOA || g.numero || '0'),
          horario: g.horario || g.DESCRIPCION,
          hora: g.HORA,
          color: g.COLOR
        }));
        setWinners(ganadoresFormateados);
      }
    } catch (error) {
      console.error('Error al cargar ganadores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Operarios no ven esta tabla
  if (isOperario) {
    return null;
  }

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

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Trophy className="h-5 w-5 text-chart-4" />
            Lottos Ganadores
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Trophy className="h-5 w-5 text-chart-4" />
            Lottos Ganadores
          </CardTitle>
          <Badge variant="outline" className="bg-accent text-accent-foreground text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Hoy
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {winners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay ganadores registrados hoy</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground text-xs sm:text-sm">Horario</TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm">Animal Ganador</TableHead>
                <TableHead className="text-muted-foreground text-right text-xs sm:text-sm hidden sm:table-cell">Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {winners.map((winner, index) => (
                <TableRow
                  key={`${winner.hora}-${index}`}
                  className={`${index === 0 ? "bg-accent/30" : ""} animate-fade-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <TableCell className="font-medium text-xs sm:text-sm text-foreground">
                    {winner.horario}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {(() => {
                        const animalData = getAnimalByNombre(winner.animal);
                        return animalData ? (
                          <img
                            src={animalData.imagen}
                            alt={winner.animal}
                            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                          />
                        ) : null;
                      })()}
                      <span className="font-medium text-foreground text-xs sm:text-sm hidden sm:inline">{winner.animal}</span>
                      {(() => {
                        const animalData = getAnimalByNombre(winner.animal);
                        return (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">
                            #{animalData?.codigo || winner.numero.toString().padStart(2, "0")}
                          </Badge>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground hidden sm:table-cell">
                    {formatHora(winner.hora)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default WinnersTable;
