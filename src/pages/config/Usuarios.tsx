import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usuariosAPI, sucursalesAPI } from '@/api/admin';
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
import { Plus, Pencil, Trash2, Users, ShieldAlert, ShieldCheck, Ban, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { USER_TYPES, USER_TYPE_NAMES } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const isSuperAdmin = String(user?.tipo) === USER_TYPES.SUPER_ADMIN;
  const isAdmin = String(user?.tipo) === USER_TYPES.ADMIN;

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
        codbodega: usuario.CODBODEGA?.toString() || '0',
        estado: usuario.ESTADO,
      });
    } else {
      setEditingUser(null);
      setFormData({
        nick: '',
        clave: '',
        tipo: '2',
        caja: '',
        codbodega: '0',
        estado: 'A',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Solo superadmin puede crear otros superadmin o admins
    if (!isSuperAdmin && formData.tipo === USER_TYPES.SUPER_ADMIN) {
      toast.error('Solo el Super Administrador puede crear usuarios de este tipo');
      return;
    }

    try {
      const data = {
        nick: formData.nick,
        clave: formData.clave,
        tipo: parseInt(formData.tipo),
        caja: formData.caja,
        codbodega: formData.codbodega && formData.codbodega !== '0' ? parseInt(formData.codbodega) : null,
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
    if (!confirm('Esta seguro de desactivar este usuario?')) return;

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

  const handleToggleBloqueo = async (usuario: any) => {
    if (!isSuperAdmin) {
      toast.error('Solo el Super Administrador puede bloquear/desbloquear usuarios');
      return;
    }

    const nuevoEstado = usuario.BLOQUEADO === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'bloquear' : 'desbloquear';

    if (!confirm(`Esta seguro de ${accion} a ${usuario.NICK}?`)) return;

    try {
      const result = await usuariosAPI.actualizar(usuario.ID, {
        ...usuario,
        nick: usuario.NICK,
        clave: '',
        tipo: usuario.TIPO,
        bloqueado: nuevoEstado,
      });

      if (result.success) {
        toast.success(`Usuario ${accion === 'bloquear' ? 'bloqueado' : 'desbloqueado'} exitosamente`);
        cargarDatos();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Error al ${accion} usuario`);
    }
  };

  const getTipoBadgeClass = (tipo: number) => {
    switch (tipo) {
      case 0:
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 1:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  // Solo admins y superadmins pueden acceder
  if (!isSuperAdmin && !isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Denegado</CardTitle>
              <CardDescription>
                Solo los administradores pueden acceder a esta seccion.
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
              {isSuperAdmin ? (
                <ShieldAlert className="h-8 w-8 text-red-500" />
              ) : (
                <Users className="h-8 w-8" />
              )}
              Gestion de Usuarios
            </h1>
            <p className="text-muted-foreground mt-1">
              {isSuperAdmin
                ? 'Panel de Super Administrador - Control total de usuarios'
                : 'Administra los usuarios del sistema'}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Info para Super Admin */}
        {isSuperAdmin && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Modo Super Administrador
              </CardTitle>
              <CardDescription className="text-red-600/80 dark:text-red-400/80">
                Tienes control total sobre todos los usuarios. Puedes bloquear/desbloquear
                administradores para controlar su acceso al sistema.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              Total: {usuarios.length} usuarios registrados
              ({usuarios.filter(u => u.ESTADO === 'A').length} activos,
              {' '}{usuarios.filter(u => u.ESTADO !== 'A').length} inactivos)
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
                    Activos ({usuarios.filter(u => u.ESTADO === 'A').length})
                  </TabsTrigger>
                  <TabsTrigger value="inactivos">
                    <Ban className="h-4 w-4 mr-2" />
                    Inactivos ({usuarios.filter(u => u.ESTADO !== 'A').length})
                  </TabsTrigger>
                </TabsList>
                {['activos', 'inactivos'].map((tab) => (
                  <TabsContent key={tab} value={tab}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Caja</TableHead>
                    <TableHead>Estado</TableHead>
                    {isSuperAdmin && <TableHead>Acceso</TableHead>}
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios
                    .filter(u => tab === 'activos' ? u.ESTADO === 'A' : u.ESTADO !== 'A')
                    .map((usuario) => (
                    <TableRow
                      key={usuario.ID}
                      className={usuario.BLOQUEADO === 1 ? 'opacity-60 bg-red-50 dark:bg-red-950/20' : ''}
                    >
                      <TableCell>{usuario.ID}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {usuario.NICK}
                          {usuario.BLOQUEADO === 1 && (
                            <Ban className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoBadgeClass(usuario.TIPO)}`}>
                          {USER_TYPE_NAMES[usuario.TIPO.toString()] || usuario.TIPO_NOMBRE}
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
                      {isSuperAdmin && (
                        <TableCell>
                          {usuario.TIPO === 1 && (
                            <Badge
                              variant={usuario.BLOQUEADO === 1 ? 'destructive' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => handleToggleBloqueo(usuario)}
                            >
                              {usuario.BLOQUEADO === 1 ? (
                                <>
                                  <Ban className="h-3 w-3 mr-1" />
                                  Bloqueado
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Permitido
                                </>
                              )}
                            </Badge>
                          )}
                          {usuario.TIPO === 0 && (
                            <Badge variant="secondary">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Super Admin
                            </Badge>
                          )}
                          {usuario.TIPO === 2 && (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenDialog(usuario)}
                          disabled={usuario.TIPO === 0 && !isSuperAdmin}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleEliminar(usuario.ID)}
                          disabled={usuario.TIPO === 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                  {usuarios.filter(u => tab === 'activos' ? u.ESTADO === 'A' : u.ESTADO !== 'A').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay usuarios {tab}
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
                    {/* ✅ CAMBIO: Usar "0" en lugar de "" para "Sin sucursal" */}
                    <SelectItem value="0">Sin sucursal</SelectItem>
                    {sucursales.map((suc) => (
                      <SelectItem key={suc.CODIGO} value={suc.CODIGO.toString()}>
                        {suc.BODEGA}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                <div className="grid gap-2">
                  <Label htmlFor="clave">
                    Contrasena {editingUser && '(dejar vacio para mantener)'}
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
                      {isSuperAdmin && (
                        <SelectItem value="0">
                          <span className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                            Super Administrador
                          </span>
                        </SelectItem>
                      )}
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
                      <SelectItem value="0">Sin sucursal</SelectItem>
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
    </DashboardLayout>
  );
}