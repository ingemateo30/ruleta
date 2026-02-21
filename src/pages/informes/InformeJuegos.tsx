import { useState, useEffect } from 'react';
import { informesAPI, sucursalesAPI, horariosAPI } from '@/api/admin';
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
import { FileText, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export default function InformeJuegos() {
  const [jugadas, setJugadas] = useState<any[]>([]);
  const [conteoAnimales, setConteoAnimales] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
    fecha_fin: format(new Date(), 'yyyy-MM-dd'),
    sucursal: '',
    horario: '',
  });

  // Guardar qué filtros se usaron en la última búsqueda para renderizar el conteo correctamente
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    sucursal: '',
    horario: '',
  });

  useEffect(() => {
    cargarOpciones();
  }, []);

  const cargarOpciones = async () => {
    try {
      const [sucursalesRes, horariosRes] = await Promise.all([
        sucursalesAPI.listar(),
        horariosAPI.activos(),
      ]);

      if (sucursalesRes.success) setSucursales(sucursalesRes.data);
      if (horariosRes.success) setHorarios(horariosRes.data);
    } catch (error: any) {
      console.error('Error al cargar opciones:', error);
    }
  };

  const handleBuscar = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        fecha_inicio: filtros.fecha_inicio,
        fecha_fin: filtros.fecha_fin,
      };

      if (filtros.sucursal) params.sucursal = filtros.sucursal;
      if (filtros.horario) params.horario = filtros.horario;

      const [response, conteoResponse] = await Promise.all([
        informesAPI.juegos(params),
        informesAPI.conteoAnimales({
          fecha_inicio: filtros.fecha_inicio,
          fecha_fin: filtros.fecha_fin,
          sucursal: filtros.sucursal || undefined,
        }),
      ]);

      if (response.success) {
        const juegosData = response.data?.juegos || response.data || [];
        setJugadas(juegosData);
        toast.success(`Se encontraron ${juegosData.length} jugadas`);
      }

      if (conteoResponse.success) {
        setConteoAnimales(conteoResponse.data?.conteo || []);
      }

      // Guardar los filtros que se aplicaron en esta búsqueda
      setFiltrosAplicados({
        sucursal: filtros.sucursal,
        horario: filtros.horario,
      });
    } catch (error: any) {
      toast.error('Error al generar informe: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calcularResumen = () => {
    const totalJugadas = jugadas.length;
    const totalApostado = jugadas.reduce(
      (sum, j) => sum + parseFloat(j.TOTALJUEGO || j.TOTAL_APOSTADO || 0),
      0
    );
    const promedio = totalJugadas > 0 ? totalApostado / totalJugadas : 0;
    return { totalJugadas, totalApostado, promedio };
  };

  const exportarCSV = () => {
    if (jugadas.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const headers = ['Radicado', 'Fecha', 'Sucursal', 'Horario', 'Animales', 'Total'];
    const rows = jugadas.map((j) => [
      j.RADICADO,
      j.FECHA ? format(new Date(j.FECHA), 'dd/MM/yyyy') : '',
      j.NOMBRE_SUCURSAL || '',
      j.HORARIO || j.HORA || '',
      j.DETALLE_ANIMALES || j.ANIMALES || '',
      j.TOTALJUEGO || j.TOTAL_APOSTADO || 0,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `informe_juegos_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Informe exportado exitosamente');
  };

  // ─── Helpers para el renderizado del conteo de animalitos ────────────────────

  const renderConteoTable = (
    items: { animal: string; codigo: string; jugadas: number; total: number }[]
  ) => (
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
          {items.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-semibold">
                #{item.codigo} {item.animal}
              </TableCell>
              <TableCell className="text-center font-bold">
                {item.jugadas.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-bold text-primary">
                ${item.total.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  /**
   * Renderiza el bloque de conteo de animalitos siguiendo la misma lógica
   * que ListarJugadas:
   *
   * — Si se filtró por un horario específico → conteo simple (una sola tabla).
   * — Si NO hay horario seleccionado (todos los horarios) → agrupa por horario
   *   (HORARIO / HORA del registro) y muestra una Card por cada grupo,
   *   igual que ListarJugadas agrupa por DESJUEGO en modo "recientes".
   */
  const renderConteoAnimales = () => {
    if (jugadas.length === 0) return null;

    // Usamos los conteos que vienen de la API (conteoAnimales) como base,
    // pero también construimos el desglose desde las propias jugadas para
    // poder agrupar por horario cuando no se filtró uno específico.

    const hayFiltroHorario = !!filtrosAplicados.horario && filtrosAplicados.horario !== '0';
    const horarioSeleccionado = horarios.find(
      (h) => h.NUM.toString() === filtrosAplicados.horario
    );

    if (hayFiltroHorario) {
      // ── Modo horario específico: conteo simple ──────────────────────────────
      // Construimos el conteo desde las jugadas para asegurar consistencia
      // con el filtro aplicado.
      const conteo = jugadas.reduce<
        Record<string, { animal: string; codigo: string; jugadas: number; total: number }>
      >((acc, j) => {
        const key = j.CODIGOJUEGO || j.CODANIMAL || j.ANIMAL;
        if (!acc[key]) {
          acc[key] = {
            animal: j.ANIMAL || j.ANIMALES || key,
            codigo: j.CODIGOJUEGO || j.CODANIMAL || key,
            jugadas: 0,
            total: 0,
          };
        }
        acc[key].jugadas += 1;
        acc[key].total += parseFloat(j.TOTALJUEGO || j.TOTAL_APOSTADO || 0);
        return acc;
      }, {});

      // Si la API de conteoAnimales ya nos trae el dato listo, lo usamos directamente.
      const conteoArr =
        conteoAnimales.length > 0
          ? conteoAnimales
              .map((item: any) => ({
                animal: item.ANIMAL,
                codigo: item.CODIGOJUEGO || item.CODANIMAL || '',
                jugadas: parseInt(item.TOTAL_JUGADAS),
                total: parseFloat(item.TOTAL_APOSTADO),
              }))
              .sort((a, b) => b.jugadas - a.jugadas)
          : Object.values(conteo).sort((a, b) => b.jugadas - a.jugadas);

      return (
        <Card className="shadow-md">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" />
              Conteo de Jugadas por Animalito
              {horarioSeleccionado && (
                <span className="text-sm font-normal text-muted-foreground">
                  — {horarioSeleccionado.HORA} {horarioSeleccionado.DESCRIPCION}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">{renderConteoTable(conteoArr)}</CardContent>
        </Card>
      );
    } else {
      // ── Modo sin filtro de horario: agrupa por horario (como "recientes") ───
      // Agrupamos las jugadas por el campo de horario que traiga el registro.
      const porHorario: Record<
        string,
        {
          desc: string;
          animales: Record<string, { animal: string; codigo: string; jugadas: number; total: number }>;
        }
      > = {};

      for (const j of jugadas) {
        const horDesc =
          j.HORARIO ||
          j.HORA ||
          j.DESJUEGO ||
          'Sin horario';

        if (!porHorario[horDesc]) {
          porHorario[horDesc] = { desc: horDesc, animales: {} };
        }

        // Cada fila del informe puede tener uno o varios animales (DETALLE_ANIMALES).
        // Si hay detalle, lo parseamos; si no, usamos los campos directos.
        const tieneDetalle =
          j.DETALLE_ANIMALES && typeof j.DETALLE_ANIMALES === 'string';

        if (tieneDetalle) {
          // Formato esperado: "01-Perro, 02-Gato" — tomamos el código del prefijo
          j.DETALLE_ANIMALES.split(', ')
            .filter(Boolean)
            .forEach((parte: string) => {
              const [cod, ...nombreParts] = parte.split('-');
              const codigo = cod?.trim() || parte;
              const animal = nombreParts.join('-').trim() || parte;
              const key = codigo;

              if (!porHorario[horDesc].animales[key]) {
                porHorario[horDesc].animales[key] = {
                  animal,
                  codigo,
                  jugadas: 0,
                  total: 0,
                };
              }
              // El valor del animal individual no lo tenemos desglosado aquí,
              // así que dividimos el total entre la cantidad de animales de la jugada.
              const numAnimales =
                j.DETALLE_ANIMALES.split(', ').filter(Boolean).length || 1;
              porHorario[horDesc].animales[key].jugadas += 1;
              porHorario[horDesc].animales[key].total +=
                parseFloat(j.TOTALJUEGO || j.TOTAL_APOSTADO || 0) / numAnimales;
            });
        } else {
          // Fila con un solo animal
          const key = j.CODIGOJUEGO || j.CODANIMAL || j.ANIMAL || 'N/A';
          if (!porHorario[horDesc].animales[key]) {
            porHorario[horDesc].animales[key] = {
              animal: j.ANIMAL || key,
              codigo: j.CODIGOJUEGO || j.CODANIMAL || key,
              jugadas: 0,
              total: 0,
            };
          }
          porHorario[horDesc].animales[key].jugadas += 1;
          porHorario[horDesc].animales[key].total += parseFloat(
            j.TOTALJUEGO || j.TOTAL_APOSTADO || 0
          );
        }
      }

      const grupos = Object.values(porHorario);
      if (grupos.length === 0) return null;

      return (
        <div className="space-y-4">
          {grupos.map((grupo) => {
            const conteoArr = Object.values(grupo.animales).sort(
              (a, b) => b.jugadas - a.jugadas
            );
            return (
              <Card key={grupo.desc} className="shadow-md">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-primary" />
                    Conteo por Animalito — {grupo.desc}
                    {filtrosAplicados.sucursal && filtrosAplicados.sucursal !== '0' && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {' '}
                        (
                        {sucursales.find(
                          (s) => s.CODIGO.toString() === filtrosAplicados.sucursal
                        )?.BODEGA || 'Sucursal seleccionada'}
                        )
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {renderConteoTable(conteoArr)}
                </CardContent>
              </Card>
            );
          })}
        </div>
      );
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  const resumen = calcularResumen();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Informe de Juegos
            </h1>
            <p className="text-muted-foreground mt-1">
              Consulta de jugadas realizadas
            </p>
          </div>
          {jugadas.length > 0 && (
            <Button onClick={exportarCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros de Búsqueda</CardTitle>
            <CardDescription>Seleccione los criterios de búsqueda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="grid gap-2">
                <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={filtros.fecha_inicio}
                  onChange={(e) =>
                    setFiltros({ ...filtros, fecha_inicio: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fecha_fin">Fecha Fin</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  value={filtros.fecha_fin}
                  onChange={(e) =>
                    setFiltros({ ...filtros, fecha_fin: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sucursal">Sucursal</Label>
                <Select
                  value={filtros.sucursal}
                  onValueChange={(value) =>
                    setFiltros({ ...filtros, sucursal: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Todas</SelectItem>
                    {sucursales.map((suc) => (
                      <SelectItem key={suc.CODIGO} value={suc.CODIGO.toString()}>
                        {suc.BODEGA}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="horario">Horario</Label>
                <Select
                  value={filtros.horario}
                  onValueChange={(value) =>
                    setFiltros({ ...filtros, horario: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Todos</SelectItem>
                    {horarios.map((hor) => (
                      <SelectItem key={hor.NUM} value={hor.NUM.toString()}>
                        {hor.HORA} - {hor.DESCRIPCION}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleBuscar} disabled={isLoading} className="w-full">
                  {isLoading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {jugadas.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Jugadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{resumen.totalJugadas}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Apostado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    ${resumen.totalApostado.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Promedio por Jugada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    $
                    {resumen.promedio.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>
                  Total: {jugadas.length} jugadas encontradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Radicado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Sucursal</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Animales</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jugadas.map((jugada, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono font-medium">
                          {jugada.RADICADO}
                        </TableCell>
                        <TableCell>
                          {jugada.FECHA
                            ? format(new Date(jugada.FECHA + 'T00:00:00'), 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>{jugada.NOMBRE_SUCURSAL || '-'}</TableCell>
                        <TableCell className="font-mono">
                          {jugada.HORARIO || jugada.HORA || '-'}
                        </TableCell>
                        <TableCell className="min-w-[140px]">
                          <div className="flex flex-col lg:flex-row lg:flex-wrap lg:gap-x-1">
                            {(jugada.DETALLE_ANIMALES || jugada.ANIMALES || '-')
                              .split(', ')
                              .filter(Boolean)
                              .map((item: string, i: number, arr: string[]) => (
                                <span key={i} className="whitespace-nowrap text-sm">
                                  {item}
                                  {i < arr.length - 1 ? ',' : ''}
                                </span>
                              ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          $
                          {parseFloat(
                            jugada.TOTALJUEGO || jugada.TOTAL_APOSTADO || 0
                          ).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Conteo de Jugadas por Animalito — dinámico según filtros */}
            {renderConteoAnimales()}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}