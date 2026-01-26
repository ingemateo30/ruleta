import { useState, useEffect } from 'react';
import { informesAPI, sucursalesAPI, horariosAPI } from '@/api/admin';
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
import { FileText, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export default function InformeJuegos() {
  const [jugadas, setJugadas] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
    fecha_fin: format(new Date(), 'yyyy-MM-dd'),
    sucursal: '',
    horario: '',
  });

  useEffect(() => {
    cargarOpciones();
  }, []);

  const cargarOpciones = async () => {
    try {
      const [sucursalesRes, horariosRes] = await Promise.all([
        sucursalesAPI.listar(),
        horariosAPI.listar(),
      ]);

      if (sucursalesRes.success) setSucursales(sucursalesRes.data);
      if (horariosRes.success) setHorarios(horariosRes.data);
    } catch (error: any) {
      console.error('Error al cargar opciones:', error);
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
      if (filtros.horario) params.horario = filtros.horario;

      const response = await informesAPI.juegos(params);

      if (response.success) {
        // API devuelve { juegos: [...], resumen: {...} }
        const juegosData = response.data?.juegos || response.data || [];
        setJugadas(juegosData);
        toast.success(`Se encontraron ${juegosData.length} jugadas`);
      }
    } catch (error: any) {
      toast.error('Error al generar informe: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calcularResumen = () => {
    const totalJugadas = jugadas.length;
    const totalApostado = jugadas.reduce((sum, j) => sum + parseFloat(j.TOTALJUEGO || j.TOTAL_APOSTADO || 0), 0);
    const promedio = totalJugadas > 0 ? totalApostado / totalJugadas : 0;

    return { totalJugadas, totalApostado, promedio };
  };

  const exportarCSV = () => {
    if (jugadas.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const headers = ['Radicado', 'Fecha', 'Sucursal', 'Horario', 'Animales', 'Total'];
    const rows = jugadas.map((j) => [
      j.RADICADO,
      j.FECHA ? format(new Date(j.FECHA), 'dd/MM/yyyy') : '',
      j.NOMBRE_SUCURSAL || '',
      j.HORARIO || j.HORA || '',
      j.DETALLE_ANIMALES || j.ANIMALES || '',
      j.TOTALJUEGO || j.TOTAL_APOSTADO || 0,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `informe_juegos_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Informe exportado exitosamente');
  };

  const resumen = calcularResumen();

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Informe de Juegos
          </h1>
          <p className="text-muted-foreground mt-1">
            Consulta de jugadas realizadas
          </p>
        </div>
        {jugadas.length > 0 && (
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
            Seleccione los criterios de búsqueda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
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

            <div className="grid gap-2">
              <Label htmlFor="horario">Horario</Label>
              <Select
                value={filtros.horario}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, horario: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {horarios.map((hor) => (
                    <SelectItem key={hor.NUM} value={hor.NUM.toString()}>
                      {hor.HORA} - {hor.DESCRIPCION}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleBuscar} disabled={isLoading} className="w-full">
                {isLoading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {jugadas.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Jugadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{resumen.totalJugadas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Apostado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${resumen.totalApostado.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Promedio por Jugada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  ${resumen.promedio.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
              <CardDescription>
                Total: {jugadas.length} jugadas encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Radicado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Animales</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jugadas.map((jugada, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono font-medium">
                        {jugada.RADICADO}
                      </TableCell>
                      <TableCell>
                        {jugada.FECHA ? format(new Date(jugada.FECHA + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>{jugada.NOMBRE_SUCURSAL || '-'}</TableCell>
                      <TableCell className="font-mono">{jugada.HORARIO || jugada.HORA || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{jugada.DETALLE_ANIMALES || jugada.ANIMALES || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${parseFloat(jugada.TOTALJUEGO || jugada.TOTAL_APOSTADO || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
    </DashboardLayout>
  );
}
