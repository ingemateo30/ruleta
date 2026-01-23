# API Realizar Juego - Documentación

Este endpoint replica toda la funcionalidad del formulario Java `FrmDRealizarJuego.java` para gestionar juegos de lotería de animales.

## Base URL
```
http://localhost/api/realizar-juego.php
```

## Endpoints Disponibles

### 1. Obtener Consecutivo de Radicado
**GET** `/realizar-juego.php/consecutivo`

Obtiene el próximo número consecutivo para el radicado del juego.

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "consecutivo": 1,
    "radicado": "00000001"
  }
}
```

**Ejemplo cURL:**
```bash
curl http://localhost/api/realizar-juego.php/consecutivo
```

---

### 2. Listar Animales
**GET** `/realizar-juego.php/animales`

Obtiene todos los animales activos de la ruleta.

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "NUM": 1,
      "CODIGOJUEGO": "00",
      "VALOR": "Delfin",
      "COLOR": "Rojo"
    },
    {
      "NUM": 2,
      "CODIGOJUEGO": "01",
      "VALOR": "Ballena",
      "COLOR": "Azul"
    }
  ],
  "count": 2
}
```

**Ejemplo cURL:**
```bash
curl http://localhost/api/realizar-juego.php/animales
```

---

### 3. Listar Horarios de Juego
**GET** `/realizar-juego.php/horarios`

Obtiene todos los horarios de juego activos.

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "NUM": 1,
      "DESCRIPCION": "Primera",
      "HORA": "09:00:00",
      "HORA_FORMATEADA": "09:00:00"
    },
    {
      "NUM": 2,
      "DESCRIPCION": "Segunda",
      "HORA": "12:00:00",
      "HORA_FORMATEADA": "12:00:00"
    }
  ],
  "count": 2
}
```

**Ejemplo cURL:**
```bash
curl http://localhost/api/realizar-juego.php/horarios
```

---

### 4. Obtener Parámetros de Apuesta
**GET** `/realizar-juego.php/parametros`

Obtiene los valores mínimo y máximo permitidos para las apuestas.

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "minimo": 100.0,
    "maximo": 10000.0
  }
}
```

**Ejemplo cURL:**
```bash
curl http://localhost/api/realizar-juego.php/parametros
```

---

### 5. Buscar Animal por Código
**GET** `/realizar-juego.php/animal/{codigo}`

Busca un animal específico por su código.

**Parámetros:**
- `codigo` (string): Código del animal (ej: "00", "01", etc.)

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "CODIGOJUEGO": "00",
    "VALOR": "Delfin",
    "NUM": 1,
    "COLOR": "Rojo"
  }
}
```

**Respuesta de error:**
```json
{
  "success": false,
  "error": "Animal no encontrado"
}
```

**Ejemplo cURL:**
```bash
curl http://localhost/api/realizar-juego.php/animal/00
```

---

### 6. Guardar Juego Completo
**POST** `/realizar-juego.php/guardar`

Guarda un juego completo con todos sus detalles. Inserta en las tablas `jugarlotto` y `hislottojuego`.

**Body (JSON):**
```json
{
  "radicado": "00000001",
  "fecha": "2026-01-18",
  "hora": "14:30:00",
  "sucursal": "SUCURSAL PRINCIPAL",
  "total": 5000,
  "juegos": [
    {
      "codigoAnimal": "00",
      "nombreAnimal": "Delfin",
      "codigoHorario": 1,
      "horaJuego": "09:00:00",
      "descripcionHorario": "Primera",
      "valor": 2000
    },
    {
      "codigoAnimal": "05",
      "nombreAnimal": "Leon",
      "codigoHorario": 2,
      "horaJuego": "12:00:00",
      "descripcionHorario": "Segunda",
      "valor": 3000
    }
  ]
}
```

**Campos requeridos:**
- `radicado` (string): Número de radicado del juego
- `fecha` (string): Fecha del juego (formato: YYYY-MM-DD)
- `hora` (string): Hora del registro (formato: HH:MM:SS)
- `sucursal` (string): Nombre de la sucursal
- `total` (number): Total del juego (suma de todos los valores)
- `juegos` (array): Array con los juegos individuales
  - `codigoAnimal` (string): Código del animal
  - `nombreAnimal` (string): Nombre del animal
  - `codigoHorario` (number): Código del horario
  - `horaJuego` (string): Hora del juego (HH:MM:SS)
  - `descripcionHorario` (string): Descripción del horario
  - `valor` (number): Valor apostado

**Validaciones automáticas:**
- ✓ Verifica que todos los campos requeridos estén presentes
- ✓ Valida que cada apuesta esté dentro del rango mínimo/máximo
- ✓ Verifica que haya al menos un juego
- ✓ Usa transacciones para garantizar integridad de datos

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Juego Lotto Animal con Radicado: 00000001 almacenado correctamente",
  "data": {
    "radicado": "00000001",
    "total": 5000,
    "cantidad_juegos": 2
  }
}
```

**Respuesta de error (validación):**
```json
{
  "success": false,
  "error": "Errores de validación",
  "details": [
    "Juego #1: El valor 50 es inferior al mínimo permitido (100)",
    "Juego #2: El valor 15000 es superior al máximo permitido (10000)"
  ]
}
```

**Ejemplo cURL:**
```bash
curl -X POST http://localhost/api/realizar-juego.php/guardar \
  -H "Content-Type: application/json" \
  -d '{
    "radicado": "00000001",
    "fecha": "2026-01-18",
    "hora": "14:30:00",
    "sucursal": "SUCURSAL PRINCIPAL",
    "total": 5000,
    "juegos": [
      {
        "codigoAnimal": "00",
        "nombreAnimal": "Delfin",
        "codigoHorario": 1,
        "horaJuego": "09:00:00",
        "descripcionHorario": "Primera",
        "valor": 2000
      },
      {
        "codigoAnimal": "05",
        "nombreAnimal": "Leon",
        "codigoHorario": 2,
        "horaJuego": "12:00:00",
        "descripcionHorario": "Segunda",
        "valor": 3000
      }
    ]
  }'
```

---

## Flujo Completo de Uso

### 1. Inicializar un nuevo juego
```javascript
// 1. Obtener consecutivo
const consecutivo = await fetch('/api/realizar-juego.php/consecutivo');
const { data: { radicado } } = await consecutivo.json();

// 2. Obtener animales disponibles
const animales = await fetch('/api/realizar-juego.php/animales');
const { data: listaAnimales } = await animales.json();

// 3. Obtener horarios disponibles
const horarios = await fetch('/api/realizar-juego.php/horarios');
const { data: listaHorarios } = await horarios.json();

// 4. Obtener parámetros de apuesta
const parametros = await fetch('/api/realizar-juego.php/parametros');
const { data: { minimo, maximo } } = await parametros.json();
```

### 2. Buscar animal por código
```javascript
const codigo = "00";
const response = await fetch(`/api/realizar-juego.php/animal/${codigo}`);
const { data: animal } = await response.json();
console.log(animal); // { CODIGOJUEGO: "00", VALOR: "Delfin", ... }
```

### 3. Guardar juego completo
```javascript
const juego = {
  radicado: "00000001",
  fecha: "2026-01-18",
  hora: new Date().toLocaleTimeString('es-ES', { hour12: false }),
  sucursal: "SUCURSAL PRINCIPAL",
  total: 5000,
  juegos: [
    {
      codigoAnimal: "00",
      nombreAnimal: "Delfin",
      codigoHorario: 1,
      horaJuego: "09:00:00",
      descripcionHorario: "Primera",
      valor: 2000
    },
    {
      codigoAnimal: "05",
      nombreAnimal: "Leon",
      codigoHorario: 2,
      horaJuego: "12:00:00",
      descripcionHorario: "Segunda",
      valor: 3000
    }
  ]
};

const response = await fetch('/api/realizar-juego.php/guardar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(juego)
});

const result = await response.json();
if (result.success) {
  console.log(result.message);
}
```

---

## Manejo de Errores

Todos los endpoints retornan errores en el siguiente formato:

```json
{
  "success": false,
  "error": "Mensaje descriptivo del error",
  "details": "Información adicional (opcional)"
}
```

**Códigos de estado HTTP:**
- `200` - Éxito (GET)
- `201` - Creado exitosamente (POST)
- `400` - Error de validación o datos incorrectos
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

---

## Comparación con el código Java

| Método Java | Endpoint PHP | Descripción |
|-------------|--------------|-------------|
| `ConsecutivoRadicado()` | `GET /consecutivo` | Obtener próximo radicado |
| `MostrarTabla()` | `GET /animales` | Listar animales |
| `MostrarTablaJuegos()` | `GET /horarios` | Listar horarios |
| `ParametroMinimoJ()` + `ParametroMaximoJ()` | `GET /parametros` | Obtener límites de apuesta |
| `BuscarAnimal()` | `GET /animal/{codigo}` | Buscar animal |
| `Guardar()` + `HisGuardar()` | `POST /guardar` | Guardar juego completo |

---

## Notas Técnicas

- ✓ Usa transacciones SQL para garantizar integridad de datos
- ✓ Validación automática de rangos de apuesta (mínimo/máximo)
- ✓ Soporte completo para CORS
- ✓ Respuestas en formato JSON UTF-8
- ✓ Manejo de errores robusto
- ✓ Compatible con la estructura de BD existente

## Tablas de Base de Datos

### Tablas utilizadas:
- `jugarlotto` - Registro principal de juegos
- `hislottojuego` - Historial detallado de cada apuesta
- `lottoruleta` - Catálogo de animales
- `horariojuego` - Horarios disponibles
- `parametros` - Configuración del sistema
