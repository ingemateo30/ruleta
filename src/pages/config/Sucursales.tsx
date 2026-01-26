import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { sucursalesAPI } from '@/api/admin';
import { USER_TYPES } from '@/api/types';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Building2, MapPin, Phone, Mail, User, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Sucursales() {
  const { user } = useAuth();
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState<any>(null);
  const [editingSucursal, setEditingSucursal] = useState<any>(null);
  const [formData, setFormData] = useState({
    bodega: '',
    direccion: '',
    telefono: '',
    celular: '',
    email: '',
    responsable: '',
    ciudad: '',
    horario_apertura: '08:00',
    horario_cierre: '22:00',
    estado: 'A',
    observaciones: '',
  });

  const isSuperAdmin = String(user?.tipo) === USER_TYPES.SUPER_ADMIN;
  const isAdmin = String(user?.tipo) === USER_TYPES.ADMIN;

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
        direccion: sucursal.DIRECCION || '',
        telefono: sucursal.TELEFONO || '',
        celular: sucursal.CELULAR || '',
        email: sucursal.EMAIL || '',
        responsable: sucursal.RESPONSABLE || '',
        ciudad: sucursal.CIUDAD || '',
        horario_apertura: sucursal.HORARIO_APERTURA || '08:00',
        horario_cierre: sucursal.HORARIO_CIERRE || '22:00',
        estado: sucursal.ESTADO || 'A',
        observaciones: sucursal.OBSERVACIONES || '',
      });
    } else {
      setEditingSucursal(null);
      setFormData({
        bodega: '',
        direccion: '',
        telefono: '',
        celular: '',
        email: '',
        responsable: '',
        ciudad: '',
        horario_apertura: '08:00',
        horario_cierre: '22:00',
        estado: 'A',
        observaciones: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleViewSucursal = (sucursal: any) => {
    setSelectedSucursal(sucursal);
    setViewDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        bodega: formData.bodega,
        direccion: formData.direccion,
        telefono: formData.telefono,
        celular: formData.celular,
        email: formData.email,
        responsable: formData.responsable,
        ciudad: formData.ciudad,
        horario_apertura: formData.horario_apertura,
        horario_cierre: formData.horario_cierre,
        estado: formData.estado,
        observaciones: formData.observaciones,
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
    if (!confirm('Esta seguro de eliminar esta sucursal?')) return;

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

  // Estadisticas
  const sucursalesActivas = sucursales.filter(s => s.ESTADO === 'A' || !s.ESTADO).length;
  const sucursalesInactivas = sucursales.filter(s => s.ESTADO === 'I').length;
  const totalUsuarios = sucursales.reduce((acc, s) => acc + (s.TOTAL_USUARIOS || 0), 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Gestion de Sucursales
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

        {/* Estadisticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sucursales</p>
                  <p className="text-2xl font-bold">{sucursales.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Activas</p>
                  <p className="text-2xl font-bold text-green-600">{sucursalesActivas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inactivas</p>
                  <p className="text-2xl font-bold text-red-600">{sucursalesInactivas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Usuarios</p>
                  <p className="text-2xl font-bold">{totalUsuarios}</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Ciudad</TableHead>
                      <TableHead>Direccion</TableHead>
                      <TableHead>Telefono</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Usuarios</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sucursales.map((sucursal) => (
                      <TableRow key={sucursal.CODIGO}>
                        <TableCell className="font-medium">{sucursal.CODIGO}</TableCell>
                        <TableCell className="font-semibold">{sucursal.BODEGA}</TableCell>
                        <TableCell>{sucursal.CIUDAD || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={sucursal.DIRECCION}>
                          {sucursal.DIRECCION || '-'}
                        </TableCell>
                        <TableCell>
                          {sucursal.TELEFONO || sucursal.CELULAR || '-'}
                        </TableCell>
                        <TableCell>{sucursal.RESPONSABLE || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {sucursal.HORARIO_APERTURA && sucursal.HORARIO_CIERRE
                            ? `${sucursal.HORARIO_APERTURA} - ${sucursal.HORARIO_CIERRE}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {sucursal.TOTAL_USUARIOS || 0} usuarios
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={sucursal.ESTADO === 'I' ? 'destructive' : 'default'}
                            className={sucursal.ESTADO === 'I' ? '' : 'bg-green-500 hover:bg-green-600'}
                          >
                            {sucursal.ESTADO === 'I' ? 'Inactiva' : 'Activa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewSucursal(sucursal)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenDialog(sucursal)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleEliminar(sucursal.CODIGO)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog para crear/editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="contacto">Contacto</TabsTrigger>
                  <TabsTrigger value="operacion">Operacion</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 mt-4">
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
                    <Label htmlFor="ciudad" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Ciudad
                    </Label>
                    <Input
                      id="ciudad"
                      value={formData.ciudad}
                      onChange={(e) =>
                        setFormData({ ...formData, ciudad: e.target.value })
                      }
                      placeholder="Ej: Bogota"
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
                      placeholder="Ej: Calle 123 # 45-67"
                    />
                  </div>

                  {editingSucursal && (
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
                          <SelectItem value="A">Activa</SelectItem>
                          <SelectItem value="I">Inactiva</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="contacto" className="space-y-4 mt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="responsable" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Responsable / Administrador
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="telefono" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefono Fijo
                      </Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) =>
                          setFormData({ ...formData, telefono: e.target.value })
                        }
                        placeholder="Ej: 601 1234567"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="celular" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Celular
                      </Label>
                      <Input
                        id="celular"
                        value={formData.celular}
                        onChange={(e) =>
                          setFormData({ ...formData, celular: e.target.value })
                        }
                        placeholder="Ej: 300 1234567"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Correo Electronico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Ej: sucursal@lottoanimal.com"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="operacion" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="horario_apertura" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Hora de Apertura
                      </Label>
                      <Input
                        id="horario_apertura"
                        type="time"
                        value={formData.horario_apertura}
                        onChange={(e) =>
                          setFormData({ ...formData, horario_apertura: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="horario_cierre" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Hora de Cierre
                      </Label>
                      <Input
                        id="horario_cierre"
                        type="time"
                        value={formData.horario_cierre}
                        onChange={(e) =>
                          setFormData({ ...formData, horario_cierre: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) =>
                        setFormData({ ...formData, observaciones: e.target.value })
                      }
                      placeholder="Notas adicionales sobre la sucursal..."
                      rows={3}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
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

        {/* Dialog para ver detalles */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedSucursal?.BODEGA}
              </DialogTitle>
              <DialogDescription>
                Detalles completos de la sucursal
              </DialogDescription>
            </DialogHeader>
            {selectedSucursal && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">Codigo</Label>
                    <p className="font-medium">{selectedSucursal.CODIGO}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Estado</Label>
                    <p>
                      <Badge
                        variant={selectedSucursal.ESTADO === 'I' ? 'destructive' : 'default'}
                        className={selectedSucursal.ESTADO === 'I' ? '' : 'bg-green-500'}
                      >
                        {selectedSucursal.ESTADO === 'I' ? 'Inactiva' : 'Activa'}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Ciudad
                  </Label>
                  <p className="font-medium">{selectedSucursal.CIUDAD || '-'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Direccion
                  </Label>
                  <p className="font-medium">{selectedSucursal.DIRECCION || '-'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Telefono
                    </Label>
                    <p className="font-medium">{selectedSucursal.TELEFONO || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Celular
                    </Label>
                    <p className="font-medium">{selectedSucursal.CELULAR || '-'}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Correo
                  </Label>
                  <p className="font-medium">{selectedSucursal.EMAIL || '-'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Responsable
                  </Label>
                  <p className="font-medium">{selectedSucursal.RESPONSABLE || '-'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Horario de Operacion
                  </Label>
                  <p className="font-medium">
                    {selectedSucursal.HORARIO_APERTURA && selectedSucursal.HORARIO_CIERRE
                      ? `${selectedSucursal.HORARIO_APERTURA} - ${selectedSucursal.HORARIO_CIERRE}`
                      : '-'
                    }
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Usuarios Asignados</Label>
                  <p className="font-medium">{selectedSucursal.TOTAL_USUARIOS || 0} usuarios</p>
                </div>

                {selectedSucursal.OBSERVACIONES && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Observaciones</Label>
                    <p className="text-sm">{selectedSucursal.OBSERVACIONES}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
