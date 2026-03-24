# Correcciones: Eliminación de Usuarios y Modal de Selección de Materiales

**Fecha**: 21 de Octubre de 2025

## Resumen de Problemas Resueltos

### 1. Problema: Error CORS al eliminar usuarios (404)

**Síntoma**: Al intentar eliminar un usuario desde la página de Usuarios, aparecía un error CORS indicando que la solicitud OPTIONS (preflight) no pasaba el control de acceso.

**Causa raíz**: La Edge Function `delete-user` no estaba desplegada en Supabase, causando que todas las solicitudes retornaran 404.

**Solución**:
- Desplegamos la Edge Function `delete-user` en Supabase
- Corregimos un error de sintaxis en línea 16 (falta de punto y coma)
- Simplificamos la invocación de la función para que use el SDK de Supabase correctamente

**Archivos modificados**:
- `supabase/functions/delete-user/index.ts` (corrección de sintaxis)
- `src/services/userService.js` (simplificación de la invocación)

### 2. Problema: Usuarios fantasma después de eliminación manual

**Síntoma**: Después de eliminar usuarios manualmente desde la base de datos (`alisonparra@conductosvimar.com` y `alinsonparra@conductosvimar.com`), estos seguían apareciendo en la lista de usuarios de la aplicación.

**Causa raíz**: Los usuarios fueron eliminados de la tabla `public.usuarios` pero NO de `auth.users`, dejando registros huérfanos.

**Solución**:
- Identificamos los usuarios fantasma en `auth.users` con los IDs:
  - `57343ce9-b2bf-4bcc-b51d-3128a5c56ef9` (alisonparra)
  - `bac2d8b6-1a1e-490f-a22a-d08807cd6bf2` (alinsonparra)
- Creamos y aplicamos la migración `delete_ghost_users_auth` para eliminarlos de `auth.users`
- Los usuarios ya no aparecen en la aplicación

### 3. Problema: Búsqueda de empleados no funciona al crear usuario

**Síntoma**: Al intentar vincular un empleado al crear un usuario, el campo de búsqueda "Buscar Empleado" no mostraba resultados para "Alin Radhames Parra Hidalgo".

**Causa raíz**: El empleado tenía el campo `user_id` apuntando a un usuario eliminado (`bac2d8b6-1a1e-490f-a22a-d08807cd6bf2`), por lo que la función `get_empleados_sin_usuario` no lo retornaba.

**Solución**:
- Limpiamos el campo `user_id` de los empleados que apuntaban a usuarios eliminados:
  - Alin Radhames Parra Hidalgo (E003)
  - Alison Parra (E014)
- Ahora ambos empleados aparecen correctamente en la búsqueda

### 4. Problema: Empleado duplicado "Alison Parra"

**Síntoma**: "Alin Radhames Parra Hidalgo" y "Alison Parra" eran el mismo empleado. Al intentar eliminar "Alison Parra" desde la aplicación, aparecía un error de conflicto (409).

**Causa raíz**: El empleado "Alison Parra" (ID: 17) tenía 4 obras asignadas en la tabla `empleados_obras`, causando una violación de foreign key al intentar eliminarlo.

**Solución**:
- Transferimos las 4 asignaciones de obras de "Alison Parra" (ID: 17) a "Alin Radhames Parra Hidalgo" (ID: 6):
  - ALZA 124 PARLA
  - ALZA 150 AZUQUECA
  - ALZA 160 VIV MECO
  - AQUATERRA 88 VIV VALLECAS
- Eliminamos el empleado duplicado (ID: 17)
- Alin Radhames ahora tiene 5 obras asignadas correctamente

### 5. Problema: Modal de selección de materiales con visualización incorrecta

**Síntoma**: En el modal de selección de materiales para crear partes de trabajo, los pasos de "Tipo", "Espesor" y "Diámetro" no se visualizaban correctamente en dispositivos móviles.

**Causa raíz**: El modal tenía problemas de layout y no incluía scroll horizontal para contenido largo.

**Solución implementada**:
- **Mejorado el layout del modal**:
  - Cambiado de `items-end` a `items-center` en desktop para centrar correctamente
  - Ajustado para que ocupe `h-full` en móvil y `max-h-[90vh]` en desktop
  - Mejorado el header con `flex-1 min-w-0` para evitar desbordamiento

- **Agregado scroll horizontal**:
  - Indicador de progreso: `overflow-x-auto` con `min-w-max` para permitir scroll horizontal
  - Breadcrumb: `overflow-x-auto` con `whitespace-nowrap` para textos largos
  - Agregados separadores visuales entre pasos del progreso

- **Mejoras de responsive**:
  - Texto más pequeño en móvil (`text-xs sm:text-sm`)
  - Espaciado optimizado con `gap-2` y `ml-1.5`
  - Botones con `flex-shrink-0` para evitar que se compriman
  - Header truncado con `truncate` para textos largos

- **Mejoras de accesibilidad**:
  - Agregados atributos `aria-label` a los botones
  - Mejor contraste visual en los estados activos

**Archivo modificado**:
- `src/components/partes-empleados/SelectorArticulosMobileModal.jsx`

## Estado Actual

### Empleados sin usuario disponibles para vincular:
1. **Alin Radhames Parra Hidalgo** (E003) - 5 obras asignadas ✅
2. **Engel Gabriel Parra Matos** (E009)
3. **Jose Miguel Medina Martinez** (E006)
4. **Othman Riyahi** (E004)
5. **Redouane El Fekri** (E001)
6. **Sixto Orlando Orejuela Rivera** (E007)

Total: 7 empleados disponibles

### Usuarios activos en el sistema:
1. Administrador AISLA
2. Alberto Escanio Silverio
3. Angelo Parra Hidalgo
4. Empleado (prueba)
5. Francisco Gutierrez Perez
6. Jonathan Peralta Almonte
7. Luduis Enmanuel Silverio Ramos
8. Luis Sanchez (SUMINISTROS TÉCNICOS AISLA)
9. Tiago Miguel Lourenço Aguiar
10. Yordis Jose Mendoza Gomez

Total: 10 usuarios activos

## Recomendaciones

### Para eliminar usuarios en el futuro:
1. ⚠️ **NUNCA eliminar usuarios manualmente desde la base de datos**
2. ✅ **Siempre usar el botón "Eliminar" en la interfaz** o la Edge Function `delete-user`
3. Esto asegura que se eliminen correctamente de:
   - `auth.users` (autenticación)
   - `public.usuarios` (perfil)
   - `usuarios_roles` (roles)
   - `empleados` o `proveedores` (si está vinculado)

### Para verificar integridad de datos:
```sql
-- Verificar empleados con user_id que apunta a usuarios inexistentes
SELECT 
  e.id,
  e.codigo,
  e.nombre,
  e.user_id,
  CASE 
    WHEN au.id IS NULL THEN 'Usuario NO existe'
    ELSE 'Usuario existe'
  END as estado
FROM empleados e
LEFT JOIN auth.users au ON e.user_id = au.id
WHERE e.user_id IS NOT NULL;
```

## Próximos Pasos

1. **Crear usuario para Alin Radhames Parra Hidalgo**:
   - Ir a Usuarios → Crear Nuevo Usuario
   - Seleccionar "Vincular Empleado"
   - Buscar "Alin" en el campo de búsqueda
   - Completar el formulario con:
     - Email: `alinsonparra@conductosvimar.com`
     - Contraseña
     - Roles correspondientes

2. **Verificar funcionalidad del modal de materiales**:
   - Probar en dispositivo móvil
   - Verificar que todos los pasos se visualizan correctamente
   - Confirmar que el scroll horizontal funciona para contenido largo
   - Verificar que se pueden seleccionar Tipo, Espesor y Diámetro sin problemas

## Commits Realizados

1. `51532f2` - "fix: Corregir eliminación de usuarios - desplegar Edge Function delete-user y simplificar invocación"
2. `97fe38e` - "fix: Mejorar visualización del modal de selección de materiales - agregar scroll horizontal y mejorar layout responsive"

---

**Nota**: Todos los cambios han sido desplegados a producción vía Vercel. Esperar 1-2 minutos para que el despliegue se complete, luego refrescar la aplicación (Ctrl + F5).

