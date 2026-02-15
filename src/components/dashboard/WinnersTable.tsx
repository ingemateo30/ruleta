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
import { Ticket } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { USER_TYPES } from "@/api/types";

interface Winner {
  numero_ticket: string;
  hora_juego: string;
  animal_ganador: string;
  sucursal: string;
  color?: string;
}

const WinnersTable = () => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Los operarios no tienen acceso a este endpoint
  const isOperario = String(user?.tipo) === USER_TYPES.OPERARIO;

  useEffect(() => {
    // Esperar a que el usuario esté cargado antes de decidir
    if (!user) {
      return;
    }

    // Los operarios no tienen acceso a estadísticas
    if (isOperario) {
      setIsLoading(false);
      return;
    }

    cargarGanadores();
    // Actualizar cada 60 segundos
    const interval = setInterval(cargarGanadores, 60000);
    return () => clearInterval(interval);
  }, [user, isOperario]);

  const cargarGanadores = async () => {
    try {
      const response = await estadisticasAPI.dashboard();
      if (response.success && response.data?.ultimos_ganadores) {
        const ganadoresFormateados = response.data.ultimos_ganadores.map((g: any) => ({
          numero_ticket: g.numero_ticket,
          hora_juego: g.hora_juego,
          animal_ganador: g.animal_ganador,
          sucursal: g.sucursal,
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

  // Operarios no ven esta tabla - tambien verificar que el usuario esté cargado
  if (isOperario || !user) {
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
            Tickets Ganadores
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
            Tickets Ganadores
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
                <TableHead className="text-muted-foreground text-xs sm:text-sm">N° Ticket</TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm">Hora de Juego</TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm">Animal Ganador</TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">Sucursal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {winners.map((winner, index) => (
                <TableRow
                  key={`${winner.numero_ticket}-${index}`}
                  className={`${index === 0 ? "bg-accent/30" : ""} animate-fade-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <TableCell className="font-mono font-medium text-xs sm:text-sm text-foreground">
                    <div className="flex items-center gap-1">
                      <Ticket className="h-3 w-3 text-muted-foreground" />
                      {winner.numero_ticket}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs sm:text-sm">
                    {formatHora(winner.hora_juego)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {(() => {
                        const animalData = getAnimalByNombre(winner.animal_ganador);
                        return animalData ? (
                          <img
                            src={animalData.imagen}
                            alt={winner.animal_ganador}
                            className="w-7 h-7 sm:w-9 sm:h-9 object-contain"
                          />
                        ) : null;
                      })()}
                      <span className="font-medium text-foreground text-xs sm:text-sm">{winner.animal_ganador}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">
                    {winner.sucursal}
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
