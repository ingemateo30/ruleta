import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Ticket, Trophy, TrendingUp } from "lucide-react";

const StatsCards = () => {
  const stats = [
    {
      title: "Ventas del Día",
      value: "$2,450,000",
      change: "+12.5%",
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
      shadowColor: "",
    },
    {
      title: "Tickets Emitidos",
      value: "156",
      change: "+8 hoy",
      icon: <Ticket className="h-5 w-5" />,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      shadowColor: "",
    },
    {
      title: "Premios Pagados",
      value: "$850,000",
      change: "34.6%",
      icon: <Trophy className="h-5 w-5" />,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      shadowColor: "",
    },
    {
      title: "Utilidad",
      value: "$1,600,000",
      change: "+5.2%",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      shadowColor: "",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, idx) => (
        <Card 
          key={stat.title} 
          className={`${stat.shadowColor} hover:scale-[1.02] transition-all duration-300 animate-fade-in-up`}
          style={{ animationDelay: `${idx * 0.1}s` }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor}`}>
              <span className={stat.color}>{stat.icon}</span>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              <span className="text-primary font-medium">{stat.change}</span> vs ayer
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;