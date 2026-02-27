import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { restriccionesAPI } from '@/api/admin';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  ShieldOff, Plus, Trash2, Pencil, CalendarOff, Clock, Users,
  AlertTriangle, CheckCircle, Ban, Calendar,
} from 'lucide-react';
import { usuariosAPI } from '@/api/admin';
import { USER_TYPES } from '@/api/types';

const DIAS_SEMANA = [
  { valor: '1', etiqueta: 'Lunes' },
  { valor: '2', etiqueta: 'Martes' },
  { valor: '3', etiqueta: 'Miércoles' },
  { valor: '4', etiqueta: 'Jueves' },
  { valor: '5', etiqueta: 'Viernes' },
  { valor: '6', etiqueta: 'Sábado' },
  { valor: '7', etiqueta: 'Domingo' },
];

const DIA_NOMBRES: Record<string, string> = {
  '1': 'Lun', '2': 'Mar', '3': 'Mié', '4': 'Jue',
  '5': 'Vie', '6': 'Sáb', '7': 'Dom',
};

const FORM_INICIAL = {
  tipo: 'TODOS',
  usuario_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  dia_semana: [] as string[],
  hora_inicio: '',
  hora_fin: '',
  motivo: '',
  activo: 'A',
};

const FORM_DIA_INICIAL = {
  fecha: '',
  motivo: '',
  activo: 'A',
};

export default function RestriccionesAcceso() {
  const { user } = useAuth();
  const isSuperAdmin = String(user?.tipo) === USER_TYPES.SUPER_ADMIN;
  const isAdmin = String(user?.tipo) === USER_TYPES.ADMIN;

  // Estado restricciones de acceso
  const [restricciones, setRestricciones] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...FORM_INICIAL });

  // Estado días sin sorteo
  const [diasSinSorteo, setDiasSinSorteo] = useState<any[]>([]);
  const [isDialogDiaOpen, setIsDialogDiaOpen] = useState(false);
  const [editingDiaId, setEditingDiaId] = useState<number | null>(null);
  const [formDia, setFormDia] = useState({ ...FORM_DIA_INICIAL });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setIsLoading(true);

    // Ejecutar cada llamada de forma independiente para evitar que un fallo
    // cancele las demás y deje la pantalla en blanco.
    const [restricRes, diasRes, usuariosRes] = await Promise.allSettled([
      restriccionesAPI.listar(),
      restriccionesAPI.diasSinSorteo.listar(),
      usuariosAPI.listar(),
    ]);

    if (restricRes.status === 'fulfilled' && restricRes.value.success) {
      setRestricciones(restricRes.value.data);
    } else if (restricRes.status === 'rejected') {
      toast.error('No se pudieron cargar las restricciones de acceso.');
    }

    if (diasRes.status === 'fulfilled' && diasRes.value.success) {
      setDiasSinSorteo(diasRes.value.data);
    } else if (diasRes.status === 'rejected') {
      toast.error('No se pudieron cargar los días sin sorteo.');
    }

    if (usuariosRes.status === 'fulfilled' && usuariosRes.value.success) {
      // Excluir SuperAdmins (TIPO '0') del selector de usuarios
      setUsuarios(usuariosRes.value.data.filter((u: any) => String(u.TIPO) !== '0'));
    } else if (usuariosRes.status === 'rejected') {
      toast.error('No se pudo cargar la lista de usuarios.');
    }

    setIsLoading(false);
  };

  // ----------------------------------------------------------------
  //  RESTRICCIONES DE ACCESO — CRUD
  // ----------------------------------------------------------------
  const abrirDialogRestr = (r?: any) => {
    if (r) {
      setEditingId(r.ID);
      setFormData({
        tipo: r.TIPO,
        usuario_id: r.USUARIO_ID || '',
        fecha_inicio: r.FECHA_INICIO || '',
        fecha_fin: r.FECHA_FIN || '',
        dia_semana: r.DIA_SEMANA ? r.DIA_SEMANA.split(',').map((d: string) => d.trim()) : [],
        hora_inicio: r.HORA_INICIO ? r.HORA_INICIO.slice(0, 5) : '',
        hora_fin: r.HORA_FIN ? r.HORA_FIN.slice(0, 5) : '',
        motivo: r.MOTIVO || '',
        activo: r.ACTIVO,
      });
    } else {
      setEditingId(null);
      setFormData({ ...FORM_INICIAL });
    }
    setIsDialogOpen(true);
  };

  const toggleDia = (valor: string) => {
    setFormData(prev => ({
      ...prev,
      dia_semana: prev.dia_semana.includes(valor)
        ? prev.dia_semana.filter(d => d !== valor)
        : [...prev.dia_semana, valor].sort(),
    }));
  };

  const guardarRestr = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      dia_semana: formData.dia_semana.length > 0 ? formData.dia_semana.join(',') : null,
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin: formData.fecha_fin || null,
      hora_inicio: formData.hora_inicio || null,
      hora_fin: formData.hora_fin || null,
      usuario_id: formData.tipo === 'USUARIO' ? formData.usuario_id : null,
    };

    const destinatario = formData.tipo === 'TODOS'
      ? 'todos los operarios'
      : (usuarios.find((u: any) => String(u.ID) === String(formData.usuario_id))?.NICK || `usuario #${formData.usuario_id}`);

    try {
      if (editingId) {
        await restriccionesAPI.actualizar(editingId, payload);
        toast.success(`Restricción #${editingId} actualizada correctamente para ${destinatario}.`);
      } else {
        await restriccionesAPI.crear(payload);
        toast.success(`Restricción creada para ${destinatario}.${formData.motivo ? ` Motivo: ${formData.motivo}` : ''}`);
      }
      setIsDialogOpen(false);
      cargarDatos();
    } catch (e: any) {
      toast.error(`Error al guardar restricción para ${destinatario}: ${e.message || 'error desconocido'}`);
    }
  };

  const eliminarRestr = async (id: number) => {
    const restr = restricciones.find((r: any) => r.ID === id);
    const desc = restr
      ? (restr.TIPO === 'TODOS' ? 'todos los operarios' : (restr.USUARIO_NICK || `#${restr.USUARIO_ID}`))
      : `#${id}`;
    if (!confirm(`¿Eliminar la restricción para ${desc}?`)) return;
    try {
      await restriccionesAPI.eliminar(id);
      toast.success(`Restricción para ${desc} eliminada correctamente.`);
      cargarDatos();
    } catch (e: any) {
      toast.error(`Error al eliminar la restricción para ${desc}: ${(e as any).message || 'error desconocido'}`);
    }
  };

  const toggleActivoRestr = async (r: any) => {
    const nuevoActivo = r.ACTIVO === 'A' ? 'I' : 'A';
    const desc = r.TIPO === 'TODOS' ? 'todos los operarios' : (r.USUARIO_NICK || `#${r.USUARIO_ID}`);
    try {
      await restriccionesAPI.actualizar(r.ID, { activo: nuevoActivo });
      if (nuevoActivo === 'A') {
        toast.success(`Restricción para ${desc} activada. Los accesos serán bloqueados según los criterios definidos.`);
      } else {
        toast.success(`Restricción para ${desc} desactivada. Los accesos procederán con normalidad.`);
      }
      cargarDatos();
    } catch (e: any) {
      toast.error(`Error al cambiar estado de la restricción para ${desc}: ${(e as any).message || 'error desconocido'}`);
    }
  };

  // ----------------------------------------------------------------
  //  DÍAS SIN SORTEO — CRUD
  // ----------------------------------------------------------------
  const abrirDialogDia = (d?: any) => {
    if (d) {
      setEditingDiaId(d.ID);
      setFormDia({ fecha: d.FECHA, motivo: d.MOTIVO || '', activo: d.ACTIVO });
    } else {
      setEditingDiaId(null);
      setFormDia({ ...FORM_DIA_INICIAL });
    }
    setIsDialogDiaOpen(true);
  };

  const guardarDia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDiaId) {
        await restriccionesAPI.diasSinSorteo.actualizar(editingDiaId, formDia);
        toast.success(`Día sin sorteo del ${formDia.fecha} actualizado correctamente.`);
      } else {
        await restriccionesAPI.diasSinSorteo.crear(formDia);
        toast.success(`Día sin sorteo registrado: ${formDia.fecha}.${formDia.motivo ? ` Motivo: ${formDia.motivo}` : ''}`);
      }
      setIsDialogDiaOpen(false);
      cargarDatos();
    } catch (e: any) {
      toast.error(`Error al guardar el día sin sorteo (${formDia.fecha}): ${(e as any).message || 'error desconocido'}`);
    }
  };

  const eliminarDia = async (id: number) => {
    const dia = diasSinSorteo.find((d: any) => d.ID === id);
    const fechaDesc = dia ? dia.FECHA : `#${id}`;
    if (!confirm(`¿Eliminar el día sin sorteo del ${fechaDesc}?`)) return;
    try {
      await restriccionesAPI.diasSinSorteo.eliminar(id);
      toast.success(`Día sin sorteo del ${fechaDesc} eliminado correctamente.`);
      cargarDatos();
    } catch (e: any) {
      toast.error(`Error al eliminar el día sin sorteo del ${fechaDesc}: ${(e as any).message || 'error desconocido'}`);
    }
  };

  // ----------------------------------------------------------------
  //  Helpers de visualización
  // ----------------------------------------------------------------
  const formatFecha = (f: string | null) => (f ? new Date(f + 'T00:00:00').toLocaleDateString('es-CO') : '-');
  const formatHora = (h: string | null) => (h ? h.slice(0, 5) : '-');

  const descCriterios = (r: any) => {
    const parts: string[] = [];
    if (r.FECHA_INICIO) {
      parts.push(r.FECHA_FIN && r.FECHA_FIN !== r.FECHA_INICIO
        ? `${formatFecha(r.FECHA_INICIO)} → ${formatFecha(r.FECHA_FIN)}`
        : `Fecha: ${formatFecha(r.FECHA_INICIO)}`);
    }
    if (r.DIA_SEMANA) {
      const dias = r.DIA_SEMANA.split(',').map((d: string) => DIA_NOMBRES[d.trim()] || d.trim()).join(', ');
      parts.push(`Días: ${dias}`);
    }
    if (r.HORA_INICIO && r.HORA_FIN) {
      parts.push(`Horario: ${formatHora(r.HORA_INICIO)} - ${formatHora(r.HORA_FIN)}`);
    }
    return parts.length ? parts.join(' | ') : 'Sin criterios definidos';
  };

  if (!isSuperAdmin && !isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Denegado</CardTitle>
              <CardDescription>Solo los administradores pueden acceder a esta sección.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldOff className="h-8 w-8 text-orange-500" />
              Control de Acceso y Sorteos
            </h1>
            <p className="text-muted-foreground mt-1">
              Restringe el acceso de usuarios y gestiona los días sin sorteos
            </p>
          </div>
        </div>

        <Tabs defaultValue="restricciones">
          <TabsList className="mb-4">
            <TabsTrigger value="restricciones" className="flex items-center gap-2">
              <ShieldOff className="h-4 w-4" />
              Restricciones de Acceso
            </TabsTrigger>
            <TabsTrigger value="dias-sin-sorteo" className="flex items-center gap-2">
              <CalendarOff className="h-4 w-4" />
              Días Sin Sorteo
            </TabsTrigger>
          </TabsList>

          {/* ====================================================== */}
          {/* TAB: Restricciones de Acceso                           */}
          {/* ====================================================== */}
          <TabsContent value="restricciones" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Restricciones de Acceso al Sistema
                  </CardTitle>
                  <CardDescription>
                    Define cuándo los usuarios no pueden iniciar sesión (por fecha, día de la semana u horario).
                  </CardDescription>
                </div>
                <Button onClick={() => abrirDialogRestr()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Restricción
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Cargando...</div>
                ) : restricciones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay restricciones configuradas
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aplica a</TableHead>
                        <TableHead>Criterios</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Creado por</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {restricciones.map((r) => (
                        <TableRow key={r.ID} className={r.ACTIVO !== 'A' ? 'opacity-50' : ''}>
                          <TableCell>
                            {r.TIPO === 'TODOS' ? (
                              <Badge variant="destructive">
                                <Users className="h-3 w-3 mr-1" />
                                Todos los usuarios
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                {r.USUARIO_NICK || r.USUARIO_ID}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {descCriterios(r)}
                          </TableCell>
                          <TableCell className="text-sm">{r.MOTIVO || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={r.ACTIVO === 'A' ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => toggleActivoRestr(r)}
                            >
                              {r.ACTIVO === 'A' ? (
                                <><Ban className="h-3 w-3 mr-1" />Activa</>
                              ) : (
                                <><CheckCircle className="h-3 w-3 mr-1" />Inactiva</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {r.CREADO_POR || '-'}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="icon" onClick={() => abrirDialogRestr(r)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => eliminarRestr(r.ID)}>
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

            {/* Info card */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4" />
                  ¿Cómo funcionan las restricciones?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-700/80 dark:text-blue-300/80 space-y-1">
                <p>• Una restricción bloquea el acceso cuando <strong>todos</strong> los criterios que define coinciden con la fecha/hora actual.</p>
                <p>• Puedes combinar criterios: por ejemplo, <em>solo los martes y miércoles entre las 10 PM y 6 AM</em>.</p>
                <p>• Tipo <strong>"Todos los usuarios"</strong> aplica únicamente a <strong>Operarios</strong>. Los Administradores nunca son bloqueados por este tipo.</p>
                <p>• Tipo <strong>"Usuario específico"</strong> aplica únicamente al usuario seleccionado (puede ser Operario o Administrador).</p>
                <p>• Las horas usan la zona horaria de Colombia (America/Bogota).</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====================================================== */}
          {/* TAB: Días Sin Sorteo                                   */}
          {/* ====================================================== */}
          <TabsContent value="dias-sin-sorteo" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarOff className="h-5 w-5" />
                    Días Sin Sorteo
                  </CardTitle>
                  <CardDescription>
                    Marca fechas en las que no habrá sorteos. La pantalla pública mostrará un aviso informativo.
                  </CardDescription>
                </div>
                <Button onClick={() => abrirDialogDia()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Día
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Cargando...</div>
                ) : diasSinSorteo.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay días sin sorteo registrados
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Registrado por</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diasSinSorteo.map((d) => (
                        <TableRow key={d.ID} className={d.ACTIVO !== 'A' ? 'opacity-50' : ''}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-orange-500" />
                              {formatFecha(d.FECHA)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{d.MOTIVO || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={d.ACTIVO === 'A' ? 'destructive' : 'outline'}>
                              {d.ACTIVO === 'A' ? 'Sin sorteo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {d.CREADO_POR || '-'}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="icon" onClick={() => abrirDialogDia(d)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => eliminarDia(d.ID)}>
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
          </TabsContent>
        </Tabs>

        {/* ====================================================== */}
        {/* DIALOG: Crear / Editar Restricción                     */}
        {/* ====================================================== */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Restricción' : 'Nueva Restricción de Acceso'}
              </DialogTitle>
              <DialogDescription>
                Define cuándo y a quién se bloquea el acceso al sistema.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={guardarRestr} className="space-y-4 py-2">

              {/* Tipo */}
              <div className="grid gap-2">
                <Label>Aplica a</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) => setFormData({ ...formData, tipo: v, usuario_id: '' })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos los usuarios</SelectItem>
                    <SelectItem value="USUARIO">Usuario específico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo === 'USUARIO' && (
                <div className="grid gap-2">
                  <Label>Usuario</Label>
                  <Select
                    value={formData.usuario_id}
                    onValueChange={(v) => setFormData({ ...formData, usuario_id: v })}
                    required
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccione usuario" /></SelectTrigger>
                    <SelectContent>
                      {usuarios.map((u) => (
                        <SelectItem key={u.ID} value={String(u.ID)}>
                          {u.NICK} — {u.TIPO_NOMBRE}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Fecha inicio</Label>
                  <Input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Fecha fin <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    min={formData.fecha_inicio}
                  />
                </div>
              </div>

              {/* Días de la semana */}
              <div className="grid gap-2">
                <Label>Días de la semana <span className="text-muted-foreground text-xs">(opcional, múltiple)</span></Label>
                <div className="flex flex-wrap gap-3">
                  {DIAS_SEMANA.map((d) => (
                    <label key={d.valor} className="flex items-center gap-1.5 cursor-pointer select-none text-sm">
                      <Checkbox
                        checked={formData.dia_semana.includes(d.valor)}
                        onCheckedChange={() => toggleDia(d.valor)}
                      />
                      {d.etiqueta}
                    </label>
                  ))}
                </div>
              </div>

              {/* Horario */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Hora inicio <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Hora fin <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                  />
                </div>
              </div>

              {/* Motivo */}
              <div className="grid gap-2">
                <Label>Motivo / Descripción</Label>
                <Input
                  placeholder="Ej: Mantenimiento del sistema, Festivo..."
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                />
              </div>

              {editingId && (
                <div className="grid gap-2">
                  <Label>Estado</Label>
                  <Select
                    value={formData.activo}
                    onValueChange={(v) => setFormData({ ...formData, activo: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Activa</SelectItem>
                      <SelectItem value="I">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Actualizar' : 'Crear Restricción'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ====================================================== */}
        {/* DIALOG: Crear / Editar Día Sin Sorteo                  */}
        {/* ====================================================== */}
        <Dialog open={isDialogDiaOpen} onOpenChange={setIsDialogDiaOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>
                {editingDiaId ? 'Editar Día Sin Sorteo' : 'Registrar Día Sin Sorteo'}
              </DialogTitle>
              <DialogDescription>
                La ruleta pública mostrará un aviso informativo en esta fecha.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={guardarDia} className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={formDia.fecha}
                  onChange={(e) => setFormDia({ ...formDia, fecha: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Motivo</Label>
                <Input
                  placeholder="Ej: Día festivo, Mantenimiento..."
                  value={formDia.motivo}
                  onChange={(e) => setFormDia({ ...formDia, motivo: e.target.value })}
                />
              </div>
              {editingDiaId && (
                <div className="grid gap-2">
                  <Label>Estado</Label>
                  <Select
                    value={formDia.activo}
                    onValueChange={(v) => setFormDia({ ...formDia, activo: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Sin sorteo (activo)</SelectItem>
                      <SelectItem value="I">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogDiaOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDiaId ? 'Actualizar' : 'Registrar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
