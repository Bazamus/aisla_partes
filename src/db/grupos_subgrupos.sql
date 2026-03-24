-- Crear tabla para grupos y subgrupos
CREATE TABLE IF NOT EXISTS grupos_subgrupos (
    id SERIAL PRIMARY KEY,
    grupo_principal VARCHAR(100) NOT NULL,
    subgrupo VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(grupo_principal, subgrupo)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_grupos_subgrupos_grupo_principal ON grupos_subgrupos(grupo_principal);
CREATE INDEX IF NOT EXISTS idx_grupos_subgrupos_subgrupo ON grupos_subgrupos(subgrupo);

-- Insertar datos iniciales
INSERT INTO grupos_subgrupos (grupo_principal, subgrupo) VALUES
-- FONTANERÍA
('FONTANERIA', 'Instalación Interior'),
('FONTANERIA', 'Baterías Contadores'),
('FONTANERIA', 'PVC'),
('FONTANERIA', 'Instalación General'),
('FONTANERIA', 'Otros Fontanería'),

-- CALEFACCIÓN
('CALEFACCION', 'Instalación Interior'),
('CALEFACCION', 'Instalación Exterior'),
('CALEFACCION', 'Otros Calefacción'),

-- AIRE ACONDICIONADO
('AIRE ACONDICIONADO', 'Precio tubería por metro con coquilla'),
('AIRE ACONDICIONADO', 'Precio tubería por metro preaislada'),
('AIRE ACONDICIONADO', 'Precio metro lineal Cable'),
('AIRE ACONDICIONADO', 'Precio metro lineal Manguera'),
('AIRE ACONDICIONADO', 'Otros Aire acondicionado')
ON CONFLICT (grupo_principal, subgrupo) DO NOTHING;
