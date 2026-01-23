# Guía de Inicialización del Proyecto Lotto Animal

## 📋 Descripción del Proyecto

**Lotto Animal** es un sistema de gestión de apuestas de ruleta con animales, construido con tecnologías modernas:

- ⚛️ **React 18** - Biblioteca de UI
- 🔷 **TypeScript** - Tipado estático
- ⚡ **Vite** - Herramienta de construcción rápida
- 🎨 **Tailwind CSS** - Framework CSS utility-first
- 🧩 **shadcn-ui** - Componentes UI reutilizables
- 🔄 **React Query** - Manejo de estado del servidor
- 🛣️ **React Router** - Navegación

## 🚀 Inicialización del Proyecto

### Prerrequisitos

Asegúrate de tener instalado:
- **Node.js** v18 o superior
- **npm** v9 o superior

Verifica las versiones:
```bash
node --version
npm --version
```

### Paso 1: Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd ruleta
```

### Paso 2: Instalar dependencias

```bash
npm install
```

Este comando instalará todas las dependencias necesarias definidas en `package.json`.

### Paso 3: Configurar variables de entorno (Opcional)

Copia el archivo de ejemplo y configúralo según tus necesidades:

```bash
cp .env.example .env
```

El proyecto funciona sin archivo `.env` ya que usa configuración automática:
- **Desarrollo**: `http://localhost:8080/api`
- **Producción**: `/api` (ruta relativa)

### Paso 4: Iniciar servidor de desarrollo

```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:8080`

## 📁 Estructura del Proyecto

```
ruleta/
├── public/              # Archivos estáticos
├── src/
│   ├── api/            # Servicios y configuración de API
│   │   ├── auth.ts            # Autenticación
│   │   ├── realizar-juego.ts  # Realizar jugadas
│   │   ├── anular-juego.ts    # Anular jugadas
│   │   ├── listar-jugadas.ts  # Listar jugadas
│   │   ├── ingresar-resultado.ts # Ingresar resultados
│   │   ├── types.ts           # Tipos TypeScript
│   │   └── config.ts          # Configuración de API
│   ├── components/     # Componentes reutilizables
│   │   ├── ui/                # Componentes shadcn-ui
│   │   ├── layout/            # Componentes de layout
│   │   └── dashboard/         # Componentes del dashboard
│   ├── pages/          # Páginas de la aplicación
│   │   ├── Login.tsx          # Página de login
│   │   ├── Dashboard.tsx      # Dashboard principal
│   │   ├── operativo/         # Páginas operativas
│   │   └── admin/             # Páginas administrativas
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilidades
│   ├── constants/      # Constantes
│   └── utils/          # Funciones auxiliares
├── .htaccess           # Configuración Apache
├── package.json        # Dependencias y scripts
└── vite.config.ts      # Configuración de Vite
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo

# Producción
npm run build            # Construye para producción
npm run build:dev        # Construye en modo desarrollo
npm run preview          # Vista previa de la build

# Calidad de código
npm run lint             # Ejecuta ESLint
```

## 🔌 Conexión con Backend

El proyecto está configurado para conectarse con un backend que debe proporcionar los siguientes endpoints:

### Endpoints de API

#### Autenticación
- `POST /api/auth/login` - Login de usuario

#### Operativo
- `GET /api/realizar-juego/consecutivo` - Obtener consecutivo
- `GET /api/realizar-juego/animales` - Listar animales
- `GET /api/realizar-juego/horarios` - Listar horarios
- `GET /api/realizar-juego/parametros` - Obtener parámetros
- `POST /api/realizar-juego/guardar` - Guardar juego

#### Anular Jugada
- `POST /api/anular-juego/buscar` - Buscar juego
- `POST /api/anular-juego/anular` - Anular juego

#### Listar Jugadas
- `GET /api/listar-jugadas/horarios` - Listar horarios
- `POST /api/listar-jugadas/consultar` - Consultar jugadas
- `GET /api/listar-jugadas/recientes` - Jugadas recientes
- `POST /api/listar-jugadas/voucher` - Obtener voucher

#### Resultados
- `GET /api/ingresar-resultado/animales` - Listar animales
- `GET /api/ingresar-resultado/horarios` - Listar horarios
- `POST /api/ingresar-resultado/guardar` - Guardar resultado

## 🎯 Características del Sistema

### Módulos Operativos

1. **Realizar Jugadas** (`/operativo/jugadas`)
   - Selección de animales y horarios
   - Ingreso de valores de apuesta
   - Generación de recibo de caja
   - Validación de montos (mínimo/máximo)

2. **Anular Jugada** (`/operativo/anular`)
   - Búsqueda de jugadas por radicado
   - Visualización de detalles
   - Anulación de jugadas

3. **Listar Jugadas** (`/operativo/listar-jugadas`)
   - Filtros por fecha y horario
   - Visualización de jugadas activas/anuladas
   - Reimpresión de vouchers

4. **Ver Resultados** (`/operativo/resultados`)
   - Consulta de resultados por fecha
   - Visualización de ganadores

### Módulos Administrativos

1. **Ingresar Resultado** (`/admin/ingresar-resultados`)
   - Selección de animal ganador
   - Registro de resultado por horario
   - Gestión de sorteos

## 🎨 Temas y Personalización

El proyecto incluye soporte para tema claro/oscuro:
- Cambio automático según preferencia del sistema
- Toggle manual en la interfaz
- Persistencia de preferencia del usuario

## 📱 Características de UI

- **Responsive Design**: Adaptado para móviles, tablets y desktop
- **Animaciones**: Transiciones suaves con Framer Motion
- **Componentes**: Biblioteca completa de shadcn-ui
- **Accesibilidad**: Componentes accesibles por defecto
- **Loading States**: Indicadores de carga en operaciones asíncronas
- **Toast Notifications**: Notificaciones de éxito/error

## 🔐 Autenticación

El sistema requiere autenticación para acceder a las funcionalidades:

1. Usuario ingresa credenciales en `/`
2. El sistema valida contra el backend
3. Se almacena sesión del usuario
4. Redirección a `/dashboard`

### Tipos de usuario
- **Operativo**: Acceso a módulos de jugadas
- **Administrativo**: Acceso completo incluyendo resultados

## 🚨 Solución de Problemas

### Error: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: Puerto en uso
Cambia el puerto en `vite.config.ts` o detén el proceso que lo está usando.

### Problemas de construcción
```bash
npm run build:dev  # Construye en modo desarrollo para debug
```

### Problemas de CORS
Asegúrate de que el backend permita peticiones desde el origen del frontend.

## 📦 Despliegue

### Despliegue en Apache

1. Construye el proyecto:
```bash
npm run build
```

2. Copia el contenido de `dist/` a tu servidor web

3. El archivo `.htaccess` ya está incluido para:
   - Redirección de rutas SPA
   - Compresión GZIP
   - Cache de assets estáticos

### Despliegue en Nginx

Configuración ejemplo:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /ruta/a/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8080;
    }
}
```

## 🧪 Testing

Para agregar tests en el futuro:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

## 🤝 Contribución

1. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Commit tus cambios: `git commit -m 'Agrega nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Abre un Pull Request

## 📄 Licencia

© 2024 Lotto Animal - Todos los derechos reservados

## 📞 Soporte

Para problemas o preguntas sobre el proyecto, contacta al equipo de desarrollo.

---

**¡Proyecto inicializado con éxito! 🎉**
