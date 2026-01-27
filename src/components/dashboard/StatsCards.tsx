import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Trophy, Clock, Users, Loader2 } from "lucide-react";
import { estadisticasAPI } from '@/api/admin';
import { useAuth } from '@/hooks/use-auth';
import { USER_TYPES } from '@/api/types';

const StatsCards = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Determinar si es superadmin (solo superadmin ve datos financieros)
  const isSuperAdmin = String(user?.tipo) === USER_TYPES.SUPER_ADMIN;

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const result = await estadisticasAPI.dashboard();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Configuración para SuperAdmin (con datos financieros)
  const superAdminStatsConfig = [
    {
      title: "Tickets Emitidos",
      getValue: () => stats?.kpis?.total_tickets || 0,
      getChange: () => `${stats?.kpis?.total_tickets || 0} hoy`,
      icon: <Ticket className="h-5 w-5" />,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      format: (val: number) => val.toString(),
    },
    {
      title: "Sorteos Realizados",
      getValue: () => stats?.ultimos_ganadores?.length || 0,
      getChange: () => `de ${stats?.proximos_horarios?.length || 0} programados`,
      icon: <Trophy className="h-5 w-5" />,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      format: (val: number) => val.toString(),
    },
    {
      title: "Horarios Activos",
      getValue: () => stats?.proximos_horarios?.length || 0,
      getChange: () => 'configurados',
      icon: <Clock className="h-5 w-5" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
      format: (val: number) => val.toString(),
    },
    {
      title: "Sucursales Activas",
      getValue: () => stats?.ventas_por_sucursal?.filter((s: any) => s.tickets > 0)?.length || 0,
      getChange: () => `de ${stats?.ventas_por_sucursal?.length || 0} total`,
      icon: <Users className="h-5 w-5" />,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      format: (val: number) => val.toString(),
    },
  ];

  // Configuración para Admin y Operario (sin datos financieros)
  const adminStatsConfig = [
    {
      title: "Tickets Emitidos",
      getValue: () => stats?.kpis?.total_tickets || 0,
      getChange: () => `${stats?.kpis?.total_tickets || 0} hoy`,
      icon: <Ticket className="h-5 w-5" />,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      format: (val: number) => val.toString(),
    },
    {
      title: "Sorteos Realizados",
      getValue: () => stats?.ultimos_ganadores?.length || 0,
      getChange: () => `de ${stats?.proximos_horarios?.length || 0} programados`,
      icon: <Trophy className="h-5 w-5" />,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      format: (val: number) => val.toString(),
    },
    {
      title: "Horarios Activos",
      getValue: () => stats?.proximos_horarios?.length || 0,
      getChange: () => 'configurados',
      icon: <Clock className="h-5 w-5" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
      format: (val: number) => val.toString(),
    },
    {
      title: "Sucursales Activas",
      getValue: () => stats?.ventas_por_sucursal?.filter((s: any) => s.tickets > 0)?.length || 0,
      getChange: () => `de ${stats?.ventas_por_sucursal?.length || 0} total`,
      icon: <Users className="h-5 w-5" />,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      format: (val: number) => val.toString(),
    },
  ];

  // Seleccionar la configuración según el rol
  const statsConfig = isSuperAdmin ? superAdminStatsConfig : adminStatsConfig;

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
              <span className="text-primary font-medium">{stat.getChange()}</span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;