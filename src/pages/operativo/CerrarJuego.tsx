import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { cerrarJuegoAPI, horariosAPI, sucursalesAPI } from '@/api/admin';
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
import { Lock, CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export default function CerrarJuego() {
  const { user } = useAuth();
  const [horarios, setHorarios] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [cierres, setCierres] = useState<any[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    codigo_horario: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    codigo_sucursal: '', // Para cierre por sucursal
  });

  useEffect(() => {
    cargarHorarios();
    cargarSucursales();
    cargarCierres();
  }, []);

  const cargarHorarios = async () => {
    try {
      const response = await horariosAPI.activos();
      if (response.success) {
        setHorarios(response.data);
      }
    } catch (error: any) {
      toast.error('Error al cargar horarios: ' + error.message);
    }
  };

  const cargarSucursales = async () => {
    try {
      const response = await sucursalesAPI.listar();
      if (response.success) {
        setSucursales(response.data);
      }
    } catch (error: any) {
      toast.error('Error al cargar sucursales: ' + error.message);
    }
  };

  const cargarCierres = async () => {
    try {
      const response = await cerrarJuegoAPI.listar({
        fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
        fecha_fin: format(new Date(), 'yyyy-MM-dd'),
      });
      if (response.success) {
        setCierres(response.data);
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
        setResumen(response.data);
        if (response.data.cerrado) {
          toast.info('Este juego ya ha sido cerrado');
        } else {
          toast.success('El juego está listo para cerrar');
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

    const sucursalSeleccionada = sucursales.find(s => s.CODIGO.toString() === formData.codigo_sucursal);
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Lock className="h-8 w-8" />
            Cerrar Juego
          </h1>
          <p className="text-muted-foreground mt-1">
            Cierra los juegos y determina los ganadores
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
                  <SelectItem value="">Todas las sucursales</SelectItem>
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
                {isLoading ? 'Verificando...' : 'Verificar'}
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
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-yellow-500" />
                  Resumen del Juego
                </>
              )}
            </CardTitle>
            <CardDescription>
              {resumen.cerrado
                ? 'Este juego ya fue cerrado anteriormente'
                : 'Revise el resumen antes de cerrar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total Ventas (Apostado)
                </div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  ${(resumen.total_apostado || 0).toLocaleString()}
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  Animal Ganador
                </div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {resumen.animal_ganador || 'N/A'}
                </div>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-sm font-medium text-red-700 dark:text-red-300">
                  Pago a Ganadores
                </div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                  ${(resumen.total_pagar || 0).toLocaleString()}
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Utilidad Bruta
                </div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  ${(resumen.utilidad || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Distribución de ingresos según requisitos */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-3">Distribución de Ingresos</h4>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="text-sm text-muted-foreground">Admin Sucursal (7%)</span>
                  <span className="font-semibold text-orange-600">
                    ${((resumen.total_apostado || 0) * 0.07).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="text-sm text-muted-foreground">Sistemas (20%)</span>
                  <span className="font-semibold text-cyan-600">
                    ${(((resumen.total_apostado || 0) - ((resumen.total_apostado || 0) * 0.07) - (resumen.total_pagar || 0)) * 0.20).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-background rounded">
                  <span className="text-sm text-muted-foreground">Administración (80%)</span>
                  <span className="font-semibold text-indigo-600">
                    ${(((resumen.total_apostado || 0) - ((resumen.total_apostado || 0) * 0.07) - (resumen.total_pagar || 0)) * 0.80).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                <span className="text-sm font-medium">Ingresos Netos</span>
                <span className="text-lg font-bold text-green-600">
                  ${Math.max(0, (resumen.total_apostado || 0) - ((resumen.total_apostado || 0) * 0.07) - (resumen.total_pagar || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {!resumen.cerrado && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleCerrar}
                  disabled={isProcessing}
                  size="lg"
                >
                  {isProcessing ? 'Cerrando...' : 'Ejecutar Cierre'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cierres Realizados Hoy</CardTitle>
          <CardDescription>
            Total: {cierres.length} cierres realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cierres.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay cierres realizados hoy
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Animal Ganador</TableHead>
                  <TableHead className="text-right">Total Apostado</TableHead>
                  <TableHead className="text-right">Total a Pagar</TableHead>
                  <TableHead className="text-right">Utilidad</TableHead>
                  <TableHead>Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cierres.map((cierre, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {cierre.FECHA ? format(new Date(cierre.FECHA), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="font-mono">{cierre.HORA}</TableCell>
                    <TableCell className="font-semibold">
                      {cierre.ANIMAL_GANADOR}
                    </TableCell>
                    <TableCell className="text-right">
                      ${(cierre.TOTAL_APOSTADO || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-semibold">
                      ${(cierre.TOTAL_PAGAR || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-semibold">
                      ${(cierre.UTILIDAD || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>{cierre.USUARIO}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
