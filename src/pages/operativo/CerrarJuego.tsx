import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { cerrarJuegoAPI, sucursalesAPI, parametrosAPI } from '@/api/admin';
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
import { Lock, CheckCircle2, XCircle, Building2, AlertTriangle, AlertCircle, Loader2, Calendar, Search, TrendingUp, DollarSign, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, subDays } from 'date-fns';
import { getAnimalByNombre } from '@/constants/animals';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CerrarJuego() {
  const { user } = useAuth();
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [horariosPendientes, setHorariosPendientes] = useState<any[]>([]);
  const [cierres, setCierres] = useState<any[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [parametros, setParametros] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    codigo_sucursal: '',
  });

  // Filtros para el historial
  const [filtroHistorial, setFiltroHistorial] = useState({
    fecha_inicio: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    fecha_fin: format(new Date(), 'yyyy-MM-dd'),
    sucursal: '',
  });

  // Estadísticas
  const [estadisticas, setEstadisticas] = useState({
    totalApostado: 0,
    totalPagoPotencial: 0,
    totalPagadoReal: 0,
    totalPendiente: 0,
    utilidadProyectada: 0,
    utilidadReal: 0,
    totalCierres: 0,
  });

  useEffect(() => {
    cargarSucursales();
    cargarCierres();
    cargarParametros();
    cargarHorariosPendientes();
  }, []);

  const cargarSucursales = async () => {
    try {
      const response = await sucursalesAPI.listar();
      if (response.success) {
        setSucursales(response.data || []);
      }
    } catch (error: any) {
      toast.error('Error al cargar sucursales: ' + error.message);
    }
  };

  const cargarParametros = async () => {
    try {
      const response = await parametrosAPI.listar();
      if (response.success && response.data) {
        const params: any = {};
        response.data.forEach((p: any) => {
          params[p.NOMBRE] = parseFloat(p.VALOR) || p.VALOR;
        });
        setParametros(params);
      }
    } catch (error: any) {
      console.error('Error al cargar parámetros:', error);
    }
  };

  const cargarHorariosPendientes = async () => {
    try {
      const response = await cerrarJuegoAPI.pendientes({ fecha: formData.fecha });
      if (response.success) {
        setHorariosPendientes(response.data || []);
      }
    } catch (error: any) {
      console.error('Error al cargar horarios pendientes:', error);
    }
  };

  const cargarCierres = async (filtros?: typeof filtroHistorial) => {
    try {
      const params = filtros || filtroHistorial;
      const response = await cerrarJuegoAPI.listar({
        fecha_inicio: params.fecha_inicio,
        fecha_fin: params.fecha_fin,
      });
      if (response.success) {
        let data = response.data || [];

        // Filtrar por sucursal si se especifica
        if (params.sucursal) {
          data = data.filter((c: any) =>
            c.CODIGO_SUCURSAL?.toString() === params.sucursal
          );
        }

        setCierres(data);

        // Calcular estadísticas
        const stats = data.reduce((acc: any, cierre: any) => {
          acc.totalApostado += parseFloat(cierre.TOTAL_APOSTADO || 0);
          acc.totalPagoPotencial += parseFloat(cierre.PAGO_POTENCIAL_GANADORES || 0);
          acc.totalPagadoReal += parseFloat(cierre.TOTAL_PAGADO_REAL || 0);
          acc.totalPendiente += parseFloat(cierre.PAGOS_PENDIENTES || 0);
          acc.utilidadProyectada += parseFloat(cierre.UTILIDAD_PROYECTADA || 0);
          acc.utilidadReal += parseFloat(cierre.UTILIDAD_REAL || 0);
          acc.totalCierres += 1;
          return acc;
        }, {
          totalApostado: 0,
          totalPagoPotencial: 0,
          totalPagadoReal: 0,
          totalPendiente: 0,
          utilidadProyectada: 0,
          utilidadReal: 0,
          totalCierres: 0
        });

        setEstadisticas(stats);
      }
    } catch (error: any) {
      console.error('Error al cargar cierres:', error);
    }
  };

  const handleBuscarHistorial = () => {
    cargarCierres(filtroHistorial);
  };

  const handleCerrarDia = async () => {
    // Validar que haya horarios pendientes con ganador
    const horariosConGanador = horariosPendientes.filter(h => h.ANIMAL_GANADOR && h.ESTADO === 'PENDIENTE');
    
    if (horariosConGanador.length === 0) {
      toast.error('No hay horarios pendientes con resultado registrado');
      return;
    }

    const sucursalSeleccionada = sucursales.find(s => s.CODIGO?.toString() === formData.codigo_sucursal);
    const mensajeConfirmacion = formData.codigo_sucursal
      ? `¿Cerrar todos los sorteos del ${format(new Date(formData.fecha + 'T00:00:00'), 'dd/MM/yyyy')} para la sucursal "${sucursalSeleccionada?.BODEGA}"?\n\nSe cerrarán ${horariosConGanador.length} horario(s). Esta acción no se puede deshacer.`
      : `¿Cerrar todos los sorteos del ${format(new Date(formData.fecha + 'T00:00:00'), 'dd/MM/yyyy')} para TODAS las sucursales?\n\nSe cerrarán ${horariosConGanador.length} horario(s) en múltiples sucursales. Esta acción no se puede deshacer.`;

    if (!confirm(mensajeConfirmacion)) {
      return;
    }

    try {
      setIsProcessing(true);
      const requestData: any = {
        fecha: formData.fecha,
        usuario: user?.nick || '',
      };

      if (formData.codigo_sucursal) {
        requestData.codigo_sucursal = parseInt(formData.codigo_sucursal);
      }

      const response = await cerrarJuegoAPI.ejecutar(requestData);

      if (response.success) {
        toast.success(response.message || 'Cierres realizados exitosamente', {
          description: `Se procesaron ${response.data?.cantidad_cierres || 0} cierre(s)`,
          duration: 5000,
        });
        setResumen(response.data);
        cargarCierres();
        cargarHorariosPendientes();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cerrar juegos');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Agrupar cierres por sucursal
  const cierresPorSucursal = cierres.reduce((acc: any, cierre: any) => {
    const sucursal = cierre.NOMBRE_SUCURSAL || 'Sin Sucursal';
    if (!acc[sucursal]) {
      acc[sucursal] = {
        cierres: [],
        totalApostado: 0,
        totalPagoPotencial: 0,
        totalPagadoReal: 0,
        totalPendiente: 0,
        utilidadProyectada: 0,
        utilidadReal: 0,
      };
    }
    acc[sucursal].cierres.push(cierre);
    acc[sucursal].totalApostado += parseFloat(cierre.TOTAL_APOSTADO || 0);
    acc[sucursal].totalPagoPotencial += parseFloat(cierre.PAGO_POTENCIAL_GANADORES || 0);
    acc[sucursal].totalPagadoReal += parseFloat(cierre.TOTAL_PAGADO_REAL || 0);
    acc[sucursal].totalPendiente += parseFloat(cierre.PAGOS_PENDIENTES || 0);
    acc[sucursal].utilidadProyectada += parseFloat(cierre.UTILIDAD_PROYECTADA || 0);
    acc[sucursal].utilidadReal += parseFloat(cierre.UTILIDAD_REAL || 0);
    return acc;
  }, {});

  // Horarios por estado
  const horariosPorEstado = horariosPendientes.reduce((acc: any, h: any) => {
    if (!acc[h.ESTADO]) acc[h.ESTADO] = [];
    acc[h.ESTADO].push(h);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Lock className="h-8 w-8 text-primary" />
              Cerrar Juegos del Día
            </h1>
            <p className="text-muted-foreground mt-1">
              Cierre masivo de todos los sorteos del día
            </p>
          </div>
        </div>

        {/* Guía de uso */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-sm space-y-2">
                <p className="font-semibold text-blue-800 dark:text-blue-300">Sistema de cierre mejorado:</p>
                <ul className="list-disc list-inside text-blue-700 dark:text-blue-400 space-y-1">
                  <li><strong>Cierre del día completo:</strong> Se cierran todos los horarios con resultado registrado</li>
                  <li><strong>Control financiero:</strong> Se registra pago potencial vs pago real (hay 3 días para cobrar)</li>
                  <li><strong>Por sucursal:</strong> Puede cerrar todas las sucursales o solo una específica</li>
                  <li><strong>Sin pagos obligatorios:</strong> El cierre no requiere que todos los premios estén pagados</li>
                </ul>
                <Alert className="mt-3 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    Los ganadores tienen 3 días para cobrar sus premios. El sistema mantiene control de pagos pendientes.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="cerrar" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cerrar">Cerrar Día</TabsTrigger>
            <TabsTrigger value="pendientes">Horarios Pendientes</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="cerrar" className="space-y-6">
            {/* Selector de fecha y sucursal */}
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Fecha y Sucursal</CardTitle>
                <CardDescription>
                  Cierre todos los sorteos del día seleccionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="fecha">Fecha del Cierre</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => {
                        setFormData({ ...formData, fecha: e.target.value });
                        // Recargar horarios pendientes cuando cambia la fecha
                        setTimeout(() => cargarHorariosPendientes(), 100);
                      }}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="sucursal" className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Sucursal (Opcional)
                    </Label>
                    <Select
                      value={formData.codigo_sucursal}
                      onValueChange={(value) =>
                        setFormData({ ...formData, codigo_sucursal: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las sucursales" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Todas las sucursales</SelectItem>
                        {sucursales.map((sucursal) => (
                          <SelectItem key={sucursal.CODIGO} value={sucursal.CODIGO.toString()}>
                            {sucursal.BODEGA}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={handleCerrarDia}
                      disabled={isProcessing}
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Cerrando...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Ejecutar Cierre del Día
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumen de cierre ejecutado */}
            {resumen && (
              <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-5 w-5" />
                    Cierre Completado Exitosamente
                  </CardTitle>
                  <CardDescription>
                    Se procesaron {resumen.cantidad_cierres} cierre(s) de sorteos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className="text-sm font-medium text-muted-foreground">Total Apostado</div>
                      <div className="text-xl font-bold">{formatCurrency(resumen.resumen?.total_apostado || 0)}</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className="text-sm font-medium text-muted-foreground">Pago Potencial</div>
                      <div className="text-xl font-bold text-purple-600">{formatCurrency(resumen.resumen?.total_pago_potencial || 0)}</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className="text-sm font-medium text-muted-foreground">Ya Pagado</div>
                      <div className="text-xl font-bold text-green-600">{formatCurrency(resumen.resumen?.total_pagado_real || 0)}</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className="text-sm font-medium text-muted-foreground">Pendiente Pago</div>
                      <div className="text-xl font-bold text-amber-600">{formatCurrency(resumen.resumen?.total_pendiente || 0)}</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className="text-sm font-medium text-muted-foreground">Utilidad Proyectada</div>
                      <div className="text-xl font-bold text-blue-600">{formatCurrency(resumen.resumen?.utilidad_proyectada_total || 0)}</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className="text-sm font-medium text-muted-foreground">Utilidad Real</div>
                      <div className="text-xl font-bold text-cyan-600">{formatCurrency(resumen.resumen?.utilidad_real_total || 0)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pendientes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" />
                  Estado de Horarios para {format(new Date(formData.fecha + 'T00:00:00'), 'dd/MM/yyyy')}
                </CardTitle>
                <CardDescription>
                  Horarios con y sin resultado registrado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {horariosPendientes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay información de horarios para esta fecha</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Horarios pendientes */}
                    {horariosPorEstado.PENDIENTE && horariosPorEstado.PENDIENTE.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-amber-500" />
                          Pendientes de Cierre ({horariosPorEstado.PENDIENTE.length})
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                          {horariosPorEstado.PENDIENTE.map((h: any) => (
                            <div key={h.NUM} className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/20 border-amber-200">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-semibold">{h.HORA}</span>
                                <Badge variant={h.ANIMAL_GANADOR ? "default" : "secondary"}>
                                  {h.ANIMAL_GANADOR ? "Con Resultado" : "Sin Resultado"}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">{h.DESCRIPCION}</div>
                              {h.ANIMAL_GANADOR && (
                                <div className="text-sm font-medium text-green-600 mt-1">
                                  Ganador: {h.ANIMAL_GANADOR}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Horarios cerrados */}
                    {horariosPorEstado.CERRADO && horariosPorEstado.CERRADO.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Ya Cerrados ({horariosPorEstado.CERRADO.length})
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                          {horariosPorEstado.CERRADO.map((h: any) => (
                            <div key={h.NUM} className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-semibold">{h.HORA}</span>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="text-sm text-muted-foreground">{h.DESCRIPCION}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial" className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Filtros de Búsqueda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="grid gap-2">
                    <Label>Fecha Inicio</Label>
                    <Input
                      type="date"
                      value={filtroHistorial.fecha_inicio}
                      onChange={(e) =>
                        setFiltroHistorial({ ...filtroHistorial, fecha_inicio: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Fecha Fin</Label>
                    <Input
                      type="date"
                      value={filtroHistorial.fecha_fin}
                      onChange={(e) =>
                        setFiltroHistorial({ ...filtroHistorial, fecha_fin: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Sucursal</Label>
                    <Select
                      value={filtroHistorial.sucursal}
                      onValueChange={(value) =>
                        setFiltroHistorial({ ...filtroHistorial, sucursal: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Todas las sucursales</SelectItem>
                        {sucursales.map((s) => (
                          <SelectItem key={s.CODIGO} value={s.CODIGO.toString()}>
                            {s.BODEGA}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleBuscarHistorial} className="w-full">
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas generales */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Apostado</p>
                      <p className="text-lg font-bold">{formatCurrency(estadisticas.totalApostado)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pago Potencial</p>
                      <p className="text-lg font-bold">{formatCurrency(estadisticas.totalPagoPotencial)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pagado Real</p>
                      <p className="text-lg font-bold">{formatCurrency(estadisticas.totalPagadoReal)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <CalendarClock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pendiente</p>
                      <p className="text-lg font-bold">{formatCurrency(estadisticas.totalPendiente)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Util. Proyectada</p>
                      <p className="text-lg font-bold">{formatCurrency(estadisticas.utilidadProyectada)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Util. Real</p>
                      <p className="text-lg font-bold">{formatCurrency(estadisticas.utilidadReal)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <Lock className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Cierres</p>
                      <p className="text-lg font-bold">{estadisticas.totalCierres}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumen por sucursal */}
            {Object.keys(cierresPorSucursal).length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Resumen por Sucursal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(cierresPorSucursal).map(([sucursal, data]: [string, any]) => (
                      <div key={sucursal} className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-lg mb-3">{sucursal}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cierres:</span>
                            <span className="font-medium">{data.cierres.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Apostado:</span>
                            <span className="font-medium">{formatCurrency(data.totalApostado)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pago Potencial:</span>
                            <span className="font-medium text-purple-600">{formatCurrency(data.totalPagoPotencial)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pagado Real:</span>
                            <span className="font-medium text-green-600">{formatCurrency(data.totalPagadoReal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pendiente:</span>
                            <span className="font-medium text-amber-600">{formatCurrency(data.totalPendiente)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-muted-foreground">Util. Real:</span>
                            <span className="font-bold text-cyan-600">{formatCurrency(data.utilidadReal)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabla de cierres */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Detalle de Cierres
                  <Badge variant="secondary">{cierres.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cierres.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay cierres en el periodo seleccionado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Horario</TableHead>
                          <TableHead>Sucursal</TableHead>
                          <TableHead>Animal</TableHead>
                          <TableHead className="text-right">Apostado</TableHead>
                          <TableHead className="text-right">Potencial</TableHead>
                          <TableHead className="text-right">Pagado</TableHead>
                          <TableHead className="text-right">Pendiente</TableHead>
                          <TableHead className="text-right">Util. Real</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cierres.map((cierre, index) => (
                          <TableRow key={cierre.ID || index}>
                            <TableCell>
                              {cierre.FECHA ? format(new Date(cierre.FECHA + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                            <TableCell className="font-mono">{cierre.HORA}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{cierre.NOMBRE_SUCURSAL || '-'}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {cierre.ANIMAL_GANADOR && (
                                  (() => {
                                    const animalData = getAnimalByNombre(cierre.ANIMAL_GANADOR);
                                    return animalData ? (
                                      <img
                                        src={animalData.imagen}
                                        alt={cierre.ANIMAL_GANADOR}
                                        className="w-6 h-6 object-contain"
                                      />
                                    ) : null;
                                  })()
                                )}
                                <span className="font-semibold">{cierre.ANIMAL_GANADOR}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(parseFloat(cierre.TOTAL_APOSTADO) || 0)}
                            </TableCell>
                            <TableCell className="text-right text-purple-600">
                              {formatCurrency(parseFloat(cierre.PAGO_POTENCIAL_GANADORES) || 0)}
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-semibold">
                              {formatCurrency(parseFloat(cierre.TOTAL_PAGADO_REAL) || 0)}
                            </TableCell>
                            <TableCell className="text-right text-amber-600 font-semibold">
                              {formatCurrency(parseFloat(cierre.PAGOS_PENDIENTES) || 0)}
                            </TableCell>
                            <TableCell className="text-right text-cyan-600 font-bold">
                              {formatCurrency(parseFloat(cierre.UTILIDAD_REAL) || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}