# API Anular Juego - Documentación

Este endpoint replica la funcionalidad del formulario Java `FrmDAnularJuego.java` para anular un ticket de juego realizado.

## Base URL
```
http://localhost/api/anular-juego.php
```

## Endpoints Disponibles

### 1. Buscar Juego para Anular
**GET** `/anular-juego.php/buscar?radicado=RAD&fecha=YYYY-MM-DD`

Busca la información de un ticket y su detalle de apuestas para confirmar antes de la anulación.

**Parámetros Query:**
- `radicado` (requerido): Número de radicado del ticket.
- `fecha` (requerido): Fecha del juego en formato `YYYY-MM-DD`.

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "cabecera": {
      "RADICADO": "00000001",
      "FECHA": "2024-01-18",
      "HORA": "09:30:15",
      "SUCURSAL": "CAJA-01",
      "TOTALJUEGO": 5000,
      "ESTADO": "A"
    },
    "detalles": [
      {
        "CODANIMAL": "00",
        "ANIMAL": "DELFIN",
        "VALOR": 2000,
        "DESJUEGO": "MAÑANA 10 AM",
        "HORAJUEGO": "10:00:00",
        "ESTADOP": "A"
      },
      {
        "CODANIMAL": "01",
        "ANIMAL": "BALLENA",
        "VALOR": 3000,
        "DESJUEGO": "MAÑANA 10 AM",
        "HORAJUEGO": "10:00:00",
        "ESTADOP": "A"
      }
    ]
  }
}
```

---

### 2. Ejecutar Anulación
**POST** `/anular-juego.php/ejecutar`

Anula el juego especificado, cambiando su estado a 'I' (Inactivo).

**Cuerpo de la petición (JSON):**
```json
{
  "radicado": "00000001",
  "fecha": "2024-01-18"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Juego con Radicado: 00000001 ha sido anulado correctamente"
}
```

## Funcionamiento Interno
- Cambia el campo `ESTADO` a **'I'** en la tabla `jugarlotto`.
- Cambia los campos `ESTADOP` y `ESTADOC` a **'I'** en la tabla `hislottojuego`.
- Solo permite anular juegos que se encuentren en estado activo ('A').
