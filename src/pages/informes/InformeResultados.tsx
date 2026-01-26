import { useState, useEffect } from 'react';
import { informesAPI } from '@/api/admin';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Award, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export default function InformeResultados() {
  const [datos, setDatos] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
    fecha_fin: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleBuscar = async () => {
    try {
      setIsLoading(true);
      const response = await informesAPI.resultados({
        fecha_inicio: filtros.fecha_inicio,
        fecha_fin: filtros.fecha_fin,
      });

      if (response.success) {
        // Mapear datos de la API al formato esperado por el frontend
        const apiData = response.data;
        const mappedData = {
          resultados: (apiData.resultados || []).map((r: any) => ({
            fecha: r.FECHA,
            horario: r.HORARIO || r.HORA,
            animal_ganador: r.ANIMAL,
            total_apostado: parseFloat(r.TOTAL_APOSTADO || 0),
            total_pagar: parseFloat(r.TOTAL_A_PAGAR || 0),
            utilidad: parseFloat(r.UTILIDAD || 0),
          })),
          top_ganadores: (apiData.animales_mas_ganadores || []).map((a: any) => ({
            nombre: a.ANIMAL,
            veces_ganador: parseInt(a.VECES_GANADOR || 0),
            porcentaje: parseFloat(a.PORCENTAJE || 0),
          })),
        };
        setDatos(mappedData);
        toast.success('Informe generado exitosamente');
      }
    } catch (error: any) {
      toast.error('Error al generar informe: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const exportarCSV = () => {
    if (!datos) {
      toast.error('No hay datos para exportar');
      return;
    }

    const headers = ['Fecha', 'Horario', 'Animal Ganador', 'Total Apostado', 'Total a Pagar'];
    const rows = datos.resultados?.map((item: any) => [
      item.fecha,
      item.horario,
      item.animal_ganador,
      item.total_apostado,
      item.total_pagar,
    ]) || [];

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `informe_resultados_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Informe exportado exitosamente');
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="h-8 w-8" />
            Informe de Resultados
          </h1>
          <p className="text-muted-foreground mt-1">
            Análisis de resultados y animales ganadores
          </p>
        </div>
        {datos && (
          <Button onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>
            Seleccione el rango de fechas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
              <Input
                id="fecha_inicio"
                type="date"
                value={filtros.fecha_inicio}
                onChange={(e) =>
                  setFiltros({ ...filtros, fecha_inicio: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fecha_fin">Fecha Fin</Label>
              <Input
                id="fecha_fin"
                type="date"
                value={filtros.fecha_fin}
                onChange={(e) =>
                  setFiltros({ ...filtros, fecha_fin: e.target.value })
                }
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleBuscar} disabled={isLoading} className="w-full">
                {isLoading ? 'Generando...' : 'Generar Informe'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {datos && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resultados por Fecha y Horario</CardTitle>
                <CardDescription>
                  Total: {datos.resultados?.length || 0} resultados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {datos.resultados && datos.resultados.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Horario</TableHead>
                        <TableHead>Animal Ganador</TableHead>
                        <TableHead className="text-right">Apostado</TableHead>
                        <TableHead className="text-right">A Pagar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datos.resultados.map((resultado: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            {resultado.fecha
                              ? format(new Date(resultado.fecha), 'dd/MM/yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell className="font-mono">
                            {resultado.horario}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {resultado.animal_ganador}
                          </TableCell>
                          <TableCell className="text-right">
                            ${(resultado.total_apostado || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-semibold">
                            ${(resultado.total_pagar || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay resultados para mostrar
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 Animales Ganadores</CardTitle>
                <CardDescription>
                  Animales que más veces han ganado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {datos.top_ganadores && datos.top_ganadores.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={datos.top_ganadores}
                          dataKey="veces_ganador"
                          nameKey="nombre"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) => `${entry.nombre} (${entry.veces_ganador})`}
                        >
                          {datos.top_ganadores.map((_: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="mt-4 space-y-2">
                      {datos.top_ganadores.map((animal: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{animal.nombre}</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-bold">{animal.veces_ganador}</span>{' '}
                            veces
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay datos de animales ganadores
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
    </DashboardLayout>
  );
}
