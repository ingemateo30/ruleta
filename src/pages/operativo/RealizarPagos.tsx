import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { pagosAPI } from '@/api/admin';
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
import { Search, DollarSign, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export default function RealizarPagos() {
  const { user } = useAuth();
  const [ganadores, setGanadores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingRadicado, setProcessingRadicado] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({
    radicado: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
  });

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
        setGanadores(response.data);
        if (response.data.length === 0) {
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
    if (!confirm(`¿Confirmar pago de $${jugada.VALOR_PAGAR?.toLocaleString()} para el radicado ${jugada.RADICADO}?`)) {
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
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
          <div className="grid gap-4 md:grid-cols-3">
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

            <div className="flex items-end">
              <Button onClick={handleBuscar} disabled={isLoading} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {ganadores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Jugadas Ganadoras Encontradas</CardTitle>
            <CardDescription>
              Total: {ganadores.length} jugadas ganadoras
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
                  <TableHead>Animal Ganador</TableHead>
                  <TableHead className="text-right">Valor Apostado</TableHead>
                  <TableHead className="text-right">Valor a Pagar</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ganadores.map((jugada) => (
                  <TableRow key={jugada.RADICADO}>
                    <TableCell className="font-mono font-medium">
                      {jugada.RADICADO}
                    </TableCell>
                    <TableCell>
                      {jugada.FECHA ? format(new Date(jugada.FECHA), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>{jugada.NOMBRE_SUCURSAL || '-'}</TableCell>
                    <TableCell>
                      <span className="font-mono">{jugada.HORA || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {jugada.ANIMAL_NOMBRE || jugada.NUM_ANIMAL} - {jugada.ANIMAL_NOMBRE}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${(jugada.VALOR_APOSTADO || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      ${(jugada.VALOR_PAGAR || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {jugada.ESTADO_PAGO === 'PAGADO' ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          <CheckCircle2 className="h-3 w-3 inline mr-1" />
                          PAGADO
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                          PENDIENTE
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {jugada.ESTADO_PAGO !== 'PAGADO' && (
                        <Button
                          onClick={() => handleRealizarPago(jugada)}
                          disabled={processingRadicado === jugada.RADICADO}
                          size="sm"
                        >
                          {processingRadicado === jugada.RADICADO
                            ? 'Procesando...'
                            : 'Realizar Pago'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!isLoading && ganadores.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay jugadas ganadoras para mostrar</p>
              <p className="text-sm">Utilice los filtros para buscar jugadas</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
