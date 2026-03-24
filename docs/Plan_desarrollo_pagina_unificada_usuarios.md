Vale, entiendo la necesidad de unificar la gestión de usuarios para simplificar el flujo de trabajo y evitar redundancias. La propuesta de crear una página única "Usuarios" es excelente y centralizará todas las operaciones relacionadas.

Revisando la propuesta y las clarificaciones:

Centralización: La idea de una página Usuarios es muy acertada. Eliminará la confusión actual y proporcionará un punto único de control.
Funcionalidades Clave: Las funciones propuestas (crear desde cero, crear desde empleado/proveedor, asignar roles, gestionar contraseñas) cubren las necesidades esenciales.
Eliminación de Funcionalidad Antigua: Es correcto eliminar la casilla "Crear usuario" y el campo de contraseña de los formularios de Empleados/Proveedores.
Páginas Existentes:
Usuarios Pendientes: Su funcionalidad se integrará mejor en la nueva página Usuarios, quizás como una vista o filtro que muestre empleados/proveedores sin cuenta de auth.users asociada.
Gestion de Roles y Administración de Permisos: Podrían mantenerse, pero enfocadas exclusivamente en la definición de roles y permisos, mientras que la asignación a usuarios se haría desde la nueva página Usuarios. Esto mantiene una separación lógica de responsabilidades.
Diseño: Se aplicará un diseño profesional y limpio, evitando fondos negros y asegurando la coherencia con los estilos globales existentes o definiendo nuevos si es necesario. Se usarán los colores corporativos y se buscará una buena experiencia de usuario.
Volumen y Escalabilidad: Aunque el volumen inicial es bajo (~100), la implementación se hará pensando en buenas prácticas que permitan escalar si fuera necesario en el futuro (consultas eficientes, paginación si la lista crece mucho, etc.).
Notificaciones por Email: Se desarrollará la lógica para enviar correos (creación de cuenta, reseteo de contraseña), pero se dejará desactivada por defecto, lista para habilitarse cuando sea necesario.
Plan de Desarrollo Propuesto:

Antes de empezar, voy a revisar el plan que has mencionado en docs/Plan_desarrollo_pagina_unificada_usuarios.md para asegurarme de que mis pasos se alinean con él y seguir el orden sugerido.

(Supongamos que he revisado el plan y lo siguiente es una síntesis/adaptación)

Aquí tienes un plan de desarrollo detallado, integrando tus requisitos y las mejores prácticas:

Fase 1: Preparación y Backend

Revisar/Ajustar Modelo de Datos (Supabase):
Verificar la relación entre empleados, proveedores y auth.users. Idealmente, el email debería ser el vínculo principal. Podríamos añadir una columna user_id (tipo UUID, nullable) en empleados y proveedores que referencie a auth.users.id para una relación más explícita, aunque no es estrictamente necesario si el email es único y fiable.
Asegurar que las tablas de roles (roles, user_roles) están correctamente configuradas.
Crear o ajustar las Policies de RLS (Row Level Security) en Supabase para permitir a los administradores gestionar usuarios, roles y contraseñas de forma segura.
Crear Servicios de Backend (userService.js o similar):
Función para obtener la lista de usuarios (auth.users) con información adicional (¿está vinculado a empleado/proveedor?, roles).
Función para obtener la lista de empleados/proveedores que aún no tienen una cuenta de usuario asociada.
Función para crear un usuario en auth.users (y opcionalmente actualizar el user_id en empleados/proveedores).
Función para asignar/modificar roles a un usuario (user_roles).
Función para resetear/cambiar la contraseña de un usuario (requiere permisos de administrador en Supabase).
Función (desactivada) para enviar notificaciones por email.
Fase 2: Creación de la Nueva Página Usuarios

Crear Componente Usuarios.jsx:
Estructura básica de la página (src/pages/Usuarios.jsx).
Añadir routing en App.jsx para la nueva ruta /usuarios.
Integrar en el Layout.jsx (añadir enlace en el menú de navegación lateral/superior).
Implementar Pestañas/Secciones:
Utilizar un sistema de pestañas (o secciones) dentro de Usuarios.jsx para organizar:
"Usuarios Activos": Lista de usuarios existentes en auth.users.
"Pendientes de Creación": Lista de empleados/proveedores sin cuenta.
"Crear Nuevo Usuario": Formulario para creación directa.
Diseño Básico y Estilos:
Aplicar estilos base con TailwindCSS siguiendo las directrices de diseño (colores corporativos, sin fondos negros, profesional).
Fase 3: Funcionalidades Principales

Listado de Usuarios Activos:
Crear un componente de tabla reutilizable (UserTable.jsx?).
Mostrar usuarios con columnas: Email, Nombre (si está vinculado), Rol(es), Estado, Acciones.
Implementar paginación si se prevé un gran número de usuarios.
Añadir botones de acción (Editar Rol, Resetear Contraseña, Desactivar/Activar - si aplica).
Listado de Pendientes de Creación:
Mostrar tabla de empleados/proveedores sin cuenta (email, nombre, tipo [Empleado/Proveedor]).
Añadir botón "Crear Cuenta de Usuario" por cada fila.
Flujo: Crear Usuario desde Pendientes:
Al pulsar "Crear Cuenta de Usuario":
Mostrar un modal o formulario simple pidiendo confirmar/establecer la contraseña inicial.
Asignar un rol por defecto (ej. 'empleado' o 'proveedor').
Llamar a la función del servicio para crear el usuario en auth.users.
Actualizar la UI (mover el registro de "Pendientes" a "Usuarios Activos").
Opcional: Llamar a la función (desactivada) de notificación por email.
Formulario "Crear Nuevo Usuario":
Formulario con campos: Email, Contraseña, Confirmar Contraseña, Selección de Rol(es).
Validaciones de formulario (email válido, contraseñas coinciden, etc.).
Llamar a la función del servicio para crear el usuario.
Actualizar la lista de "Usuarios Activos".
Opcional: Llamar a la función (desactivada) de notificación por email.
Fase 4: Gestión de Roles y Contraseñas

Asignación/Modificación de Roles:
Implementar la acción "Editar Rol" en la tabla de usuarios activos.
Mostrar un modal o desplegable con la lista de roles disponibles (obtenidos del backend).
Permitir seleccionar uno o varios roles.
Llamar a la función del servicio para actualizar los roles del usuario.
Actualizar la UI.
Gestión de Contraseñas:
Implementar la acción "Resetear Contraseña".
Mostrar un modal que permita al administrador establecer una nueva contraseña.
Llamar a la función del servicio correspondiente (requiere privilegios).
Opcional: Llamar a la función (desactivada) para notificar al usuario del cambio.
Fase 5: Limpieza y Refactorización

Eliminar Funcionalidad Antigua:
Modificar los formularios de edición de Empleados y Proveedores para quitar la sección "Crear usuario" y "Contraseña".
Revisar y decidir el futuro de UsuariosPendientes.jsx, GestionRoles.jsx (parte de asignación) y AdministracionPermisos.jsx (parte de asignación). Probablemente se puedan simplificar o eliminar partes.
Revisión de Estilos Globales:
Asegurar que los nuevos componentes respetan y/o complementan los estilos globales (index.css o similar) para mantener la coherencia visual.
Pruebas:
Probar exhaustivamente todos los flujos de creación, edición de roles y reseteo de contraseñas.
Verificar que los permisos de administrador funcionan correctamente.
Comprobar la interfaz en diferentes tamaños de pantalla.
Consideraciones Adicionales:

Estado del Usuario: Podríamos añadir un campo estado ('activo', 'inactivo') en auth.users (si Supabase no lo provee por defecto) o en nuestras tablas empleados/proveedores para poder desactivar usuarios sin borrarlos.
Feedback al Usuario: Usar notificaciones (como React Hot Toast) para confirmar acciones (Usuario creado, Rol asignado, Contraseña cambiada, etc.) y mostrar errores.
Este plan es detallado pero flexible. Empezaremos por las fases iniciales (Backend y estructura de la página) y avanzaremos implementando las funcionalidades paso a paso.

¿Te parece bien este plan de desarrollo? ¿Hay algún punto que quieras ajustar o priorizar de manera diferente?

Feedback submitted
Generating
