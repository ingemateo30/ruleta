import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { sucursalesAPI, usuariosAPI } from '@/api/admin';
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
import { Plus, Pencil, Trash2, Building2, MapPin, Phone, Mail, FileText, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Sucursales() {
  const { user } = useAuth();
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<any>(null);
  const [formData, setFormData] = useState({
    bodega: '',
    direccion: '',
    telefono: '',
    email: '',
    nit: '',
    responsable: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const [sucursalesRes, usuariosRes] = await Promise.all([
        sucursalesAPI.listar(),
        usuariosAPI.listar(),
      ]);

      if (sucursalesRes.success) {
        setSucursales(sucursalesRes.data);
      }

      if (usuariosRes.success) {
        setUsuarios(usuariosRes.data);
      }
    } catch (error: any) {
      toast.error('Error al cargar datos: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getUsuariosPorSucursal = (codigo: number) => {
    return usuarios.filter((u) => u.CODBODEGA === codigo).length;
  };

  const handleOpenDialog = (sucursal?: any) => {
    if (sucursal) {
      setEditingSucursal(sucursal);
      setFormData({
        bodega: sucursal.BODEGA || '',
        direccion: sucursal.DIRECCION || '',
        telefono: sucursal.TELEFONO || '',
        email: sucursal.EMAIL || '',
        nit: sucursal.NIT || '',
        responsable: sucursal.RESPONSABLE || '',
      });
    } else {
      setEditingSucursal(null);
      setFormData({
        bodega: '',
        direccion: '',
        telefono: '',
        email: '',
        nit: '',
        responsable: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        bodega: formData.bodega,
        direccion: formData.direccion || undefined,
        telefono: formData.telefono || undefined,
        email: formData.email || undefined,
        nit: formData.nit || undefined,
        responsable: formData.responsable || undefined,
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
    const usuariosCount = getUsuariosPorSucursal(codigo);

    if (usuariosCount > 0) {
      toast.error(`No se puede eliminar. Hay ${usuariosCount} usuarios asignados a esta sucursal`);
      return;
    }

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

  if (user?.tipo !== 1) {
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
                  <TableHead>Dirección</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sucursales.map((sucursal) => (
                  <TableRow key={sucursal.CODIGO}>
                    <TableCell className="font-medium">{sucursal.CODIGO}</TableCell>
                    <TableCell className="font-semibold">{sucursal.BODEGA}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {sucursal.DIRECCION || '-'}
                    </TableCell>
                    <TableCell className="text-sm">{sucursal.TELEFONO || '-'}</TableCell>
                    <TableCell className="text-sm">{sucursal.RESPONSABLE || '-'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {getUsuariosPorSucursal(sucursal.CODIGO)} usuarios
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
            </DialogTitle>
            <DialogDescription>
              {editingSucursal
                ? 'Modifica los datos de la sucursal'
                : 'Ingresa los datos de la nueva sucursal'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
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

              <div className="grid gap-2">
                <Label htmlFor="direccion" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Direccion
                </Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                  placeholder="Ej: Calle 123 #45-67"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="telefono" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefono
                  </Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    placeholder="Ej: 3001234567"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="nit" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    NIT / RUT
                  </Label>
                  <Input
                    id="nit"
                    value={formData.nit}
                    onChange={(e) =>
                      setFormData({ ...formData, nit: e.target.value })
                    }
                    placeholder="Ej: 900123456-1"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Ej: sucursal@empresa.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="responsable" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Responsable
                </Label>
                <Input
                  id="responsable"
                  value={formData.responsable}
                  onChange={(e) =>
                    setFormData({ ...formData, responsable: e.target.value })
                  }
                  placeholder="Ej: Juan Perez"
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
  );
}
