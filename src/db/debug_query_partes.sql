-- Crear función RPC para diagnosticar problemas con partes
CREATE OR REPLACE FUNCTION debug_query_partes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Importante: se ejecuta con los permisos del creador
AS $$
DECLARE
  result JSONB;
  total_count INTEGER;
  data_full JSONB;
BEGIN
  -- Contar registros totales en la tabla partes
  SELECT COUNT(*) INTO total_count FROM partes;
  
  -- Obtener todos los datos completos
  SELECT jsonb_agg(to_jsonb(p))
  INTO data_full
  FROM partes p
  ORDER BY p.created_at DESC;
  
  -- Construir resultado
  SELECT jsonb_build_object(
    'total_count', total_count,
    'table_exists', TRUE,
    'columns', (
      SELECT jsonb_agg(column_name)
      FROM information_schema.columns
      WHERE table_name = 'partes'
    ),
    'data_full', data_full
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', 'Error en debug_query_partes'
    );
END;
$$;

-- Comentario: Para ejecutar esta función en Supabase
-- 1. Ve al panel de administración de Supabase
-- 2. Navega a SQL Editor
-- 3. Pega este código y ejecútalo
-- 4. La función estará disponible para llamadas RPC desde el cliente
