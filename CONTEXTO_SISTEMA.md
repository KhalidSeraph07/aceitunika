# 🫒 Sistema SAS — Aceitunas v2
### Documento de Contexto Completo · Versión en Producción

---

## 1. ¿Qué problema resuelve?

**Aceitunas v2** es un sistema de gestión operativa para una **empresa agroindustrial aceitunera**. Reemplaza un flujo anterior en PHP, migrando toda la lógica a Node.js + PostgreSQL dentro de contenedores Docker.

El sistema resuelve de forma centralizada los siguientes problemas del negocio:

| Problema real | Solución en el sistema |
|---|---|
| Registro manual en papel de cada lote de aceituna que ingresa | Módulo de **Entradas** con 67+ campos por lote |
| No se sabe cuánto producto hay ni dónde está en el almacén | Módulo de **Almacén** con mapa físico de filas y cuadrantes |
| Pérdida de trazabilidad de los "puchos" (restos de bidón) | Lógica de **puchos** con zonas dedicadas y candado inteligente |
| Falta de control de quién usa qué insumo (ácidos, sal, etc.) | Módulo de **Insumos** con movimientos de stock |
| El trabajador de campo no puede ver costos financieros | **Control de acceso por rol** — precios ocultos al `trabajador` |
| No hay registro de auditoria de cambios | **Historial de actividad** con JSONB (datos antes/después) |
| Registro de ventas disperso | Módulo de **Ventas** con detalle por calibre y tipo (exportación/nacional) |
| Préstamos de producto sin seguimiento | Módulo de **Préstamos** con estados pendiente/devuelto/liquidado |

---

## 2. Stack Tecnológico

```
Backend:   Node.js  +  Fastify v5
Base de Datos:   PostgreSQL 15 (Alpine)
ORM:       Ninguno — SQL puro con @fastify/postgres (pool de conexiones)
Auth:      Sesiones con @fastify/session + @fastify/cookie  |  bcryptjs para contraseñas
Seguridad: @fastify/helmet + @fastify/cors
Frontend:  HTML + Vanilla JS + Vanilla CSS (SPA manual, servida por Fastify Static)
Infra:     Docker Compose (2 servicios: app + db)
```

---

## 3. Arquitectura del Proyecto

```
aceitunas_v2/
│
├── app.js                        ← Entry point: registra plugins, rutas, arranca servidor
├── package.json                  ← Fastify v5, bcryptjs, pg, dotenv, helmet, cors, session
├── .env                          ← Variables: DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, PORT, SESSION_SECRET
├── Dockerfile                    ← Imagen Node.js para producción
├── docker-compose.yml            ← 2 servicios: aceitunas_app (3000) + aceitunas_db (5432)
│
├── app/
│   ├── plugins/
│   │   ├── db.js                 ← Conexión PG + decorator fastify.logActivity()
│   │   └── auth.js               ← Sesiones + decorators: checkAuth / isAdmin
│   │
│   ├── routes/   (9 módulos)     ← Definición de rutas con preHandler de auth
│   │   ├── auth.js
│   │   ├── entradas.js
│   │   ├── almacen.js
│   │   ├── calibres.js
│   │   ├── ventas.js
│   │   ├── reportes.js
│   │   ├── insumos.js
│   │   ├── prestamos.js
│   │   └── historial.js
│   │
│   ├── controllers/  (9 módulos) ← Lógica de negocio, queries SQL
│   │   ├── authController.js
│   │   ├── entradasController.js   (401 líneas)
│   │   ├── almacenController.js    (821 líneas — el más complejo)
│   │   ├── calibresController.js
│   │   ├── ventasController.js
│   │   ├── reportesController.js
│   │   ├── insumosController.js
│   │   ├── prestamosController.js
│   │   └── historialController.js
│   │
│   └── utils/
│       └── helpers.js             ← toCamelCase(), parseMoneda()
│
├── public/                        ← Frontend estático
│   ├── index.html                 (16 KB) — Login / landing
│   ├── entrada_aceituna.html      (232 KB) — App principal (SPA manual)
│   ├── css/
│   │   └── estilos.css            (46 KB)
│   └── js/
│       ├── main.js                (497 KB — monolito JS, todo el frontend)
│       ├── api.js                 (10 KB — llamadas fetch a la API)
│       └── state.js               (3 KB — estado global compartido)
│
└── sql/
    └── definitiva.sql             ← Schema completo PostgreSQL + datos semilla
```

---

## 4. Rutas de la API

| Método | Ruta | Controller | Auth | Descripción |
|---|---|---|---|---|
| POST | `/api/auth/login` | authController | ❌ | Login con username/password |
| POST | `/api/auth/logout` | authController | ✅ | Cerrar sesión |
| GET | `/api/auth/me` | authController | ✅ | Datos del usuario actual |
| GET | `/api/entradas` | entradasController | ✅ | Listar todos los lotes |
| GET | `/api/entradas/:id` | entradasController | ✅ | Detalle de un lote |
| POST | `/api/entradas` | entradasController | ✅ | Crear lote (con detección de duplicados) |
| PUT | `/api/entradas/:id` | entradasController | admin/ing_yeny | Editar lote |
| DELETE | `/api/entradas/:id` | entradasController | admin | Eliminar lote (verifica almacén) |
| DELETE | `/api/entradas/:id/force` | entradasController | admin | Eliminar lote forzado |
| GET | `/api/almacen` | almacenController | ✅ | Mapa completo del almacén |
| POST | `/api/almacen/filas` | almacenController | ✅ | Crear fila |
| PUT | `/api/almacen/filas/:id` | almacenController | ✅ | Renombrar fila |
| DELETE | `/api/almacen/filas/:id` | almacenController | admin | Eliminar fila |
| POST | `/api/almacen/cuadrantes` | almacenController | ✅ | Crear cuadrante |
| DELETE | `/api/almacen/cuadrantes/:id` | almacenController | ✅ | Eliminar cuadrante |
| POST | `/api/almacen/toggle-pucho/:id` | almacenController | ✅ | Marcar/desmarcar zona de puchos |
| POST | `/api/almacen/lotes` | almacenController | ✅ | Asignar lote a cuadrante |
| DELETE | `/api/almacen/lotes/:id` | almacenController | ✅ | Retirar lote de cuadrante |
| DELETE | `/api/almacen/lotes-completo/:entradaId` | almacenController | ✅ | Limpiar todo un lote del almacén |
| POST | `/api/almacen/mover-lote` | almacenController | ✅ | Mover lote entre cuadrantes |
| POST | `/api/almacen/reubicar-calibre` | almacenController | ✅ | Mover solo un calibre entre cuadrantes |
| POST | `/api/almacen/extraer-pucho` | almacenController | ✅ | Extraer puchos a zona dedicada |
| GET | `/api/almacen/puchos/:id` | almacenController | ✅ | Ver puchos de un cuadrante |
| POST | `/api/almacen/devolver-pucho` | almacenController | ✅ | Devolver pucho a su lote origen |
| POST | `/api/almacen/devolver-todo-pucho` | almacenController | ✅ | Vaciar zona de puchos completa |
| GET | `/api/almacen/disponibilidad/:entradaId` | almacenController | ✅ | Estado de asignación de un lote |
| GET | `/api/ventas` | ventasController | admin | Listar ventas |
| GET | `/api/ventas/:id` | ventasController | admin | Ver venta |
| POST | `/api/ventas` | ventasController | admin | Registrar venta |
| DELETE | `/api/ventas/:id` | ventasController | admin | Eliminar venta |
| GET | `/api/reportes` | reportesController | ✅ | Reporte filtrable (hoy/semana/mes/custom/lote) |
| GET | `/api/reportes/inventario` | reportesController | ✅ | Inventario completo (físico + puchos) |
| GET | `/api/reportes/export/excel` | reportesController | admin | Exportar a .xls |
| GET | `/api/insumos` | insumosController | ✅ | Stock de insumos + movimientos |
| POST | `/api/insumos/movimiento` | insumosController | ✅ | Entrada/salida de insumo |
| GET | `/api/prestamos` | prestamosController | ✅ | Listar préstamos |
| POST | `/api/prestamos` | prestamosController | ✅ | Registrar préstamo |
| PUT | `/api/prestamos/:id` | prestamosController | admin | Actualizar estado de préstamo |
| DELETE | `/api/prestamos/:id` | prestamosController | admin | Eliminar préstamo |
| GET | `/api/historial` | historialController | ✅ | Log de actividad |
| GET | `/api/calibres/entrada/:id` | calibresController | ✅ | Calibres de una entrada |

---

## 5. Modelo de Datos (PostgreSQL)

### Tabla `entradas` — La tabla CORE del sistema

Registra cada lote de aceitunas que ingresa a la empresa. Tiene ~70 campos agrupados en secciones:

```
IDENTIFICACIÓN:    codigo_lote, fecha, vendedor, supervisor, lugar, color, variedad
PESAJE:            precio, cantidad, tipo_envase, envase_cantidad, envase_kilos, envase_puchos
CALIDAD:           acidez, grados_sal, ph
PROCESO:           proceso, sub_proceso, destino
TRANSPORTE:        conductor, viajes, costo_viaje, traspaleadores, costo_traspaleador, total
SALMUERA (9 insumos): agua, sorbato_potasio, acido_lactico, acido_citrico, calcio,
                       acido_acetico, acido_ascorbico, benzoato_potasio + otros
CALIBRACIÓN:       fecha_calibracion, responsable_calibracion
PERSONAL (turnos): varones (qty/hora/ingreso/final/total), mujeres (ídem), traspaleadores
COSTOS:            total_costo_salmuera, total_costo_personal, total_otros_gastos
EXTRA:             aceituna_manchada_kg, observaciones, usuario_id
```

### Mapa completo de tablas

```
┌─────────────────────────────────────────────────────────────┐
│  USUARIOS      id, username, password, nombre, rol, activo  │
├─────────────────────────────────────────────────────────────┤
│  ENTRADAS      (tabla central ~70 cols)                     │
│   └─ CALIBRES           por calibre de la entrada           │
│   └─ OTROS_GASTOS       gastos extra sin categoría          │
│   └─ PERSONAL_TURNOS    turnos por día/turno/tipo           │
├─────────────────────────────────────────────────────────────┤
│  ALMACÉN FÍSICO                                             │
│   FILAS         A, B, C, D, E, F, G, H                     │
│    └─ CUADRANTES  A-1 … H-5  (40 posiciones totales)       │
│        └─ LOTES_ALMACEN    lote asignado a cuadrante        │
│             └─ CALIBRES_ALMACEN  kg/bidones/pucho por cal.  │
│   PUCHOS_DETALLE   restos acumulados en zona de puchos      │
├─────────────────────────────────────────────────────────────┤
│  VENTAS        exportacion / nacional                       │
│   └─ VENTAS_DETALLE   por calibre                           │
├─────────────────────────────────────────────────────────────┤
│  INSUMOS                                                    │
│   └─ MOVIMIENTOS_INSUMOS   entradas/salidas de inventario   │
├─────────────────────────────────────────────────────────────┤
│  PRESTAMOS     salida/entrada, pendiente/devuelto/liquidado │
├─────────────────────────────────────────────────────────────┤
│  HISTORIAL_ACTIVIDAD   JSONB (datos_anteriores/datos_nuevos)│
└─────────────────────────────────────────────────────────────┘
```

### Enums de PostgreSQL

| Enum | Valores |
|---|---|
| `rol_tipo` | `admin` · `ing_yeny` · `trabajador` |
| `color_tipo` | `verde` · `negra` · `mulata` |
| `envase_tipo` | `margaritos` · `chavitos` · `bidones` · `tarzas` |
| `venta_tipo` | `exportacion` · `nacional` |
| `turno_tipo` | `manana` · `tarde` · `noche` |
| `personal_tipo` | `varones` · `mujeres` · `traspaleadores` |
| `prestamo_estado` | `pendiente` · `devuelto` · `liquidado` |
| `movimiento_tipo` | `entrada` · `salida` |

---

## 6. Sistema de Roles y Permisos

```
admin
  ├── Ve todos los precios y costos
  ├── Puede crear / editar / eliminar entradas
  ├── Puede eliminar entradas con lotes en almacén (forzado)
  ├── Acceso exclusivo a ventas (CRUD completo)
  ├── Exportar Excel
  └── Gestión completa de préstamos

ing_yeny
  ├── Puede editar entradas
  ├── NO puede modificar precios/costos (quedan como estaban)
  └── Sin acceso a ventas

trabajador
  ├── Puede crear entradas
  ├── Los precios de entradas se devuelven como null en la API
  └── Sin acceso a ventas ni eliminación
```

---

## 7. Lógica de Negocio Clave

### 7.1 Detección de duplicados en entradas
Al crear una entrada, el sistema verifica si ya existe el `codigo_lote`. Si existe, responde con HTTP 409 y permite al usuario confirmar si desea registrarlo igualmente (`confirmarDuplicado: true`).

También hay protección anti-concurrencia: si en los últimos 30 segundos se registró el mismo lote + vendedor + fecha, devuelve el ID existente en lugar de duplicar.

### 7.2 Candado inteligente de puchos (almacén)
Al asignar un calibre a un cuadrante, si los kg intentados superan los disponibles del lote origen:
1. El sistema intenta **rescatar puchos** previamente extraídos del mismo calibre/entrada
2. Si aún sobra exceso, limita automáticamente los `kg` y el `pucho` al máximo disponible
3. Esto garantiza integridad: nunca se asigna más producto del que físicamente existe

### 7.3 Sincronización Entrada ↔ Almacén
Al editar una entrada, si tiene exactamente **1 lote en almacén**, el sistema sincroniza automáticamente los `calibres_almacen` con los nuevos valores de calibres de la entrada. Si tiene múltiples lotes, solo sincroniza el `codigo_lote`.

### 7.4 Control de capacidad del cuadrante
Cada cuadrante tiene `capacidad_max = 300 bidones` por defecto. Al asignar un lote se valida que `envases_actuales + envases_nuevos <= capacidad_max`. Se puede forzar con `forzarAsignacion: true`.

### 7.5 Reportes con filtros
El endpoint de reportes acepta: `periodo` (today/week/month/custom), `tipoEnvase`, `lote`, `fechaInicio`, `fechaFin`. Devuelve entradas con calibres y otros gastos embebidos.

### 7.6 Insumos
Stock calculado dinámicamente desde la suma de movimientos (no solo el campo `stock_actual`). Al registrar movimiento también actualiza el campo directo. El mapeo de nombre de insumo a ID es fijo (Agua=1, SorbatoPotasio=2, etc.).

---

## 8. Infraestructura de Producción

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:15-alpine
    container_name: aceitunas_db
    restart: always
    volumes:
      - pgdata:/var/lib/postgresql/data        ← datos persistentes
      - ./sql/definitiva.sql:/docker-entrypoint-initdb.d/init.sql  ← init al primer arranque

  app:
    build: .                                   ← Dockerfile local
    container_name: aceitunas_app
    restart: always
    ports: PORT:3000
    env_file: .env
    environment:
      DB_HOST: db                              ← red interna Docker
    depends_on: [db]
```

**Variables de entorno requeridas (`.env`)**:
```env
DB_USER=
DB_PASSWORD=
DB_NAME=aceitunas_v2
DB_HOST=db
DB_PORT=5432
PORT=3000
SESSION_SECRET=
NODE_ENV=production
```

---

## 9. Usuarios del Sistema (Semilla)

| Username | Nombre | Rol |
|---|---|---|
| `administracion` | Administración | admin |
| `freddy` | Freddy | admin |
| `yudy` | Yudy | admin |
| `yeny` | Ing. Yeny | ing_yeny |
| `trabajador` | Trabajador | trabajador |

> ⚠️ Los hashes en el SQL inicial son del formato PHP (`$2y$`). Son compatibles con `bcryptjs`, pero deberían regenerarse con Node.js al desplegar en producción limpia.

---

## 10. Estado Actual del Sistema (Funcionalidades implementadas)

### ✅ Completamente funcional

- [x] **Login / Logout / Sesiones** — con control por rol
- [x] **CRUD completo de Entradas** — 67+ campos, calibres, gastos, turnos
- [x] **Detección de duplicados** en entradas con confirmación del usuario
- [x] **Mapa de Almacén** — filas A–H, cuadrantes A-1…H-5
- [x] **CRUD de Filas y Cuadrantes** — crear, renombrar, eliminar
- [x] **Asignación de lotes a cuadrantes** — con validación de capacidad
- [x] **Mover lotes entre cuadrantes** — con fusión si ya existe
- [x] **Reubicar calibres individuales** — granularidad a nivel calibre
- [x] **Zonas de puchos** — marcar cuadrante como zona pucho
- [x] **Extraer puchos** — desde lote almacén o desde sobras de entrada
- [x] **Devolver puchos** — unitario o todo el cuadrante de una vez
- [x] **Candado inteligente** — rescate automático de puchos al assignar
- [x] **Disponibilidad por entrada** — kg/bidones asignados vs disponibles
- [x] **Ventas** — exportacion y nacional, con detalle por calibre
- [x] **Reportes filtrados** — por periodo/lote/envase/fechas
- [x] **Inventario general** — físico + puchos con ubicación fila/cuadrante
- [x] **Exportar Excel** — formato `.xls` XML (solo admin)
- [x] **Insumos** — stock de 10 químicos con movimientos
- [x] **Préstamos** — registro y seguimiento de estado
- [x] **Historial de actividad** — auditoria completa con datos JSONB
- [x] **Ocultamiento de precios** — datos financieros invisibles al rol trabajador
- [x] **Sincronización entrada ↔ almacén** — al editar una entrada

### ⚙️ Parcial / pendiente de mejora

- [ ] **Exportar Excel** — estructura básica implementada, falta portar estilos del PHP original
- [ ] **CORS restringido** — actualmente `origin: '*'`, pendiente configurar dominio de producción
- [ ] **Regeneración de contraseñas** — hashes semilla son de PHP, pendiente migrar a bcryptjs puro
- [ ] **Dos copias del SQL** — `sql/definitiva.sql` y `database/definitiva.sql`, pendiente unificar
- [ ] **Frontend modular** — `main.js` de 497 KB es un monolito, sin bundler ni módulos

### 🚫 No implementado aún

- [ ] Notificaciones / alertas de stock mínimo de insumos
- [ ] Dashboard con métricas en tiempo real
- [ ] Reportes de ventas con márgenes de ganancia
- [ ] Gestión de usuarios desde la UI (crear/editar/desactivar)
- [ ] Backup automático de la base de datos
- [ ] Sistema de facturación electrónica (SUNAT)

---

## 11. Deuda Técnica

| # | Problema | Impacto | Prioridad |
|---|---|---|---|
| 1 | `main.js` monolito 497 KB | Mantenimiento difícil | Media |
| 2 | `entrada_aceituna.html` 232 KB | Carga inicial lenta | Media |
| 3 | CORS `origin: '*'` | Seguridad en producción | Alta |
| 4 | Hashes PHP en SQL semilla | Autenticación mixta | Baja |
| 5 | Dos copias del schema SQL | Confusión en migraciones | Baja |
| 6 | Export Excel básico | Funcionalidad incompleta | Media |
| 7 | Sin validación de esquema en routes | Fastify Schema no usado | Media |

---

*Documento generado el 2026-04-05 | Sistema en producción activa*
