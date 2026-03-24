-- Añadir columna unidad a la tabla lista_de_precios
ALTER TABLE lista_de_precios 
ADD COLUMN IF NOT EXISTS unidad VARCHAR(10) DEFAULT 'UN';

-- Crear un tipo ENUM para las unidades (opcional, para validación)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_unidad') THEN
        CREATE TYPE tipo_unidad AS ENUM ('M2', 'ML', 'UN');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END$$;

-- Añadir constraint para validar los valores permitidos
ALTER TABLE lista_de_precios
DROP CONSTRAINT IF EXISTS check_unidad_valores;

ALTER TABLE lista_de_precios
ADD CONSTRAINT check_unidad_valores
CHECK (unidad IN ('M2', 'ML', 'UN'));

-- Actualizar registros existentes a 'UN' por defecto
UPDATE lista_de_precios
SET unidad = 'UN'
WHERE unidad IS NULL;

-- Crear índice para mejorar rendimiento en búsquedas por unidad
CREATE INDEX IF NOT EXISTS idx_precios_unidad ON lista_de_precios(unidad);
