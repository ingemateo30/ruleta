# Instrucciones de Migración y Configuración

## Sistema Completado - Lotto Animal

Este documento contiene las instrucciones para completar la configuración del sistema mejorado de Lotto Animal.

---

## 1. Migración de Base de Datos

### Paso 1: Ejecutar Script SQL

Necesitas ejecutar el script de migración para agregar las nuevas tablas `pagos` y `cierrejuego` a tu base de datos.

**Ubicación del script:**
```
/api/migrations/add_pagos_table.sql
```

**Opciones para ejecutar:**

#### Opción A: Desde phpMyAdmin
1. Abre phpMyAdmin en tu navegador
2. Selecciona tu base de datos (bd_lottoa o if0_40919233_lottoa)
3. Click en la pestaña "SQL"
4. Copia y pega el contenido del archivo `add_pagos_table.sql`
5. Click en "Continuar"

#### Opción B: Desde MySQL CLI
```bash
mysql -u root -p bd_lottoa < api/migrations/add_pagos_table.sql
```

#### Opción C: Desde XAMPP MySQL
```bash
cd C:\xampp\mysql\bin
mysql.exe -u root bd_lottoa < "C:\ruta\al\proyecto\ruleta\api\migrations\add_pagos_table.sql"
```

### Paso 2: Verificar las Tablas

Ejecuta esta query para verificar que las tablas se crearon correctamente:

```sql
SHOW TABLES LIKE '%pagos%';
SHOW TABLES LIKE '%cierrejuego%';
```

Deberías ver:
- `pagos`
- `cierrejuego`

---

## 2. Nuevas Funcionalidades Implementadas

### Módulos Administrativos Completados:

✅ **Configuración > Seguridad**
- Gestión completa de usuarios (CRUD)
- Asignación de sucursales
- Control de permisos (Admin/Operario)

✅ **Configuración > Sucursales**
- CRUD de sucursales/bodegas
- Visualización de usuarios asignados
- Validaciones de integridad

✅ **Configuración > Parámetros**
- Edición de parámetros del sistema
- Validación de rangos (min/max apuestas, porcentajes, etc.)
- Configuración de comisiones

✅ **Configuración > Horarios de Juego**
- CRUD de horarios de sorteo
- Validación de formato de hora
- Activación/desactivación de horarios
- Estadísticas por horario

✅ **Configuración > Asignar Ruleta**
- Activar/desactivar animales individualmente
- Activar/desactivar todos los animales
- Estadísticas por animal (jugadas, apostado, veces ganador)
- Visualización con imágenes

### Módulos Operativos Completados:

✅ **Operativo > Realizar Pagos**
- Buscar jugadas ganadoras por radicado o fecha
- Verificar si una jugada es ganadora
- Calcular premios automáticamente (valor x puntos de pago)
- Registrar pagos
- Evitar pagos duplicados

✅ **Operativo > Cerrar Juego**
- Cerrar juegos por horario y fecha
- Cálculo automático de utilidades
- Distribución de comisiones
- Ganancias de sucursal
- Registro de cierres
- Validación de animal ganador registrado

### Módulos de Informes Completados:

✅ **Informes > Informe de Juegos**
- Filtros: fecha inicio/fin, sucursal, horario
- Listado detallado de jugadas
- Resumen: total jugadas, apostado, promedio
- Exportación a CSV

✅ **Informes > Ventas del Día**
- Ventas por sucursal
- Ventas por horario
- Gráficos de barras (usando Recharts)
- KPIs: total ventas, tickets, cancelaciones

✅ **Informes > Informe de Resultados**
- Resultados por fecha y horario
- Animal ganador con estadísticas
- Top 10 animales más ganadores
- Gráfico de pastel (Recharts)
- Cálculo de total a pagar

✅ **Informes > Informe de Pagos**
- Filtros: fecha inicio/fin, sucursal
- Listado de pagos realizados
- Resumen por sucursal
- Totales y promedios

### Módulo de Estadísticas Completado:

✅ **Estadísticas**
- Dashboard completo con múltiples gráficos
- Tendencias de ventas (7 días)
- Top 10 animales más jugados
- Ventas por horario
- Distribución por sucursal
- Todos los gráficos usando Recharts:
  - LineChart (tendencias)
  - BarChart (animales, horarios)
  - PieChart (distribución)

---

## 3. APIs Backend Creadas

Todas las APIs están en la carpeta `/api/`:

| Archivo | Descripción |
|---------|-------------|
| `usuarios.php` | CRUD de usuarios del sistema |
| `sucursales.php` | CRUD de sucursales/bodegas |
| `parametros.php` | Gestión de parámetros del sistema |
| `horarios.php` | CRUD de horarios de juego |
| `ruleta.php` | Gestión de animales de la ruleta |
| `pagos.php` | Operaciones de pagos a ganadores |
| `cerrar-juego.php` | Operaciones de cierre de juegos |
| `informes.php` | Todos los informes del sistema |
| `estadisticas.php` | Estadísticas y dashboard |

---

## 4. Servicios Frontend Creados

Archivo principal: `/src/api/admin.ts`

Contiene todos los servicios para consumir las APIs:
- `usuariosAPI`
- `sucursalesAPI`
- `parametrosAPI`
- `horariosAPI`
- `ruletaAPI`
- `pagosAPI`
- `cerrarJuegoAPI`
- `informesAPI`
- `estadisticasAPI`

---

## 5. Páginas Frontend Creadas

### Configuración:
- `/src/pages/config/Usuarios.tsx`
- `/src/pages/config/Sucursales.tsx`
- `/src/pages/config/Parametros.tsx`
- `/src/pages/config/Horarios.tsx`
- `/src/pages/config/AsignarRuleta.tsx`

### Operativo:
- `/src/pages/operativo/RealizarPagos.tsx`
- `/src/pages/operativo/CerrarJuego.tsx`

### Informes:
- `/src/pages/informes/InformeJuegos.tsx`
- `/src/pages/informes/InformeVentas.tsx`
- `/src/pages/informes/InformeResultados.tsx`
- `/src/pages/informes/InformePagos.tsx`

### Estadísticas:
- `/src/pages/Estadisticas.tsx`

---

## 6. Mejoras Implementadas

### Dashboard Mejorado:
- ✅ KPIs con datos en tiempo real desde la API
- ✅ Formateo de moneda en pesos colombianos (COP)
- ✅ Cálculo de porcentajes dinámicos
- ✅ Loading states con skeleton

### Diseño Mejorado:
- ✅ Interfaz moderna con shadcn-ui
- ✅ Tema claro/oscuro
- ✅ Responsive design
- ✅ Animaciones suaves
- ✅ Notificaciones con Sonner

### Gráficos:
- ✅ Implementados con Recharts
- ✅ Colores consistentes con el tema
- ✅ Tooltips informativos
- ✅ Responsive

---

## 7. Flujo de Trabajo Recomendado

### Para Operarios:

1. **Realizar Jugadas** → Registrar apuestas de clientes
2. **Listar Jugadas** → Ver historial y reimprimir tickets
3. **Anular Juego** → Cancelar apuestas (si es necesario)
4. **Realizar Pagos** → Pagar a ganadores después del sorteo

### Para Administradores:

1. **Ingresar Resultados** → Registrar animal ganador del sorteo
2. **Cerrar Juego** → Cerrar el juego del horario y calcular utilidades
3. **Ver Informes** → Revisar ventas, pagos, resultados
4. **Ver Estadísticas** → Analizar tendencias y desempeño
5. **Configuración** → Gestionar usuarios, sucursales, parámetros

---

## 8. Configuración de Parámetros Importantes

Los parámetros se configuran en **Configuración > Parámetros**:

| Parámetro | Descripción | Valor Recomendado |
|-----------|-------------|-------------------|
| MINIMOAPUESTA | Mínimo por apuesta | 1,000 |
| MAXIMOAPUESTA | Máximo por apuesta | 50,000 |
| PUNTOSPAGO | Multiplicador de premio | 30 |
| COMISIONADMINISTRACION | % comisión admin | 80 |
| COMISIONSISTEMATIZACION | % comisión sistema | 20 |
| PORCENTAJEGANANCIA | % ganancia sucursal | 7 |

---

## 9. Notas de Seguridad

⚠️ **IMPORTANTE:**

1. **Contraseñas:** Actualmente las contraseñas se guardan en texto plano. Se recomienda implementar hashing (bcrypt/password_hash) en producción.

2. **Autenticación:** El sistema usa localStorage para sesión. Considera implementar JWT para mayor seguridad.

3. **Validación:** Todas las APIs tienen validaciones básicas, pero se recomienda agregar más validaciones según necesidades específicas.

4. **Backup:** Haz backups regulares de la base de datos, especialmente antes de cierres de juego.

---

## 10. Solución de Problemas

### Error: Tablas no encontradas
→ Ejecuta la migración SQL (Paso 1)

### Error: CORS en las APIs
→ Verifica que el archivo `.htaccess` esté en `/api/`

### Error: Cannot find module '@/api/admin'
→ Ejecuta `npm install` para asegurar que todas las dependencias estén instaladas

### Gráficos no se muestran
→ Verifica que `recharts` esté instalado: `npm install recharts`

---

## 11. Próximos Pasos Recomendados

1. ✅ Ejecutar migración SQL
2. ✅ Probar login con usuario existente
3. ✅ Verificar que todas las páginas cargan correctamente
4. ✅ Configurar parámetros del sistema
5. ✅ Probar flujo completo: Jugada → Resultado → Pago → Cierre
6. ✅ Revisar informes y estadísticas

---

## 12. Contacto y Soporte

Para dudas o problemas, revisar:
- Logs de PHP en `/api/` (errores backend)
- Console del navegador (errores frontend)
- Network tab para errores de APIs

---

## 13. Estructura de la Base de Datos Final

```
bd_lottoa
├── seguridad (usuarios)
├── bodegas (sucursales)
├── lottoruleta (animales)
├── horariojuego (horarios de sorteo)
├── parametros (configuración)
├── jugarlotto (cabecera de apuestas)
├── hislottojuego (detalle de apuestas)
├── ingresarganadores (animales ganadores)
├── pagos (nuevapagos a ganadores) ⭐
└── cierrejuego (nueva - cierres de juegos) ⭐
```

---

¡Sistema completado y listo para usar! 🎉
