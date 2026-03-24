-- Script para configurar relaciones entre roles y permisos
-- Este script crea la tabla de relación role_permisos si no existe y asigna permisos a roles

DO $$
DECLARE
    permisos_count INTEGER;
    role_record RECORD;
BEGIN
    -- Verificar si las tablas necesarias existen
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles') THEN
        RAISE EXCEPTION 'La tabla roles no existe, no se pueden configurar permisos';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'permisos') THEN
        RAISE EXCEPTION 'La tabla permisos no existe, no se pueden asignar permisos a roles';
    END IF;

    -- Verificar si existe la tabla de relación role_permisos
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'role_permisos') THEN
        RAISE NOTICE 'Creando tabla de relación role_permisos...';
        
        -- Crear tabla de relación entre roles y permisos
        CREATE TABLE role_permisos (
            id SERIAL PRIMARY KEY,
            role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
            permiso_id UUID NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(role_id, permiso_id)
        );
        
        RAISE NOTICE 'Tabla role_permisos creada correctamente';
    ELSE
        RAISE NOTICE 'La tabla role_permisos ya existe';
        
        -- Verificar si la tabla tiene las columnas esperadas
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'role_permisos' AND column_name = 'role_id'
        ) OR NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'role_permisos' AND column_name = 'permiso_id'
        ) THEN
            RAISE EXCEPTION 'La tabla role_permisos existe pero no tiene las columnas esperadas (role_id, permiso_id)';
        END IF;
    END IF;

    -- Limpiar relaciones existentes para evitar duplicados
    DELETE FROM role_permisos;
    RAISE NOTICE 'Relaciones existentes eliminadas para evitar duplicados';

    -- Definir permisos para el rol de Administrador
    IF EXISTS (SELECT 1 FROM roles WHERE nombre_rol = 'Administrador' OR nombre = 'Administrador' OR id::text = '6745763d-7dd8-4be8-b00c-78fc22e3627b') THEN
        RAISE NOTICE 'Configurando permisos para el rol Administrador...';
        
        -- Obtener el ID del rol Administrador
        WITH admin_role AS (
            SELECT id FROM roles 
            WHERE nombre_rol = 'Administrador' 
            OR nombre = 'Administrador' 
            OR id::text = '6745763d-7dd8-4be8-b00c-78fc22e3627b'
            LIMIT 1
        )
        -- Asignar todos los permisos existentes al rol de Administrador
        INSERT INTO role_permisos (role_id, permiso_id)
        SELECT (SELECT id FROM admin_role), id
        FROM permisos;
        
        GET DIAGNOSTICS permisos_count = ROW_COUNT;
        RAISE NOTICE 'Se asignaron % permisos al rol Administrador', permisos_count;
    END IF;

    -- Definir permisos para el rol de Empleado
    IF EXISTS (SELECT 1 FROM roles WHERE nombre_rol = 'Empleado' OR nombre = 'Empleado' OR id::text = 'f722bc1a-4dc1-4022-b93f-7c463f2895d9') THEN
        RAISE NOTICE 'Configurando permisos para el rol Empleado...';
        
        -- Obtener el ID del rol Empleado
        WITH empleado_role AS (
            SELECT id FROM roles 
            WHERE nombre_rol = 'Empleado' 
            OR nombre = 'Empleado' 
            OR id::text = 'f722bc1a-4dc1-4022-b93f-7c463f2895d9'
            LIMIT 1
        )
        -- Asignar permisos básicos al rol de Empleado
        INSERT INTO role_permisos (role_id, permiso_id)
        SELECT 
            (SELECT id FROM empleado_role), 
            id
        FROM 
            permisos
        WHERE 
            nombre IN ('partes:leer', 'perfil:ver', 'perfil:editar', 'dashboard:acceso');
        
        GET DIAGNOSTICS permisos_count = ROW_COUNT;
        RAISE NOTICE 'Se asignaron % permisos al rol Empleado', permisos_count;
    END IF;

    -- Definir permisos para el rol de Supervisor
    IF EXISTS (SELECT 1 FROM roles WHERE nombre_rol = 'Supervisor' OR nombre = 'Supervisor' OR id::text = '2bd8cf42-6cff-45fe-a254-7419713c8ae7') THEN
        RAISE NOTICE 'Configurando permisos para el rol Supervisor...';
        
        -- Obtener el ID del rol Supervisor
        WITH supervisor_role AS (
            SELECT id FROM roles 
            WHERE nombre_rol = 'Supervisor' 
            OR nombre = 'Supervisor' 
            OR id::text = '2bd8cf42-6cff-45fe-a254-7419713c8ae7'
            LIMIT 1
        )
        -- Asignar permisos intermedios al rol de Supervisor
        INSERT INTO role_permisos (role_id, permiso_id)
        SELECT 
            (SELECT id FROM supervisor_role), 
            id
        FROM 
            permisos
        WHERE 
            nombre IN ('partes:leer', 'partes:crear', 'partes:editar', 'partes:aprobar', 
                      'usuarios:ver', 'dashboard:acceso', 'reportes:ver', 'reportes:exportar');
        
        GET DIAGNOSTICS permisos_count = ROW_COUNT;
        RAISE NOTICE 'Se asignaron % permisos al rol Supervisor', permisos_count;
    END IF;

    -- Verificar que los permisos se hayan configurado correctamente
    SELECT COUNT(*) INTO permisos_count FROM role_permisos;
    RAISE NOTICE 'Se han configurado % relaciones entre roles y permisos en total', permisos_count;

    -- Mostrar un resumen de los permisos por rol
    RAISE NOTICE 'Resumen de permisos por rol:';
    FOR role_record IN 
        SELECT r.id, COALESCE(r.nombre_rol, r.nombre) AS nombre_rol, COUNT(rp.id) AS num_permisos
        FROM roles r
        LEFT JOIN role_permisos rp ON r.id = rp.role_id
        GROUP BY r.id, COALESCE(r.nombre_rol, r.nombre)
        ORDER BY COUNT(rp.id) DESC
    LOOP
        RAISE NOTICE 'Rol: %, Permisos: %', role_record.nombre_rol, role_record.num_permisos;
    END LOOP;

    RAISE NOTICE 'Configuración de permisos completada con éxito';
END $$;

-- Consulta para verificar los permisos asignados a cada rol
SELECT 
    r.id AS rol_id, 
    COALESCE(r.nombre_rol, r.nombre) AS nombre_rol, 
    p.nombre AS permiso, 
    p.descripcion
FROM 
    roles r
JOIN 
    role_permisos rp ON r.id = rp.role_id
JOIN 
    permisos p ON rp.permiso_id = p.id
ORDER BY 
    nombre_rol, permiso;
