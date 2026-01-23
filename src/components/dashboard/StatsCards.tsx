import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Ticket, Trophy, TrendingUp, Loader2 } from "lucide-react";
import { estadisticasAPI } from '@/api/admin';

const StatsCards = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const result = await estadisticasAPI.dashboard();
      if (result.success) {
        setStats(result.data.kpis);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const statsConfig = [
    {
      title: "Ventas del Día",
      getValue: () => stats?.total_ventas || 0,
      getChange: () => {
        const total = stats?.total_ventas || 0;
        const cancelado = stats?.total_cancelado || 0;
        return total > 0 ? `${((total - cancelado) / total * 100).toFixed(1)}%` : '0%';
      },
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
      format: formatCurrency,
    },
    {
      title: "Tickets Emitidos",
      getValue: () => stats?.total_tickets || 0,
      getChange: () => `${stats?.total_tickets || 0} hoy`,
      icon: <Ticket className="h-5 w-5" />,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      format: (val: number) => val.toString(),
    },
    {
      title: "Premios Pagados",
      getValue: () => stats?.total_pagado || 0,
      getChange: () => {
        const ventas = stats?.total_ventas || 0;
        const pagado = stats?.total_pagado || 0;
        return ventas > 0 ? `${((pagado / ventas) * 100).toFixed(1)}%` : '0%';
      },
      icon: <Trophy className="h-5 w-5" />,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      format: formatCurrency,
    },
    {
      title: "Utilidad",
      getValue: () => stats?.utilidad_neta || 0,
      getChange: () => {
        const ventas = stats?.total_ventas || 0;
        const utilidad = stats?.utilidad_neta || 0;
        return ventas > 0 ? `${((utilidad / ventas) * 100).toFixed(1)}%` : '0%';
      },
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      format: formatCurrency,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="h-8 bg-muted rounded w-32 mb-2" />
              <div className="h-3 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statsConfig.map((stat, idx) => (
        <Card
          key={stat.title}
          className="hover:scale-[1.02] transition-all duration-300 animate-fade-in-up"
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
            <div className="text-lg sm:text-2xl font-bold text-foreground">
              {stat.format(stat.getValue())}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              <span className="text-primary font-medium">{stat.getChange()}</span> de ventas
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;