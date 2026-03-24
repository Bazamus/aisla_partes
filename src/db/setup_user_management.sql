-- Script para configurar las tablas necesarias para la gestión de usuarios
-- Ejecutar este script en la base de datos de Supabase

-- Verificar la estructura actual de la tabla roles
DO $$
DECLARE
    id_type TEXT;
    has_nombre BOOLEAN;
BEGIN
    -- Verificar si la tabla roles existe y obtener el tipo de la columna id
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles') THEN
        SELECT data_type INTO id_type FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'id';
        
        -- Verificar si existe la columna nombre
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'roles' AND column_name = 'nombre'
        ) INTO has_nombre;
        
        RAISE NOTICE 'La tabla roles existe. Tipo de columna id: %. Tiene columna nombre: %', id_type, has_nombre;
    ELSE
        RAISE NOTICE 'La tabla roles no existe';
    END IF;
END $$;

-- 1. Añadir columnas faltantes a la tabla empleados
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empleados' AND column_name = 'telefono'
    ) THEN
        ALTER TABLE empleados ADD COLUMN telefono VARCHAR(20);
        RAISE NOTICE 'Columna telefono añadida a empleados';
    ELSE
        RAISE NOTICE 'La columna telefono ya existe en empleados';
    END IF;
END $$;

-- 2. Añadir columnas faltantes a la tabla proveedores
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proveedores' AND column_name = 'nombre'
    ) THEN
        ALTER TABLE proveedores ADD COLUMN nombre VARCHAR(100);
        RAISE NOTICE 'Columna nombre añadida a proveedores';
    ELSE
        RAISE NOTICE 'La columna nombre ya existe en proveedores';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proveedores' AND column_name = 'telefono'
    ) THEN
        ALTER TABLE proveedores ADD COLUMN telefono VARCHAR(20);
        RAISE NOTICE 'Columna telefono añadida a proveedores';
    ELSE
        RAISE NOTICE 'La columna telefono ya existe en proveedores';
    END IF;
END $$;

-- 3. Manejar la tabla roles
DO $$
DECLARE
    id_type TEXT;
    has_columns RECORD;
BEGIN
    -- Verificar si la tabla roles existe
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles') THEN
        -- Obtener información sobre las columnas
        SELECT 
            EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'nombre') as has_nombre,
            EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'nombre_rol') as has_nombre_rol
        INTO has_columns;
        
        RAISE NOTICE 'Tabla roles existente. Tiene columna nombre: %, nombre_rol: %', 
                     has_columns.has_nombre, has_columns.has_nombre_rol;
        
        -- Verificar si la columna nombre_rol existe
        IF NOT has_columns.has_nombre_rol THEN
            ALTER TABLE roles ADD COLUMN nombre_rol VARCHAR(100);
            RAISE NOTICE 'Columna nombre_rol añadida a roles';
        ELSE
            RAISE NOTICE 'La columna nombre_rol ya existe en roles';
        END IF;
    ELSE
        -- Crear tabla de roles
        CREATE TABLE roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            nombre VARCHAR(100) NOT NULL,
            nombre_rol VARCHAR(100) NOT NULL,
            descripcion TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla roles creada con id de tipo UUID';
    END IF;
END $$;

-- 4. Verificar si la tabla user_roles existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_roles') THEN
        -- Crear tabla de asignación de roles a usuarios
        CREATE TABLE user_roles (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            role UUID NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, role)
        );
        
        -- Añadir la restricción de clave foránea
        BEGIN
            ALTER TABLE user_roles 
            ADD CONSTRAINT user_roles_role_fkey 
            FOREIGN KEY (role) REFERENCES roles(id) ON DELETE CASCADE;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'No se pudo añadir la restricción de clave foránea: %', SQLERRM;
        END;
        
        RAISE NOTICE 'Tabla user_roles creada';
    ELSE
        RAISE NOTICE 'La tabla user_roles ya existe';
    END IF;
END $$;

-- 5. Insertar roles predeterminados
DO $$
DECLARE
    admin_id UUID;
    empleado_id UUID;
    proveedor_id UUID;
    has_nombre BOOLEAN;
BEGIN
    -- Verificar si existe la columna nombre
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'nombre'
    ) INTO has_nombre;
    
    -- Insertar rol de administrador
    IF has_nombre THEN
        INSERT INTO roles (nombre, nombre_rol, descripcion)
        VALUES ('Administrador', 'Administrador', 'Acceso completo al sistema')
        ON CONFLICT (id) DO NOTHING
        RETURNING id INTO admin_id;
    ELSE
        INSERT INTO roles (nombre_rol, descripcion)
        VALUES ('Administrador', 'Acceso completo al sistema')
        ON CONFLICT (id) DO NOTHING
        RETURNING id INTO admin_id;
    END IF;
    
    -- Insertar rol de empleado
    IF has_nombre THEN
        INSERT INTO roles (nombre, nombre_rol, descripcion)
        VALUES ('Empleado', 'Empleado', 'Acceso a funciones básicas del sistema')
        ON CONFLICT (id) DO NOTHING
        RETURNING id INTO empleado_id;
    ELSE
        INSERT INTO roles (nombre_rol, descripcion)
        VALUES ('Empleado', 'Acceso a funciones básicas del sistema')
        ON CONFLICT (id) DO NOTHING
        RETURNING id INTO empleado_id;
    END IF;
    
    -- Insertar rol de proveedor
    IF has_nombre THEN
        INSERT INTO roles (nombre, nombre_rol, descripcion)
        VALUES ('Proveedor', 'Proveedor', 'Acceso limitado para proveedores')
        ON CONFLICT (id) DO NOTHING
        RETURNING id INTO proveedor_id;
    ELSE
        INSERT INTO roles (nombre_rol, descripcion)
        VALUES ('Proveedor', 'Acceso limitado para proveedores')
        ON CONFLICT (id) DO NOTHING
        RETURNING id INTO proveedor_id;
    END IF;
    
    RAISE NOTICE 'Roles creados con IDs: admin=%, empleado=%, proveedor=%', 
                 admin_id, empleado_id, proveedor_id;
    
    -- 6. Asignar rol de administrador al superadmin (si existe)
    DECLARE
        superadmin_id UUID;
    BEGIN
        -- Buscar el usuario superadmin
        SELECT id INTO superadmin_id FROM auth.users WHERE email = 'davidrey@aclimar.com';
        
        IF superadmin_id IS NOT NULL AND admin_id IS NOT NULL THEN
            -- Asignar rol de administrador
            INSERT INTO user_roles (user_id, role)
            VALUES (superadmin_id, admin_id)
            ON CONFLICT (user_id, role) DO NOTHING;
            
            RAISE NOTICE 'Rol de administrador asignado al superadmin';
        ELSE
            RAISE NOTICE 'Usuario superadmin no encontrado o rol de admin no creado';
        END IF;
    END;
END $$;
