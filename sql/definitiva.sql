-- PostgreSQL Initialization Script for Aceitunas SAS

-- Drop tables if they exist (for clean start)
DROP TABLE IF EXISTS "personal_turnos" CASCADE;
DROP TABLE IF EXISTS "otros_gastos" CASCADE;
DROP TABLE IF EXISTS "puchos_detalle" CASCADE;
DROP TABLE IF EXISTS "movimientos_insumos" CASCADE;
DROP TABLE IF EXISTS "insumos" CASCADE;
DROP TABLE IF EXISTS "historial_actividad" CASCADE;
DROP TABLE IF EXISTS "calibres_almacen" CASCADE;
DROP TABLE IF EXISTS "lotes_almacen" CASCADE;
DROP TABLE IF EXISTS "cuadrantes" CASCADE;
DROP TABLE IF EXISTS "filas" CASCADE;
DROP TABLE IF EXISTS "calibres" CASCADE;
DROP TABLE IF EXISTS "ventas_detalle" CASCADE;
DROP TABLE IF EXISTS "ventas" CASCADE;
DROP TABLE IF EXISTS "prestamos" CASCADE;
DROP TABLE IF EXISTS "entradas" CASCADE;
DROP TABLE IF EXISTS "usuarios" CASCADE;

-- Drop types if they exist
DROP TYPE IF EXISTS "rol_tipo" CASCADE;
DROP TYPE IF EXISTS "accion_tipo" CASCADE;
DROP TYPE IF EXISTS "color_tipo" CASCADE;
DROP TYPE IF EXISTS "envase_tipo" CASCADE;
DROP TYPE IF EXISTS "prestamo_tipo" CASCADE;
DROP TYPE IF EXISTS "prestamo_estado" CASCADE;
DROP TYPE IF EXISTS "venta_tipo" CASCADE;
DROP TYPE IF EXISTS "turno_tipo" CASCADE;
DROP TYPE IF EXISTS "personal_tipo" CASCADE;
DROP TYPE IF EXISTS "movimiento_tipo" CASCADE;

-- Create Types (Enums)
CREATE TYPE "rol_tipo" AS ENUM ('admin', 'ing_yeny', 'trabajador');
CREATE TYPE "accion_tipo" AS ENUM ('login', 'logout', 'crear', 'editar', 'eliminar', 'exportar', 'ver');
CREATE TYPE "color_tipo" AS ENUM ('verde', 'negra', 'mulata');
CREATE TYPE "envase_tipo" AS ENUM ('margaritos', 'chavitos', 'bidones', 'tarzas');
CREATE TYPE "prestamo_tipo" AS ENUM ('salida', 'entrada');
CREATE TYPE "prestamo_estado" AS ENUM ('pendiente', 'devuelto', 'liquidado');
CREATE TYPE "venta_tipo" AS ENUM ('exportacion', 'nacional');
CREATE TYPE "turno_tipo" AS ENUM ('manana', 'tarde', 'noche');
CREATE TYPE "personal_tipo" AS ENUM ('varones', 'mujeres', 'traspaleadores');
CREATE TYPE "movimiento_tipo" AS ENUM ('entrada', 'salida');

-- Tables

CREATE TABLE "usuarios" (
  "id" SERIAL PRIMARY KEY,
  "username" varchar(50) UNIQUE NOT NULL,
  "password" varchar(255) NOT NULL,
  "nombre" varchar(100) NOT NULL,
  "rol" "rol_tipo" DEFAULT 'trabajador',
  "activo" BOOLEAN DEFAULT TRUE,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "entradas" (
  "id" SERIAL PRIMARY KEY,
  "codigo_lote" varchar(50) NOT NULL,
  "fecha" date NOT NULL,
  "vendedor" varchar(100),
  "supervisor" varchar(100),
  "lugar" varchar(150),
  "precio" decimal(10,2) DEFAULT 0.00,
  "cantidad" decimal(10,2) DEFAULT 0.00,
  "tipo_envase" "envase_tipo",
  "envase_cantidad" int DEFAULT 0,
  "envase_kilos" decimal(10,2) DEFAULT 0.00,
  "envase_puchos" decimal(10,2) DEFAULT 0.00,
  "acidez" decimal(5,2),
  "grados_sal" decimal(5,2),
  "ph" decimal(4,2),
  "color" "color_tipo",
  "variedad" varchar(50),
  "proceso" varchar(50),
  "sub_proceso" varchar(50),
  "destino" varchar(50),
  "transporte_conductor" varchar(100),
  "transporte_viajes" int DEFAULT 0,
  "transporte_costo_viaje" decimal(10,2) DEFAULT 0.00,
  "transporte_traspaleadores" int DEFAULT 0,
  "transporte_costo_traspaleador" decimal(10,2) DEFAULT 0.00,
  "transporte_total" decimal(10,2) DEFAULT 0.00,
  "salmuera_agua" decimal(10,2) DEFAULT 0.00,
  "salmuera_agua_precio" decimal(10,2) DEFAULT 0.00,
  "sorbato_potasio" decimal(10,2) DEFAULT 0.00,
  "sorbato_potasio_precio" decimal(10,2) DEFAULT 0.00,
  "acido_lactico" decimal(10,2) DEFAULT 0.00,
  "acido_lactico_precio" decimal(10,2) DEFAULT 0.00,
  "acido_citrico" decimal(10,2) DEFAULT 0.00,
  "acido_citrico_precio" decimal(10,2) DEFAULT 0.00,
  "calcio" decimal(10,2) DEFAULT 0.00,
  "calcio_precio" decimal(10,2) DEFAULT 0.00,
  "acido_acetico" decimal(10,2) DEFAULT 0.00,
  "acido_acetico_precio" decimal(10,2) DEFAULT 0.00,
  "acido_ascorbico" decimal(10,2) DEFAULT 0.00,
  "acido_ascorbico_precio" decimal(10,2) DEFAULT 0.00,
  "benzoato_potasio" decimal(10,2) DEFAULT 0.00,
  "benzoato_potasio_precio" decimal(10,2) DEFAULT 0.00,
  "salmuera_otros" text,
  "salmuera_otros_costo" decimal(10,2) DEFAULT 0.00,
  "total_costo_salmuera" decimal(10,2) DEFAULT 0.00,
  "fecha_calibracion" date,
  "responsable_calibracion" varchar(100),
  "varones_qty" int DEFAULT 0,
  "varones_hora_hombre" decimal(10,2) DEFAULT 0.00,
  "varones_hora_ingreso" time,
  "varones_hora_final" time,
  "varones_horas_trabajadas" varchar(10),
  "varones_costo_total" decimal(10,2) DEFAULT 0.00,
  "mujeres_qty" int DEFAULT 0,
  "mujeres_hora_hombre" decimal(10,2) DEFAULT 0.00,
  "mujeres_hora_ingreso" time,
  "mujeres_hora_final" time,
  "mujeres_horas_trabajadas" varchar(10),
  "mujeres_costo_total" decimal(10,2) DEFAULT 0.00,
  "traspaleadores_qty" int DEFAULT 0,
  "traspaleadores_costo_dia" decimal(10,2) DEFAULT 0.00,
  "traspaleadores_dias" int DEFAULT 1,
  "traspaleadores_costo_total" decimal(10,2) DEFAULT 0.00,
  "total_costo_personal" decimal(10,2) DEFAULT 0.00,
  "total_otros_gastos" decimal(10,2) DEFAULT 0.00,
  "observaciones" text,
  "aceituna_manchada_kg" decimal(10,2) DEFAULT 0.00,
  "usuario_id" int REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "calibres" (
  "id" SERIAL PRIMARY KEY,
  "entrada_id" int NOT NULL REFERENCES "entradas"("id") ON DELETE CASCADE,
  "calibre" varchar(20) NOT NULL,
  "bidones" int DEFAULT 0,
  "kilos_por_bidon" decimal(10,2) DEFAULT 0.00,
  "sobras" decimal(10,2) DEFAULT 0.00,
  "subtotal" decimal(10,2) DEFAULT 0.00,
  "precio" decimal(10,2) DEFAULT 0.00,
  "valor_total" decimal(10,2) DEFAULT 0.00,
  "precio_venta" decimal(10,2) DEFAULT 0.00,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "filas" (
  "id" SERIAL PRIMARY KEY,
  "nombre" varchar(100) NOT NULL,
  "orden" int DEFAULT 0,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "cuadrantes" (
  "id" SERIAL PRIMARY KEY,
  "fila_id" int NOT NULL REFERENCES "filas"("id") ON DELETE CASCADE,
  "nombre" varchar(100) NOT NULL,
  "orden" int DEFAULT 0,
  "capacidad_max" int DEFAULT 300,
  "es_zona_puchos" BOOLEAN DEFAULT FALSE,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "lotes_almacen" (
  "id" SERIAL PRIMARY KEY,
  "cuadrante_id" int NOT NULL REFERENCES "cuadrantes"("id") ON DELETE CASCADE,
  "entrada_id" int REFERENCES "entradas"("id") ON DELETE SET NULL,
  "codigo_lote" varchar(50) NOT NULL,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "calibres_almacen" (
  "id" SERIAL PRIMARY KEY,
  "lote_almacen_id" int NOT NULL REFERENCES "lotes_almacen"("id") ON DELETE CASCADE,
  "calibre" varchar(20) NOT NULL,
  "kg" decimal(10,2) DEFAULT 0.00,
  "cantidad_envases" int DEFAULT 0,
  "kilos_por_envase" decimal(10,2) DEFAULT 60.00,
  "pucho" decimal(10,2) DEFAULT 0.00,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "puchos_detalle" (
  "id" SERIAL PRIMARY KEY,
  "cuadrante_id" int NOT NULL REFERENCES "cuadrantes"("id") ON DELETE CASCADE,
  "lote_origen_id" int REFERENCES "lotes_almacen"("id") ON DELETE SET NULL,
  "entrada_id" int REFERENCES "entradas"("id") ON DELETE SET NULL,
  "color" "color_tipo" NOT NULL,
  "calibre" varchar(20) NOT NULL,
  "kg" decimal(10,2) NOT NULL,
  "usuario_id" int REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "fecha_aporte" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "historial_actividad" (
  "id" SERIAL PRIMARY KEY,
  "usuario_id" int NOT NULL REFERENCES "usuarios"("id") ON DELETE CASCADE,
  "accion" "accion_tipo" NOT NULL,
  "modulo" varchar(50) NOT NULL,
  "descripcion" text,
  "datos_anteriores" jsonb,
  "datos_nuevos" jsonb,
  "ip_address" varchar(45),
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "insumos" (
  "id" SERIAL PRIMARY KEY,
  "nombre" varchar(100) NOT NULL,
  "unidad" varchar(20) DEFAULT 'Kg',
  "stock_actual" decimal(10,2) DEFAULT 0.00,
  "stock_minimo" decimal(10,2) DEFAULT 0.00,
  "precio_unitario" decimal(10,2) DEFAULT 0.00,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "movimientos_insumos" (
  "id" SERIAL PRIMARY KEY,
  "insumo_id" int NOT NULL REFERENCES "insumos"("id") ON DELETE CASCADE,
  "tipo" "movimiento_tipo" NOT NULL,
  "cantidad" decimal(10,2) NOT NULL,
  "motivo" varchar(200),
  "usuario_id" int REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "otros_gastos" (
  "id" SERIAL PRIMARY KEY,
  "entrada_id" int NOT NULL REFERENCES "entradas"("id") ON DELETE CASCADE,
  "descripcion" varchar(200),
  "monto" decimal(10,2) DEFAULT 0.00,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "personal_turnos" (
  "id" SERIAL PRIMARY KEY,
  "entrada_id" int NOT NULL REFERENCES "entradas"("id") ON DELETE CASCADE,
  "fecha" date,
  "turno" "turno_tipo" NOT NULL,
  "tipo_personal" "personal_tipo" NOT NULL,
  "cantidad" int DEFAULT 0,
  "hora_ingreso" time,
  "hora_final" time,
  "horas_trabajadas" varchar(20),
  "incluye_almuerzo" BOOLEAN DEFAULT FALSE,
  "costo_hora" decimal(10,2) DEFAULT 0.00,
  "costo_total" decimal(10,2) DEFAULT 0.00,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "prestamos" (
  "id" SERIAL PRIMARY KEY,
  "fecha" date NOT NULL,
  "tipo_prestamo" "prestamo_tipo" DEFAULT 'salida',
  "codigo_lote" varchar(50),
  "calibre" varchar(20),
  "kilos" decimal(10,2) DEFAULT 0.00,
  "destinatario" varchar(150),
  "motivo" text,
  "estado" "prestamo_estado" DEFAULT 'pendiente',
  "fecha_devolucion" date,
  "usuario_id" int REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ventas" (
  "id" SERIAL PRIMARY KEY,
  "fecha" date NOT NULL,
  "tipo_venta" "venta_tipo" DEFAULT 'exportacion',
  "codigo_lote" varchar(50),
  "entrada_id" int REFERENCES "entradas"("id") ON DELETE SET NULL,
  "cliente" varchar(150),
  "destino_pais" varchar(100),
  "destino_ciudad" varchar(100),
  "total_bidones" int DEFAULT 0,
  "total_kg" decimal(10,2) DEFAULT 0.00,
  "total_monto" decimal(12,2) DEFAULT 0.00,
  "observaciones" text,
  "usuario_id" int REFERENCES "usuarios"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ventas_detalle" (
  "id" SERIAL PRIMARY KEY,
  "venta_id" int NOT NULL REFERENCES "ventas"("id") ON DELETE CASCADE,
  "calibre" varchar(20) NOT NULL,
  "bidones" int DEFAULT 0,
  "kg" decimal(10,2) DEFAULT 0.00,
  "precio_kg" decimal(10,2) DEFAULT 0.00,
  "subtotal" decimal(12,2) DEFAULT 0.00,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON "usuarios" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_entradas_updated_at BEFORE UPDATE ON "entradas" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_insumos_updated_at BEFORE UPDATE ON "insumos" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_prestamos_updated_at BEFORE UPDATE ON "prestamos" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ventas_updated_at BEFORE UPDATE ON "ventas" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Initial Data

INSERT INTO "usuarios" ("id", "username", "password", "nombre", "rol", "activo") VALUES
(1, 'administracion', '$2y$10$L64eOiGV2XlGs1jJ3VEMZudK9IfAsAFuYhJSO64suChDDEiG2b7Bi', 'Administración', 'admin', TRUE),
(2, 'freddy', '$2y$10$L64eOiGV2XlGs1jJ3VEMZudK9IfAsAFuYhJSO64suChDDEiG2b7Bi', 'Freddy', 'admin', TRUE),
(3, 'yudy', '$2y$10$L64eOiGV2XlGs1jJ3VEMZudK9IfAsAFuYhJSO64suChDDEiG2b7Bi', 'Yudy', 'admin', TRUE),
(4, 'yeny', '$2y$10$XNviG24nglsB0So3xLxh7uFBfqFnaxgB1D.5STA6lesOOBMYRkH9y', 'Ing. Yeny', 'ing_yeny', TRUE),
(5, 'trabajador', '$2y$10$zga63d/tPq7YoVrw8hVVguOx04tN90xFh60spb2h8Ca8f.gAg3tNe', 'Trabajador', 'trabajador', TRUE);

-- Nota: La contraseña de arriba es un placeholder. El sistema debería usar bcryptjs en el backend.
-- Actualizando con el hash real de admin si lo tengo. El hash en el SQL original era: $2y$10$L64eOiGV2XlGs1jJ3VEMZudK9IfAsAFuYhJSO64suChDDEiG2b7Bi (PHP)
-- bcryptjs puede verificar hashes de PHP ($2y$), pero PostgreSQL 15 no tiene problema.

INSERT INTO "insumos" ("id", "nombre", "unidad") VALUES
(1, 'Agua', 'm³'),
(2, 'Sorbato de Potasio', 'Kg'),
(3, 'Ácido Láctico', 'Lt'),
(4, 'Ácido Cítrico', 'Kg'),
(5, 'Calcio', 'Kg'),
(6, 'Ácido Acético', 'Lt'),
(7, 'Ácido Ascórbico', 'Kg'),
(8, 'Benzoato de Potasio', 'Kg'),
(9, 'Sal Industrial', 'Kg'),
(10, 'Otros', 'Und');

INSERT INTO "filas" ("id", "nombre", "orden") VALUES
(1, 'A', 1), (2, 'B', 2), (3, 'C', 3), (4, 'D', 4), (5, 'E', 5), (6, 'F', 6), (7, 'G', 7), (8, 'H', 8);

INSERT INTO "cuadrantes" ("fila_id", "nombre", "orden") VALUES
(1, 'A-1', 1), (1, 'A-2', 2), (1, 'A-3', 3), (1, 'A-4', 4), (1, 'A-5', 5),
(2, 'B-1', 1), (2, 'B-2', 2), (2, 'B-3', 3), (2, 'B-4', 4), (2, 'B-5', 5),
(3, 'C-1', 1), (3, 'C-2', 2), (3, 'C-3', 3), (3, 'C-4', 4), (3, 'C-5', 5),
(4, 'D-1', 1), (4, 'D-2', 2), (4, 'D-3', 3), (4, 'D-4', 4), (4, 'D-5', 5),
(5, 'E-1', 1), (5, 'E-2', 2), (5, 'E-3', 3), (5, 'E-4', 4), (5, 'E-5', 5),
(6, 'F-1', 1), (6, 'F-2', 2), (6, 'F-3', 3), (6, 'F-4', 4), (6, 'F-5', 5),
(7, 'G-1', 1), (7, 'G-2', 2), (7, 'G-3', 3), (7, 'G-4', 4), (7, 'G-5', 5),
(8, 'H-1', 1), (8, 'H-2', 2), (8, 'H-3', 3), (8, 'H-4', 4), (8, 'H-5', 5);
