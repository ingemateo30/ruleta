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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, Download, TrendingUp, TrendingDown, DollarSign, Clock, Loader2, Search, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function InformeCierre() {
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
    handleBuscar();
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
      if (filtros.sucursal && filtros.sucursal !== '0') {
        params.sucursal = filtros.sucursal;
      }
      const response = await informesAPI.cierres(params);
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
    const abs = Math.abs(num);
    const formatted = abs.toLocaleString('es-CO', { maximumFractionDigits: 0 });
    return num < 0 ? `-$${formatted}` : `$${formatted}`;
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

    const headers = ['Fecha', 'Sucursal', 'Horario', 'Hora', 'Animal Ganador', 'Total Apostado', 'Total Pagado', 'Pago a Sucursal (7%)', 'Utilidad', 'Comision Sistemas (20%)', 'Comision Admin (80%)'];
    const rows = datos.cierres.map((c: any) => [
      c.FECHA,
      c.NOMBRE_SUCURSAL || '-',
      c.NOMBRE_HORARIO,
      c.HORA,
      c.ANIMAL_GANADOR || '-',
      c.TOTAL_APOSTADO || 0,
      c.TOTAL_PAGADO_REAL || 0,
      c.GANANCIA_SUCURSAL || 0,
      c.UTILIDAD || 0,
      c.COMISION_SISTEMA || 0,
      c.COMISION_ADMIN || 0,
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
              Resumen de utilidades diarias y estadísticas por sorteo
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
            <div className="grid gap-4 md:grid-cols-4">
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
              <div className="grid gap-2">
                <Label htmlFor="sucursal">Sede</Label>
                <Select
                  value={filtros.sucursal}
                  onValueChange={(value) => setFiltros({ ...filtros, sucursal: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las sedes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Todas las sedes</SelectItem>
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

        {/* KPIs - Resumen de estadísticas */}
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
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Building2 className="h-6 w-6 mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs text-muted-foreground font-semibold">Pago a Sucursales</p>
                  <p className="text-xl font-bold text-emerald-600">{formatMoney(datos.resumen.total_ganancia_sucursal)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Sistemas (20%)</p>
                  <p className="text-lg font-bold">{formatMoney(datos.resumen.total_comision_sistema)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Administración (80%)</p>
                  <p className="text-lg font-bold">{formatMoney(datos.resumen.total_comision_admin)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabla de cierres por horario */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : datos?.cierres && datos.cierres.length > 0 ? (
          <>
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
                        <TableHead>Sede</TableHead>
                        <TableHead>Horario</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Animal Ganador</TableHead>
                        <TableHead className="text-right">Apostado</TableHead>
                        <TableHead className="text-right">Pagado</TableHead>
                        <TableHead className="text-right">Pago Sucursal (7%)</TableHead>
                        <TableHead className="text-right">Utilidad Bruta</TableHead>
                        <TableHead className="text-right">Sistemas (20%)</TableHead>
                        <TableHead className="text-right">Admin (80%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datos.cierres.map((cierre: any, index: number) => {
                        const utilidad = parseFloat(cierre.UTILIDAD || 0);
                        return (
                          <TableRow key={`${cierre.FECHA}-${cierre.CODIGOH}-${cierre.CODIGO_SUCURSAL}-${index}`}>
                            <TableCell className="font-medium">
                              {cierre.FECHA}
                            </TableCell>
                            <TableCell>{cierre.NOMBRE_SUCURSAL || '-'}</TableCell>
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
                              {formatMoney(cierre.TOTAL_PAGADO_REAL)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-emerald-600">
                              {formatMoney(cierre.GANANCIA_SUCURSAL)}
                            </TableCell>
                            <TableCell className={`text-right font-mono font-semibold ${utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatMoney(cierre.UTILIDAD)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatMoney(cierre.COMISION_SISTEMA)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatMoney(cierre.COMISION_ADMIN)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de cierre por sede */}
            {datos.resumen_por_sede && datos.resumen_por_sede.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Detalle de Cierre por Sede
                  </CardTitle>
                  <CardDescription>
                    Estadísticas consolidadas por sede en el periodo seleccionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sede</TableHead>
                          <TableHead className="text-right">Cierres</TableHead>
                          <TableHead className="text-right">Total Apostado</TableHead>
                          <TableHead className="text-right">Total Pagado</TableHead>
                          <TableHead className="text-right">Pago Sucursal (7%)</TableHead>
                          <TableHead className="text-right">Utilidad Bruta</TableHead>
                          <TableHead className="text-right">Sistemas (20%)</TableHead>
                          <TableHead className="text-right">Admin (80%)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {datos.resumen_por_sede.map((sede: any, index: number) => (
                          <TableRow key={sede.CODIGO_SUCURSAL || index}>
                            <TableCell className="font-medium">{sede.NOMBRE_SUCURSAL || '-'}</TableCell>
                            <TableCell className="text-right">{sede.TOTAL_CIERRES}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatMoney(sede.TOTAL_APOSTADO)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-red-600">
                              {formatMoney(sede.TOTAL_PAGADO)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-emerald-600">
                              {formatMoney(sede.GANANCIA_SUCURSAL)}
                            </TableCell>
                            <TableCell className={`text-right font-mono font-semibold ${parseFloat(sede.UTILIDAD) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatMoney(sede.UTILIDAD)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatMoney(sede.COMISION_SISTEMA)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatMoney(sede.COMISION_ADMIN)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
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
