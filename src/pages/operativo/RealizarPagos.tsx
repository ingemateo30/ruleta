import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { pagosAPI } from '@/api/admin';
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
import { Search, DollarSign, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { getAnimalByNumero } from '@/constants/animals';

export default function RealizarPagos() {
  const { user } = useAuth();
  const [ganadores, setGanadores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingRadicado, setProcessingRadicado] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({
    radicado: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
  });

  // Calcular totales
  const totales = ganadores.reduce((acc, g) => {
    acc.apostado += parseFloat(g.VALOR_APOSTADO || 0);
    acc.aPagar += parseFloat(g.VALOR_GANADO || 0);
    if (g.ESTADO_PAGO === 'PAGADO') {
      acc.pagado += parseFloat(g.VALOR_GANADO || 0);
    } else {
      acc.pendiente += parseFloat(g.VALOR_GANADO || 0);
    }
    return acc;
  }, { apostado: 0, aPagar: 0, pagado: 0, pendiente: 0 });

  const handleBuscar = async () => {
    if (!searchParams.radicado && !searchParams.fecha) {
      toast.error('Ingrese al menos un criterio de búsqueda');
      return;
    }

    try {
      setIsLoading(true);
      const params: any = {};
      if (searchParams.radicado) params.radicado = searchParams.radicado;
      if (searchParams.fecha) params.fecha = searchParams.fecha;

      const response = await pagosAPI.buscarGanadores(params);

      if (response.success) {
        setGanadores(response.data || []);
        if (!response.data || response.data.length === 0) {
          toast.info('No se encontraron jugadas ganadoras');
        } else {
          toast.success(`Se encontraron ${response.data.length} jugadas ganadoras`);
        }
      }
    } catch (error: any) {
      toast.error('Error al buscar ganadores: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRealizarPago = async (jugada: any) => {
    const valorPagar = parseFloat(jugada.VALOR_GANADO || 0);
    if (!confirm(`¿Confirmar pago de $${valorPagar.toLocaleString('es-CO')} para el radicado ${jugada.RADICADO}?`)) {
      return;
    }

    try {
      setProcessingRadicado(jugada.RADICADO);
      const result = await pagosAPI.realizarPago({
        radicado: jugada.RADICADO,
        usuario: user?.nick || '',
      });

      if (result.success) {
        toast.success('Pago realizado exitosamente');
        handleBuscar();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al realizar pago');
    } finally {
      setProcessingRadicado(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatHora = (hora: string): string => {
    if (!hora) return "-";
    const partes = hora.split(":");
    if (partes.length < 2) return hora;
    const horas = parseInt(partes[0], 10);
    const minutos = partes[1];
    const ampm = horas >= 12 ? "PM" : "AM";
    const horas12 = horas % 12 || 12;
    return `${horas12}:${minutos} ${ampm}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-primary" />
              Realizar Pagos
            </h1>
            <p className="text-muted-foreground mt-1">
              Buscar y pagar jugadas ganadoras
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar Jugadas Ganadoras</CardTitle>
            <CardDescription>
              Busca por radicado o por fecha para encontrar las jugadas pendientes de pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="radicado">Radicado</Label>
                <Input
                  id="radicado"
                  value={searchParams.radicado}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, radicado: e.target.value })
                  }
                  placeholder="Ingrese el radicado"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={searchParams.fecha}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, fecha: e.target.value })
                  }
                />
              </div>

              <div className="flex items-end md:col-span-2">
                <Button onClick={handleBuscar} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? 'Buscando...' : 'Buscar Ganadores'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de totales */}
        {ganadores.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Apostado</div>
                <div className="text-xl font-bold text-blue-600">{formatCurrency(totales.apostado)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total a Pagar</div>
                <div className="text-xl font-bold text-purple-600">{formatCurrency(totales.aPagar)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Ya Pagado</div>
                <div className="text-xl font-bold text-green-600">{formatCurrency(totales.pagado)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Pendiente</div>
                <div className="text-xl font-bold text-yellow-600">{formatCurrency(totales.pendiente)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {ganadores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Jugadas Ganadoras Encontradas
                <Badge variant="secondary">{ganadores.length}</Badge>
              </CardTitle>
              <CardDescription>
                Se encontraron {ganadores.length} jugadas ganadoras para procesar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Radicado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Sucursal</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Animal Ganador</TableHead>
                      <TableHead className="text-right">Apostado</TableHead>
                      <TableHead className="text-right">A Pagar</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ganadores.map((jugada, index) => {
                      const animalData = getAnimalByNumero(parseInt(jugada.CODANIMAL || '0'));
                      const valorApostado = parseFloat(jugada.VALOR_APOSTADO || 0);
                      const valorPagar = parseFloat(jugada.VALOR_GANADO || 0);

                      return (
                        <TableRow key={`${jugada.RADICADO}-${jugada.CODANIMAL}-${index}`}>
                          <TableCell className="font-mono font-medium">
                            {jugada.RADICADO}
                          </TableCell>
                          <TableCell>
                            {jugada.FECHA ? format(new Date(jugada.FECHA + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell>{jugada.NOMBRE_SUCURSAL || '-'}</TableCell>
                          <TableCell>
                            <span className="font-mono">{formatHora(jugada.HORAJUEGO || '')}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {animalData && (
                                <img
                                  src={animalData.imagen}
                                  alt={jugada.ANIMAL}
                                  className="w-8 h-8 object-contain"
                                />
                              )}
                              <span className="font-semibold">
                                {jugada.ANIMAL}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                #{jugada.CODANIMAL?.toString().padStart(2, '0')}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(valorApostado)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(valorPagar)}
                          </TableCell>
                          <TableCell>
                            {jugada.ESTADO_PAGO === 'PAGADO' ? (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                PAGADO
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                                PENDIENTE
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {jugada.ESTADO_PAGO !== 'PAGADO' && (
                              <Button
                                onClick={() => handleRealizarPago(jugada)}
                                disabled={processingRadicado === jugada.RADICADO}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {processingRadicado === jugada.RADICADO ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Procesando...
                                  </>
                                ) : (
                                  <>
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Pagar
                                  </>
                                )}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && ganadores.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay jugadas ganadoras para mostrar</p>
                <p className="text-sm">Utilice los filtros para buscar jugadas ganadoras</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
