import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { mainAnimals } from "@/constants/animals";

const animals = mainAnimals.map((animal, index) => ({
  ...animal,
  color: [
    "bg-destructive/20 hover:bg-destructive/30",
    "bg-chart-4/20 hover:bg-chart-4/30",
    "bg-chart-4/20 hover:bg-chart-4/30",
    "bg-chart-4/20 hover:bg-chart-4/30",
    "bg-primary/20 hover:bg-primary/30",
    "bg-chart-2/20 hover:bg-chart-2/30",
    "bg-chart-3/20 hover:bg-chart-3/30",
    "bg-chart-5/20 hover:bg-chart-5/30",
    "bg-chart-1/20 hover:bg-chart-1/30",
    "bg-chart-4/20 hover:bg-chart-4/30",
    "bg-accent hover:bg-accent/80",
    "bg-secondary/20 hover:bg-secondary/30",
  ][index] || "bg-accent/20 hover:bg-accent/30",
}));

const AnimalRoulette = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Ruleta de Animales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {animals.map((animal, idx) => (
            <div
              key={animal.numero}
              className={`${animal.color} rounded-lg p-2 sm:p-3 text-center hover:scale-105 transition-all duration-200 cursor-pointer border border-border animate-scale-in active:scale-95`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <img 
                src={animal.imagen} 
                alt={animal.nombre}
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto object-contain"
              />
              <p className="text-xs font-bold text-foreground mt-1">
                #{animal.numero.toString().padStart(2, "0")}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {animal.nombre}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnimalRoulette;