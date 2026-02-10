import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ruletaAPI, sucursalesAPI } from '@/api/admin';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CircleDot, Power, PowerOff, Search, Filter, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAnimalByCodigo, getAnimalByNombre } from '@/constants/animals';

const getLocalDateString = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function AsignarRuleta() {
  const { user } = useAuth();
  const [animales, setAnimales] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAll, setProcessingAll] = useState(false);

  // Filtros de estadísticas
  const [filtros, setFiltros] = useState({
    fecha_inicio: getLocalDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    fecha_fin: getLocalDateString(new Date()),
    sucursal: '',
    animal: '',
  });
  const [statsFiltradas, setStatsFiltradas] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    cargarDatos();
    cargarSucursales();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const response = await ruletaAPI.listar();

      if (response.success) {
        setAnimales(response.data);
      }
    } catch (error: any) {
      toast.error('Error al cargar datos: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cargarSucursales = async () => {
    try {
      const response = await sucursalesAPI.listar();
      if (response.success) {
        setSucursales(response.data || []);
      }
    } catch (error: any) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  const handleBuscarStats = async () => {
    try {
      setLoadingStats(true);
      const params: any = {};
      if (filtros.fecha_inicio) params.fecha_inicio = filtros.fecha_inicio;
      if (filtros.fecha_fin) params.fecha_fin = filtros.fecha_fin;
      if (filtros.sucursal && filtros.sucursal !== '0') params.sucursal = filtros.sucursal;
      if (filtros.animal && filtros.animal !== '0') params.animal = filtros.animal;

      const response = await ruletaAPI.estadisticasFiltradas(params);
      if (response.success) {
        setStatsFiltradas(response.data);
      } else {
        toast.error('Error al cargar estadísticas filtradas');
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleToggleAnimal = async (num: string, estadoActual: string) => {
    try {
      setProcessingId(num);
      const result = estadoActual === 'A'
        ? await ruletaAPI.desactivar(num)
        : await ruletaAPI.activar(num);

      if (result.success) {
        toast.success(
          `Animal ${estadoActual === 'A' ? 'desactivado' : 'activado'} exitosamente`
        );
        cargarDatos();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setProcessingId(null);
    }
  };

  const handleActivarTodos = async () => {
    if (!confirm('¿Está seguro de activar todos los animales?')) return;

    try {
      setProcessingAll(true);
      const result = await ruletaAPI.activarTodos();

      if (result.success) {
        toast.success('Todos los animales han sido activados');
        cargarDatos();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al activar animales');
    } finally {
      setProcessingAll(false);
    }
  };

  const handleDesactivarTodos = async () => {
    if (!confirm('¿Está seguro de desactivar todos los animales?')) return;

    try {
      setProcessingAll(true);
      const result = await ruletaAPI.desactivarTodos();

      if (result.success) {
        toast.success('Todos los animales han sido desactivados');
        cargarDatos();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al desactivar animales');
    } finally {
      setProcessingAll(false);
    }
  };

  const getAnimalImage = (num: string, nombre?: string) => {
    let animal = getAnimalByCodigo(num);
    if (!animal && nombre) {
      animal = getAnimalByNombre(nombre);
    }
    return animal?.imagen || '';
  };

  if (String(user?.tipo) !== '1') {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Denegado</CardTitle>
              <CardDescription>
                Solo los administradores pueden acceder a esta sección.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CircleDot className="h-8 w-8" />
              Gestión de Animales
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra los animales disponibles en la ruleta
            </p>
          </div>
          <div className="space-x-2">
            <Button
              onClick={handleActivarTodos}
              disabled={processingAll}
              variant="default"
            >
              <Power className="h-4 w-4 mr-2" />
              Activar Todos
            </Button>
            <Button
              onClick={handleDesactivarTodos}
              disabled={processingAll}
              variant="destructive"
            >
              <PowerOff className="h-4 w-4 mr-2" />
              Desactivar Todos
            </Button>
          </div>
        </div>

        {/* Estadísticas básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen General</CardTitle>
            <CardDescription>
              Total: {animales.length} animales configurados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  Activos
                </div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {animales.filter((a) => a.ESTADO === 'A').length}
                </div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-sm font-medium text-red-700 dark:text-red-300">
                  Inactivos
                </div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {animales.filter((a) => a.ESTADO === 'I').length}
                </div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total Jugadas (Global)
                </div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {animales.reduce((sum, a) => sum + (a.TOTAL_JUGADAS || 0), 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas con filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Estadísticas Filtradas
            </CardTitle>
            <CardDescription>
              Filtre por sucursal, rango de fecha y animal. Use "Todos" para ver el total general.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="grid gap-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={filtros.fecha_inicio}
                  onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={filtros.fecha_fin}
                  onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Sucursal</Label>
                <Select
                  value={filtros.sucursal}
                  onValueChange={(value) => setFiltros({ ...filtros, sucursal: value })}
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
              <div className="grid gap-2">
                <Label>Animal</Label>
                <Select
                  value={filtros.animal}
                  onValueChange={(value) => setFiltros({ ...filtros, animal: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Todos los animales</SelectItem>
                    {animales.map((a) => (
                      <SelectItem key={a.NUM} value={a.NUM.toString()}>
                        {a.VALOR || a.NOMBRE} (#{a.NUM})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleBuscarStats} className="w-full" disabled={loadingStats}>
                  {loadingStats ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Consultar
                </Button>
              </div>
            </div>

            {statsFiltradas && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Total Jugadas
                    </div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {(statsFiltradas.total_jugadas || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">
                      Total Apostado
                    </div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      ${(statsFiltradas.total_apostado || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Animales Jugados
                    </div>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {statsFiltradas.animales_jugados || 0}
                    </div>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Veces Ganador
                    </div>
                    <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                      {statsFiltradas.veces_ganador || 0}
                    </div>
                  </div>
                </div>

                {statsFiltradas.detalle_animales && statsFiltradas.detalle_animales.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Top Animales</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {statsFiltradas.detalle_animales.map((a: any) => (
                        <div key={a.NUM} className="p-3 border rounded-lg text-center">
                          <div className="font-bold text-sm">{a.nombre}</div>
                          <div className="text-xs text-muted-foreground">{a.total_jugadas} jugadas</div>
                          <div className="text-xs font-semibold text-green-600">
                            ${parseFloat(a.total_apostado || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {animales.map((animal) => (
              <Card key={animal.NUM} className="overflow-hidden">
                <div
                  className="h-32 flex items-center justify-center relative"
                  style={{ backgroundColor: animal.COLOR || '#cccccc' }}
                >
                  {getAnimalImage(animal.NUM, animal.VALOR) ? (
                    <>
                      <img
                        src={getAnimalImage(animal.NUM, animal.VALOR)}
                        alt={animal.VALOR}
                        className="h-24 w-24 object-contain drop-shadow-lg"
                      />
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-lg font-bold px-2 py-1 rounded">
                        {animal.NUM}
                      </div>
                    </>
                  ) : (
                    <div className="text-6xl font-bold text-white drop-shadow-lg">
                      {animal.NUM}
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{animal.VALOR}</CardTitle>
                    <Badge variant={animal.ESTADO === 'A' ? 'default' : 'secondary'}>
                      {animal.ESTADO === 'A' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <CardDescription>Animal #{animal.NUM}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Jugadas</div>
                      <div className="font-semibold">{animal.TOTAL_JUGADAS || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Ganador</div>
                      <div className="font-semibold">{animal.VECES_GANADOR || 0}x</div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Total Apostado</div>
                    <div className="font-semibold">
                      ${(animal.TOTAL_APOSTADO || 0).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleToggleAnimal(animal.NUM, animal.ESTADO)}
                    disabled={processingId === animal.NUM}
                    variant={animal.ESTADO === 'A' ? 'destructive' : 'default'}
                    className="w-full"
                  >
                    {processingId === animal.NUM ? (
                      'Procesando...'
                    ) : animal.ESTADO === 'A' ? (
                      <>
                        <PowerOff className="h-4 w-4 mr-2" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 mr-2" />
                        Activar
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
