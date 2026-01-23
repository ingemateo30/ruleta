import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Search, Trash2, Loader2, Calendar, Clock, Building } from "lucide-react";
import { anularJuegoService } from "@/api";
import type { CabeceraJuego, DetalleJuego } from "@/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const AnularJugada = () => {
  const [radicado, setRadicado] = useState("");
  const [fechaBusqueda, setFechaBusqueda] = useState("");
  const [juegoEncontrado, setJuegoEncontrado] = useState<{
    cabecera: CabeceraJuego;
    detalles: DetalleJuego[];
  } | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [anulando, setAnulando] = useState(false);

  // Establecer fecha actual por defecto
  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0];
    setFechaBusqueda(hoy);
  }, []);

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

  const handleAnularJuego = async () => {
    if (!juegoEncontrado) return;

    setAnulando(true);
    try {
      const response = await anularJuegoService.ejecutarAnulacion({
        radicado: juegoEncontrado.cabecera.RADICADO,
        fecha: juegoEncontrado.cabecera.FECHA,
      });

      if (response.success) {
        toast({
          title: "¡Juego anulado!",
          description: response.message || "El juego ha sido anulado correctamente",
        });
        setJuegoEncontrado(null);
        setRadicado("");
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al anular el juego",
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full"
                        disabled={anulando}
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
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. El juego con radicado{" "}
                          <strong>{juegoEncontrado.cabecera.RADICADO}</strong> será anulado
                          permanentemente.
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
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Juego ya anulado
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnularJugada;
