# API Listar Jugadas - Documentación

Este endpoint replica la funcionalidad del formulario Java `FrmDListarJugadas.java` para consultar el historial de juegos realizados.

## Base URL
```
http://localhost/api/listar-jugadas.php
```

## Endpoints Disponibles

### 1. Listar Horarios de Juego
**GET** `/listar-jugadas.php/horarios`

Obtiene todos los horarios de juego registrados para usarlos como filtro de búsqueda.

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "NUM": 1,
      "DESCRIPCION": "MAÑANA 10:00 AM"
    },
    {
      "NUM": 2,
      "DESCRIPCION": "MEDIO DIA 12:00 PM"
    }
  ],
  "count": 2
}
```

**Ejemplo cURL:**
```bash
curl http://localhost/api/listar-jugadas.php/horarios
```

---

### 2. Consultar Jugadas por Filtro
**GET** `/listar-jugadas.php/consultar?fecha=YYYY-MM-DD&codigoJuego=ID`

Busca las jugadas realizadas en una fecha específica y para un horario determinado.

**Parámetros Query:**
- `fecha` (requerido): Fecha en formato `YYYY-MM-DD` (ej: `2024-01-18`)
- `codigoJuego` (requerido): ID del horario (`NUM` de la tabla `horariojuego`)

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "RADICADO": "00000001",
      "CODANIMAL": "00",
      "ANIMAL": "DELFIN",
      "VALOR": 1000,
      "SUCURSAL": "CAJA-01",
      "HORA": "09:30:15",
      "ESTADOP": "A",
      "VALOR_FORMATEADO": "1,000.00"
    }
  ],
  "count": 1,
  "filters": {
    "fecha": "2024-01-18",
    "codigoJuego": "1"
  }
}
```

**Ejemplo cURL:**
```bash
curl "http://localhost/api/listar-jugadas.php/consultar?fecha=2024-01-18&codigoJuego=1"
```

## Estructura de Datos (Tabla hislottojuego)

La consulta retorna los siguientes campos:
- `RADICADO`: Número único del ticket.
- `CODANIMAL`: Código del animal apostado.
- `ANIMAL`: Nombre del animal.
- `VALOR`: Monto apostado.
- `SUCURSAL`: Identificador de la caja/sucursal que realizó la venta.
- `HORA`: Hora exacta de la transacción.
- `ESTADOP`: Estado del juego ('A' para Activo).
