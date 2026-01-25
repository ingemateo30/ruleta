import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { parametrosAPI } from '@/api/admin';
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

  const validateValue = (value: string): boolean => {
    if (value === '' || value === null || value === undefined) {
      toast.error('El valor no puede estar vacío');
      return false;
    }
    return true;
  };

  const handleSave = async (codigo: number) => {
    if (!validateValue(editingValue)) {
      return;
    }

    try {
      const result = await parametrosAPI.actualizar(codigo, {
        valor: editingValue,
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
      <DashboardLayout>
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
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

      </div>
    </DashboardLayout>
  );
}
