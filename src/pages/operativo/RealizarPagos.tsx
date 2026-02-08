import { useState, useEffect } from 'react';
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
import { Search, DollarSign, CheckCircle2, Loader2, Clock, AlertTriangle, CalendarX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays } from 'date-fns';
import { getAnimalByNombre } from '@/constants/animals';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RealizarPagos() {
  const { user } = useAuth();
  const [ganadores, setGanadores] = useState<any[]>([]);
  const [proximosAVencer, setProximosAVencer] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingRadicado, setProcessingRadicado] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({
    radicado: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
  });

  // Configuración: minutos de espera después del sorteo
  const MINUTOS_ESPERA_PAGO = 1;
  const DIAS_LIMITE_COBRO = 3;

 useEffect(() => {
     if (user?.tipo === '0' || user?.tipo === '1') {
       cargarProximosAVencer();
     }
   }, [user]);

  // Función para validar si se puede mostrar/pagar
  const calcularEstadoPago = (fechaSorteo: string, horaJuego: string, fechaPago?: string): {
    puedeMostrar: boolean;
    puedePagar: boolean;
    diasRestantes: number;
    mensaje?: string;
    estaVencido: boolean;
  } => {
    try {
      const [year, month, day] = fechaSorteo.split('-').map(Number);
      const horaParts = horaJuego.split(':');
      const horas = parseInt(horaParts[0] || '0', 10);
      const minutos = parseInt(horaParts[1] || '0', 10);
      const segundos = parseInt(horaParts[2] || '0', 10);

      const fechaSorteoDate = new Date(year, month - 1, day, horas, minutos, segundos);
      const fechaPermitidaMostrar = new Date(fechaSorteoDate.getTime() + MINUTOS_ESPERA_PAGO * 60 * 1000);
      const fechaLimiteCobro = new Date(year, month - 1, day + DIAS_LIMITE_COBRO, 23, 59, 59);
      const ahora = new Date();

      const diasRestantes = Math.ceil((fechaLimiteCobro.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
      const estaVencido = ahora > fechaLimiteCobro;
      const puedeMostrar = ahora >= fechaPermitidaMostrar;
      const puedePagar = puedeMostrar && !estaVencido;

      let mensaje = '';
      if (!puedeMostrar) {
        const minutosRestantes = Math.ceil((fechaPermitidaMostrar.getTime() - ahora.getTime()) / (60 * 1000));
        mensaje = `Espere ${minutosRestantes} minuto${minutosRestantes !== 1 ? 's' : ''}`;
      } else if (estaVencido) {
        mensaje = 'Plazo vencido';
      } else if (diasRestantes <= 0) {
        mensaje = 'Último día';
      } else {
        mensaje = `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}`;
      }

      return {
        puedeMostrar,
        puedePagar,
        diasRestantes: Math.max(0, diasRestantes),
        mensaje,
        estaVencido
      };
    } catch (error) {
      console.error('Error al calcular estado de pago:', error);
      return {
        puedeMostrar: false,
        puedePagar: false,
        diasRestantes: 0,
        mensaje: 'Error',
        estaVencido: false
      };
    }
  };

  const cargarProximosAVencer = async () => {
    try {
      const response = await pagosAPI.proximosAVencer();
      if (response.success) {
        setProximosAVencer(response.data || []);
      }
    } catch (error: any) {
      console.error('Error al cargar próximos a vencer:', error);
    }
  };

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
        const todasLasJugadas = response.data || [];
        
        // Filtrar y validar cada jugada
        const jugadasValidas = todasLasJugadas.filter((jugada: any) => {
          const estado = calcularEstadoPago(
            jugada.FECHA_SORTEO,
            jugada.HORAJUEGO,
            jugada.FECHA_PAGO
          );
          return estado.puedeMostrar && !estado.estaVencido;
        }).map((jugada: any) => ({
          ...jugada,
          estadoPago: calcularEstadoPago(jugada.FECHA_SORTEO, jugada.HORAJUEGO, jugada.FECHA_PAGO)
        }));

        setGanadores(jugadasValidas);

        if (jugadasValidas.length === 0) {
          if (todasLasJugadas.length > 0) {
            const primeraJugada = todasLasJugadas[0];
            const estado = calcularEstadoPago(primeraJugada.FECHA_SORTEO, primeraJugada.HORAJUEGO);
            
            if (estado.estaVencido) {
              toast.error('Las jugadas encontradas ya expiraron (más de 3 días)');
            } else {
              toast.info('Jugadas encontradas pero aún no disponibles', {
                description: `${estado.mensaje}. Los pagos se habilitan ${MINUTOS_ESPERA_PAGO} minuto(s) después del sorteo.`,
                duration: 5000,
              });
            }
          } else {
            toast.info('No se encontraron jugadas ganadoras');
          }
        } else {
          const jugadasOcultadas = todasLasJugadas.length - jugadasValidas.length;
          if (jugadasOcultadas > 0) {
            toast.success(`${jugadasValidas.length} jugada(s) disponible(s) para pago`, {
              description: `${jugadasOcultadas} jugada(s) no disponible(s) (en espera o vencidas)`,
              duration: 4000,
            });
          } else {
            toast.success(`${jugadasValidas.length} jugada(s) ganadora(s) encontrada(s)`);
          }
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
    const diasRestantes = jugada.estadoPago?.diasRestantes || 0;
    
    if (!jugada.estadoPago?.puedePagar) {
      toast.error('Esta jugada no puede ser pagada en este momento');
      return;
    }

    const mensaje = diasRestantes === 0
      ? '⚠️ ÚLTIMO DÍA PARA COBRAR'
      : diasRestantes === 1
      ? '⚠️ Quedan 24 horas para cobrar'
      : `Quedan ${diasRestantes} días para cobrar`;

    if (!confirm(`${mensaje}\n\n¿Confirmar pago de ${formatCurrency(valorPagar)} para el radicado ${jugada.RADICADO}?`)) {
      return;
    }

    try {
      setProcessingRadicado(jugada.RADICADO);
      const result = await pagosAPI.realizarPago({
        radicado: jugada.RADICADO,
        usuario: user?.nick || '',
      });

      if (result.success) {
        toast.success('Pago realizado exitosamente', {
          description: `Total pagado: ${formatCurrency(result.data?.total_pagado || 0)}`,
          duration: 5000,
        });
        handleBuscar();
        cargarProximosAVencer();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Error al realizar pago';
      toast.error(errorMsg);
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
              Buscar y pagar jugadas ganadoras (plazo: 3 días)
            </p>
          </div>
        </div>

        {/* Alerta de información */}
        <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            <strong>Importante:</strong> Los ganadores tienen 3 días calendario para cobrar sus premios desde la fecha del sorteo. 
            Los pagos se habilitan {MINUTOS_ESPERA_PAGO} minuto(s) después de cada sorteo.
          </AlertDescription>
        </Alert>

        {/* Alertas de jugadas próximas a vencer */}
        {proximosAVencer.length > 0 && (user?.tipo === '0' || user?.tipo === '1') && (
          <Alert className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              <strong>¡Atención!</strong> Hay {proximosAVencer.length} jugada(s) ganadora(s) próxima(s) a vencer (≤1 día restante).
              <div className="mt-2 space-y-1">
                {proximosAVencer.slice(0, 3).map((jugada: any) => (
                  <div key={jugada.RADICADO} className="text-sm">
                    • Radicado {jugada.RADICADO} - {jugada.NOMBRE_SUCURSAL} - {formatCurrency(parseFloat(jugada.TOTAL_A_PAGAR))} 
                    ({jugada.DIAS_RESTANTES} día{jugada.DIAS_RESTANTES !== 1 ? 's' : ''} restante{jugada.DIAS_RESTANTES !== 1 ? 's' : ''})
                  </div>
                ))}
                {proximosAVencer.length > 3 && (
                  <div className="text-sm">... y {proximosAVencer.length - 3} más</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Buscar Jugadas Ganadoras</CardTitle>
            <CardDescription>
              Busque por radicado o fecha de sorteo. Solo se mostrarán jugadas dentro del plazo de cobro.
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
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fecha">Fecha de Sorteo</Label>
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
                Jugadas Ganadoras Disponibles
                <Badge variant="secondary">{ganadores.length}</Badge>
              </CardTitle>
              <CardDescription>
                Jugadas dentro del plazo de cobro ({DIAS_LIMITE_COBRO} días desde el sorteo)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Radicado</TableHead>
                      <TableHead>Fecha Sorteo</TableHead>
                      <TableHead>Sucursal</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Animal Ganador</TableHead>
                      <TableHead className="text-right">Apostado</TableHead>
                      <TableHead className="text-right">A Pagar</TableHead>
                      <TableHead>Plazo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ganadores.map((jugada, index) => {
                      const animalData = getAnimalByNombre(jugada.ANIMAL);
                      const valorApostado = parseFloat(jugada.VALOR_APOSTADO || 0);
                      const valorPagar = parseFloat(jugada.VALOR_GANADO || 0);
                      const estado = jugada.estadoPago;
                      const urgente = estado.diasRestantes <= 1;

                      return (
                        <TableRow key={`${jugada.RADICADO}-${jugada.CODANIMAL}-${index}`} 
                                  className={urgente && jugada.ESTADO_PAGO !== 'PAGADO' ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
                          <TableCell className="font-mono font-medium">
                            {jugada.RADICADO}
                          </TableCell>
                          <TableCell>
                            {jugada.FECHA_SORTEO ? format(new Date(jugada.FECHA_SORTEO + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
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
                                #{jugada.CODANIMAL?.toString()}
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
                            {estado.diasRestantes === 0 ? (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <CalendarX className="h-3 w-3" />
                                ÚLTIMO DÍA
                              </Badge>
                            ) : estado.diasRestantes === 1 ? (
                              <Badge variant="outline" className="flex items-center gap-1 border-amber-500 text-amber-600">
                                <AlertTriangle className="h-3 w-3" />
                                1 día
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {estado.diasRestantes} días
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {jugada.ESTADO_PAGO === 'PAGADO' ? (
                              <div>
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  PAGADO
                                </Badge>
                                {jugada.FECHA_PAGO && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(jugada.FECHA_PAGO), 'dd/MM/yyyy')}
                                  </div>
                                )}
                              </div>
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
                                className={urgente ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}
                              >
                                {processingRadicado === jugada.RADICADO ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Procesando...
                                  </>
                                ) : (
                                  <>
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    {urgente ? '⚠️ Pagar' : 'Pagar'}
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
                <p>No hay jugadas ganadoras disponibles para mostrar</p>
                <p className="text-sm mt-2">
                  Las jugadas aparecen {MINUTOS_ESPERA_PAGO} minuto(s) después del sorteo y tienen {DIAS_LIMITE_COBRO} días de plazo
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}