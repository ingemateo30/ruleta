import { useState, useEffect } from 'react';
import { informesAPI, sucursalesAPI } from '@/api/admin';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { TrendingUp, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function InformeVentas() {
  const [datos, setDatos] = useState<any>(null);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
    fecha_fin: format(new Date(), 'yyyy-MM-dd'),
    sucursal: '',
  });

  useEffect(() => {
    cargarSucursales();
  }, []);

  const cargarSucursales = async () => {
    try {
      const response = await sucursalesAPI.listar();
      if (response.success) setSucursales(response.data);
    } catch (error: any) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  const handleBuscar = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        fecha_inicio: filtros.fecha_inicio,
        fecha_fin: filtros.fecha_fin,
      };

      if (filtros.sucursal) params.sucursal = filtros.sucursal;

      const response = await informesAPI.ventas(params);

      if (response.success) {
        setDatos(response.data);
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

    const headers = ['Sucursal', 'Total Ventas', 'Total Tickets'];
    const rows = datos.por_sucursal?.map((item: any) => [
      item.sucursal,
      item.total_ventas,
      item.total_tickets,
    ]) || [];

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `informe_ventas_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Informe exportado exitosamente');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Informe de Ventas
          </h1>
          <p className="text-muted-foreground mt-1">
            Análisis de ventas por sucursal y horario
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
            Seleccione el rango de fechas y sucursal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
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

            <div className="grid gap-2">
              <Label htmlFor="sucursal">Sucursal</Label>
              <Select
                value={filtros.sucursal}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, sucursal: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {sucursales.map((suc) => (
                    <SelectItem key={suc.CODIGO} value={suc.CODIGO.toString()}>
                      {suc.BODEGA}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${(datos.kpis?.total_ventas || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {(datos.kpis?.total_tickets || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ventas Canceladas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  ${(datos.kpis?.ventas_canceladas || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ventas por Sucursal</CardTitle>
              <CardDescription>
                Comparativo de ventas entre sucursales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datos.por_sucursal || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sucursal" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => `$${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="total_ventas" fill="#22c55e" name="Total Ventas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ventas por Horario</CardTitle>
              <CardDescription>
                Detalle de ventas por horario
              </CardDescription>
            </CardHeader>
            <CardContent>
              {datos.por_horario && datos.por_horario.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horario</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Total Tickets</TableHead>
                      <TableHead className="text-right">Total Ventas</TableHead>
                      <TableHead className="text-right">Promedio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datos.por_horario.map((horario: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono font-medium">
                          {horario.hora}
                        </TableCell>
                        <TableCell>{horario.descripcion}</TableCell>
                        <TableCell className="text-right">
                          {(horario.total_tickets || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${(horario.total_ventas || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${(horario.promedio || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de ventas por horario
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
