-- Script para inspeccionar la estructura de las tablas de roles y permisos

DO $$
DECLARE
    column_record RECORD;
    role_record RECORD;
    perm_record RECORD;
    table_record RECORD;
BEGIN
    -- Listar todas las tablas en el esquema public
    RAISE NOTICE 'Listado de tablas en el esquema public:';
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        RAISE NOTICE 'Tabla: %', table_record.tablename;
    END LOOP;

    -- Verificar si la tabla roles existe
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles') THEN
        RAISE NOTICE '--------------------------------------';
        RAISE NOTICE 'La tabla roles existe';
        
        -- Mostrar la estructura de la tabla roles
        RAISE NOTICE 'Estructura de la tabla roles:';
        FOR column_record IN 
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'roles'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Columna: %, Tipo: %, Longitud: %', 
                column_record.column_name, 
                column_record.data_type, 
                column_record.character_maximum_length;
        END LOOP;
        
        -- Mostrar algunos datos de ejemplo de la tabla roles
        RAISE NOTICE 'Datos de ejemplo de la tabla roles:';
        BEGIN
            FOR role_record IN 
                SELECT * FROM roles LIMIT 5
            LOOP
                RAISE NOTICE 'ID: %', role_record.id;
                -- Mostrar todas las columnas dinámicamente
                FOR column_record IN 
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'roles'
                    AND column_name != 'id'
                LOOP
                    EXECUTE 'SELECT $1.' || quote_ident(column_record.column_name)
                    INTO STRICT perm_record
                    USING role_record;
                    
                    RAISE NOTICE '  %: %', column_record.column_name, perm_record;
                END LOOP;
            END LOOP;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error al mostrar datos de roles: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'La tabla roles no existe';
    END IF;
    
    -- Verificar si la tabla permisos existe
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'permisos') THEN
        RAISE NOTICE '--------------------------------------';
        RAISE NOTICE 'La tabla permisos existe';
        
        -- Mostrar la estructura de la tabla permisos
        RAISE NOTICE 'Estructura de la tabla permisos:';
        FOR column_record IN 
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'permisos'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Columna: %, Tipo: %, Longitud: %', 
                column_record.column_name, 
                column_record.data_type, 
                column_record.character_maximum_length;
        END LOOP;
        
        -- Mostrar algunos datos de ejemplo de la tabla permisos si existen
        IF EXISTS (SELECT 1 FROM permisos LIMIT 1) THEN
            RAISE NOTICE 'Datos de ejemplo de la tabla permisos:';
            BEGIN
                FOR perm_record IN 
                    SELECT * FROM permisos LIMIT 5
                LOOP
                    RAISE NOTICE 'ID: %', perm_record.id;
                    -- Mostrar todas las columnas dinámicamente
                    FOR column_record IN 
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'permisos'
                        AND column_name != 'id'
                    LOOP
                        EXECUTE 'SELECT $1.' || quote_ident(column_record.column_name)
                        INTO STRICT role_record
                        USING perm_record;
                        
                        RAISE NOTICE '  %: %', column_record.column_name, role_record;
                    END LOOP;
                END LOOP;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Error al mostrar datos de permisos: %', SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'La tabla permisos está vacía';
        END IF;
    ELSE
        RAISE NOTICE 'La tabla permisos no existe';
    END IF;
    
    -- Verificar si existe la tabla user_roles (relación entre usuarios y roles)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_roles') THEN
        RAISE NOTICE '--------------------------------------';
        RAISE NOTICE 'La tabla user_roles existe';
        
        -- Mostrar la estructura de la tabla user_roles
        RAISE NOTICE 'Estructura de la tabla user_roles:';
        FOR column_record IN 
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'user_roles'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Columna: %, Tipo: %, Longitud: %', 
                column_record.column_name, 
                column_record.data_type, 
                column_record.character_maximum_length;
        END LOOP;
        
        -- Mostrar algunos datos de ejemplo
        IF EXISTS (SELECT 1 FROM user_roles LIMIT 1) THEN
            RAISE NOTICE 'Datos de ejemplo de la tabla user_roles:';
            BEGIN
                FOR role_record IN 
                    SELECT * FROM user_roles LIMIT 5
                LOOP
                    RAISE NOTICE 'Registro user_roles:';
                    -- Mostrar todas las columnas dinámicamente
                    FOR column_record IN 
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'user_roles'
                    LOOP
                        EXECUTE 'SELECT $1.' || quote_ident(column_record.column_name)
                        INTO STRICT perm_record
                        USING role_record;
                        
                        RAISE NOTICE '  %: %', column_record.column_name, perm_record;
                    END LOOP;
                END LOOP;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Error al mostrar datos de user_roles: %', SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'La tabla user_roles está vacía';
        END IF;
    ELSE
        RAISE NOTICE 'La tabla user_roles no existe';
    END IF;
END $$;
