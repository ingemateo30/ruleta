import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Trophy, Calendar } from "lucide-react";
import { getAnimalByNumero } from "@/constants/animals";

const resultados = [
  { fecha: "Hoy", sorteos: [
    { hora: "09:00", animal: "León", numero: 5 },
    { hora: "10:00", animal: "Caballo", numero: 12 },
    { hora: "11:00", animal: "Pescado", numero: 33 },
  ]},
  { fecha: "Ayer", sorteos: [
    { hora: "09:00", animal: "Tigre", numero: 10 },
    { hora: "10:00", animal: "Águila", numero: 9 },
    { hora: "12:00", animal: "Gato", numero: 11 },
    { hora: "15:00", animal: "Rana", numero: 6 },
    { hora: "17:00", animal: "Ratón", numero: 8 },
    { hora: "20:00", animal: "Perico", numero: 7 },
  ]},
];

const VerResultados = () => {
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

        {resultados.map((dia) => (
          <Card key={dia.fecha}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {dia.fecha}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {dia.sorteos.map((sorteo) => {
                  const animalData = getAnimalByNumero(sorteo.numero);
                  return (
                    <div
                      key={sorteo.hora}
                      className="bg-accent/30 rounded-xl p-4 text-center hover:bg-accent/50 transition-colors"
                    >
                      <Badge variant="outline" className="mb-2">
                        {sorteo.hora}
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
                          #{sorteo.numero.toString().padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default VerResultados;
