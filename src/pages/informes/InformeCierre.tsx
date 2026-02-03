import { useState, useEffect } from 'react';
import { informesAPI, sucursalesAPI } from '@/api/admin';
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
import { FileText, Download, TrendingUp, TrendingDown, DollarSign, Clock, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function InformeCierre() {
  const [datos, setDatos] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
    fecha_fin: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    handleBuscar();
  }, []);

  const handleBuscar = async () => {
    try {
      setIsLoading(true);
      const response = await informesAPI.cierres(filtros);
      if (response.success) {
        setDatos(response.data);
      }
    } catch (error: any) {
      console.error('Error al cargar informe de cierre:', error);
      toast.error('Error al cargar el informe de cierre');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMoney = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  };

  const formatHora = (hora: string): string => {
    if (!hora) return '';
    const partes = hora.split(':');
    if (partes.length < 2) return hora;
    const h = parseInt(partes[0], 10);
    const minutos = partes[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    const horas12 = h % 12 || 12;
    return `${horas12}:${minutos} ${ampm}`;
  };

  const handleExportCSV = () => {
    if (!datos?.cierres || datos.cierres.length === 0) return;

    const headers = ['Fecha', 'Horario', 'Hora', 'Animal Ganador', 'Total Apostado', 'Total Pagado', 'Utilidad', 'Comision Admin', 'Comision Sistema', 'Ganancia Sucursal'];
    const rows = datos.cierres.map((c: any) => [
      c.FECHA,
      c.NOMBRE_HORARIO,
      c.HORA,
      c.ANIMAL_GANADOR || '-',
      c.TOTAL_APOSTADO || 0,
      c.TOTAL_PAGADO || 0,
      c.UTILIDAD || 0,
      c.COMISION_ADMIN || 0,
      c.COMISION_SISTEMA || 0,
      c.GANANCIA_SUCURSAL || 0,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r: any[]) => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `informe_cierre_${filtros.fecha_inicio}_${filtros.fecha_fin}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <FileText className="h-7 w-7 text-primary" />
              Informe de Cierre
            </h1>
            <p className="text-muted-foreground mt-1">
              Resumen de utilidades diarias y ganancias por sorteo
            </p>
          </div>
          {datos?.cierres && datos.cierres.length > 0 && (
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={filtros.fecha_inicio}
                  onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={filtros.fecha_fin}
                  onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleBuscar} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs - Resumen de utilidades */}
        {datos?.resumen && (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Total Apostado</p>
                  <p className="text-lg font-bold">{formatMoney(datos.resumen.total_apostado)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingDown className="h-6 w-6 mx-auto text-red-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Total Pagado</p>
                  <p className="text-lg font-bold text-red-600">{formatMoney(datos.resumen.total_pagado)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 mx-auto text-green-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Utilidad Bruta</p>
                  <p className="text-lg font-bold text-green-600">{formatMoney(datos.resumen.total_utilidad)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Comision Admin</p>
                  <p className="text-lg font-bold">{formatMoney(datos.resumen.total_comision_admin)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Comision Sistema</p>
                  <p className="text-lg font-bold">{formatMoney(datos.resumen.total_comision_sistema)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs text-muted-foreground font-semibold">Ganancia Neta</p>
                  <p className="text-xl font-bold text-emerald-600">{formatMoney(datos.resumen.total_ganancia_sucursal)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabla de cierres */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : datos?.cierres && datos.cierres.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Detalle de Cierres por Horario
              </CardTitle>
              <CardDescription>
                {datos.resumen.total_cierres} cierres en el periodo seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Animal Ganador</TableHead>
                      <TableHead className="text-right">Apostado</TableHead>
                      <TableHead className="text-right">Pagado</TableHead>
                      <TableHead className="text-right">Utilidad</TableHead>
                      <TableHead className="text-right">Ganancia Sucursal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datos.cierres.map((cierre: any, index: number) => {
                      const utilidad = parseFloat(cierre.UTILIDAD || 0);
                      return (
                        <TableRow key={`${cierre.FECHA}-${cierre.CODIGOH}-${index}`}>
                          <TableCell className="font-medium">
                            {cierre.FECHA}
                          </TableCell>
                          <TableCell>{cierre.NOMBRE_HORARIO}</TableCell>
                          <TableCell>{formatHora(cierre.HORA)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {cierre.ANIMAL_GANADOR || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatMoney(cierre.TOTAL_APOSTADO)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-red-600">
                            {formatMoney(cierre.TOTAL_PAGADO)}
                          </TableCell>
                          <TableCell className={`text-right font-mono font-semibold ${utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatMoney(cierre.UTILIDAD)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-emerald-600">
                            {formatMoney(cierre.GANANCIA_SUCURSAL)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron cierres para el periodo seleccionado</p>
              <p className="text-sm mt-2">Seleccione un rango de fechas y haga clic en Buscar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
