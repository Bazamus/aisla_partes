-- Crear la tabla empleados si no existe
CREATE TABLE IF NOT EXISTS empleados (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    coste_hora_trabajador DECIMAL(10, 2) DEFAULT 0,
    coste_hora_empresa DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear la tabla obras si no existe
CREATE TABLE IF NOT EXISTS obras (
    id SERIAL PRIMARY KEY,
    nombre_obra VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Modificar la tabla empleados para añadir nuevos campos
ALTER TABLE empleados
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
ADD COLUMN IF NOT EXISTS obra_asignada VARCHAR(255);

-- Modificar la tabla obras para añadir nuevos campos
ALTER TABLE obras
ADD COLUMN IF NOT EXISTS numero_obra VARCHAR(9),
ADD COLUMN IF NOT EXISTS fecha_alta DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS cliente VARCHAR(255),
ADD COLUMN IF NOT EXISTS ref_interna VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(100),
ADD COLUMN IF NOT EXISTS direccion_obra VARCHAR(255);

-- Crear tabla intermedia para la relación muchos a muchos entre empleados y obras
CREATE TABLE IF NOT EXISTS empleados_obras (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    obra_id INTEGER NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empleado_id, obra_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_empleados_codigo ON empleados(codigo);
CREATE INDEX IF NOT EXISTS idx_obras_numero_obra ON obras(numero_obra);
CREATE INDEX IF NOT EXISTS idx_empleados_obras_empleado ON empleados_obras(empleado_id);
CREATE INDEX IF NOT EXISTS idx_empleados_obras_obra ON empleados_obras(obra_id);
