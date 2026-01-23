# API Endpoints

Esta carpeta contiene los endpoints PHP para la aplicación.

## Configuración del Servidor

### Desarrollo Local

Para que los endpoints PHP funcionen en desarrollo, necesitas:

1. **Opción 1: Usar un servidor web con PHP**
   - XAMPP, WAMP, o similar
   - Configurar el servidor para servir desde la carpeta `public`
   - Asegurarse de que PHP esté habilitado

2. **Opción 2: Usar el servidor PHP incorporado**
   ```bash
   php -S localhost:8000 -t public
   ```
   Luego actualiza la URL en `Login.tsx` a `http://localhost:8000/api/login.php`

### Producción

En producción, asegúrate de que:
- El servidor web (Apache/Nginx) tenga PHP habilitado
- Los archivos PHP tengan permisos de ejecución
- La base de datos esté configurada correctamente

## Endpoints Disponibles

### POST /api/login.php

Autentica un usuario contra la base de datos `bd_lottoa`.

**Request:**
```json
{
  "username": "usuario",
  "password": "contraseña"
}
```

**Response (éxito):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "id": "ID",
    "nombre": "Nombre",
    "nick": "nick",
    "tipo": "TIPO",
    "caja": 1,
    "codBodega": 1
  }
}
```

**Response (error):**
```json
{
  "success": false,
  "message": "Mensaje de error"
}
```

## Configuración de Base de Datos

La conexión está configurada para:
- Host: localhost
- Base de datos: bd_lottoa
- Usuario: root
- Contraseña: 123

Para cambiar estas credenciales, edita el archivo `login.php`.
