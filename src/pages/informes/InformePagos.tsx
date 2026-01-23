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
import { Receipt, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

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
    if (!datos) {
      toast.error('No hay datos para exportar');
      return;
    }

    const headers = [
      'Radicado',
      'Fecha Pago',
      'Sucursal',
      'Valor Pagado',
      'Usuario',
    ];
    const rows = datos.pagos?.map((item: any) => [
      item.radicado,
      item.fecha_pago,
      item.sucursal,
      item.valor_pagado,
      item.usuario,
    ]) || [];

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="h-8 w-8" />
            Informe de Pagos
          </h1>
          <p className="text-muted-foreground mt-1">
            Consulta de pagos realizados
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
                  ${(datos.totales?.promedio || 0).toLocaleString(undefined, {
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
                  {(datos.totales?.cantidad || 0).toLocaleString()}
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
              {datos.por_sucursal && datos.por_sucursal.length > 0 ? (
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
                    {datos.por_sucursal.map((sucursal: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {sucursal.sucursal}
                        </TableCell>
                        <TableCell className="text-right">
                          {(sucursal.cantidad || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${(sucursal.total_pagado || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${(sucursal.promedio || 0).toLocaleString(undefined, {
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Radicado</TableHead>
                      <TableHead>Fecha Pago</TableHead>
                      <TableHead>Sucursal</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead className="text-right">Valor Pagado</TableHead>
                      <TableHead>Usuario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datos.pagos.map((pago: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono font-medium">
                          {pago.radicado}
                        </TableCell>
                        <TableCell>
                          {pago.fecha_pago
                            ? format(new Date(pago.fecha_pago), 'dd/MM/yyyy HH:mm')
                            : '-'}
                        </TableCell>
                        <TableCell>{pago.sucursal || '-'}</TableCell>
                        <TableCell className="font-mono">{pago.horario || '-'}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ${(pago.valor_pagado || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>{pago.usuario || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay pagos para mostrar
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
