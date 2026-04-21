# Deuda Técnica — Aceitunika / entrada_01

Lista priorizada de mejoras pendientes. Aucune de estas bloquea producción, pero acumulan riesgo de mantenimiento.

---

## Alta prioridad

### 1. `main.js` es un monolito de 9,481 líneas

**Problema:** Todo el frontend (lógica UI, eventos, renderizado, API calls) vive en un solo archivo.

**Impacto:** Imposible de mantener, un cambio puede romper cualquier cosa sin forma de aislarlo. Test coverage es 0% en frontend.

**Solución propuesta:**
- Separar en módulos: `/public/js/api/`, `/public/js/ui/`, `/public/js/utils/`, `/public/js/handlers/`
- Usar ES modules (`import/export`) o al menos concatenar múltiples archivos
- Instalar un bundler liviano (Vite, esbuild)

**Esfuerzo estimado:** Alto (días a semanas).

---

### 2. CORS configurado como `origin: '*'`

**Problema:** `app.js` línea 10: `origin: '*'` permite cualquier dominio.

**Impacto:** En producción, cualquier sitio web podría hacer requests a la API.

**Solución:** Especificar dominios permitidos en `.env` y usarlos en la configuración de CORS.

**Esfuerzo estimado:** Bajo (minutos).

---

### 3. Sin separación controllers ↔ services

**Problema:** Los 9 controllers tienen SQL inline y lógica de negocio mezclada con req/res.

**Impacto:** La lógica de negocio no es reusable, difícil de testear sin mocks de HTTP.

**Solución:** Extraer lógica a `app/services/` para cada dominio (almacenService, entradasService, etc.).

**Esfuerzo estimado:** Medio-alto (por función, acumulativo).

---

## Media prioridad

### 4. `almacenController.js` con 820 líneas

**Problema:** Un solo archivo maneja filas, cuadrantes, lotes, puchos, mover/reubicar/extaer.

**Impacto:** Difícil de navegar, entender y modificar.

**Solución:** Dividir por responsabilidad en services.

**Esfuerzo estimado:** Medio.

---

### 5. SQL schema duplicado

**Problema:**
```
database/definitiva.sql (349 ln)
sql/definitiva.sql      (copia con contenido diferente)
```

**Impacto:** Confusión al hacer migraciones. Puede haber drift entre ambos archivos.

**Solución:** Eliminar `sql/definitiva.sql`, mantener solo `database/definitiva.sql`. Agregar un solo archivo de migración por feature.

**Esfuerzo estimado:** Bajo.

---

### 6. Hashes de contraseña en formato PHP

**Problema:** Los hashes en el SQL semilla son `$2y$` (formato PHP bcrypt). Los hashes `bcryptjs` modernos usan `$2a$` o `$2b$`.

**Impacto:** Compatibilidad actual funciona, pero mezcla de estándares.

**Solución:** Regenerar passwords con bcryptjs puro al primer login o con un script de migración.

**Esfuerzo estimado:** Bajo.

---

### 7. Variables de sesión en frontend

**Problema:** `sessionStorage` guarda `isLoggedIn`, `userRole`, `userName`. Estas también existen en el objeto `AppState`.

**Impacto:** Dual source of truth, riesgo de desincronización.

**Solución:** Unificar en `AppState` y usar `API.auth.check()` para sincronizar al cargar.

**Esfuerzo estimado:** Bajo.

---

### 8. Sin tests de integración o e2e

**Problema:** Solo hay tests para `helpers.js` (17 tests). No hay coverage para controllers, routes, ni frontend.

**Impacto:** Refactors son de alto riesgo, bugs se detectan tarde.

**Solución:** Agregar tests con Supertest para routes, y jsdom + Vitest para frontend.

**Esfuerzo estimado:** Medio-alto.

---

## Baja prioridad

### 9. Exportar Excel básico

**Problema:** El reporte Excel es XML structure básico, sin estilos.

**Impacto:** Discrepancia visual con el reporte PHP original.

**Solución:** Portar los estilos del PHP o usar una librería como `exceljs`.

**Esfuerzo estimado:** Medio.

---

### 10. Sin notificaciones de stock mínimo

**Problema:** No hay alertas cuando insumos bajan de cierto umbral.

**Impacto:** Se puede quedar sin insumos sin aviso.

**Solución:** Agregar campo `stock_minimo` a insumos y check en el backend.

**Esfuerzo estimado:** Bajo.

---

### 11. Sin backup automático de la DB

**Problema:** No hay job de backup configurado.

**Impacto:** Riesgo de pérdida de datos.

**Solución:** Configurar pg_dump en un cron o usar un servicio cloud con backup automático.

**Esfuerzo estimado:** Bajo.

---

### 12. Sistema de facturación electrónica (SUNAT)

**Problema:** No está implementado (era no-requerido según contexto).

**Impacto:** Manual para facturación legal en Perú.

**Solución:** Integrar con API de SUNAT (requiere contrato y credenciales).

**Esfuerzo estimado:** Alto (depende de factores externos).

---

### 13. Sin gestión de usuarios desde UI

**Problema:** Solo existe en el schema SQL, no hay CRUD desde la aplicación.

**Impacto:** El admin debe editar la DB para crear/modificar usuarios.

**Solución:** Agregar sección de administración de usuarios.

**Esfuerzo estimado:** Medio.

---

## Resumen

| Prioridad | Count |
|-----------|-------|
| Alta | 3 |
| Media | 5 |
| Baja | 5 |

| Items resolubles en <1h | Count |
|------------------------|-------|
| CORS restrictivo | 1 |
| Unificar SQL | 1 |
| Regenerar passwords | 1 |
| Unificar estado frontend | 1 |
| Notificaciones stock mínimo | 1 |
| **Total <1h** | **6** |
