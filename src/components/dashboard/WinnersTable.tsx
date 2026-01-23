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
import { Trophy, TrendingUp } from "lucide-react";
import { getAnimalByNumero } from "@/constants/animals";

const mockWinners = [
  { id: "RAD-001542", animal: "León", numero: 5, valor: 50000, hora: "09:30" },
  { id: "RAD-001538", animal: "Caballo", numero: 12, valor: 25000, hora: "10:00" },
  { id: "RAD-001525", animal: "Pescado", numero: 33, valor: 75000, hora: "10:30" },
  { id: "RAD-001519", animal: "Burro", numero: 18, valor: 30000, hora: "11:00" },
  { id: "RAD-001512", animal: "Perico", numero: 7, valor: 45000, hora: "11:30" },
];

const WinnersTable = () => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

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
            En tiempo real
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground text-xs sm:text-sm">Radicado</TableHead>
              <TableHead className="text-muted-foreground text-xs sm:text-sm">Animal</TableHead>
              <TableHead className="text-muted-foreground text-right text-xs sm:text-sm">Valor</TableHead>
              <TableHead className="text-muted-foreground text-right text-xs sm:text-sm hidden sm:table-cell">Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockWinners.map((winner, index) => (
              <TableRow 
                key={winner.id} 
                className={`${index === 0 ? "bg-accent/30" : ""} animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <TableCell className="font-mono text-xs sm:text-sm text-foreground">
                  {winner.id}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {(() => {
                      const animalData = getAnimalByNumero(winner.numero);
                      return animalData ? (
                        <img 
                          src={animalData.imagen} 
                          alt={winner.animal}
                          className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                        />
                      ) : null;
                    })()}
                    <span className="font-medium text-foreground text-xs sm:text-sm hidden sm:inline">{winner.animal}</span>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs">
                      #{winner.numero.toString().padStart(2, "0")}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold text-primary text-xs sm:text-sm">
                  {formatCurrency(winner.valor)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground hidden sm:table-cell">
                  {winner.hora}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default WinnersTable;