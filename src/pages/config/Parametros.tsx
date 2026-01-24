import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { parametrosAPI } from '@/api/admin';
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
import { toast } from 'sonner';
import { Settings, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Parametros() {
  const { user } = useAuth();
  const [parametros, setParametros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const response = await parametrosAPI.listar();

      if (response.success) {
        setParametros(response.data);
      }
    } catch (error: any) {
      toast.error('Error al cargar datos: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (parametro: any) => {
    setEditingId(parametro.CODIGO);
    setEditingValue(parametro.VALOR);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const validateValue = (codigo: number, value: string): boolean => {
    const parametro = parametros.find((p) => p.CODIGO === codigo);
    if (!parametro) return false;

    const numValue = parseFloat(value);

    // Validar según el tipo de parámetro
    if (parametro.CODIGO === 1) { // MAX_JUGADAS_DIA
      if (numValue < 1 || numValue > 10000) {
        toast.error('El valor debe estar entre 1 y 10000');
        return false;
      }
    } else if (parametro.CODIGO === 2) { // COMISION_PORCENTAJE
      if (numValue < 0 || numValue > 100) {
        toast.error('El valor debe estar entre 0 y 100');
        return false;
      }
    } else if (parametro.CODIGO === 3) { // PREMIO_MULTIPLICADOR
      if (numValue < 1 || numValue > 1000) {
        toast.error('El valor debe estar entre 1 y 1000');
        return false;
      }
    } else if (parametro.CODIGO === 4) { // APUESTA_MINIMA
      if (numValue < 100 || numValue > 1000000) {
        toast.error('El valor debe estar entre 100 y 1000000');
        return false;
      }
    } else if (parametro.CODIGO === 5) { // APUESTA_MAXIMA
      if (numValue < 1000 || numValue > 10000000) {
        toast.error('El valor debe estar entre 1000 y 10000000');
        return false;
      }
    }

    return true;
  };

  const handleSave = async (codigo: number) => {
    if (!validateValue(codigo, editingValue)) {
      return;
    }

    try {
      const result = await parametrosAPI.actualizar(codigo, {
        valor: parseFloat(editingValue),
      });

      if (result.success) {
        toast.success('Parámetro actualizado exitosamente');
        setEditingId(null);
        setEditingValue('');
        cargarDatos();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar parámetro');
    }
  };

  if (String(user?.tipo) !== '1') {
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
            <Settings className="h-8 w-8" />
            Parámetros del Sistema
          </h1>
          <p className="text-muted-foreground mt-1">
            Configura los parámetros de operación del sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
          <CardDescription>
            Total: {parametros.length} parámetros configurados
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
                  <TableHead>Descripción</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parametros.map((parametro) => (
                  <TableRow key={parametro.CODIGO}>
                    <TableCell className="font-medium">{parametro.CODIGO}</TableCell>
                    <TableCell>{parametro.NOMBRE}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {parametro.DESCRIPCION}
                    </TableCell>
                    <TableCell>
                      {editingId === parametro.CODIGO ? (
                        <Input
                          type="number"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="w-32"
                          step="0.01"
                          autoFocus
                        />
                      ) : (
                        <span className="font-semibold">{parametro.VALOR}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {editingId === parametro.CODIGO ? (
                        <>
                          <Button
                            variant="default"
                            size="icon"
                            onClick={() => handleSave(parametro.CODIGO)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(parametro)}
                        >
                          Editar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de Rangos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm">
            <div>
              <strong>MAX_JUGADAS_DIA:</strong> Rango permitido: 1 - 10,000
            </div>
            <div>
              <strong>COMISION_PORCENTAJE:</strong> Rango permitido: 0% - 100%
            </div>
            <div>
              <strong>PREMIO_MULTIPLICADOR:</strong> Rango permitido: 1x - 1,000x
            </div>
            <div>
              <strong>APUESTA_MINIMA:</strong> Rango permitido: $100 - $1,000,000
            </div>
            <div>
              <strong>APUESTA_MAXIMA:</strong> Rango permitido: $1,000 - $10,000,000
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
