# Guía de Implementación de Roles y Usuarios

Esta guía detalla los pasos necesarios para implementar el sistema de roles y usuarios en Aisla Partes.

## 1. Preparación de la Base de Datos

Ejecuta los siguientes scripts SQL en el orden indicado:

1. **Actualizar tablas para añadir campos de email y user_id**:
   ```sql
   -- Ejecutar el script
   actualizar_tablas_email.sql
   ```

2. **Crear tabla de usuarios pendientes**:
   ```sql
   -- Ejecutar el script
   crear_tabla_usuarios_pendientes.sql
   ```

3. **Crear permisos para gestión de usuarios**:
   ```sql
   -- Ejecutar el script
   crear_permiso_usuarios.sql
   ```

4. **Crear funciones para procesar usuarios pendientes**:
   ```sql
   -- Ejecutar el script
   procesar_usuarios_pendientes.sql
   ```

5. **Asignar roles masivamente a empleados y proveedores existentes**:
   ```sql
   -- Ejecutar el script
   asignar_roles_masivos.sql
   ```

## 2. Implementación en la Aplicación

### Nuevos Componentes

Se han añadido los siguientes componentes a la aplicación:

1. **Página de Usuarios Pendientes**:
   - Ruta: `/usuarios-pendientes`
   - Archivo: `src/pages/UsuariosPendientes.jsx`
   - Funcionalidad: Permite gestionar las solicitudes de creación de usuarios para empleados y proveedores.

2. **Componente para Procesar Usuarios Pendientes**:
   - Archivo: `src/components/ProcesarUsuariosPendientes.jsx`
   - Funcionalidad: Permite procesar todos los usuarios pendientes de una vez.

### Modificaciones en Formularios Existentes

1. **Formulario de Empleados**:
   - Se han añadido campos para email, contraseña y una opción para crear usuario.
   - Al crear o modificar un empleado, se puede crear un usuario asociado con rol de "empleado".

2. **Formulario de Proveedores**:
   - Se han añadido campos para email, contraseña y una opción para crear usuario.
   - Al crear o modificar un proveedor, se puede crear un usuario asociado con rol de "proveedor".

## 3. Flujo de Trabajo para Asignación de Roles

### Para Usuarios Nuevos

1. Al crear un empleado o proveedor, marca la opción "Crear usuario" y proporciona un email y contraseña.
2. El sistema registrará la solicitud en la tabla `usuarios_pendientes`.
3. Un administrador debe ir a la página "Usuarios Pendientes" y aprobar la solicitud.
4. Una vez aprobada, se creará el usuario y se le asignará el rol correspondiente.

### Para Usuarios Existentes

1. Ejecuta el script `asignar_roles_masivos.sql` para asignar roles a todos los empleados y proveedores existentes.
2. Alternativamente, puedes ir a la página "Gestión de Roles" y asignar roles manualmente.

## 4. Permisos Necesarios

Para acceder a la gestión de usuarios, se requieren los siguientes permisos:

- `usuarios:ver`: Ver usuarios del sistema
- `usuarios:crear`: Crear nuevos usuarios
- `usuarios:editar`: Editar usuarios existentes
- `usuarios:eliminar`: Eliminar usuarios
- `usuarios:gestionar`: Gestionar usuarios (incluye todas las operaciones)

Estos permisos se asignan automáticamente a los roles de administrador y superadmin al ejecutar el script `crear_permiso_usuarios.sql`.

## 5. Solución de Problemas

### Error al Crear Usuarios

Si ocurre un error al crear usuarios, verifica lo siguiente:

1. Asegúrate de que el email no esté ya registrado en el sistema.
2. Verifica que la contraseña cumpla con los requisitos mínimos de seguridad.
3. Comprueba que el usuario tenga los permisos necesarios para crear usuarios.

### Error al Asignar Roles

Si ocurre un error al asignar roles, verifica lo siguiente:

1. Asegúrate de que el rol exista en la tabla `roles`.
2. Verifica que el usuario tenga los permisos necesarios para asignar roles.
3. Comprueba que la tabla `roles` tenga la estructura correcta.

## 6. Próximos Pasos

1. **Implementar autenticación de dos factores (2FA)** para mejorar la seguridad.
2. **Crear una página de recuperación de contraseña** para permitir a los usuarios restablecer sus contraseñas.
3. **Implementar un sistema de auditoría** para registrar las acciones de los usuarios en el sistema.
