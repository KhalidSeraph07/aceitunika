-- Protocolo de Migración PostgreSQL para Proyecto Aceitunas
-- Generado por Antigravity - Skill de Migración Maestro

-- 1. Extensiones y Funciones Útiles
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Definición de Tipos ENUM personalizados
CREATE TYPE tipo_envase AS ENUM ('margaritos', 'chavitos', 'bidones', 'tarzas');
CREATE TYPE tipo_color AS ENUM ('verde', 'negra', 'mulata');
CREATE TYPE tipo_accion AS ENUM ('login', 'logout', 'crear', 'editar', 'eliminar', 'exportar', 'ver');
CREATE TYPE tipo_movimiento AS ENUM ('entrada', 'salida');
CREATE TYPE tipo_prestamo_mov AS ENUM ('salida', 'entrada');
CREATE TYPE tipo_prestamo_estado AS ENUM ('pendiente', 'devuelto', 'liquidado');
CREATE TYPE tipo_usuario_rol AS ENUM ('admin', 'ing_yeny', 'trabajador');
CREATE TYPE tipo_venta_cat AS ENUM ('exportacion', 'nacional');
CREATE TYPE tipo_turno AS ENUM ('manana', 'tarde', 'noche');
CREATE TYPE tipo_personal AS ENUM ('varones', 'mujeres', 'traspaleadores');

-- 3. Estructura de Tablas

-- Tabla: usuarios
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  rol tipo_usuario_rol DEFAULT 'trabajador',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: entradas
CREATE TABLE entradas (
  id SERIAL PRIMARY KEY,
  codigo_lote VARCHAR(50) NOT NULL,
  fecha DATE NOT NULL,
  vendedor VARCHAR(100),
  supervisor VARCHAR(100),
  lugar VARCHAR(150),
  precio DECIMAL(10,2) DEFAULT 0.00,
  cantidad DECIMAL(10,2) DEFAULT 0.00,
  tipo_envase tipo_envase,
  envase_cantidad INT DEFAULT 0,
  envase_kilos DECIMAL(10,2) DEFAULT 0.00,
  envase_puchos DECIMAL(10,2) DEFAULT 0.00,
  acidez DECIMAL(5,2),
  grados_sal DECIMAL(5,2),
  ph DECIMAL(4,2),
  color tipo_color,
  variedad VARCHAR(50),
  proceso VARCHAR(50),
  sub_proceso VARCHAR(50),
  destino VARCHAR(50),
  transporte_conductor VARCHAR(100),
  transporte_viajes INT DEFAULT 0,
  transporte_costo_viaje DECIMAL(10,2) DEFAULT 0.00,
  transporte_traspaleadores INT DEFAULT 0,
  transporte_costo_traspaleador DECIMAL(10,2) DEFAULT 0.00,
  transporte_total DECIMAL(10,2) DEFAULT 0.00,
  salmuera_agua DECIMAL(10,2) DEFAULT 0.00,
  salmuera_agua_precio DECIMAL(10,2) DEFAULT 0.00,
  sorbato_potasio DECIMAL(10,2) DEFAULT 0.00,
  sorbato_potasio_precio DECIMAL(10,2) DEFAULT 0.00,
  acido_lactico DECIMAL(10,2) DEFAULT 0.00,
  acido_lactico_precio DECIMAL(10,2) DEFAULT 0.00,
  acido_citrico DECIMAL(10,2) DEFAULT 0.00,
  acido_citrico_precio DECIMAL(10,2) DEFAULT 0.00,
  calcio DECIMAL(10,2) DEFAULT 0.00,
  calcio_precio DECIMAL(10,2) DEFAULT 0.00,
  acido_acetico DECIMAL(10,2) DEFAULT 0.00,
  acido_acetico_precio DECIMAL(10,2) DEFAULT 0.00,
  acido_ascorbico DECIMAL(10,2) DEFAULT 0.00,
  acido_ascorbico_precio DECIMAL(10,2) DEFAULT 0.00,
  benzoato_potasio DECIMAL(10,2) DEFAULT 0.00,
  benzoato_potasio_precio DECIMAL(10,2) DEFAULT 0.00,
  salmuera_otros TEXT,
  salmuera_otros_costo DECIMAL(10,2) DEFAULT 0.00,
  total_costo_salmuera DECIMAL(10,2) DEFAULT 0.00,
  fecha_calibracion DATE,
  responsable_calibracion VARCHAR(100),
  varones_qty INT DEFAULT 0,
  varones_hora_hombre DECIMAL(10,2) DEFAULT 0.00,
  varones_hora_ingreso TIME,
  varones_hora_final TIME,
  varones_horas_trabajadas VARCHAR(10),
  varones_costo_total DECIMAL(10,2) DEFAULT 0.00,
  mujeres_qty INT DEFAULT 0,
  mujeres_hora_hombre DECIMAL(10,2) DEFAULT 0.00,
  mujeres_hora_ingreso TIME,
  mujeres_hora_final TIME,
  mujeres_horas_trabajadas VARCHAR(10),
  mujeres_costo_total DECIMAL(10,2) DEFAULT 0.00,
  traspaleadores_qty INT DEFAULT 0,
  traspaleadores_costo_dia DECIMAL(10,2) DEFAULT 0.00,
  traspaleadores_dias INT DEFAULT 1,
  traspaleadores_costo_total DECIMAL(10,2) DEFAULT 0.00,
  total_costo_personal DECIMAL(10,2) DEFAULT 0.00,
  total_otros_gastos DECIMAL(10,2) DEFAULT 0.00,
  observaciones TEXT,
  aceituna_manchada_kg DECIMAL(10,2) DEFAULT 0.00,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: calibres
CREATE TABLE calibres (
  id SERIAL PRIMARY KEY,
  entrada_id INT NOT NULL REFERENCES entradas(id) ON DELETE CASCADE,
  calibre VARCHAR(20) NOT NULL,
  bidones INT DEFAULT 0,
  kilos_por_bidon DECIMAL(10,2) DEFAULT 0.00,
  sobras DECIMAL(10,2) DEFAULT 0.00,
  subtotal DECIMAL(10,2) DEFAULT 0.00,
  precio DECIMAL(10,2) DEFAULT 0.00,
  valor_total DECIMAL(10,2) DEFAULT 0.00,
  precio_venta DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: filas
CREATE TABLE filas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  orden INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: cuadrantes
CREATE TABLE cuadrantes (
  id SERIAL PRIMARY KEY,
  fila_id INT NOT NULL REFERENCES filas(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  orden INT DEFAULT 0,
  capacidad_max INT DEFAULT 300,
  es_zona_puchos BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: lotes_almacen
CREATE TABLE lotes_almacen (
  id SERIAL PRIMARY KEY,
  cuadrante_id INT NOT NULL REFERENCES cuadrantes(id) ON DELETE CASCADE,
  entrada_id INT REFERENCES entradas(id) ON DELETE SET NULL,
  codigo_lote VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: calibres_almacen
CREATE TABLE calibres_almacen (
  id SERIAL PRIMARY KEY,
  lote_almacen_id INT NOT NULL REFERENCES lotes_almacen(id) ON DELETE CASCADE,
  calibre VARCHAR(20) NOT NULL,
  kg DECIMAL(10,2) DEFAULT 0.00,
  cantidad_envases INT DEFAULT 0,
  kilos_por_envase DECIMAL(10,2) DEFAULT 60.00,
  pucho DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: historial_actividad
CREATE TABLE historial_actividad (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  accion tipo_accion NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  descripcion TEXT,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: insumos
CREATE TABLE insumos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  unidad VARCHAR(20) DEFAULT 'Kg',
  stock_actual DECIMAL(10,2) DEFAULT 0.00,
  stock_minimo DECIMAL(10,2) DEFAULT 0.00,
  precio_unitario DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: movimientos_insumos
CREATE TABLE movimientos_insumos (
  id SERIAL PRIMARY KEY,
  insumo_id INT NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  tipo tipo_movimiento NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  motivo VARCHAR(200),
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: puchos_detalle
CREATE TABLE puchos_detalle (
  id SERIAL PRIMARY KEY,
  cuadrante_id INT NOT NULL REFERENCES cuadrantes(id) ON DELETE CASCADE,
  lote_origen_id INT,
  entrada_id INT,
  color tipo_color NOT NULL,
  calibre VARCHAR(20) NOT NULL,
  kg DECIMAL(10,2) NOT NULL,
  usuario_id INT,
  fecha_aporte TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: otros_gastos
CREATE TABLE otros_gastos (
  id SERIAL PRIMARY KEY,
  entrada_id INT NOT NULL REFERENCES entradas(id) ON DELETE CASCADE,
  descripcion VARCHAR(200),
  monto DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: personal_turnos
CREATE TABLE personal_turnos (
  id SERIAL PRIMARY KEY,
  entrada_id INT NOT NULL REFERENCES entradas(id) ON DELETE CASCADE,
  fecha DATE,
  turno tipo_turno NOT NULL,
  tipo_personal tipo_personal NOT NULL,
  cantidad INT DEFAULT 0,
  hora_ingreso TIME,
  hora_final TIME,
  horas_trabajadas VARCHAR(20),
  incluye_almuerzo BOOLEAN DEFAULT FALSE,
  costo_hora DECIMAL(10,2) DEFAULT 0.00,
  costo_total DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: prestamos
CREATE TABLE prestamos (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  tipo_prestamo tipo_prestamo_mov DEFAULT 'salida',
  codigo_lote VARCHAR(50),
  calibre VARCHAR(20),
  kilos DECIMAL(10,2) DEFAULT 0.00,
  destinatario VARCHAR(150),
  motivo TEXT,
  estado tipo_prestamo_estado DEFAULT 'pendiente',
  fecha_devolucion DATE,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: ventas
CREATE TABLE ventas (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  tipo_venta tipo_venta_cat DEFAULT 'exportacion',
  codigo_lote VARCHAR(50),
  entrada_id INT REFERENCES entradas(id) ON DELETE SET NULL,
  cliente VARCHAR(150),
  destino_pais VARCHAR(100),
  destino_ciudad VARCHAR(100),
  total_bidones INT DEFAULT 0,
  total_kg DECIMAL(10,2) DEFAULT 0.00,
  total_monto DECIMAL(12,2) DEFAULT 0.00,
  observaciones TEXT,
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: ventas_detalle
CREATE TABLE ventas_detalle (
  id SERIAL PRIMARY KEY,
  venta_id INT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  calibre VARCHAR(20) NOT NULL,
  bidones INT DEFAULT 0,
  kg DECIMAL(10,2) DEFAULT 0.00,
  precio_kg DECIMAL(10,2) DEFAULT 0.00,
  subtotal DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Triggers para updated_at (ON UPDATE CURRENT_TIMESTAMP)
CREATE TRIGGER set_timestamp_usuarios BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_entradas BEFORE UPDATE ON entradas FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_insumos BEFORE UPDATE ON insumos FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_prestamos BEFORE UPDATE ON prestamos FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_ventas BEFORE UPDATE ON ventas FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- 5. Índices adicionales
CREATE INDEX idx_calibres_entrada ON calibres(entrada_id);
CREATE INDEX idx_calibres_nombre ON calibres(calibre);
CREATE INDEX idx_entradas_codigo ON entradas(codigo_lote);
CREATE INDEX idx_entradas_fecha ON entradas(fecha);
CREATE INDEX idx_puchos_cuadrante ON puchos_detalle(cuadrante_id);
CREATE INDEX idx_puchos_segregacion ON puchos_detalle(color, calibre);

-- 6. Inserción de Datos Iniciales

-- Usuarios (Contraseña: 123456 - hashes generados con bcryptjs de Node.js)
INSERT INTO usuarios (id, username, password, nombre, rol) VALUES
(1, 'administracion', '$2b$10$rAKK4sMqaZd9r1v43.qrneHbuXbi83BQOFxxjx30OZ2Tf3iYu/R8i', 'Administración', 'admin'),
(2, 'freddy', '$2b$10$rAKK4sMqaZd9r1v43.qrneHbuXbi83BQOFxxjx30OZ2Tf3iYu/R8i', 'Freddy', 'admin'),
(3, 'yudy', '$2b$10$rAKK4sMqaZd9r1v43.qrneHbuXbi83BQOFxxjx30OZ2Tf3iYu/R8i', 'Yudy', 'admin'),
(4, 'yeny', '$2b$10$WGS0MYVRXRng5e4YAvof8edL45txQq.lJX.ndGQDJ9fphfL/ZC1WC', 'Ing. Yeny', 'ing_yeny'),
(5, 'trabajador', '$2b$10$onCVlJ0cAvsfmjYkTuQz9eDnXvDtRf36MuViD35ViIfW329y4KJKi', 'Trabajador', 'trabajador');

-- Insumos
INSERT INTO insumos (id, nombre, unidad) VALUES
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

-- Filas
INSERT INTO filas (id, nombre, orden) VALUES
(1, 'A', 1), (2, 'B', 2), (3, 'C', 3), (4, 'D', 4),
(5, 'E', 5), (6, 'F', 6), (7, 'G', 7), (8, 'H', 8);

-- Cuadrantes
INSERT INTO cuadrantes (id, fila_id, nombre, orden) VALUES
(1, 1, 'A-1', 1), (2, 1, 'A-2', 2), (3, 1, 'A-3', 3), (4, 1, 'A-4', 4), (5, 1, 'A-5', 5),
(6, 2, 'B-1', 1), (7, 2, 'B-2', 2), (8, 2, 'B-3', 3), (9, 2, 'B-4', 4), (10, 2, 'B-5', 5),
(11, 3, 'C-1', 1), (12, 3, 'C-2', 2), (13, 3, 'C-3', 3), (14, 3, 'C-4', 4), (15, 3, 'C-5', 5),
(16, 4, 'D-1', 1), (17, 4, 'D-2', 2), (18, 4, 'D-3', 3), (19, 4, 'D-4', 4), (20, 4, 'D-5', 5),
(21, 5, 'E-1', 1), (22, 5, 'E-2', 2), (23, 5, 'E-3', 3), (24, 5, 'E-4', 4), (25, 5, 'E-5', 5),
(26, 6, 'F-1', 1), (27, 6, 'F-2', 2), (28, 6, 'F-3', 3), (29, 6, 'F-4', 4), (30, 6, 'F-5', 5),
(31, 7, 'G-1', 1), (32, 7, 'G-2', 2), (33, 7, 'G-3', 3), (34, 7, 'G-4', 4), (35, 7, 'G-5', 5),
(36, 8, 'H-1', 1), (37, 8, 'H-2', 2), (38, 8, 'H-3', 3), (39, 8, 'H-4', 4), (40, 8, 'H-5', 5);

-- Ajustar secuencias después de inserciones manuales con ID
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
SELECT setval('insumos_id_seq', (SELECT MAX(id) FROM insumos));
SELECT setval('filas_id_seq', (SELECT MAX(id) FROM filas));
SELECT setval('cuadrantes_id_seq', (SELECT MAX(id) FROM cuadrantes));
