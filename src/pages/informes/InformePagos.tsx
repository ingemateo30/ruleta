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
import { Receipt, Download, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { getAnimalByNumero } from '@/constants/animals';

export default function InformePagos() {
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

      const response = await informesAPI.pagos(params);

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
    if (!datos || !datos.pagos || datos.pagos.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const headers = [
      'ID',
      'Radicado',
      'Fecha',
      'Animal',
      'Valor Apostado',
      'Valor Pagado',
      'Sucursal',
      'Usuario',
      'Fecha Pago',
    ];
    const rows = datos.pagos.map((item: any) => [
      item.ID,
      item.RADICADO,
      item.FECHA,
      item.ANIMAL,
      item.VALOR_APOSTADO,
      item.VALOR_GANADO,
      item.NOMBRE_SUCURSAL,
      item.USUARIO,
      item.FECHA_PAGO,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `informe_pagos_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Informe exportado exitosamente');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Receipt className="h-8 w-8 text-primary" />
              Informe de Pagos
            </h1>
            <p className="text-muted-foreground mt-1">
              Consulta de pagos realizados a ganadores
            </p>
          </div>
          {datos && datos.pagos?.length > 0 && (
            <Button onClick={exportarCSV} variant="outline">
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
                  <SelectItem value="0">Todas</SelectItem>
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
                <CardTitle className="text-lg">Total Pagado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${(datos.totales?.total_pagado || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Promedio por Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  ${(datos.totales?.promedio_pago || 0).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cantidad de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {(datos.totales?.total_pagos || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen por Sucursal</CardTitle>
              <CardDescription>
                Detalle de pagos por sucursal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {datos.resumen_por_sucursal && datos.resumen_por_sucursal.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sucursal</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Total Pagado</TableHead>
                      <TableHead className="text-right">Promedio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datos.resumen_por_sucursal.map((sucursal: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {sucursal.SUCURSAL}
                        </TableCell>
                        <TableCell className="text-right">
                          {(sucursal.TOTAL_PAGOS || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ${(parseFloat(sucursal.TOTAL_PAGADO) || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${(parseFloat(sucursal.PROMEDIO_PAGO) || 0).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de pagos por sucursal
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalle de Pagos</CardTitle>
              <CardDescription>
                Total: {datos.pagos?.length || 0} pagos realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {datos.pagos && datos.pagos.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Radicado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Animal</TableHead>
                        <TableHead>Sucursal</TableHead>
                        <TableHead className="text-right">Apostado</TableHead>
                        <TableHead className="text-right">Pagado</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Fecha Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datos.pagos.map((pago: any, index: number) => {
                        const animalData = getAnimalByNumero(parseInt(pago.CODANIMAL));
                        return (
                          <TableRow key={pago.ID || index}>
                            <TableCell className="font-mono font-medium">
                              {pago.RADICADO}
                            </TableCell>
                            <TableCell>
                              {pago.FECHA ? format(new Date(pago.FECHA + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {animalData && (
                                  <img src={animalData.imagen} alt={pago.ANIMAL} className="w-6 h-6 object-contain" />
                                )}
                                <span>{pago.ANIMAL}</span>
                              </div>
                            </TableCell>
                            <TableCell>{pago.NOMBRE_SUCURSAL || '-'}</TableCell>
                            <TableCell className="text-right">
                              ${(parseFloat(pago.VALOR_APOSTADO) || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              ${(parseFloat(pago.VALOR_GANADO) || 0).toLocaleString()}
                            </TableCell>
                            <TableCell>{pago.USUARIO || '-'}</TableCell>
                            <TableCell>
                              {pago.FECHA_PAGO
                                ? format(new Date(pago.FECHA_PAGO), 'dd/MM/yyyy HH:mm')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay pagos para mostrar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!datos && !isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Seleccione los filtros y presione "Generar Informe"</p>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </DashboardLayout>
  );
}
