import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { cerrarJuegoAPI, horariosAPI, sucursalesAPI, parametrosAPI } from '@/api/admin';
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
import { Lock, CheckCircle2, XCircle, Building2, AlertTriangle, AlertCircle, Loader2, Calendar, Search, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, subDays } from 'date-fns';
import { getAnimalByNombre } from '@/constants/animals';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CerrarJuego() {
  const { user } = useAuth();
  const [horarios, setHorarios] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [cierres, setCierres] = useState<any[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [parametros, setParametros] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    codigo_horario: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    codigo_sucursal: '',
  });

  // Filtros para el historial
  const [filtroHistorial, setFiltroHistorial] = useState({
    fecha_inicio: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    fecha_fin: format(new Date(), 'yyyy-MM-dd'),
    sucursal: '',
  });

  // Estadisticas
  const [estadisticas, setEstadisticas] = useState({
    totalApostado: 0,
    totalPagado: 0,
    utilidad: 0,
    totalCierres: 0,
  });

  useEffect(() => {
    cargarHorarios();
    cargarSucursales();
    cargarCierres();
    cargarParametros();
  }, []);

  const cargarHorarios = async () => {
    try {
      const response = await horariosAPI.activos();
      if (response.success) {
        setHorarios(response.data || []);
      }
    } catch (error: any) {
      toast.error('Error al cargar horarios: ' + error.message);
    }
  };

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
      console.error('Error al cargar parametros:', error);
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
            c.CODIGO_SUCURSAL?.toString() === params.sucursal ||
            c.SUCURSAL === params.sucursal
          );
        }

        setCierres(data);

        // Calcular estadisticas
        const stats = data.reduce((acc: any, cierre: any) => {
          acc.totalApostado += parseFloat(cierre.TOTAL_APOSTADO || 0);
          acc.totalPagado += parseFloat(cierre.TOTAL_PAGADO || 0);
          acc.utilidad += parseFloat(cierre.UTILIDAD || 0);
          acc.totalCierres += 1;
          return acc;
        }, { totalApostado: 0, totalPagado: 0, utilidad: 0, totalCierres: 0 });

        setEstadisticas(stats);
      }
    } catch (error: any) {
      console.error('Error al cargar cierres:', error);
    }
  };

  const handleBuscarHistorial = () => {
    cargarCierres(filtroHistorial);
  };

  const handleVerificar = async () => {
    if (!formData.codigo_horario) {
      toast.error('Seleccione un horario');
      return;
    }

    try {
      setIsLoading(true);
      const response = await cerrarJuegoAPI.verificar({
        codigo_horario: parseInt(formData.codigo_horario),
        fecha: formData.fecha,
      });

      if (response.success) {
        if (response.cerrado) {
          setResumen({
            cerrado: true,
            ...response.data
          });
          toast.info('Este juego ya ha sido cerrado');
        } else {
          const totalApostado = parseFloat(response.data?.totales?.total_apostado || 0);
          const ganador = response.data?.ganador;

          setResumen({
            cerrado: false,
            total_apostado: totalApostado,
            total_jugadas: response.data?.totales?.total_jugadas || 0,
            ganador: ganador,
            animal_ganador: ganador?.ANIMAL || null,
            codigo_animal_ganador: ganador?.CODIGOA || null,
            horario: response.data?.horario,
            tiene_ganador: !!ganador
          });

          if (!ganador) {
            toast.warning('No hay animal ganador registrado para este horario. Debe ingresar el resultado primero.');
          } else {
            toast.success('El juego esta listo para cerrar');
          }
        }
      }
    } catch (error: any) {
      toast.error('Error al verificar: ' + error.message);
      setResumen(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCerrar = async () => {
    if (!resumen || resumen.cerrado) {
      toast.error('No se puede cerrar este juego');
      return;
    }

    if (!resumen.tiene_ganador) {
      toast.error('Debe registrar el animal ganador antes de cerrar el juego');
      return;
    }

    const sucursalSeleccionada = sucursales.find(s => s.CODIGO?.toString() === formData.codigo_sucursal);
    const mensajeConfirmacion = formData.codigo_sucursal
      ? `Esta seguro de cerrar este juego para la sucursal "${sucursalSeleccionada?.BODEGA}"? Esta accion no se puede deshacer.`
      : 'Esta seguro de cerrar este juego para TODAS las sucursales? Esta accion no se puede deshacer.';

    if (!confirm(mensajeConfirmacion)) {
      return;
    }

    try {
      setIsProcessing(true);
      const requestData: any = {
        codigo_horario: parseInt(formData.codigo_horario),
        fecha: formData.fecha,
        usuario: user?.nick || '',
      };

      if (formData.codigo_sucursal) {
        requestData.codigo_sucursal = parseInt(formData.codigo_sucursal);
      }

      const response = await cerrarJuegoAPI.ejecutar(requestData);

      if (response.success) {
        toast.success(response.message || 'Juego cerrado exitosamente');
        setResumen(null);
        setFormData({
          codigo_horario: '',
          fecha: format(new Date(), 'yyyy-MM-dd'),
          codigo_sucursal: '',
        });
        cargarCierres();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cerrar juego');
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

  const calcularDistribucion = () => {
    if (!resumen || resumen.cerrado) return null;

    const totalApostado = resumen.total_apostado || 0;
    const puntosPago = parametros.PUNTOSPAGO || 30;
    const porcentajeAdmin = parametros.PORCENTAJEADMINSUCURSAL || 7;
    const pagoAdminSucursal = (totalApostado * porcentajeAdmin) / 100;

    return {
      totalApostado,
      pagoAdminSucursal,
      puntosPago
    };
  };

  const distribucion = calcularDistribucion();

  // Agrupar cierres por sucursal para el reporte
  const cierresPorSucursal = cierres.reduce((acc: any, cierre: any) => {
    const sucursal = cierre.NOMBRE_SUCURSAL || cierre.SUCURSAL || 'Sin Sucursal';
    if (!acc[sucursal]) {
      acc[sucursal] = {
        cierres: [],
        totalApostado: 0,
        totalPagado: 0,
        utilidad: 0,
      };
    }
    acc[sucursal].cierres.push(cierre);
    acc[sucursal].totalApostado += parseFloat(cierre.TOTAL_APOSTADO || 0);
    acc[sucursal].totalPagado += parseFloat(cierre.TOTAL_PAGADO || 0);
    acc[sucursal].utilidad += parseFloat(cierre.UTILIDAD || 0);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Lock className="h-8 w-8 text-primary" />
              Cerrar Juego
            </h1>
            <p className="text-muted-foreground mt-1">
              Cierre de sorteos y liquidacion de resultados
            </p>
          </div>
        </div>

        {/* Guia de uso */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-sm space-y-1">
                <p className="font-semibold text-blue-800 dark:text-blue-300">Como funciona el cierre de juego:</p>
                <ol className="list-decimal list-inside text-blue-700 dark:text-blue-400 space-y-1">
                  <li><strong>Seleccione</strong> el horario del sorteo y la fecha</li>
                  <li><strong>Verifique</strong> que el resultado (animal ganador) ya este registrado</li>
                  <li><strong>Revise</strong> el resumen de apuestas, pagos y utilidades</li>
                  <li><strong>Confirme</strong> el cierre - esta accion es irreversible</li>
                </ol>
                <p className="text-blue-600 dark:text-blue-500 text-xs mt-2">
                  Nota: Debe registrar el resultado del sorteo antes de poder cerrar el juego.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="cerrar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cerrar">Cerrar Juego</TabsTrigger>
            <TabsTrigger value="historial">Historial de Cierres</TabsTrigger>
          </TabsList>
<TabsContent value="cerrar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paso 1: Seleccionar Sorteo</CardTitle>
                <CardDescription>
                  Elija el horario del sorteo que desea cerrar y la fecha correspondiente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="grid gap-2">
                    <Label htmlFor="horario">Horario</Label>
                    <Select
                      value={formData.codigo_horario}
                      onValueChange={(value) =>
                        setFormData({ ...formData, codigo_horario: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione horario" />
                      </SelectTrigger>
                      <SelectContent>
                        {horarios.map((horario) => (
                          <SelectItem key={horario.NUM} value={horario.NUM.toString()}>
                            {horario.HORA} - {horario.DESCRIPCION}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="sucursal" className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Sucursal
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

                  <div className="grid gap-2">
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={(e) =>
                        setFormData({ ...formData, fecha: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex items-end lg:col-span-2">
                    <Button
                      onClick={handleVerificar}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        'Verificar Estado'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {resumen && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {resumen.cerrado ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Juego Ya Cerrado
                      </>
                    ) : !resumen.tiene_ganador ? (
                      <>
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        Sin Resultado Registrado
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-blue-500" />
                        Resumen del Juego
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {resumen.cerrado
                      ? 'Este juego ya fue cerrado anteriormente'
                      : !resumen.tiene_ganador
                        ? 'Debe registrar el animal ganador antes de cerrar'
                        : 'Revise el resumen antes de cerrar'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Total Apostado
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(resumen.total_apostado || resumen.TOTAL_APOSTADO || 0)}
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm font-medium text-green-700 dark:text-green-300">
                        Animal Ganador
                      </div>
                      <div className="flex items-center gap-2">
                        {resumen.animal_ganador && (
                          (() => {
                            const animalData = getAnimalByNombre(resumen.animal_ganador);
                            return animalData ? (
                              <img
                                src={animalData.imagen}
                                alt={resumen.animal_ganador}
                                className="w-10 h-10 object-contain"
                              />
                            ) : null;
                          })()
                        )}
                        <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {resumen.animal_ganador || resumen.ANIMAL_GANADOR || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-sm font-medium text-red-700 dark:text-red-300">
                        Total Pagado
                      </div>
                      <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                        {formatCurrency(resumen.TOTAL_PAGADO || 0)}
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        Utilidad
                      </div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {formatCurrency(resumen.UTILIDAD || 0)}
                      </div>
                    </div>
                  </div>

                  {distribucion && !resumen.cerrado && resumen.tiene_ganador && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-3">Distribucion de Ingresos (Estimado)</h4>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="flex justify-between items-center p-2 bg-background rounded">
                          <span className="text-sm text-muted-foreground">Admin Sucursal (7%)</span>
                          <span className="font-semibold text-orange-600">
                            {formatCurrency(distribucion.pagoAdminSucursal)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-background rounded">
                          <span className="text-sm text-muted-foreground">Multiplicador de Pago</span>
                          <span className="font-semibold text-cyan-600">
                            x{distribucion.puntosPago}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-background rounded">
                          <span className="text-sm text-muted-foreground">Total Jugadas</span>
                          <span className="font-semibold text-indigo-600">
                            {resumen.total_jugadas || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!resumen.cerrado && resumen.tiene_ganador && (
                    <div className="mt-6 flex justify-end">
                      <Button
                        onClick={handleCerrar}
                        disabled={isProcessing}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Cerrando...
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Ejecutar Cierre
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {!resumen.cerrado && !resumen.tiene_ganador && (
                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">
                          Debe ir a "Ingresar Resultado" y registrar el animal ganador para este horario antes de poder cerrar el juego.
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

                  <TabsContent value="historial" className="space-y-6">
                    {/* Filtros del historial */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Filtros de Busqueda
                        </CardTitle>
                        <CardDescription>
                          Filtre los cierres por rango de fechas y sucursal
                        </CardDescription>
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

                    {/* Estadisticas generales */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <DollarSign className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Apostado</p>
                              <p className="text-2xl font-bold">{formatCurrency(estadisticas.totalApostado)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                              <DollarSign className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Pagado</p>
                              <p className="text-2xl font-bold">{formatCurrency(estadisticas.totalPagado)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                              <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Utilidad Total</p>
                              <p className="text-2xl font-bold text-green-600">{formatCurrency(estadisticas.utilidad)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <Lock className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Cierres</p>
                              <p className="text-2xl font-bold">{estadisticas.totalCierres}</p>
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
                                    <span className="text-muted-foreground">Pagado:</span>
                                    <span className="font-medium text-red-600">{formatCurrency(data.totalPagado)}</span>
                                  </div>
                                  <div className="flex justify-between border-t pt-2">
                                    <span className="text-muted-foreground">Utilidad:</span>
                                    <span className="font-bold text-green-600">{formatCurrency(data.utilidad)}</span>
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
                          Historial de Cierres
                          <Badge variant="secondary">{cierres.length}</Badge>
                        </CardTitle>
                        <CardDescription>
                          Detalle de todos los cierres en el periodo seleccionado
                        </CardDescription>
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
                                  <TableHead>Animal Ganador</TableHead>
                                  <TableHead className="text-right">Total Apostado</TableHead>
                                  <TableHead className="text-right">Total Pagado</TableHead>
                                  <TableHead className="text-right">Utilidad</TableHead>
                                  <TableHead>Usuario</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {cierres.map((cierre, index) => (
                                  <TableRow key={cierre.ID || index}>
                                    <TableCell>
                                      {cierre.FECHA ? format(new Date(cierre.FECHA + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                                    </TableCell>
                                    <TableCell className="font-mono">{cierre.HORA || cierre.HORAJUEGO}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {cierre.NOMBRE_SUCURSAL || cierre.SUCURSAL || '-'}
                                      </Badge>
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
                                    <TableCell className="text-right text-red-600 dark:text-red-400 font-semibold">
                                      {formatCurrency(parseFloat(cierre.TOTAL_PAGADO) || 0)}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600 dark:text-green-400 font-semibold">
                                      {formatCurrency(parseFloat(cierre.UTILIDAD) || 0)}
                                    </TableCell>
                                    <TableCell>{cierre.USUARIO_CIERRE}</TableCell>
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
