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
import { Lock, CheckCircle2, XCircle, Building2, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { getAnimalByNumero } from '@/constants/animals';

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
      console.error('Error al cargar parámetros:', error);
    }
  };

  const cargarCierres = async () => {
    try {
      const response = await cerrarJuegoAPI.listar({
        fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
        fecha_fin: format(new Date(), 'yyyy-MM-dd'),
      });
      if (response.success) {
        setCierres(response.data || []);
      }
    } catch (error: any) {
      console.error('Error al cargar cierres:', error);
    }
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
        // Si ya está cerrado, la respuesta tiene una estructura diferente
        if (response.cerrado) {
          setResumen({
            cerrado: true,
            ...response.data
          });
          toast.info('Este juego ya ha sido cerrado');
        } else {
          // Calcular valores para mostrar
          const totalApostado = parseFloat(response.data?.totales?.total_apostado || 0);
          const ganador = response.data?.ganador;
          const puntosPago = parametros.PUNTOSPAGO || 30;

          // Necesitamos calcular cuánto se apostó al animal ganador
          // Por ahora, lo dejamos en 0 si no tenemos el dato
          const totalApostadoGanador = 0; // Esto lo calcula el backend al cerrar

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
            toast.success('El juego está listo para cerrar');
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
      ? `¿Está seguro de cerrar este juego para la sucursal "${sucursalSeleccionada?.BODEGA}"? Esta acción no se puede deshacer.`
      : '¿Está seguro de cerrar este juego para TODAS las sucursales? Esta acción no se puede deshacer.';

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

  // Cálculos para mostrar en el resumen
  const calcularDistribucion = () => {
    if (!resumen || resumen.cerrado) return null;

    const totalApostado = resumen.total_apostado || 0;
    const puntosPago = parametros.PUNTOSPAGO || 30;
    const porcentajeAdmin = parametros.PORCENTAJEADMINSUCURSAL || 7;

    // Estos valores son estimados, el cálculo real lo hace el backend
    const pagoAdminSucursal = (totalApostado * porcentajeAdmin) / 100;

    return {
      totalApostado,
      pagoAdminSucursal,
      puntosPago
    };
  };

  const distribucion = calcularDistribucion();

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
              Cierra los juegos y calcula las ganancias
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Juego</CardTitle>
            <CardDescription>
              Seleccione el horario y fecha del juego a cerrar
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

              <div className="flex items-end md:col-span-2">
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
                    {resumen.codigo_animal_ganador && (
                      (() => {
                        const animalData = getAnimalByNumero(parseInt(resumen.codigo_animal_ganador));
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

              {/* Distribución de ingresos */}
              {distribucion && !resumen.cerrado && resumen.tiene_ganador && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-3">Distribución de Ingresos (Estimado)</h4>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Cierres Realizados Hoy
              <Badge variant="secondary">{cierres.length}</Badge>
            </CardTitle>
            <CardDescription>
              Historial de cierres del día
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cierres.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay cierres realizados hoy</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Horario</TableHead>
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
                          <div className="flex items-center gap-2">
                            {cierre.CODANIMAL_GANADOR && (
                              (() => {
                                const animalData = getAnimalByNumero(parseInt(cierre.CODANIMAL_GANADOR));
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
      </div>
    </DashboardLayout>
  );
}
