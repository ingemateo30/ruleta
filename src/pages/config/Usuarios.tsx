import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usuariosAPI, sucursalesAPI } from '@/api/admin';
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
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    nick: '',
    clave: '',
    tipo: '2',
    caja: '',
    codbodega: '',
    estado: 'A',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const [usuariosRes, sucursalesRes] = await Promise.all([
        usuariosAPI.listar(),
        sucursalesAPI.listar(),
      ]);

      if (usuariosRes.success) {
        setUsuarios(usuariosRes.data);
      }

      if (sucursalesRes.success) {
        setSucursales(sucursalesRes.data);
      }
    } catch (error: any) {
      toast.error('Error al cargar datos: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (usuario?: any) => {
    if (usuario) {
      setEditingUser(usuario);
      setFormData({
        nick: usuario.NICK,
        clave: '',
        tipo: usuario.TIPO.toString(),
        caja: usuario.CAJA || '',
        codbodega: usuario.CODBODEGA?.toString() || '',
        estado: usuario.ESTADO,
      });
    } else {
      setEditingUser(null);
      setFormData({
        nick: '',
        clave: '',
        tipo: '2',
        caja: '',
        codbodega: '',
        estado: 'A',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        nick: formData.nick,
        clave: formData.clave,
        tipo: parseInt(formData.tipo),
        caja: formData.caja,
        codbodega: formData.codbodega ? parseInt(formData.codbodega) : null,
        estado: formData.estado,
      };

      if (editingUser) {
        const result = await usuariosAPI.actualizar(editingUser.ID, data);
        if (result.success) {
          toast.success('Usuario actualizado exitosamente');
        }
      } else {
        const result = await usuariosAPI.crear(data);
        if (result.success) {
          toast.success('Usuario creado exitosamente');
        }
      }

      setIsDialogOpen(false);
      cargarDatos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este usuario?')) return;

    try {
      const result = await usuariosAPI.eliminar(id);
      if (result.success) {
        toast.success('Usuario desactivado exitosamente');
        cargarDatos();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al desactivar usuario');
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
            <Users className="h-8 w-8" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra los usuarios del sistema
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Total: {usuarios.length} usuarios registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Caja</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.ID}>
                    <TableCell>{usuario.ID}</TableCell>
                    <TableCell className="font-medium">{usuario.NICK}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          usuario.TIPO === 1
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        }`}
                      >
                        {usuario.TIPO_NOMBRE}
                      </span>
                    </TableCell>
                    <TableCell>{usuario.NOMBRE_SUCURSAL || '-'}</TableCell>
                    <TableCell>{usuario.CAJA || '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          usuario.ESTADO === 'A'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}
                      >
                        {usuario.ESTADO === 'A' ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenDialog(usuario)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleEliminar(usuario.ID)}
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Modifica los datos del usuario'
                : 'Ingresa los datos del nuevo usuario'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nick">Usuario (Nick)</Label>
                <Input
                  id="nick"
                  value={formData.nick}
                  onChange={(e) =>
                    setFormData({ ...formData, nick: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="clave">
                  Contraseña {editingUser && '(dejar vacío para mantener)'}
                </Label>
                <Input
                  id="clave"
                  type="password"
                  value={formData.clave}
                  onChange={(e) =>
                    setFormData({ ...formData, clave: e.target.value })
                  }
                  required={!editingUser}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo de Usuario</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Administrador</SelectItem>
                    <SelectItem value="2">Operario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sucursal">Sucursal</Label>
                <Select
                  value={formData.codbodega}
                  onValueChange={(value) =>
                    setFormData({ ...formData, codbodega: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin sucursal</SelectItem>
                    {sucursales.map((suc) => (
                      <SelectItem key={suc.CODIGO} value={suc.CODIGO.toString()}>
                        {suc.BODEGA}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="caja">Caja</Label>
                <Input
                  id="caja"
                  value={formData.caja}
                  onChange={(e) =>
                    setFormData({ ...formData, caja: e.target.value })
                  }
                />
              </div>

              {editingUser && (
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
                {editingUser ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
