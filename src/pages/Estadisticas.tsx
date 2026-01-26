import { useState, useEffect } from 'react';
import { estadisticasAPI } from '@/api/admin';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { BarChart3, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export default function Estadisticas() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [tendencias, setTendencias] = useState<any[]>([]);
  const [animales, setAnimales] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);

      const [
        dashboardRes,
        tendenciasRes,
        animalesRes,
        horariosRes,
        sucursalesRes,
      ] = await Promise.all([
        estadisticasAPI.dashboard(),
        estadisticasAPI.tendencias(7),
        estadisticasAPI.animales({
          fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          fecha_fin: new Date().toISOString().split('T')[0],
        }),
        estadisticasAPI.horarios({
          fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          fecha_fin: new Date().toISOString().split('T')[0],
        }),
        estadisticasAPI.sucursales({
          fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          fecha_fin: new Date().toISOString().split('T')[0],
        }),
      ]);

      if (dashboardRes.success) setDashboard(dashboardRes.data);
      if (tendenciasRes.success) setTendencias(tendenciasRes.data);
      if (animalesRes.success) setAnimales(animalesRes.data.slice(0, 10));
      if (horariosRes.success) setHorarios(horariosRes.data);
      if (sucursalesRes.success) setSucursales(sucursalesRes.data);
    } catch (error: any) {
      toast.error('Error al cargar estadísticas: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <div className="text-xl font-semibold">Cargando estadísticas...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Dashboard de Estadísticas
          </h1>
          <p className="text-muted-foreground mt-1">
            Análisis completo del sistema
          </p>
        </div>
      </div>

      {dashboard && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Ventas Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${(dashboard.ventas_hoy || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Jugadas Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {(dashboard.jugadas_hoy || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pagado Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${(dashboard.pagado_hoy || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Utilidad Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ${(dashboard.utilidad_hoy || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Ventas (Últimos 7 días)</CardTitle>
            <CardDescription>
              Evolución de las ventas en los últimos días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendencias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total_ventas"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Ventas"
                />
                <Line
                  type="monotone"
                  dataKey="total_pagado"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Pagado"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Animales Más Jugados</CardTitle>
            <CardDescription>
              Animales con mayor cantidad de apuestas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={animales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="total_jugadas"
                  fill="#3b82f6"
                  name="Total Jugadas"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Horario</CardTitle>
            <CardDescription>
              Distribución de ventas por horario del día
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={horarios}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="descripcion" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Bar
                  dataKey="total_ventas"
                  fill="#22c55e"
                  name="Total Ventas"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Sucursal</CardTitle>
            <CardDescription>
              Participación de cada sucursal en las ventas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sucursales && sucursales.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sucursales}
                      dataKey="total_ventas"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) =>
                        `${entry.nombre} ($${entry.total_ventas.toLocaleString()})`
                      }
                    >
                      {sucursales.map((_: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => `$${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  {sucursales.map((sucursal: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="font-medium">{sucursal.nombre}</span>
                      </div>
                      <div className="text-sm font-semibold">
                        ${sucursal.total_ventas.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de sucursales
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen General</CardTitle>
          <CardDescription>
            Estadísticas generales del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Total Animales Activos
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {dashboard?.animales_activos || 0}
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm font-medium text-green-700 dark:text-green-300">
                Total Horarios Activos
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {dashboard?.horarios_activos || 0}
              </div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Total Sucursales
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {dashboard?.total_sucursales || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
