import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { sucursalesAPI } from '@/api/admin';
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
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Sucursales() {
  const { user } = useAuth();
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<any>(null);
  const [formData, setFormData] = useState({
    bodega: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const sucursalesRes = await sucursalesAPI.listar();

      if (sucursalesRes.success) {
        setSucursales(sucursalesRes.data);
      }
    } catch (error: any) {
      toast.error('Error al cargar datos: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (sucursal?: any) => {
    if (sucursal) {
      setEditingSucursal(sucursal);
      setFormData({
        bodega: sucursal.BODEGA || '',
      });
    } else {
      setEditingSucursal(null);
      setFormData({
        bodega: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        bodega: formData.bodega,
      };

      if (editingSucursal) {
        const result = await sucursalesAPI.actualizar(editingSucursal.CODIGO, data);
        if (result.success) {
          toast.success('Sucursal actualizada exitosamente');
        }
      } else {
        const result = await sucursalesAPI.crear(data);
        if (result.success) {
          toast.success('Sucursal creada exitosamente');
        }
      }

      setIsDialogOpen(false);
      cargarDatos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar sucursal');
    }
  };

  const handleEliminar = async (codigo: number) => {
    if (!confirm('¿Está seguro de eliminar esta sucursal?')) return;

    try {
      const result = await sucursalesAPI.eliminar(codigo);
      if (result.success) {
        toast.success('Sucursal eliminada exitosamente');
        cargarDatos();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar sucursal');
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
            <Building2 className="h-8 w-8" />
            Gestión de Sucursales
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra las sucursales del sistema
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Sucursal
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Sucursales</CardTitle>
          <CardDescription>
            Total: {sucursales.length} sucursales registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sucursales.map((sucursal) => (
                  <TableRow key={sucursal.CODIGO}>
                    <TableCell className="font-medium">{sucursal.CODIGO}</TableCell>
                    <TableCell className="font-semibold">{sucursal.BODEGA}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {sucursal.TOTAL_USUARIOS || 0} usuarios
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenDialog(sucursal)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleEliminar(sucursal.CODIGO)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
            </DialogTitle>
            <DialogDescription>
              {editingSucursal
                ? 'Modifica el nombre de la sucursal'
                : 'Ingresa el nombre de la nueva sucursal'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="bodega" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Nombre de la Sucursal *
                </Label>
                <Input
                  id="bodega"
                  value={formData.bodega}
                  onChange={(e) =>
                    setFormData({ ...formData, bodega: e.target.value })
                  }
                  placeholder="Ej: Sucursal Centro"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingSucursal ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
