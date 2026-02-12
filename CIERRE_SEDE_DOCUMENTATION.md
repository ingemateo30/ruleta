# Documentación: Sistema de Cierre por Sede

## Resumen de Cambios

Este documento describe las mejoras implementadas en el sistema de cierre de juegos para cumplir con los siguientes requisitos:

### Requisitos Implementados

1. ✅ **Cierre sede por sede**: Cada sede se cierra individualmente
2. ✅ **Cierre a cualquier hora**: Se puede cerrar a cualquier hora del día
3. ✅ **Restricción de jugadas post-cierre**: Una vez cerrada una sede, no puede realizar más jugadas ese día
4. ✅ **Informe de cierre funcional**: El informe de cierre continúa funcionando correctamente

---

## 1. Tabla `pagos` - Corrección de Error SQL

### Problema Original
```
Error al generar el informe: error del servidor: SQLSTATE[42S22]:
columna not found: 1054 unknown columna 'p.FECHA' in 'SELECT'
```

### Solución
Se creó la migración `00_create_pagos_table.sql` que garantiza la existencia de la tabla `pagos` con todos los campos necesarios:

```sql
CREATE TABLE IF NOT EXISTS pagos (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    RADICADO VARCHAR(20) NOT NULL,
    FECHA DATE NOT NULL,  -- ✓ Campo que faltaba
    HORA TIME NOT NULL,
    CODANIMAL INT NOT NULL,
    ANIMAL VARCHAR(50) NOT NULL,
    CODIGOJ INT NOT NULL,
    HORAJUEGO VARCHAR(50),
    VALOR_APOSTADO DECIMAL(10,2) NOT NULL,
    VALOR_GANADO DECIMAL(10,2) NOT NULL,
    SUCURSAL INT NOT NULL,
    USUARIO VARCHAR(50) NOT NULL,
    ESTADO VARCHAR(1) DEFAULT 'A',
    FECHA_PAGO DATETIME NOT NULL,
    OBSERVACIONES TEXT,
    ...
);
```

**Archivo afectado**: `/api/migrations/00_create_pagos_table.sql`

---

## 2. Cierre por Sede

### Funcionamiento Actual

El sistema ya soportaba cierre sede por sede. La tabla `cierrejuego` tiene los campos:

- `CODIGO_SUCURSAL` - Código de la sede/sucursal
- `NOMBRE_SUCURSAL` - Nombre de la sede
- Constraint único: `unique_horario_fecha_sucursal (CODIGOH, FECHA, CODIGO_SUCURSAL)`

### Proceso de Cierre

**API Endpoint**: `POST /api/cerrar-juego.php/ejecutar`

**Parámetros**:
```json
{
    "fecha": "2026-02-12",
    "usuario": "admin",
    "codigo_sucursal": 1  // Opcional: cierra solo esta sede
}
```

**Comportamiento**:

- **Con `codigo_sucursal`**: Cierra solo esa sede específica
- **Sin `codigo_sucursal`**: Cierra todas las sedes que tengan jugadas ese día

Cada cierre crea un registro independiente en `cierrejuego` con:
- Estado = 'C' (Cerrado)
- Fecha de cierre
- Usuario que cerró
- Métricas financieras específicas de esa sede

**Archivo**: `/api/cerrar-juego.php` (líneas 105-328)

---

## 3. Restricción de Jugadas Post-Cierre

### Implementación

Se agregó la función `verificarCierreSucursal()` en el archivo de realización de juegos:

```php
function verificarCierreSucursal($conn, $codigoSucursal, $fecha) {
    $stmt = $conn->prepare(
        "SELECT COUNT(*) as total
         FROM cierrejuego
         WHERE CODIGO_SUCURSAL = :sucursal
         AND FECHA = :fecha
         AND ESTADO = 'C'"
    );
    $stmt->execute([
        'sucursal' => $codigoSucursal,
        'fecha' => $fecha
    ]);

    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result['total'] > 0;
}
```

### Validación en `guardarJuego()`

Antes de permitir una jugada, el sistema verifica:

1. Si existe un cierre registrado para esa sede en esa fecha
2. Si existe, rechaza la jugada con el mensaje:
   ```
   "No se pueden realizar jugadas. La sucursal ha sido cerrada para el día de hoy."
   ```
3. Si no existe cierre, permite la jugada normalmente

**Archivo**: `/api/realizar-juego.php` (líneas 251-294)

### Comportamiento

| Escenario | Hora de Cierre | Hora de Jugada | ¿Permite Jugada? |
|-----------|----------------|----------------|------------------|
| Sede A cerrada a las 12:00 | 12:00 | 14:00 (mismo día) | ❌ NO |
| Sede A cerrada a las 12:00 | 12:00 | 08:00 (día siguiente) | ✅ SÍ |
| Sede B no cerrada | N/A | Cualquier hora | ✅ SÍ |
| Sede A cerrada, Sede B no | 12:00 | 14:00 (mismo día) | Sede A: ❌ / Sede B: ✅ |

---

## 4. Informe de Cierre

### Endpoint

**GET** `/api/informes.php/cierres`

**Parámetros**:
- `fecha_inicio`: Fecha de inicio del rango
- `fecha_fin`: Fecha de fin del rango

### Respuesta

```json
{
    "success": true,
    "data": {
        "cierres": [
            {
                "ID": 1,
                "CODIGOH": 1,
                "HORAJUEGO": "Juego de la Mañana",
                "FECHA": "2026-02-12",
                "CODIGO_SUCURSAL": 1,
                "NOMBRE_SUCURSAL": "Sede Principal",
                "TOTAL_APOSTADO": 500000,
                "PAGO_POTENCIAL_GANADORES": 150000,
                "TOTAL_PAGADO_REAL": 145000,
                "PAGOS_PENDIENTES": 5000,
                "UTILIDAD_PROYECTADA": 315000,
                "UTILIDAD_REAL": 320000,
                ...
            }
        ],
        "resumen": {
            "total_cierres": 15,
            "total_apostado": 7500000,
            "total_pagado": 2100000,
            "total_utilidad": 5400000,
            ...
        }
    }
}
```

### Características

- ✅ Muestra cada cierre como un registro separado por sede
- ✅ Incluye información del horario (descripción y hora)
- ✅ Proporciona resumen agregado de todos los cierres
- ✅ Soporta filtrado por rango de fechas
- ✅ Compatible con cierre sede por sede

**Archivo**: `/api/informes.php` (líneas 531-573)

---

## 5. Ejecución de Migraciones

Para aplicar todos los cambios de base de datos:

```bash
cd /home/user/ruleta/api/migrations
php run_migrations.php
```

O ejecutar manualmente cada migración SQL:

```bash
mysql -u usuario -p nombre_base_datos < 00_create_pagos_table.sql
mysql -u usuario -p nombre_base_datos < add_cierrejuego_columns.sql
mysql -u usuario -p nombre_base_datos < update_schema.sql
```

---

## 6. Flujo Completo del Sistema

### Proceso Normal de Operación

```
1. Usuario realiza jugada
   ↓
2. Sistema verifica si sede está cerrada para esa fecha
   ↓
3a. Si está cerrada → ❌ Rechaza jugada
3b. Si NO está cerrada → ✅ Guarda jugada
   ↓
4. Al final del día (o cuando se necesite)
   ↓
5. Admin ejecuta cierre de sede(s)
   ↓
6. Sistema registra cierre en cierrejuego con ESTADO='C'
   ↓
7. Futuras jugadas para esa sede/fecha son rechazadas
   ↓
8. Al día siguiente, el ciclo se reinicia
```

### Escenario: Cierre a las 12:00 por Percance

```
Timeline para Sede A:

08:00 - Jugadas normales ✅
09:00 - Jugadas normales ✅
10:00 - Jugadas normales ✅
11:00 - Jugadas normales ✅

12:00 - ⚠️  Admin ejecuta cierre por percance
        POST /api/cerrar-juego.php/ejecutar
        { "fecha": "2026-02-12", "codigo_sucursal": 1 }

12:01 - Usuario intenta jugada ❌ RECHAZADA
        Error: "Sucursal ha sido cerrada para el día de hoy"

15:00 - Usuario intenta jugada ❌ RECHAZADA
18:00 - Usuario intenta jugada ❌ RECHAZADA

--- Día siguiente ---

08:00 - Jugadas normales ✅ (nuevo día, sin cierre)
```

---

## 7. Archivos Modificados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `/api/migrations/00_create_pagos_table.sql` | ✨ Nuevo | - |
| `/api/migrations/run_migrations.php` | ✨ Nuevo | - |
| `/api/realizar-juego.php` | 🔧 Modificado | 251-294 |
| `CIERRE_SEDE_DOCUMENTATION.md` | ✨ Nuevo | - |

### Archivos Existentes (Sin Cambios Necesarios)

- `/api/cerrar-juego.php` - Ya soporta cierre sede por sede ✅
- `/api/informes.php` - Informe de cierre ya funciona correctamente ✅

---

## 8. Pruebas Recomendadas

### Test 1: Verificar tabla pagos
```sql
DESCRIBE pagos;
-- Debe mostrar la columna FECHA
```

### Test 2: Realizar jugada en sede sin cierre
```bash
curl -X POST http://localhost/api/realizar-juego/guardar \
  -H "Content-Type: application/json" \
  -d '{
    "radicado": "00000123",
    "fecha": "2026-02-12",
    "hora": "10:30:00",
    "sucursal": 1,
    "total": 5000,
    "juegos": [...]
  }'
# Esperado: success: true
```

### Test 3: Cerrar sede
```bash
curl -X POST http://localhost/api/cerrar-juego.php/ejecutar \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-02-12",
    "usuario": "admin",
    "codigo_sucursal": 1
  }'
# Esperado: success: true
```

### Test 4: Intentar jugada en sede cerrada
```bash
curl -X POST http://localhost/api/realizar-juego/guardar \
  -H "Content-Type: application/json" \
  -d '{
    "radicado": "00000124",
    "fecha": "2026-02-12",
    "hora": "14:30:00",
    "sucursal": 1,
    "total": 5000,
    "juegos": [...]
  }'
# Esperado: success: false, error: "Sucursal ha sido cerrada para el día de hoy"
```

### Test 5: Verificar informe de cierre
```bash
curl http://localhost/api/informes.php/cierres?fecha_inicio=2026-02-12&fecha_fin=2026-02-12
# Esperado: Lista de cierres con CODIGO_SUCURSAL = 1
```

---

## 9. Preguntas Frecuentes

### ¿Se puede reabrir una sede cerrada?

No en la implementación actual. Una vez cerrada, la sede queda cerrada para ese día. Para reabrir, sería necesario:
1. Eliminar o cambiar el estado del registro en `cierrejuego`
2. Esto no está implementado por seguridad

### ¿Se puede cerrar solo algunos horarios de una sede?

Sí, el sistema cierra por combinación de:
- Horario (CODIGOH)
- Fecha
- Sede (CODIGO_SUCURSAL)

Por lo tanto, se pueden cerrar horarios específicos dejando otros abiertos.

### ¿Qué pasa si hay un error técnico al verificar el cierre?

La función `verificarCierreSucursal()` está diseñada para "fail-open": si hay un error técnico (ej: tabla no existe), permite la jugada en lugar de bloquearla. Esto evita interrupciones del servicio por problemas técnicos.

---

## Contacto

Para preguntas sobre esta implementación, contactar al equipo de desarrollo.
