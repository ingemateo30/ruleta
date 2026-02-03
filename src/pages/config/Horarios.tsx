import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { horariosAPI } from '@/api/admin';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Plus, Pencil, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Horarios() {
  const { user } = useAuth();
  const [horarios, setHorarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHorario, setEditingHorario] = useState<any>(null);
  const [formData, setFormData] = useState({
    descripcion: '',
    hora: '',
    estado: 'A',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const response = await horariosAPI.listar();

      if (response.success) {
        setHorarios(response.data);
      }
    } catch (error: any) {
      toast.error('Error al cargar datos: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateHora = (hora: string): boolean => {
    // Aceptar formato HH:MM o HH:MM:SS
    const horaRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/;
    if (!horaRegex.test(hora)) {
      toast.error('El formato de hora debe ser HH:MM o HH:MM:SS (ejemplo: 14:30 o 14:30:00)');
      return false;
    }
    return true;
  };

  // Normalizar hora a formato HH:MM:SS
  const normalizarHora = (hora: string): string => {
    if (hora.split(':').length === 2) {
      return hora + ':00';
    }
    return hora;
  };

  const handleOpenDialog = (horario?: any) => {
    if (horario) {
      setEditingHorario(horario);
      // Mostrar solo HH:MM para edición más fácil
      const horaCorta = horario.HORA ? horario.HORA.substring(0, 5) : '';
      setFormData({
        descripcion: horario.DESCRIPCION,
        hora: horaCorta,
        estado: horario.ESTADO,
      });
    } else {
      setEditingHorario(null);
      setFormData({
        descripcion: '',
        hora: '',
        estado: 'A',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateHora(formData.hora)) {
      return;
    }

    try {
      const data = {
        descripcion: formData.descripcion,
        hora: normalizarHora(formData.hora),
        estado: formData.estado,
      };

      if (editingHorario) {
        const result = await horariosAPI.actualizar(editingHorario.NUM, data);
        if (result.success) {
          toast.success('Horario actualizado exitosamente');
        }
      } else {
        const result = await horariosAPI.crear(data);
        if (result.success) {
          toast.success('Horario creado exitosamente');
        }
      }

      setIsDialogOpen(false);
      cargarDatos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar horario');
    }
  };

  const handleEliminar = async (num: number) => {
    if (!confirm('¿Está seguro de eliminar este horario?')) return;

    try {
      const result = await horariosAPI.eliminar(num);
      if (result.success) {
        toast.success('Horario eliminado exitosamente');
        cargarDatos();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar horario');
    }
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
            <Clock className="h-8 w-8" />
            Gestión de Horarios
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra los horarios de juego del sistema
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Horario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Horarios</CardTitle>
          <CardDescription>
            Total: {horarios.length} horarios registrados
            ({horarios.filter(h => h.ESTADO === 'A').length} activos,
            {' '}{horarios.filter(h => h.ESTADO !== 'A').length} inactivos)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <Tabs defaultValue="activos" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="activos">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activos ({horarios.filter(h => h.ESTADO === 'A').length})
                </TabsTrigger>
                <TabsTrigger value="inactivos">
                  <XCircle className="h-4 w-4 mr-2" />
                  Inactivos ({horarios.filter(h => h.ESTADO !== 'A').length})
                </TabsTrigger>
              </TabsList>
              {['activos', 'inactivos'].map((tab) => (
                <TabsContent key={tab} value={tab}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Num</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total Jugadas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {horarios
                  .filter(h => tab === 'activos' ? h.ESTADO === 'A' : h.ESTADO !== 'A')
                  .map((horario) => (
                  <TableRow key={horario.NUM}>
                    <TableCell className="font-medium">{horario.NUM}</TableCell>
                    <TableCell>{horario.DESCRIPCION}</TableCell>
                    <TableCell>
                      <span className="font-mono font-semibold">{horario.HORA}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          horario.ESTADO === 'A'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}
                      >
                        {horario.ESTADO === 'A' ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {horario.TOTAL_JUGADAS || 0} jugadas
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenDialog(horario)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleEliminar(horario.NUM)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                  {horarios.filter(h => tab === 'activos' ? h.ESTADO === 'A' : h.ESTADO !== 'A').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay horarios {tab}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingHorario ? 'Editar Horario' : 'Nuevo Horario'}
            </DialogTitle>
            <DialogDescription>
              {editingHorario
                ? 'Modifica los datos del horario'
                : 'Ingresa los datos del nuevo horario'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  placeholder="Ej: Sorteo de la Mañana"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hora">Hora (HH:MM)</Label>
                <Input
                  id="hora"
                  value={formData.hora}
                  onChange={(e) =>
                    setFormData({ ...formData, hora: e.target.value })
                  }
                  placeholder="14:30"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Formato 24 horas (ejemplo: 14:30)
                </p>
              </div>

              {editingHorario && (
                <div className="grid gap-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) =>
                      setFormData({ ...formData, estado: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Activo</SelectItem>
                      <SelectItem value="I">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingHorario ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
