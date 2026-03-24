-- Script simplificado para consultar la estructura de las tablas

-- Listar todas las tablas en el esquema public
SELECT tablename AS "Tablas en schema public"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Estructura de la tabla roles (si existe)
SELECT 'roles' AS "Tabla", 
       column_name AS "Columna", 
       data_type AS "Tipo de Dato", 
       character_maximum_length AS "Longitud"
FROM information_schema.columns
WHERE table_name = 'roles'
ORDER BY ordinal_position;

-- Estructura de la tabla permisos (si existe)
SELECT 'permisos' AS "Tabla", 
       column_name AS "Columna", 
       data_type AS "Tipo de Dato", 
       character_maximum_length AS "Longitud"
FROM information_schema.columns
WHERE table_name = 'permisos'
ORDER BY ordinal_position;

-- Estructura de la tabla user_roles (si existe)
SELECT 'user_roles' AS "Tabla", 
       column_name AS "Columna", 
       data_type AS "Tipo de Dato", 
       character_maximum_length AS "Longitud"
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;

-- Datos de ejemplo de la tabla roles (si existe)
SELECT 'Datos de roles' AS "Consulta", * 
FROM roles 
LIMIT 5;

-- Datos de ejemplo de la tabla permisos (si existe)
SELECT 'Datos de permisos' AS "Consulta", * 
FROM permisos 
LIMIT 5;

-- Datos de ejemplo de la tabla user_roles (si existe)
SELECT 'Datos de user_roles' AS "Consulta", * 
FROM user_roles 
LIMIT 5;
