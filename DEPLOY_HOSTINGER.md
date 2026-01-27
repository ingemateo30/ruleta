# Guía de Despliegue en Hostinger - Lotto Animal/Ruleta

Esta guía detalla el proceso paso a paso para desplegar el sistema de Ruleta/Lotto Animal en Hostinger.

---

## Requisitos Previos

### En Hostinger necesitas:
- **Plan de Hosting**: Premium o Business (con soporte PHP 8.1+ y MySQL)
- **Acceso a**: hPanel (panel de control de Hostinger)
- **Dominio**: Puede ser el gratuito de Hostinger o uno propio

### En tu computadora:
- Node.js 18+ instalado
- Git instalado
- El proyecto clonado localmente

---

## Paso 1: Preparar el Build del Frontend

### 1.1 Configurar las variables de entorno para producción

Crea un archivo `.env.production` en la raíz del proyecto:

```bash
# En la raíz del proyecto, crear .env.production
VITE_API_URL=/api
NODE_ENV=production
```

> **Nota**: En producción usamos `/api` como ruta relativa porque el frontend y backend estarán en el mismo dominio.

### 1.2 Generar el build de producción

```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Generar build optimizado
npm run build
```

Esto creará una carpeta `dist/` con los archivos estáticos optimizados:
```
dist/
├── index.html
├── assets/
│   ├── index-XXXX.js      # JavaScript minificado
│   ├── index-XXXX.css     # CSS minificado
│   └── [imágenes y fuentes]
```

---

## Paso 2: Configurar Hostinger

### 2.1 Acceder al hPanel

1. Inicia sesión en [Hostinger](https://www.hostinger.com)
2. Ve a **Hosting** → Selecciona tu plan
3. Accede al **hPanel**

### 2.2 Crear la Base de Datos MySQL

1. En hPanel, ve a **Bases de datos** → **MySQL Databases**
2. Crea una nueva base de datos:
   - **Nombre de BD**: `tu_usuario_bd_lottoa` (Hostinger añade un prefijo)
   - **Usuario de BD**: `tu_usuario_db`
   - **Contraseña**: Genera una contraseña segura
3. **¡IMPORTANTE!** Anota estos datos:
   ```
   Host: localhost (o el proporcionado por Hostinger, ej: mysql.hostinger.com)
   Nombre BD: u123456789_bd_lottoa
   Usuario: u123456789_admin
   Contraseña: TuContraseñaSegura123!
   Puerto: 3306
   ```

### 2.3 Importar la Base de Datos

**Opción A: Via phpMyAdmin (Recomendado)**

1. En hPanel → **Bases de datos** → **phpMyAdmin**
2. Selecciona tu base de datos en el panel izquierdo
3. Ve a la pestaña **Importar**
4. Selecciona el archivo `bd_lottoa.sql` de tu proyecto
5. Haz clic en **Ejecutar**

**Opción B: Via Terminal SSH (si tienes acceso)**

```bash
mysql -u tu_usuario -p tu_base_datos < bd_lottoa.sql
```

### 2.4 Verificar PHP 8.1+

1. En hPanel → **Avanzado** → **Configuración de PHP**
2. Asegúrate que la versión sea **PHP 8.1** o superior
3. Verifica que estas extensiones estén habilitadas:
   - `pdo_mysql`
   - `mysqli`
   - `json`
   - `mbstring`

---

## Paso 3: Estructura de Archivos en Hostinger

### 3.1 Estructura final en el servidor

Tu directorio `public_html` debe quedar así:

```
public_html/
├── index.html              # Frontend (de dist/)
├── assets/                 # Assets del frontend (de dist/assets/)
│   ├── index-XXXX.js
│   ├── index-XXXX.css
│   └── [otros assets]
├── api/                    # Backend PHP (del proyecto)
│   ├── .env               # Variables de entorno (¡CONFIGURAR!)
│   ├── db.php
│   ├── index.php
│   ├── login.php
│   ├── auth_middleware.php
│   ├── realizar-juego.php
│   ├── listar-jugadas.php
│   ├── anular-juego.php
│   ├── ingresar-resultado.php
│   ├── cerrar-juego.php
│   ├── estadisticas.php
│   ├── horarios.php
│   ├── informes.php
│   ├── pagos.php
│   ├── parametros.php
│   ├── ruleta.php
│   ├── ruleta-publica.php
│   ├── sucursales.php
│   ├── usuarios.php
│   └── inicializar-animales.php
├── .htaccess              # Configuración Apache
└── favicon.ico            # (opcional)
```

---

## Paso 4: Subir Archivos a Hostinger

### 4.1 Método 1: File Manager (Más fácil)

1. En hPanel → **Archivos** → **Administrador de archivos**
2. Navega a `public_html`
3. **Elimina** los archivos por defecto (index.html de Hostinger, etc.)

**Subir Frontend:**
4. Sube el contenido de tu carpeta `dist/`:
   - `index.html` → `public_html/index.html`
   - `assets/` → `public_html/assets/`

**Subir Backend:**
5. Crea la carpeta `api` en `public_html`
6. Sube todos los archivos `.php` de tu carpeta `api/` local

### 4.2 Método 2: FTP/SFTP (Más rápido para muchos archivos)

1. En hPanel → **Archivos** → **Cuentas FTP**
2. Obtén los datos de conexión:
   ```
   Host: ftp.tudominio.com (o el proporcionado)
   Usuario: tu_usuario_ftp
   Contraseña: tu_contraseña
   Puerto: 21 (FTP) o 22 (SFTP)
   ```
3. Usa FileZilla o similar:
   - Conecta con los datos anteriores
   - Navega a `public_html`
   - Sube `dist/*` y `api/`

### 4.3 Método 3: Git (Avanzado)

Si tienes acceso SSH:

```bash
# Conectar via SSH
ssh tu_usuario@tu_servidor

# Clonar repositorio
cd public_html
git clone https://github.com/ingemateo30/ruleta.git .

# Instalar dependencias y hacer build
npm install
npm run build

# Mover archivos de dist a public_html
mv dist/* .
```

---

## Paso 5: Configurar el Backend (API)

### 5.1 Configurar variables de entorno

Crea/edita el archivo `public_html/api/.env` con los datos de tu base de datos:

```env
# Configuración de Base de Datos - HOSTINGER
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u123456789_bd_lottoa
DB_USER=u123456789_admin
DB_PASS=TuContraseñaSegura123!
```

> **IMPORTANTE**: Reemplaza con los valores reales de tu base de datos en Hostinger.

### 5.2 Verificar permisos de archivos

En el Administrador de archivos de Hostinger, verifica que:

- Carpeta `api/`: Permisos **755**
- Archivos `.php`: Permisos **644**
- Archivo `.env`: Permisos **600** (más seguro) o **644**

Para cambiar permisos:
1. Click derecho en archivo/carpeta
2. **Permisos** o **Chmod**
3. Ingresa el valor numérico

---

## Paso 6: Configurar .htaccess

### 6.1 Crear/Actualizar .htaccess en public_html

El archivo `.htaccess` en `public_html/` debe contener:

```apache
# Habilitar motor de reescritura
RewriteEngine On

# Configuración base (ajustar si está en subcarpeta)
RewriteBase /

# ===== CORS Headers =====
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>

# ===== Comprensión GZIP =====
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
    AddOutputFilterByType DEFLATE application/javascript application/json
</IfModule>

# ===== Cache de Assets =====
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# ===== Reglas de Reescritura =====

# No reescribir archivos existentes
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Redirigir peticiones API al backend PHP
RewriteRule ^api/(.*)$ api/$1 [L,QSA]

# SPA: Redirigir todas las demás rutas a index.html
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^(.*)$ index.html [L]

# ===== Seguridad =====

# Proteger archivos sensibles
<FilesMatch "\.(env|sql|md|json|lock)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Proteger directorio de configuración
<IfModule mod_rewrite.c>
    RewriteRule ^api/\.env$ - [F,L]
</IfModule>
```

### 6.2 Crear .htaccess en la carpeta api/

Crea `public_html/api/.htaccess`:

```apache
# Permitir acceso a la API
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Manejar peticiones OPTIONS (preflight CORS)
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=200,L]
</IfModule>

# Headers CORS para API
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    Header set Content-Type "application/json; charset=UTF-8"
</IfModule>

# Proteger archivo .env
<Files ".env">
    Order allow,deny
    Deny from all
</Files>
```

---

## Paso 7: Verificación y Pruebas

### 7.1 Verificar que la API funciona

Abre en tu navegador:
```
https://tudominio.com/api/index.php
```

Deberías ver una respuesta JSON:
```json
{"status": "ok", "message": "API funcionando"}
```

### 7.2 Probar endpoint de login

```bash
curl -X POST https://tudominio.com/api/login.php \
  -H "Content-Type: application/json" \
  -d '{"usuario": "admin", "password": "admin123"}'
```

### 7.3 Verificar el Frontend

1. Abre `https://tudominio.com`
2. Deberías ver la página de login
3. Intenta iniciar sesión con las credenciales de prueba

---

## Paso 8: Configuración de SSL (HTTPS)

### 8.1 Activar SSL gratuito

1. En hPanel → **Seguridad** → **SSL**
2. Selecciona **SSL Gratuito** (Let's Encrypt)
3. Haz clic en **Instalar**
4. Espera unos minutos a que se active

### 8.2 Forzar HTTPS

Añade al inicio de tu `.htaccess` en `public_html/`:

```apache
# Forzar HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Paso 9: Solución de Problemas Comunes

### Error: "No se puede conectar a la base de datos"

1. Verifica los datos en `api/.env`
2. En Hostinger, el host puede ser:
   - `localhost`
   - `tu_servidor.hostinger.com`
   - Una IP específica (ver en hPanel → MySQL)

### Error: "CORS Policy"

1. Verifica que los headers CORS estén en `.htaccess`
2. Asegúrate que `mod_headers` esté habilitado

### Error 500 en la API

1. Revisa los logs en hPanel → **Avanzado** → **Logs de errores**
2. Verifica permisos de archivos
3. Asegúrate que PHP 8.1+ esté activo

### Página en blanco (Frontend)

1. Abre la consola del navegador (F12)
2. Verifica que los assets se carguen correctamente
3. Revisa la ruta de `VITE_API_URL`

### Las rutas del SPA no funcionan

1. Verifica que el `.htaccess` tenga las reglas de reescritura
2. Asegúrate que `mod_rewrite` esté habilitado en Hostinger

---

## Paso 10: Checklist Final

- [ ] Base de datos creada e importada
- [ ] Archivos del frontend subidos (`dist/` → `public_html/`)
- [ ] Carpeta `api/` subida con todos los archivos PHP
- [ ] Archivo `api/.env` configurado con datos correctos
- [ ] Archivo `.htaccess` configurado en `public_html/`
- [ ] SSL activado y funcionando
- [ ] API responde correctamente
- [ ] Login funciona
- [ ] Navegación SPA funciona
- [ ] Permisos de archivos correctos

---

## Comandos Útiles (si tienes SSH)

```bash
# Ver logs de PHP
tail -f ~/logs/error.log

# Verificar versión de PHP
php -v

# Probar conexión a BD
php -r "new PDO('mysql:host=localhost;dbname=tu_bd', 'usuario', 'pass');"

# Ver permisos
ls -la public_html/api/

# Cambiar permisos
chmod 644 public_html/api/*.php
chmod 600 public_html/api/.env
```

---

## Estructura Final Verificada

```
public_html/
├── index.html          ✓ Frontend principal
├── assets/             ✓ JS, CSS, imágenes
├── api/                ✓ Backend PHP
│   ├── .env           ✓ Config BD (protegido)
│   ├── .htaccess      ✓ Reglas API
│   └── *.php          ✓ Endpoints
├── .htaccess          ✓ Reglas principales
└── [otros assets]
```

---

## Soporte

Si tienes problemas:
1. Revisa los **logs de error** en hPanel
2. Usa las **herramientas de desarrollador** del navegador (F12)
3. Verifica la **documentación de Hostinger**
4. Contacta al **soporte de Hostinger** si es un problema del servidor

---

**¡Listo!** Tu aplicación Lotto Animal debería estar funcionando en Hostinger.
