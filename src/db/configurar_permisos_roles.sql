-- Script para configurar permisos por rol
-- Este script crea la tabla de permisos si no existe y asigna permisos a los roles

DO $$
DECLARE
    permisos_count INTEGER;
    role_record RECORD;
BEGIN
    -- Verificar si la tabla roles existe
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles') THEN
        RAISE EXCEPTION 'La tabla roles no existe, no se pueden configurar permisos';
    END IF;

    -- Verificar si existe la tabla de permisos
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'permisos') THEN
        RAISE NOTICE 'Creando tabla de permisos...';
        
        -- Crear tabla de permisos
        CREATE TABLE permisos (
            id SERIAL PRIMARY KEY,
            role UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
            permiso VARCHAR(100) NOT NULL,
            descripcion VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(role, permiso)
        );
        
        RAISE NOTICE 'Tabla de permisos creada correctamente';
    ELSE
        RAISE NOTICE 'La tabla de permisos ya existe';
        
        -- Verificar si la tabla permisos tiene la columna 'role'
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'permisos' AND column_name = 'role'
        ) THEN
            RAISE EXCEPTION 'La tabla permisos existe pero no tiene la columna "role" esperada';
        END IF;
    END IF;

    -- Limpiar permisos existentes para evitar duplicados
    DELETE FROM permisos;
    RAISE NOTICE 'Permisos existentes eliminados para evitar duplicados';

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
        INSERT INTO permisos (role, permiso, descripcion) VALUES
            ((SELECT id FROM admin_role), 'usuarios:ver', 'Ver listado de usuarios'),
            ((SELECT id FROM admin_role), 'usuarios:crear', 'Crear nuevos usuarios'),
            ((SELECT id FROM admin_role), 'usuarios:editar', 'Editar usuarios existentes'),
            ((SELECT id FROM admin_role), 'usuarios:eliminar', 'Eliminar usuarios'),
            ((SELECT id FROM admin_role), 'usuarios:editar_roles', 'Asignar roles a usuarios'),
            ((SELECT id FROM admin_role), 'usuarios:resetear_password', 'Restablecer contraseñas'),
            ((SELECT id FROM admin_role), 'roles:ver', 'Ver roles'),
            ((SELECT id FROM admin_role), 'roles:crear', 'Crear roles'),
            ((SELECT id FROM admin_role), 'roles:editar', 'Editar roles'),
            ((SELECT id FROM admin_role), 'roles:eliminar', 'Eliminar roles'),
            ((SELECT id FROM admin_role), 'permisos:ver', 'Ver permisos'),
            ((SELECT id FROM admin_role), 'permisos:asignar', 'Asignar permisos a roles'),
            ((SELECT id FROM admin_role), 'dashboard:acceso', 'Acceso al dashboard'),
            ((SELECT id FROM admin_role), 'reportes:ver', 'Ver reportes'),
            ((SELECT id FROM admin_role), 'reportes:exportar', 'Exportar reportes'),
            ((SELECT id FROM admin_role), 'configuracion:ver', 'Ver configuración'),
            ((SELECT id FROM admin_role), 'configuracion:editar', 'Editar configuración');
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
        INSERT INTO permisos (role, permiso, descripcion) VALUES
            ((SELECT id FROM empleado_role), 'dashboard:acceso', 'Acceso al dashboard'),
            ((SELECT id FROM empleado_role), 'perfil:ver', 'Ver perfil propio'),
            ((SELECT id FROM empleado_role), 'perfil:editar', 'Editar perfil propio'),
            ((SELECT id FROM empleado_role), 'reportes:ver', 'Ver reportes básicos');
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
        INSERT INTO permisos (role, permiso, descripcion) VALUES
            ((SELECT id FROM supervisor_role), 'dashboard:acceso', 'Acceso al dashboard'),
            ((SELECT id FROM supervisor_role), 'usuarios:ver', 'Ver listado de usuarios'),
            ((SELECT id FROM supervisor_role), 'reportes:ver', 'Ver reportes'),
            ((SELECT id FROM supervisor_role), 'reportes:exportar', 'Exportar reportes'),
            ((SELECT id FROM supervisor_role), 'tareas:asignar', 'Asignar tareas');
    END IF;

    -- Verificar que los permisos se hayan configurado correctamente
    SELECT COUNT(*) INTO permisos_count FROM permisos;
    RAISE NOTICE 'Se han configurado % permisos en total', permisos_count;

    -- Mostrar un resumen de los permisos por rol
    RAISE NOTICE 'Resumen de permisos por rol:';
    FOR role_record IN 
        SELECT r.id, COALESCE(r.nombre_rol, r.nombre) AS nombre_rol, COUNT(p.id) AS num_permisos
        FROM roles r
        LEFT JOIN permisos p ON r.id = p.role
        GROUP BY r.id, COALESCE(r.nombre_rol, r.nombre)
        ORDER BY COUNT(p.id) DESC
    LOOP
        RAISE NOTICE 'Rol: %, Permisos: %', role_record.nombre_rol, role_record.num_permisos;
    END LOOP;

    RAISE NOTICE 'Configuración de permisos completada con éxito';
END $$;

-- Consulta para verificar los permisos después de la configuración
SELECT r.id AS rol_id, 
       COALESCE(r.nombre_rol, r.nombre) AS nombre_rol, 
       p.permiso, 
       p.descripcion
FROM roles r
JOIN permisos p ON r.id = p.role
ORDER BY nombre_rol, permiso;
