# Aceitunas v2 — Sistema de Gestión

Sistema de gestión operativa para una empresa agroindustrial aceitunera. Maneja el registro de lotes de aceitunas, control de almacén, ventas, préstamos, insumos y reportes.

## Stack

- **Frontend:** Vanilla JavaScript, HTML, CSS (SPA con fetch API)
- **Backend:** Node.js + Fastify v5
- **Base de datos:** PostgreSQL 15 (Docker)
- **ORM:** Ninguno — SQL puro con @fastify/postgres

## Requisitos

- Node.js 18+
- Docker y Docker Compose (para PostgreSQL)
- npm

## Instalación

```bash
git clone <repo-url>
cd entrada_01
npm install
cp .env.example .env   # editar con tus credenciales
docker-compose up -d   # arrancar PostgreSQL
npm run dev            # iniciar en desarrollo
```

## Variables de entorno (.env)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `DB_HOST` | Host de PostgreSQL | `db` (Docker) o `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `aceitunas_v2` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `postgres` |
| `SESSION_SECRET` | Secreto para sesiones | (cadena larga) |
| `NODE_ENV` | Entorno | `development` o `production` |

## Correr el proyecto

```bash
npm run dev      # desarrollo con hot-reload (--watch)
npm start        # producción
npm test         # tests (Vitest)
```

## Estructura de carpetas

```
entrada_01/
├── app/
│   ├── plugins/         # Plugins Fastify (auth, db)
│   ├── routes/         # Definición de rutas API
│   ├── controllers/    # Lógica de negocio ( recibe req/res )
│   └── utils/          # Helpers puros (toCamelCase, parseMoneda)
├── public/             # Frontend estático
│   ├── index.html      # Login
│   └── entrada_aceituna.html  # SPA principal
├── database/            # Schema SQL (PostgreSQL)
├── app.js              # Entry point Fastify
├── vitest.config.js    # Configuración de tests
└── .env                # Variables de entorno (NO committing)
```

## Estructura de carpetas (ideal, en progreso)

La estructura actual es `/app/` para backend y `/public/` para frontend. La separación `/frontend/js/{api,ui,utils,handlers}` y `/src/{routes,controllers,services,utils,config}` está planificada como deuda técnica (ver DEBT.md).

## Módulos del sistema

| Módulo | Descripción |
|--------|-------------|
| **Entradas** | Registro de lotes de aceituna (67+ campos) |
| **Almacén** | Mapa físico de filas (A-H) y cuadrantes |
| **Ventas** | Registro de ventas exportación/nacional |
| **Préstamos** | Seguimiento de préstamos de producto |
| **Insumos** | Control de stock de químicos |
| **Reportes** | Reportes filtrados e inventario |
| **Historial** | Auditoría de cambios (JSONB) |

## Roles de usuario

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso total, ve precios, puede eliminar |
| `ing_yeny` | Puede editar entradas, no ve precios |
| `trabajador` | Puede crear entradas, precios ocultos |

## Primeros pasos

1. Editar `.env` con credenciales de PostgreSQL
2. `docker-compose up -d` para arrancar la base de datos
3. `npm install` para instalar dependencias
4. `npm run dev` para iniciar el servidor en puerto 3000
5. Abrir `http://localhost:3000` y loguearse con usuario demo

## Usuarios demo (semilla)

| Username | Rol |
|----------|-----|
| `administracion` | admin |
| `freddy` | admin |
| `yeny` | ing_yeny |
| `trabajador` | trabajador |

> Los passwords están en el schema SQL种子.
