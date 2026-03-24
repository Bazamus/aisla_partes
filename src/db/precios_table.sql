-- Crear la tabla lista_de_precios
CREATE TABLE IF NOT EXISTS lista_de_precios (
    id SERIAL PRIMARY KEY,
    trabajo VARCHAR(255) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    grupo_principal VARCHAR(100) NOT NULL,
    subgrupo VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_precios_grupo_principal ON lista_de_precios(grupo_principal);
CREATE INDEX IF NOT EXISTS idx_precios_subgrupo ON lista_de_precios(subgrupo);

-- Insertar datos iniciales para los grupos y subgrupos predefinidos
INSERT INTO lista_de_precios (trabajo, precio, grupo_principal, subgrupo) VALUES
-- FONTANERÍA
('Ejemplo trabajo fontanería 1', 50.00, 'FONTANERIA', 'Instalación Interior'),
('Ejemplo trabajo fontanería 2', 75.00, 'FONTANERIA', 'Baterías Contadores'),
('Ejemplo trabajo fontanería 3', 60.00, 'FONTANERIA', 'PVC'),
('Ejemplo trabajo fontanería 4', 80.00, 'FONTANERIA', 'Instalación General'),
('Ejemplo trabajo fontanería 5', 45.00, 'FONTANERIA', 'Otros Fontanería'),

-- CALEFACCIÓN
('Ejemplo trabajo calefacción 1', 90.00, 'CALEFACCION', 'Instalación Interior'),
('Ejemplo trabajo calefacción 2', 120.00, 'CALEFACCION', 'Instalación Exterior'),
('Ejemplo trabajo calefacción 3', 70.00, 'CALEFACCION', 'Otros Calefacción'),

-- AIRE ACONDICIONADO
('Ejemplo tubería con coquilla', 25.00, 'AIRE ACONDICIONADO', 'Precio tubería por metro con coquilla'),
('Ejemplo tubería preaislada', 30.00, 'AIRE ACONDICIONADO', 'Precio tubería por metro preaislada'),
('Ejemplo metro cable', 15.00, 'AIRE ACONDICIONADO', 'Precio metro lineal Cable'),
('Ejemplo metro manguera', 20.00, 'AIRE ACONDICIONADO', 'Precio metro lineal Manguera'),
('Ejemplo aire acondicionado', 85.00, 'AIRE ACONDICIONADO', 'Otros Aire acondicionado');
