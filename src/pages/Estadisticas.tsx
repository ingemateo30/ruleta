import { useState, useEffect } from 'react';
import { estadisticasAPI } from '@/api/admin';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { BarChart3, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const getLocalDateString = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function Estadisticas() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [resumenGeneral, setResumenGeneral] = useState<any>(null);
  const [tendencias, setTendencias] = useState<any[]>([]);
  const [animales, setAnimales] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const hoyStr = getLocalDateString(new Date());
  const hace30DiasStr = getLocalDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  const [fechaInicio, setFechaInicio] = useState(hace30DiasStr);
  const [fechaFin, setFechaFin] = useState(hoyStr);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);

      // Cargar cada fuente de datos independientemente para evitar que un error afecte a todas
      const cargarDashboard = async () => {
        try {
          const res = await estadisticasAPI.dashboard();
          if (res.success && res.data) {
            setDashboard(res.data.kpis || res.data);
          }
        } catch (e) {
          console.error('Error cargando dashboard:', e);
        }
      };

      const cargarResumen = async () => {
        try {
          const res = await estadisticasAPI.resumenGeneral();
          if (res.success && res.data) {
            setResumenGeneral(res.data);
          }
        } catch (e) {
          console.error('Error cargando resumen general:', e);
        }
      };

      const cargarTendencias = async () => {
        try {
          const res = await estadisticasAPI.tendencias(7);
          if (res.success && res.data) {
            const formateadas = (res.data.ventas_por_dia || []).map((t: any) => ({
              ...t,
              total_ventas: parseFloat(t.ventas) || 0,
              total_pagado: 0
            }));
            setTendencias(formateadas);
          }
        } catch (e) {
          console.error('Error cargando tendencias:', e);
        }
      };

      const cargarAnimales = async () => {
        try {
          const res = await estadisticasAPI.animales({
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
          });
          if (res.success && res.data) {
            const formateados = (Array.isArray(res.data) ? res.data : []).slice(0, 10).map((a: any) => ({
              ...a,
              nombre: a.animal || a.VALOR || 'Sin nombre',
              total_jugadas: parseInt(a.total_jugadas) || 0,
              total_apostado: parseFloat(a.total_apostado) || 0,
            }));
            setAnimales(formateados);
          }
        } catch (e) {
          console.error('Error cargando animales:', e);
        }
      };

      const cargarHorarios = async () => {
        try {
          const res = await estadisticasAPI.horarios({
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
          });
          if (res.success && res.data) {
            const formateados = (Array.isArray(res.data) ? res.data : []).map((h: any) => ({
              ...h,
              descripcion: h.horario || h.DESCRIPCION || 'Sin descripción',
              total_ventas: parseFloat(h.total_apostado) || 0,
            }));
            setHorarios(formateados);
          }
        } catch (e) {
          console.error('Error cargando horarios:', e);
        }
      };

      const cargarSucursales = async () => {
        try {
          const res = await estadisticasAPI.sucursales({
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
          });
          if (res.success && res.data) {
            const formateadas = (Array.isArray(res.data) ? res.data : []).map((s: any) => ({
              ...s,
              nombre: s.sucursal || s.BODEGA || 'Sin nombre',
              total_ventas: parseFloat(s.total_ventas) || 0,
            }));
            setSucursales(formateadas);
          }
        } catch (e) {
          console.error('Error cargando sucursales:', e);
        }
      };

      await Promise.all([
        cargarDashboard(),
        cargarResumen(),
        cargarTendencias(),
        cargarAnimales(),
        cargarHorarios(),
        cargarSucursales(),
      ]);
    } catch (error: any) {
      toast.error('Error al cargar estadísticas: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefrescar = async () => {
    await cargarDatos();
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
        <Button variant="outline" onClick={handleRefrescar}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Filtros de periodo */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleRefrescar} className="w-full">
                Consultar Periodo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs del día */}
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
                ${(parseFloat(dashboard.total_ventas) || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tickets Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {(parseInt(dashboard.total_tickets) || 0).toLocaleString()}
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
                ${(parseFloat(dashboard.total_pagado) || 0).toLocaleString()}
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
                ${(parseFloat(dashboard.utilidad_neta) || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tendencia de ventas */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Ventas (Últimos 7 días)</CardTitle>
            <CardDescription>
              Evolución de las ventas en los últimos días
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tendencias.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={tendencias}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_ventas"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Ventas"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de tendencias disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top animales */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Animales Más Jugados</CardTitle>
            <CardDescription>
              Animales con mayor cantidad de apuestas en el periodo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {animales.length > 0 ? (
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de animales disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Ventas por horario */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Horario</CardTitle>
            <CardDescription>
              Distribución de ventas por horario del día
            </CardDescription>
          </CardHeader>
          <CardContent>
            {horarios.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={horarios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="descripcion" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="total_ventas"
                    fill="#22c55e"
                    name="Total Ventas"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de horarios disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribución por sucursal */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Sucursal</CardTitle>
            <CardDescription>
              Participación de cada sucursal en las ventas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sucursales && sucursales.length > 0 && sucursales.some((s: any) => s.total_ventas > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sucursales.filter((s: any) => s.total_ventas > 0)}
                      dataKey="total_ventas"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) =>
                        `${entry.nombre}`
                      }
                    >
                      {sucursales.filter((s: any) => s.total_ventas > 0).map((_: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => `$${Number(value).toLocaleString()}`}
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
                        ${(sucursal.total_ventas || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de sucursales disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen general del sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen General</CardTitle>
          <CardDescription>
            Estadísticas generales del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Animales Activos
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {resumenGeneral?.animales_activos || 0}
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm font-medium text-green-700 dark:text-green-300">
                Horarios Activos
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {resumenGeneral?.horarios_activos || 0}
              </div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Total Sucursales
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {resumenGeneral?.total_sucursales || 0}
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Sorteos Realizados
              </div>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {(resumenGeneral?.total_sorteos_realizados || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
