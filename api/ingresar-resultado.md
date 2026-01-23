# API Ingresar Resultado - Documentación

Este endpoint replica la funcionalidad del formulario Java `FrmDIngresarResultado.java` para registrar el animal ganador de un sorteo.

## Base URL
```
http://localhost/api/ingresar-resultado.php
```

## Endpoints Disponibles

### 1. Listar Animales
**GET** `/ingresar-resultado.php/animales`

Obtiene la lista de animales activos para seleccionar al ganador.

---

### 2. Listar Horarios de Juego
**GET** `/ingresar-resultado.php/horarios`

Obtiene la lista de horarios disponibles para asignar el resultado.

---

### 3. Guardar Resultado Ganador
**POST** `/ingresar-resultado.php/guardar`

Registra el animal ganador para un sorteo específico.

**Cuerpo de la petición (JSON):**
```json
{
  "codigoAnimal": "05",
  "nombreAnimal": "LEON",
  "codigoHorario": 1,
  "descripcionHorario": "MAÑANA 10:00 AM",
  "fecha": "2024-01-18"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Resultado ingresado correctamente para la fecha 2024-01-18"
}
```

## Estructura de la Tabla (ingresarganadores)
Los datos se almacenan en la tabla `ingresarganadores` con los siguientes campos:
- `CODIGOA`: Código del animal.
- `ANIMAL`: Nombre del animal.
- `CODIGOH`: ID del horario.
- `DESCRIOCIONH`: Descripción del horario (Nombre original corregido según DB).
- `FECHA`: Fecha del resultado.
- `ESTADO`: Estado del registro ('A' por defecto).
