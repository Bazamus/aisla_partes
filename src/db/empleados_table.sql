-- Create the Empleados table
CREATE TABLE IF NOT EXISTS empleados (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    coste_hora_trabajador DECIMAL(10, 2) DEFAULT 0,
    coste_hora_empresa DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert example data
INSERT INTO empleados (codigo, nombre, coste_hora_trabajador, coste_hora_empresa) VALUES
    ('E001', 'Juan Pérez', 15.50, 25.00),
    ('E002', 'María López', 16.00, 26.50),
    ('E003', 'Carlos Rodríguez', 14.75, 24.25);
