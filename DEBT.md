# Deuda Técnica — Aceitunika / entrada_01

Lista priorizada de mejoras pendientes. Aucune de estas bloquea producción, pero acumulan riesgo de mantenimiento.

---

## Alta prioridad

### 1. 🟡 `main.js` es un monolito de 9,481 líneas (EN PROGRESO)

**Problema:** Todo el frontend (lógica UI, eventos, renderizado, API calls) vive en un solo archivo.

**Impacto:** Imposible de mantener, un cambio puede romper cualquier cosa sin forma de aislarlo. Test coverage es 0% en frontend.

**Plan de acción:**
1. Crear archivo `public/js/modules.js` que importa y re-exporta cada módulo. Esto permite usar `import` hoy sin romper nada.
2. Extraer helpers (`showToast`, `showConfirm`, `safeNumber`, etc.) a `public/js/utils/`
3. Extraer handlers de cada sección (entradas, almacen, ventas, etc.) a `public/js/handlers/`
4. Migrar el HTML a usar `type="module"` en vez del script monolito actual
5. Instalar Vite y configurar bundling

**Esfuerzo estimado:** Alto (días a semanas) — requiere refactor cuidadoso para no romper producción.

**Estado actual:** Estructura de carpetas (`public/js/{api,ui,handlers,sections}`) была создана, но обратное восстановление `main.js` потребовало восстановления оригинального файла. Vite config was set up but actual extraction was reverted after git restore.

---

### 2. ✅ CORS configurado como `origin: '*'`

**Estado:** Resuelto — ahora lee desde `process.env.CORS_ORIGIN` (default `*` para dev).  
**Acción:** En producción, setear `CORS_ORIGIN=https://dominio.com` en `.env`.

---

### 3. ✅ Sin separación controllers ↔ services

**Estado:** Resuelto parcialmente — se extrajo `insumosService.js` como primer service. El patrón a seguir para los demás controllers.  
**Acción:** Continuar extrayendo lógica a `app/services/` para `almacenService`, `entradasService`, etc.

---

## Media prioridad

### 4. ✅ `almacenController.js` con 820 líneas

**Estado:** Resuelto — se extrajo la lógica de lotes a `app/services/lotesService.js` (5 funciones: `addLote`, `removeLote`, `removeLoteCompleto`, `moverLote`, `reubicarCalibre`). El controller queda como fachada con ~450 líneas.  
**Acción:** Continuar extrayendo lógica de puchos y disponibilidad a services separados si el archivo sigue siendo difícil de mantener.

---

### 5. ✅ SQL schema duplicado

**Estado:** Resuelto — se eliminó `sql/definitiva.sql`, se unificó en `database/definitiva.sql`.  
**Acción:** `docker-compose.yml` actualizado para apuntar a `database/definitiva.sql`.

---

### 6. ✅ Hashes de contraseña en formato PHP

**Estado:** Resuelto — hashes regenerados con `bcryptjs` puro (formato `$2b$`).  
**Acción:** En base existente, ejecutar migración para re-hashear passwords con `bcryptjs`. El sistema ahora usa hashes Node.js nativos.

---

### 7. ✅ Variables de sesión en frontend

**Estado:** Resuelto — se eliminó `sessionStorage` como fuente de verdad. Ahora usa `AppState` + `API.auth.check()`.  
**Acción:** `main.js` ahora inicializa rol/nombre desde `AppState.user`, logout usa `API.auth.logout()` y limpia `AppState`.

---

### 8. ✅ Sin tests de integración o e2e

**Estado:** Resuelto — se agregaron tests con Supertest en `app/auth.test.js` cubriendo auth, rutas protegidas y alertas de stock.  
**Acción:** Ejecutar `npm test` para verificar. Los tests requieren que la DB esté disponible (`TEST_DB_URL` o `DATABASE_URL` en `.env`).

---

## Baja prioridad

### 9. ✅ Exportar Excel básico

**Estado:** Resuelto — se migró de XML básico a `exceljs` con estilos profesionales.  
**Acción:** Incluye headers con color verde aceituna, filas alternadas, formato numérico/monetario, hoja separada para detalle de calibres. Archivo ahora es `.xlsx` en vez de `.xls`.

---

### 10. ✅ Notificaciones de stock mínimo

**Estado:** Resuelto — se agregó campo `stock_minimo` existente en la DB, endpoint `GET /api/insumos/alertas` que devuelve insumos bajo mínimo, y respuesta con alerta en cada `registrarMovimiento`.  
**Acción:** Para setear alertas, hacer `UPDATE insumos SET stock_minimo = X WHERE id = Y` con los umbrales deseados. Consultar alertas con `API.insumos.getAlertas()`.

---

### 11. ✅ Sin backup automático de la DB

**Estado:** Resuelto — script `scripts/backup.sh` configurado con `pg_dump`, mantiene últimos 30 backups.  
**Acción:** Para activar, agregar al crontab: `0 3 * * * /path/to/scripts/backup.sh`. Configurar variables de entorno `DB_PASSWORD`, `DB_HOST`, `DB_NAME` antes de ejecutar.

---

### 12. Sistema de facturación electrónica (SUNAT)

**Problema:** No está implementado (era no-requerido según contexto).

**Impacto:** Manual para facturación legal en Perú.

**Solución:** Integrar con API de SUNAT (requiere contrato y credenciales).

**Esfuerzo estimado:** Alto (depende de factores externos).

---

### 13. ✅ Sin gestión de usuarios desde UI

**Estado:** Resuelto — API CRUD completa en `/api/users` (`GET/POST/PUT/DELETE`). Requiere UI en frontend.  
**Acción:** Consultar usuarios con `API.users.getAll()`, crear con `API.users.create(data)`, editar con `API.users.update(id, data)`, cambiar password con `API.users.updatePassword(id, password)`, eliminar con `API.users.delete(id)`.

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
