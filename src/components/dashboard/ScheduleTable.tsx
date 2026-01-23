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
import { Clock, CheckCircle, Timer, AlertCircle } from "lucide-react";

const mockSchedules = [
  { id: 1, descripcion: "Sorteo Matutino 1", hora: "09:00", estado: "completado" },
  { id: 2, descripcion: "Sorteo Matutino 2", hora: "10:00", estado: "completado" },
  { id: 3, descripcion: "Sorteo Mediodía", hora: "12:00", estado: "activo" },
  { id: 4, descripcion: "Sorteo Tarde 1", hora: "15:00", estado: "pendiente" },
  { id: 5, descripcion: "Sorteo Tarde 2", hora: "17:00", estado: "pendiente" },
  { id: 6, descripcion: "Sorteo Nocturno", hora: "20:00", estado: "pendiente" },
];

const estadoBadges: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; text: string }> = {
  completado: {
    variant: "secondary",
    icon: <CheckCircle className="h-3 w-3" />,
    text: "Listo",
  },
  activo: {
    variant: "default",
    icon: <Timer className="h-3 w-3 animate-pulse" />,
    text: "En Curso",
  },
  pendiente: {
    variant: "outline",
    icon: <AlertCircle className="h-3 w-3" />,
    text: "Pendiente",
  },
};

const ScheduleTable = () => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Horarios de Apuestas
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground text-xs sm:text-sm">Sorteo</TableHead>
              <TableHead className="text-muted-foreground text-xs sm:text-sm">Hora</TableHead>
              <TableHead className="text-muted-foreground text-right text-xs sm:text-sm">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockSchedules.map((schedule, index) => {
              const estadoConfig = estadoBadges[schedule.estado];
              return (
                <TableRow 
                  key={schedule.id} 
                  className={`${schedule.estado === "activo" ? "bg-primary/5" : ""} animate-fade-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <TableCell className="font-medium text-foreground text-xs sm:text-sm">
                    {schedule.descripcion}
                  </TableCell>
                  <TableCell className="font-mono text-base sm:text-lg font-bold text-foreground">
                    {schedule.hora}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={estadoConfig.variant} className="gap-1 text-[10px] sm:text-xs">
                      {estadoConfig.icon}
                      <span className="hidden sm:inline">{estadoConfig.text}</span>
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ScheduleTable;