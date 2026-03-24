-- Script para actualizar los nombres de los roles
-- Este script asigna nombres legibles a los roles existentes y configura permisos básicos

DO $$
DECLARE
    roles_count INTEGER;
    role_record RECORD;
BEGIN
    -- Verificar si la tabla roles existe
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles') THEN
        RAISE EXCEPTION 'La tabla roles no existe';
    END IF;

    -- Verificar si existe la columna nombre_rol
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'nombre_rol'
    ) THEN
        -- Si no existe nombre_rol, verificar si existe nombre
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'roles' AND column_name = 'nombre'
        ) THEN
            RAISE EXCEPTION 'La tabla roles no tiene columna nombre_rol ni nombre';
        ELSE
            RAISE NOTICE 'Usando columna "nombre" en lugar de "nombre_rol"';
        END IF;
    END IF;

    -- Contar roles para saber si hay que actualizarlos
    SELECT COUNT(*) INTO roles_count FROM roles;
    RAISE NOTICE 'Encontrados % roles en la base de datos', roles_count;

    -- Actualizar los nombres de los roles existentes
    FOR role_record IN 
        SELECT * FROM roles
    LOOP
        -- Verificar si el rol ya tiene un nombre legible
        IF (
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'nombre_rol') AND 
             (role_record.nombre_rol IS NULL OR role_record.nombre_rol = '' OR role_record.nombre_rol = role_record.id::text))
            OR
            (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'nombre') AND 
             (role_record.nombre IS NULL OR role_record.nombre = '' OR role_record.nombre = role_record.id::text))
        ) THEN
            -- Asignar nombres predefinidos a roles específicos basados en los UUIDs exactos
            -- que hemos identificado en la aplicación
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'nombre_rol') THEN
                -- Actualizar usando nombre_rol
                UPDATE roles 
                SET nombre_rol = 
                    CASE 
                        -- UUIDs específicos identificados en la aplicación
                        WHEN role_record.id::text = '6745763d-7dd8-4be8-b00c-78fc22e3627b' THEN 'Administrador'
                        WHEN role_record.id::text = 'f722bc1a-4dc1-4022-b93f-7c463f2895d9' THEN 'Empleado'
                        WHEN role_record.id::text = '2bd8cf42-6cff-45fe-a254-7419713c8ae7' THEN 'Supervisor'
                        WHEN role_record.id::text = '91342db2-eef7-459e-baeb-97b6fbc3493f' THEN 'Técnico'
                        WHEN role_record.id::text = '8666a96a-626e-4e67-ab3e-04256e017379' THEN 'Contabilidad'
                        WHEN role_record.id::text = 'd445190d-9220-4799-898f-9027b61f1a12' THEN 'Ventas'
                        WHEN role_record.id::text = '9dc5b751-2ea2-40a7-8147-b5ee54a10372' THEN 'Recursos Humanos'
                        WHEN role_record.id::text = 'c678b6d0-63e3-4f5b-a1a1-7e497a175805' THEN 'Gerencia'
                        -- Patrones de texto para roles no identificados específicamente
                        WHEN role_record.id::text LIKE '%admin%' THEN 'Administrador'
                        WHEN role_record.id::text LIKE '%emple%' THEN 'Empleado'
                        WHEN role_record.id::text LIKE '%prove%' THEN 'Proveedor'
                        WHEN role_record.id::text LIKE '%super%' THEN 'Supervisor'
                        WHEN role_record.id::text LIKE '%tecn%' THEN 'Técnico'
                        WHEN role_record.id::text LIKE '%conta%' THEN 'Contabilidad'
                        WHEN role_record.id::text LIKE '%vent%' THEN 'Ventas'
                        WHEN role_record.id::text LIKE '%recur%' THEN 'Recursos Humanos'
                        WHEN role_record.id::text LIKE '%geren%' THEN 'Gerencia'
                        ELSE 'Rol ' || SUBSTRING(role_record.id::text, 1, 8)
                    END
                WHERE id = role_record.id;
            ELSE
                -- Actualizar usando nombre
                UPDATE roles 
                SET nombre = 
                    CASE 
                        -- UUIDs específicos identificados en la aplicación
                        WHEN role_record.id::text = '6745763d-7dd8-4be8-b00c-78fc22e3627b' THEN 'Administrador'
                        WHEN role_record.id::text = 'f722bc1a-4dc1-4022-b93f-7c463f2895d9' THEN 'Empleado'
                        WHEN role_record.id::text = '2bd8cf42-6cff-45fe-a254-7419713c8ae7' THEN 'Supervisor'
                        WHEN role_record.id::text = '91342db2-eef7-459e-baeb-97b6fbc3493f' THEN 'Técnico'
                        WHEN role_record.id::text = '8666a96a-626e-4e67-ab3e-04256e017379' THEN 'Contabilidad'
                        WHEN role_record.id::text = 'd445190d-9220-4799-898f-9027b61f1a12' THEN 'Ventas'
                        WHEN role_record.id::text = '9dc5b751-2ea2-40a7-8147-b5ee54a10372' THEN 'Recursos Humanos'
                        WHEN role_record.id::text = 'c678b6d0-63e3-4f5b-a1a1-7e497a175805' THEN 'Gerencia'
                        -- Patrones de texto para roles no identificados específicamente
                        WHEN role_record.id::text LIKE '%admin%' THEN 'Administrador'
                        WHEN role_record.id::text LIKE '%emple%' THEN 'Empleado'
                        WHEN role_record.id::text LIKE '%prove%' THEN 'Proveedor'
                        WHEN role_record.id::text LIKE '%super%' THEN 'Supervisor'
                        WHEN role_record.id::text LIKE '%tecn%' THEN 'Técnico'
                        WHEN role_record.id::text LIKE '%conta%' THEN 'Contabilidad'
                        WHEN role_record.id::text LIKE '%vent%' THEN 'Ventas'
                        WHEN role_record.id::text LIKE '%recur%' THEN 'Recursos Humanos'
                        WHEN role_record.id::text LIKE '%geren%' THEN 'Gerencia'
                        ELSE 'Rol ' || SUBSTRING(role_record.id::text, 1, 8)
                    END
                WHERE id = role_record.id;
            END IF;
            
            RAISE NOTICE 'Actualizado rol con ID %', role_record.id;
        END IF;
    END LOOP;

    -- Verificar que los roles se hayan actualizado correctamente
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'nombre_rol') THEN
        RAISE NOTICE 'Roles actualizados con nombres legibles (usando nombre_rol):';
        FOR role_record IN 
            SELECT id, nombre_rol FROM roles
        LOOP
            RAISE NOTICE 'ID: %, Nombre: %', role_record.id, role_record.nombre_rol;
        END LOOP;
    ELSE
        RAISE NOTICE 'Roles actualizados con nombres legibles (usando nombre):';
        FOR role_record IN 
            SELECT id, nombre FROM roles
        LOOP
            RAISE NOTICE 'ID: %, Nombre: %', role_record.id, role_record.nombre;
        END LOOP;
    END IF;

    -- Verificar si existe la tabla de permisos
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'permisos') THEN
        RAISE NOTICE 'La tabla permisos existe, configurando permisos básicos...';
        
        -- Aquí podríamos insertar permisos básicos para cada rol
        -- Por ejemplo, asignar permisos de administración al rol de Administrador
        
        -- Este es un ejemplo de cómo podría ser la estructura:
        -- INSERT INTO permisos (rol_id, permiso) VALUES 
        --   ((SELECT id FROM roles WHERE nombre_rol = 'Administrador'), 'usuarios:crear'),
        --   ((SELECT id FROM roles WHERE nombre_rol = 'Administrador'), 'usuarios:editar_roles'),
        --   ((SELECT id FROM roles WHERE nombre_rol = 'Administrador'), 'usuarios:resetear_password');
        
        -- Nota: Descomenta y adapta esta sección según la estructura real de tu tabla de permisos
    ELSE
        RAISE NOTICE 'La tabla permisos no existe. No se configurarán permisos.';
    END IF;

    RAISE NOTICE 'Actualización de nombres de roles completada con éxito';
END $$;

-- Consulta para verificar los roles después de la actualización
SELECT * FROM roles;
