import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { Search, Loader2, FileText, Calendar, Clock, Printer, History, Ban } from "lucide-react";
import { listarJugadasService } from "@/api";
import type { HorarioJugada, JugadaListada } from "@/api";
import ReciboCaja from "@/components/ReciboCaja";
import { useAuth } from "@/hooks/use-auth";

const ListarJugadas = () => {
  const { user } = useAuth();
  const esOperario = String(user?.tipo) === '2';

  const [horarios, setHorarios] = useState<HorarioJugada[]>([]);
  const [fechaConsulta, setFechaConsulta] = useState("");
  const [codigoJuego, setCodigoJuego] = useState("");
  const [jugadas, setJugadas] = useState<JugadaListada[]>([]);
  const [consultando, setConsultando] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(true);
  const [isRecent, setIsRecent] = useState(true);

  // Estados para reimpresión
  const [mostrarRecibo, setMostrarRecibo] = useState(false);
  const [datosRecibo, setDatosRecibo] = useState<{
    radicado: string;
    fecha: string;
    hora: string;
    sucursal: string;
    jugadas: Array<{
      codigo: string;
      animal: string;
      valor: number;
      horaJuego: string;
    }>;
    valorTotal: number;
  } | null>(null);
  const [reimprimiendo, setReimprimiendo] = useState<string | null>(null);

  // Cargar horarios y jugadas recientes al montar
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setLoadingHorarios(true);
      try {
        // Cargar horarios
        const resHorarios = await listarJugadasService.obtenerHorarios();
        if (resHorarios.success && resHorarios.data) {
          setHorarios(resHorarios.data);
        }

        // Cargar recientes
        setConsultando(true);
        const resRecientes = await listarJugadasService.obtenerRecientes(50);
        if (resRecientes.success && resRecientes.data) {
          setJugadas(resRecientes.data);
          setIsRecent(true);
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      } finally {
        setLoadingHorarios(false);
        setConsultando(false);
      }
    };

    cargarDatosIniciales();
  }, []);

  // Establecer fecha actual por defecto (usando fecha local, no UTC)
  useEffect(() => {
    const now = new Date();
    const hoy = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setFechaConsulta(hoy);
  }, []);

  const handleConsultarJugadas = async () => {
    if (!fechaConsulta || !codigoJuego) {
      toast({
        title: "Error",
        description: "Por favor seleccione fecha y horario",
        variant: "destructive",
      });
      return;
    }

    setConsultando(true);
    try {
      const response = await listarJugadasService.consultarJugadas(
        fechaConsulta,
        codigoJuego
      );

      if (response.success && response.data) {
        setJugadas(response.data);
        setIsRecent(false);
        toast({
          title: "Consulta exitosa",
          description: `Se encontraron ${response.data.length} jugadas`,
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al consultar jugadas",
          variant: "destructive",
        });
        setJugadas([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al consultar jugadas",
        variant: "destructive",
      });
      setJugadas([]);
    } finally {
      setConsultando(false);
    }
  };

  const handleVerRecientes = async () => {
    setConsultando(true);
    setCodigoJuego("");
    try {
      const response = await listarJugadasService.obtenerRecientes(50);
      if (response.success && response.data) {
        setJugadas(response.data);
        setIsRecent(true);
        toast({
          title: "Jugadas recientes",
          description: "Se cargaron las últimas jugadas del día",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las jugadas recientes",
        variant: "destructive",
      });
    } finally {
      setConsultando(false);
    }
  };

  const handleReimprimir = async (radicado: string) => {
    setReimprimiendo(radicado);
    try {
      const response = await listarJugadasService.obtenerDatosVoucher(radicado);
      if (response.success && response.data) {
        const d = response.data;
        setDatosRecibo({
          radicado: d.radicado,
          fecha: d.fecha,
          hora: d.hora,
          sucursal: d.nombreSucursal,
          jugadas: d.juegos.map(j => ({
            codigo: j.codigoAnimal,
            animal: j.nombreAnimal,
            valor: j.valor,
            horaJuego: j.horaJuego
          })),
          valorTotal: d.total
        });
        setMostrarRecibo(true);
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al obtener datos del voucher",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al intentar reimprimir el ticket",
        variant: "destructive",
      });
    } finally {
      setReimprimiendo(null);
    }
  };

  const totalJugadas = jugadas.reduce((acc, j) => acc + j.VALOR, 0);
  const horarioSeleccionado = horarios.find(h => h.NUM.toString() === codigoJuego);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Listar Jugadas
          </h1>
          <p className="text-muted-foreground">
            Consulte el historial de jugadas realizadas por fecha y horario
          </p>
        </div>

        {/* Filtros */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Búsqueda y Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Fecha</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={fechaConsulta}
                    onChange={(e) => setFechaConsulta(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Horario de Juego</Label>
                <Select
                  value={codigoJuego}
                  onValueChange={setCodigoJuego}
                  disabled={loadingHorarios}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccione horario" />
                  </SelectTrigger>
                  <SelectContent>
                    {horarios.map((horario) => (
                      <SelectItem key={horario.NUM} value={horario.NUM.toString()}>
                        {horario.DESCRIPCION}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2 md:col-span-2">
                <Button
                  className="flex-1 h-9"
                  onClick={handleConsultarJugadas}
                  disabled={consultando || !fechaConsulta || !codigoJuego}
                >
                  {consultando && !isRecent ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Buscar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-9 gap-2"
                  onClick={handleVerRecientes}
                  disabled={consultando}
                >
                  <History className="h-4 w-4" />
                  Ver Recientes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {isRecent ? (
                  <>
                    <History className="h-5 w-5 text-primary" />
                    Últimas Jugadas Realizadas
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 text-primary" />
                    Resultados de Búsqueda
                  </>
                )}
              </CardTitle>
              {!isRecent && horarioSeleccionado && (
                <p className="text-xs text-muted-foreground">
                  Filtro: {fechaConsulta} | {horarioSeleccionado.DESCRIPCION}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {jugadas.length} items
              </Badge>
              <Badge variant="default" className="text-sm font-bold bg-primary px-3">
                Total: ${totalJugadas.toLocaleString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {consultando ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p>Consultando servidor...</p>
              </div>
            ) : jugadas.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No se encontraron registros</p>
                <p className="text-sm">Intente con otros filtros de búsqueda</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-accent/50">
                    <TableRow>
                      <TableHead className="w-[100px]">Radicado</TableHead>
                      <TableHead>Animal</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Hora Jugada</TableHead>
                      <TableHead>Juega a las</TableHead>
                      <TableHead className="hidden md:table-cell">Sucursal</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      {!esOperario && <TableHead className="text-right">Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jugadas.map((jugada, index) => (
                      <TableRow key={index} className="hover:bg-accent/30 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold">
                          {jugada.RADICADO}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm uppercase">{jugada.ANIMAL}</span>
                            <span className="text-[10px] text-muted-foreground">Cod: {jugada.CODANIMAL}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          ${jugada.VALOR.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 opacity-50" />
                            {jugada.HORA}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          <div className="flex flex-col">
                            <span className="text-primary">{jugada.HORAJUEGO || 'N/A'}</span>
                            <span className="text-[10px] text-muted-foreground">{jugada.DESJUEGO || ''}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {jugada.SUCURSAL}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className="text-[10px] h-5 px-1.5"
                            variant={jugada.ESTADOP === 'A' ? 'default' : 'secondary'}
                          >
                            {jugada.ESTADOP === 'A' ? 'Activo' : 'Anulado'}
                          </Badge>
                        </TableCell>
                        {!esOperario && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => handleReimprimir(jugada.RADICADO)}
                              disabled={reimprimiendo === jugada.RADICADO}
                            >
                              {reimprimiendo === jugada.RADICADO ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Printer className="h-4 w-4 md:mr-2" />
                                  <span className="hidden md:inline">Reimprimir</span>
                                </>
                              )}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen de Jugadas por Animalito - SOLO PARA NO OPERARIOS */}
        {!esOperario && jugadas.length > 0 && (() => {
          const conteo = jugadas
            .filter((j) => j.ESTADOP === 'A')
            .reduce<Record<string, { animal: string; codigo: string; jugadas: number; total: number }>>((acc, j) => {
              const key = j.CODANIMAL || j.ANIMAL;
              if (!acc[key]) {
                acc[key] = { animal: j.ANIMAL, codigo: j.CODANIMAL, jugadas: 0, total: 0 };
              }
              acc[key].jugadas += 1;
              acc[key].total += typeof j.VALOR === 'number' ? j.VALOR : parseFloat(j.VALOR) || 0;
              return acc;
            }, {});
          const conteoArr = Object.values(conteo).sort((a, b) => b.jugadas - a.jugadas);
   
          return (
            <Card className="shadow-md">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  Conteo de Jugadas por Animalito
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-accent/50">
                      <TableRow>
                        <TableHead>Animalito</TableHead>
                        <TableHead className="text-center">Jugadas</TableHead>
                        <TableHead className="text-right">Total Apostado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conteoArr.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold">
                            #{item.codigo} {item.animal}
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {item.jugadas}
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            ${item.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>

      {/* Modal de Recibo para Reimpresión */}
      {datosRecibo && (
        <ReciboCaja
          open={mostrarRecibo}
          onClose={() => {
            setMostrarRecibo(false);
            setDatosRecibo(null);
          }}
          radicado={datosRecibo.radicado}
          fecha={datosRecibo.fecha}
          hora={datosRecibo.hora}
          sucursal={datosRecibo.sucursal}
          jugadas={datosRecibo.jugadas}
          valorTotal={datosRecibo.valorTotal}
        />
      )}
    </DashboardLayout>
  );
};

export default ListarJugadas;