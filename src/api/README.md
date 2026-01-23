# API TypeScript

Esta carpeta contiene la capa de API en TypeScript para comunicarse con los endpoints PHP usando **Axios**.

## Estructura

- **`types.ts`**: Define todos los tipos e interfaces TypeScript para las respuestas y peticiones de la API
- **`client.ts`**: Cliente base HTTP usando Axios con instancia configurada, manejo de errores y métodos para GET, POST, PUT, DELETE, PATCH
- **`auth.ts`**: Servicio de autenticación que maneja login, logout y gestión de sesión
- **`index.ts`**: Punto de entrada que exporta todos los servicios y tipos

## Configuración de Axios

El cliente utiliza una instancia de Axios configurada con:
- **Base URL**: `http://localhost/api` en desarrollo, `/api` en producción
- **Timeout**: 10 segundos
- **Headers**: `Content-Type: application/json` por defecto
- **Interceptores**: Para manejo centralizado de errores y solicitudes

## Uso

### Importar el servicio de autenticación

```typescript
import { authService } from '@/api';
```

### Ejemplo de login

```typescript
const response = await authService.login({
  username: 'usuario',
  password: 'contraseña'
});

if (response.success && response.user) {
  console.log('Usuario autenticado:', response.user);
} else {
  console.error('Error:', response.message);
}
```

### Obtener usuario actual

```typescript
const user = authService.getCurrentUser();
if (user) {
  console.log('Usuario actual:', user);
}
```

### Verificar autenticación

```typescript
if (authService.isAuthenticated()) {
  console.log('Usuario autenticado');
}
```

### Cerrar sesión

```typescript
authService.logout();
```

## Usar el hook personalizado

También puedes usar el hook `useAuth` para manejar la autenticación en componentes React:

```typescript
import { useAuth } from '@/hooks/use-auth';

const MyComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  if (isLoading) return <div>Cargando...</div>;
  
  if (!isAuthenticated) {
    return <button onClick={() => login('user', 'pass')}>Login</button>;
  }

  return (
    <div>
      <p>Bienvenido, {user?.nombre}</p>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
};
```

## Cliente API base con Axios

Si necesitas crear nuevos servicios, puedes usar el `apiClient` que utiliza Axios:

```typescript
import { apiClient } from '@/api';

// GET request
const data = await apiClient.get<MyType>('/endpoint.php');

// POST request
const result = await apiClient.post<MyResponse>('/endpoint.php', {
  field1: 'value1',
  field2: 'value2'
});

// PUT request
const updated = await apiClient.put<MyResponse>('/endpoint.php', {
  field1: 'newValue'
});

// DELETE request
await apiClient.delete('/endpoint.php');

// PATCH request
const patched = await apiClient.patch<MyResponse>('/endpoint.php', {
  field1: 'partialUpdate'
});
```

### Acceso directo a la instancia de Axios

Si necesitas acceso directo a la instancia de Axios (por ejemplo, para configuraciones avanzadas):

```typescript
import { axiosInstance } from '@/api';

// Usar la instancia directamente
const response = await axiosInstance.get('/endpoint.php');
```

### Configuración de la Base URL

La base URL se configura automáticamente:
- **Desarrollo**: `http://localhost/api`
- **Producción**: `/api` (ruta relativa)

Para cambiar la configuración, edita `src/api/client.ts`.

## Manejo de errores

El cliente API lanza `ApiError` cuando hay errores:

```typescript
import { apiClient, ApiError } from '@/api';

try {
  const data = await apiClient.post('/endpoint.php', payload);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Error de API:', error.message);
    console.error('Status:', error.status);
  }
}
```

## Tipos disponibles

- `User`: Información del usuario autenticado
- `LoginRequest`: Datos para el login
- `LoginResponse`: Respuesta del login
- `ApiResponse<T>`: Respuesta genérica de la API
- `ApiErrorResponse`: Respuesta de error de la API
