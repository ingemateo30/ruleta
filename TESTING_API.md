# Guía de Testing - Configuración de API y Frontend

## Problema Resuelto

El problema era un **conflicto de puertos** entre XAMPP y Vite:
- XAMPP (PHP/Apache) usaba el puerto 8080 para las APIs
- Vite (React) también estaba configurado para usar el puerto 8080
- Esto causaba que al acceder a http://localhost:8080 se viera XAMPP en lugar de la aplicación React

## Solución Implementada

### 1. Configuración de Vite (vite.config.ts)
- **Puerto cambiado**: Vite ahora usa el puerto `5173` (puerto por defecto)
- **Proxy configurado**: Las peticiones a `/api/*` se redirigen automáticamente a `http://localhost:8080/api/*`

### 2. Endpoint de API Principal (api/index.php)
Se creó un archivo `index.php` en la carpeta `/api` que:
- Muestra información sobre la API
- Lista todos los endpoints disponibles
- Maneja CORS correctamente

### 3. Configuración de Apache (.htaccess)
Se actualizó para:
- Manejar peticiones OPTIONS para CORS
- Redirigir `/api` a `/api/index.php` automáticamente
- Permitir acceso a todos los archivos PHP en `/api/`

## Cómo Probar

### Paso 1: Asegúrate de que XAMPP esté corriendo
```bash
# Verifica que Apache esté corriendo en el puerto 8080
# Puedes verificarlo desde el panel de control de XAMPP
```

### Paso 2: Instala las dependencias (si no lo has hecho)
```bash
npm install
```

### Paso 3: Inicia el servidor de desarrollo de Vite
```bash
npm run dev
```

Deberías ver algo como:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://[::]:5173/
```

### Paso 4: Prueba los endpoints

#### A. Frontend React
Abre tu navegador y ve a:
```
http://localhost:5173
```
Deberías ver tu aplicación React funcionando correctamente.

#### B. API directa (a través de XAMPP)
Prueba estos endpoints directamente en tu navegador o con curl:

1. **Información de la API**:
   ```
   http://localhost:8080/api
   ```
   Deberías ver un JSON con la lista de endpoints disponibles.

2. **Test de conexión a la base de datos**:
   ```
   http://localhost:8080/api/test_connection.php
   ```
   Deberías ver el estado de la conexión a la base de datos.

#### C. API a través del proxy de Vite
Cuando tu aplicación React hace peticiones a `/api/*`, estas se redirigen automáticamente a XAMPP:

```javascript
// Desde tu código React, puedes hacer:
fetch('/api/test_connection.php')
  .then(res => res.json())
  .then(data => console.log(data));
```

## Estructura Final

```
http://localhost:5173       → Aplicación React (Frontend)
http://localhost:5173/api/* → Proxy → http://localhost:8080/api/* (Backend PHP)
http://localhost:8080/api/* → APIs PHP servidas por XAMPP
```

## Troubleshooting

### Si ves "XAMPP" en localhost:5173
- Verifica que el servidor de Vite esté corriendo (`npm run dev`)
- Asegúrate de acceder a `http://localhost:5173` y no a `http://localhost:8080`

### Si las peticiones API fallan
- Verifica que XAMPP esté corriendo
- Verifica que el puerto 8080 esté disponible para Apache
- Revisa que el archivo `.env` tenga las credenciales correctas de la base de datos

### Si obtienes errores CORS
- Los headers CORS ya están configurados en `.htaccess` y en cada archivo PHP
- Si persiste el problema, verifica que el módulo `mod_headers` de Apache esté habilitado

## Comandos Útiles

```bash
# Desarrollo (Frontend + Backend)
npm run dev              # Inicia Vite en puerto 5173

# Construir para producción
npm run build           # Genera archivos estáticos en /dist

# Vista previa de producción
npm run preview         # Previsualiza el build de producción
```
