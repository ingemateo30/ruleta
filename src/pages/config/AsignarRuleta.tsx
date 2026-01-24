import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ruletaAPI } from '@/api/admin';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CircleDot, Power, PowerOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AsignarRuleta() {
  const { user } = useAuth();
  const [animales, setAnimales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [processingAll, setProcessingAll] = useState(false);

  useEffect(() => {
    cargarDatos();
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

  const handleToggleAnimal = async (num: number, estadoActual: string) => {
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

  const getAnimalImage = (num: number) => {
    // Retorna una URL de placeholder para las imágenes de animales
    return `https://via.placeholder.com/150/000000/FFFFFF/?text=Animal+${num}`;
  };

  if (String(user?.tipo) !== '1') {
    return (
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
    );
  }

  return (
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

      <Card>
        <CardHeader>
          <CardTitle>Estadísticas Generales</CardTitle>
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
                Total Jugadas
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {animales.reduce((sum, a) => sum + (a.TOTAL_JUGADAS || 0), 0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {animales.map((animal) => (
            <Card key={animal.NUM} className="overflow-hidden">
              <div
                className="h-32 flex items-center justify-center"
                style={{ backgroundColor: animal.COLOR || '#cccccc' }}
              >
                <div className="text-6xl font-bold text-white drop-shadow-lg">
                  {animal.NUM}
                </div>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{animal.NOMBRE}</CardTitle>
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
  );
}
