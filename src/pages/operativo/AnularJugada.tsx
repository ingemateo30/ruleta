import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Trash2, Loader2, Calendar, Clock, Building, AlertTriangle, FileText, DollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { anularJuegoService, authService } from "@/api";
import { sucursalesAPI } from "@/api/admin";
import type { CabeceraJuego, DetalleJuego } from "@/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";

const getLocalDateString = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Motivos predefinidos para anulación
const MOTIVOS_ANULACION = [
  "Error en facturación",
  "Jugada incompleta",
  "Hora de juego incorrecta",
  "Cliente sin dinero completo",
  "Error al seleccionar el animal del cliente",
];

const AnularJugada = () => {
  const { user } = useAuth();
  const esAdmin = String(user?.tipo) === '0' || String(user?.tipo) === '1';

  const [radicado, setRadicado] = useState("");
  const [fechaBusqueda, setFechaBusqueda] = useState("");
  const [motivoSeleccionado, setMotivoSeleccionado] = useState("");
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [juegoEncontrado, setJuegoEncontrado] = useState<{
    cabecera: CabeceraJuego;
    detalles: DetalleJuego[];
  } | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [anulando, setAnulando] = useState(false);

  // Estado para reporte de anulados (admin only)
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [anulados, setAnulados] = useState<any[]>([]);
  const [resumenAnulados, setResumenAnulados] = useState<any>(null);
  const [loadingAnulados, setLoadingAnulados] = useState(false);
  const [filtrosAnulados, setFiltrosAnulados] = useState({
    fecha_inicio: getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    fecha_fin: getLocalDateString(new Date()),
    sucursal: '0', // Por defecto muestra todas las sucursales
  });

  // Establecer fecha actual por defecto
  useEffect(() => {
    const hoy = getLocalDateString(new Date());
    setFechaBusqueda(hoy);
    if (esAdmin) {
      cargarSucursales();
    }
  }, []);

  const cargarSucursales = async () => {
    try {
      const response = await sucursalesAPI.listar();
      if (response.success) {
        const sucursalesList = response.data || [];
        setSucursales(sucursalesList);
      } else {
        console.error('Error al cargar sucursales:', response);
        toast({
          title: "Error",
          description: "No se pudieron cargar las sucursales",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
      toast({
        title: "Error",
        description: "Error al cargar la lista de sucursales",
        variant: "destructive",
      });
    }
  };

  const handleBuscarAnulados = async () => {
    setLoadingAnulados(true);
    try {
      const params: any = {};
      if (filtrosAnulados.fecha_inicio) params.fecha_inicio = filtrosAnulados.fecha_inicio;
      if (filtrosAnulados.fecha_fin) params.fecha_fin = filtrosAnulados.fecha_fin;
      if (filtrosAnulados.sucursal && filtrosAnulados.sucursal !== '0') params.sucursal = filtrosAnulados.sucursal;

      const response = await anularJuegoService.listarAnulados(params);
      if (response.success) {
        setAnulados(response.data || []);
        setResumenAnulados(response.resumen || null);
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al cargar tickets anulados",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar tickets anulados",
        variant: "destructive",
      });
    } finally {
      setLoadingAnulados(false);
    }
  };

  const handleBuscarJuego = async () => {
    if (!radicado.trim() || !fechaBusqueda) {
      toast({
        title: "Error",
        description: "Por favor ingrese el radicado y la fecha",
        variant: "destructive",
      });
      return;
    }

    setBuscando(true);
    setJuegoEncontrado(null);

    try {
      const response = await anularJuegoService.buscarJuego(radicado.trim(), fechaBusqueda);

      if (response.success && response.data) {
        setJuegoEncontrado(response.data);
        toast({
          title: "Juego encontrado",
          description: `Radicado: ${response.data.cabecera.RADICADO}`,
        });
      } else {
        toast({
          title: "No encontrado",
          description: response.error || "No se encontró ningún juego con esos datos",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al buscar el juego",
        variant: "destructive",
      });
    } finally {
      setBuscando(false);
    }
  };

  const motivoCompleto = (() => {
    const partes: string[] = [];
    if (motivoSeleccionado) partes.push(motivoSeleccionado);
    if (motivoAnulacion.trim()) partes.push(motivoAnulacion.trim());
    return partes.join(". ");
  })();

  const handleAnularJuego = async () => {
    if (!juegoEncontrado) return;

    if (!motivoSeleccionado && !motivoAnulacion.trim()) {
      toast({
        title: "Error",
        description: "Debe seleccionar o ingresar el motivo de la anulación",
        variant: "destructive",
      });
      return;
    }

    setAnulando(true);
    try {
      const usuarioActual = authService.getCurrentUser();
      const response = await anularJuegoService.ejecutarAnulacion({
        radicado: juegoEncontrado.cabecera.RADICADO,
        fecha: juegoEncontrado.cabecera.FECHA,
        motivo: motivoCompleto,
        usuario: usuarioActual?.nick || 'Sistema',
      });

      if (response.success) {
        toast({
          title: "Juego anulado",
          description: response.message || "El juego ha sido anulado correctamente",
        });
        setJuegoEncontrado(null);
        setRadicado("");
        setMotivoAnulacion("");
        setMotivoSeleccionado("");
      } else {
        toast({
          title: "Error",
          description: response.error || response.message || "Error al anular el juego",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al anular el juego",
        variant: "destructive",
      });
    } finally {
      setAnulando(false);
    }
  };

  const totalJuego = juegoEncontrado?.detalles.reduce((acc, det) => acc + det.VALOR, 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Trash2 className="h-8 w-8 text-destructive" />
            Anular Jugada
          </h1>
          <p className="text-muted-foreground">
            Busque un ticket por radicado y fecha para proceder con su anulación
          </p>
        </div>

        <Tabs defaultValue="anular" className="w-full">
          <TabsList className={esAdmin ? "grid w-full grid-cols-2" : ""}>
            <TabsTrigger value="anular">Anular Juego</TabsTrigger>
            {esAdmin && (
              <TabsTrigger value="reporte">Reporte de Anulados</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="anular" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Búsqueda */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Buscar Juego
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Radicado</Label>
                    <Input
                      type="text"
                      placeholder="Ej: 00000001"
                      value={radicado}
                      onChange={(e) => setRadicado(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleBuscarJuego();
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={fechaBusqueda}
                      onChange={(e) => setFechaBusqueda(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleBuscarJuego}
                    disabled={buscando}
                  >
                    {buscando ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Buscar Juego
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Detalles del Juego Encontrado */}
              {juegoEncontrado && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Detalles del Ticket</span>
                      <Badge
                        variant={juegoEncontrado.cabecera.ESTADO === 'A' ? 'default' : 'secondary'}
                      >
                        {juegoEncontrado.cabecera.ESTADO === 'A' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-accent/50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Radicado</p>
                          <p className="font-bold font-mono">{juegoEncontrado.cabecera.RADICADO}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fecha</p>
                          <p className="font-bold">{juegoEncontrado.cabecera.FECHA}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Hora</p>
                          <p className="font-bold">{juegoEncontrado.cabecera.HORA}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Sucursal</p>
                          <p className="font-bold">{juegoEncontrado.cabecera.SUCURSAL}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-bold text-lg text-primary">
                            ${totalJuego.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Apuestas del Ticket</Label>
                      <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {juegoEncontrado.detalles.map((detalle, index) => (
                          <div
                            key={index}
                            className="bg-background border rounded-lg p-3 text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold">{detalle.ANIMAL}</p>
                                <p className="text-muted-foreground text-xs">
                                  {detalle.DESJUEGO} - {detalle.HORAJUEGO}
                                </p>
                              </div>
                              <p className="font-bold text-primary">
                                ${detalle.VALOR.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {juegoEncontrado.cabecera.ESTADO === 'A' ? (
                      <>
                        <div className="space-y-3 border-t pt-4">
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            Motivo de Anulación (Requerido)
                          </Label>
                          <Select
                            value={motivoSeleccionado}
                            onValueChange={(value) => setMotivoSeleccionado(value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un motivo..." />
                            </SelectTrigger>
                            <SelectContent>
                              {MOTIVOS_ANULACION.map((motivo) => (
                                <SelectItem key={motivo} value={motivo}>
                                  {motivo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Textarea
                            placeholder="Detalle adicional (opcional)..."
                            value={motivoAnulacion}
                            onChange={(e) => setMotivoAnulacion(e.target.value)}
                            className="min-h-[60px]"
                          />
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="w-full"
                              disabled={anulando || (!motivoSeleccionado && !motivoAnulacion.trim())}
                            >
                              {anulando ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Anulando...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Anular Juego
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Confirmar anulación?</AlertDialogTitle>
                              <AlertDialogDescription className="space-y-2">
                                <p>
                                  Esta acción no se puede deshacer. El juego con radicado{" "}
                                  <strong>{juegoEncontrado.cabecera.RADICADO}</strong> será anulado
                                  permanentemente.
                                </p>
                                <p className="mt-2">
                                  <strong>Motivo:</strong> {motivoCompleto}
                                </p>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleAnularJuego}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Sí, Anular
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <Button variant="outline" className="w-full" disabled>
                        Juego ya anulado
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {esAdmin && (
            <TabsContent value="reporte" className="space-y-6">
              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Reporte de Tickets Anulados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="grid gap-2">
                      <Label>Fecha Inicio</Label>
                      <Input
                        type="date"
                        value={filtrosAnulados.fecha_inicio}
                        onChange={(e) => setFiltrosAnulados({ ...filtrosAnulados, fecha_inicio: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Fecha Fin</Label>
                      <Input
                        type="date"
                        value={filtrosAnulados.fecha_fin}
                        onChange={(e) => setFiltrosAnulados({ ...filtrosAnulados, fecha_fin: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Sucursal</Label>
                      <Select
                        value={filtrosAnulados.sucursal}
                        onValueChange={(value) => setFiltrosAnulados({ ...filtrosAnulados, sucursal: value })}
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
                    <div className="flex items-end">
                      <Button onClick={handleBuscarAnulados} className="w-full" disabled={loadingAnulados}>
                        {loadingAnulados ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4 mr-2" />
                        )}
                        Consultar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumen */}
              {resumenAnulados && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Tickets Anulados</p>
                          <p className="text-2xl font-bold">{resumenAnulados.total_anulados}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <DollarSign className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Monto Total Anulado</p>
                          <p className="text-2xl font-bold">
                            ${(resumenAnulados.total_monto || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tabla de anulados */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Detalle de Anulaciones
                    {anulados.length > 0 && (
                      <Badge variant="secondary">{anulados.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {anulados.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay tickets anulados en el periodo seleccionado</p>
                      <p className="text-sm mt-1">Use los filtros y presione "Consultar"</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Radicado</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Hora</TableHead>
                            <TableHead>Sucursal</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Anulado Por</TableHead>
                            <TableHead>Fecha Anulación</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {anulados.map((item, index) => (
                            <TableRow key={item.RADICADO || index}>
                              <TableCell className="font-mono font-bold">
                                {item.RADICADO}
                              </TableCell>
                              <TableCell>{item.FECHA}</TableCell>
                              <TableCell>{item.HORA}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {item.NOMBRE_SUCURSAL || item.SUCURSAL || '-'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-red-600">
                                ${parseFloat(item.TOTALJUEGO || 0).toLocaleString()}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {item.MOTIVO_ANULACION || '-'}
                              </TableCell>
                              <TableCell>{item.USUARIO_ANULACION || '-'}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {item.FECHA_ANULACION || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AnularJugada;
