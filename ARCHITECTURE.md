# Arquitectura — Aceitunas v2

## Separación Frontend / Backend

El frontend es una **SPA vanilla** (Single Page Application) servida como archivos estáticos por Fastify. Se comunica con el backend exclusivamente через HTTP REST API usando `fetch`.

No hay framework UI, templates de servidor ni WebSockets. Toda la lógica de presentación vive en JavaScript vanilla.

```
┌─────────────┐          HTTP REST           ┌──────────────┐
│   Browser   │  ←───── JSON API ──────→   │  Fastify     │
│  (Vanilla)  │                              │  (Node.js)   │
└─────────────┘                              └──────┬───────┘
                                                    │
                                                    ↓
                                              ┌──────────┐
                                              │PostgreSQL│
                                              │  (Docker)│
                                              └──────────┘
```

## Flujo de una petición típica

**Ejemplo: Crear una entrada de lote**

```
1. Usuario llena formulario y hace clic en "Guardar"
   → UI: main.js llama a API.entradas.create(data)

2. API Layer: api.js hace fetch POST /api/entradas
   → Capa fetch en public/js/api.js

3. Router: Fastify recibe POST /api/entradas
   → app/routes/entradas.js → entradasController.create()

4. Controller: Valida sesión, extrae body, llama lógica
   → app/controllers/entradasController.js

5. Service (futuro): Lógica de negocio separada de HTTP
   → Por extraerse a app/services/ (ver DEBT.md)

6. Database: Query SQL ejecuta en PostgreSQL
   → SQL inline en controllers (ver DEBT.md)

7. Response: Controller devuelve { success: true, id: X }
   → Fastify serializa a JSON

8. UI Update: .then() en api.js recibe respuesta
   → main.js actualiza el estado y re-renderiza
```

## Decisiones de Arquitectura

### 1. Vanilla JS sin framework

**Decisión:** No se usó React, Vue, Angular ni ningún framework UI.

**Por qué:**
- El proyecto migró desde PHP legacy — prioridad era funcional, no UX
- El equipo conocía JS vanilla
- SPA simple con pocas rutas/modalidades no justifica framework

**Consecuencia:** `main.js` de 9,481 líneas es difícil de mantener. Ver DEBT.md.

---

### 2. SQL puro sin ORM

**Decisión:** Queries SQL escritas inline, sin Sequelize, Prisma ni TypeORM.

**Por qué:**
- El equipo conocía SQL directamente
- Permite optimizar queries complejas con CTEs y window functions
- Evitar capa de abstracción innecesaria

**Consecuencia:** Lógica SQL repetida entre controllers. Ver DEBT.md.

---

### 3. Fastify en lugar de Express

**Decisión:** Fastify v5 como framework HTTP.

**Por qué:**
- Mejor performance que Express
- Validación de schema integrada
- Plugin ecosystem compatible
- Logger incorporado

---

### 4. Sesiones con @fastify/session

**Decisión:** Sesiones server-side con cookies firmadas.

**Por qué:**
- Compatibilidad con el flujo PHP legacy
- Sensible data (precios) no debe viajar en URLs
- Rol de usuario en sesión, no en cliente

---

### 5. Frontend como archivos estáticos

**Decisión:** Todo el frontend es HTML/CSS/JS servidos por `@fastify/static`.

**Por qué:**
- Deploy simple (copiar archivos)
- Sin build step ni bundler
- Docker sirve los mismos archivos

**Consecuencia:** main.js sin modularización ni bundler. Ver DEBT.md.

---

### 6. Helpers en utils/helpers.js

**Decisión:** Solo dos funciones puras exportadas: `toCamelCase` y `parseMoneda`.

**Por qué:**
- Conversión snake_case ↔ camelCase necesaria entre DB y API
- `parseMoneda` normaliza strings monetarios (S/, comas, espacios)

---

### 7. toCamelCase recursivo

El helper `toCamelCase` transforma recursively todas las keys de objetos y arrays de `snake_case` a `camelCase`. Esto permite que PostgreSQL (snake_case) y JavaScript (camelCase) convivan sin esfuerzo manual.

---

### 8. Sistema de roles

| Rol | Precios visibles | Puede crear | Puede editar | Puede eliminar |
|-----|-----------------|-------------|--------------|----------------|
| admin | Sí | Sí | Sí | Sí (incluye forzado) |
| ing_yeny | No | No | Sí (precios preservados) | No |
| trabajador | No | Sí | No | No |

Los precios se ocultan a nivel de controller (`_ocultarPrecios`), no en queries.

---

### 9. Arquitectura plugin de Fastify

Los plugins encapsulan funcionalidad reusable:

- `db.js`: Pool PostgreSQL + decorador `logActivity()`
- `auth.js`: Sesiones + decorators `checkAuth()` / `isAdmin()`

---

## Decisiones pendientes (ver DEBT.md)

- Separación controllers ↔ services
- Modularización frontend (main.js monolito)
- Unificación de SQL duplicado (database/ vs sql/)
- Regeneración de hashes de password
- Configuración CORS restrictiva
