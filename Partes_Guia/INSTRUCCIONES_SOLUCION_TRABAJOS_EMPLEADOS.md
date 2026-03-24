# Solución: Empleado no puede visualizar/añadir trabajos

## Problema Identificado
El empleado no podía visualizar ni añadir trabajos debido a:
1. **Error de PermissionGuard**: Se usaba `permissionName` en lugar de `requiredPermission`
2. **Posible falta de migración**: Las funciones RPC y tablas nuevas pueden no estar aplicadas

## Soluciones Aplicadas

### 1. ✅ Corregido Error de PermissionGuard
**Archivo**: `src/pages/NuevoParte.jsx` línea 346
**Cambio**: `permissionName="partes:crear"` → `requiredPermission="partes:crear"`

### 2. 📝 Creado Script de Verificación
**Archivo**: `verificar_migracion_trabajos_empleados.sql`

## Pasos para Completar la Solución

### Paso 1: VERIFICAR TIPOS DE DATOS (RECOMENDADO)
**📋 OPCIONAL**: Para conocer los tipos exactos de tu base de datos:

1. Ve al **editor SQL de Supabase**
2. Ejecuta el script: `verificar_todos_tipos_datos.sql`
3. Revisa los resultados para confirmar tipos

### Paso 2: EJECUTAR MIGRACIÓN CON TIPOS MIXTOS (OBLIGATORIO)
**⚠️ IMPORTANTE**: Usa la versión con tipos mixtos que maneja INTEGER + UUID.

1. Ve al **editor SQL de Supabase**
2. Copia y ejecuta **TODO** el contenido del archivo: `sql/migrations/migrar_trabajos_empleados_tipos_mixtos.sql`
3. Espera a que termine completamente (puede tomar 1-2 minutos)

**NOTA**: Este archivo maneja tipos mixtos:
- `partes.id` = BIGINT
- `lista_de_precios.id` = INTEGER  
- `grupos.id` = UUID
- `subgrupos.id` = UUID

  ### Paso 3: Verificar Estado Después de la Migración
Después de ejecutar la migración, ejecuta el script de verificación:

```bash
# Copiar el contenido de verificar_migracion_trabajos_empleados.sql
# Ejecutar en el editor SQL de Supabase
# Ahora NO debería dar errores
```

### Paso 4: Reiniciar la Aplicación
```bash
# En el terminal del proyecto
npm run dev
# o
yarn dev
```

### Paso 5: Probar Funcionalidad
1. Acceder como empleado (carlospulido@aclimar.com)
2. Ir a "Nuevo Parte de Trabajo"
3. Completar información básica y crear parte
4. Verificar que aparece la sección "Trabajos Realizados"
5. Probar:
   - Añadir trabajo por grupos
   - Búsqueda libre de trabajos
   - Agregar trabajo manual
   - Editar tiempo empleado
   - Eliminar trabajos

## Verificaciones Adicionales

### Si Persisten Errores de Consola
Revisar:
- Permisos del usuario en la base de datos
- Políticas RLS aplicadas correctamente
- Conexión con Supabase

### Si las Funciones RPC No Funcionan
```sql
-- Verificar permisos de ejecución
GRANT EXECUTE ON FUNCTION agregar_trabajo_empleado TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_trabajos_parte_empleado TO authenticated;
-- ... (repetir para todas las funciones)
```

## Estado de Archivos Modificados

✅ **NuevoParte.jsx** - Error PermissionGuard corregido
✅ **TrabajosCardEmpleado.jsx** - Componente completo implementado
✅ **parteEmpleadoService.js** - Servicios actualizados
✅ **EditarParte.jsx** - Integración parcial completada

## Scripts de Migración y Verificación Creados

✅ **verificar_todos_tipos_datos.sql** - Verificar tipos exactos de BD
✅ **migrar_trabajos_empleados_tipos_mixtos.sql** - Migración final con tipos correctos
✅ **verificar_migracion_trabajos_empleados.sql** - Verificar estado post-migración
✅ **EXPLICACION_ERROR_TIPOS.md** - Documentación técnica del problema

## Próximos Pasos Opcionales

1. **Completar EditarParte.jsx**: Eliminar campos obsoletos restantes
2. **Actualizar VerDetallePartePage.jsx**: Reemplazar componente obsoleto
3. **Testing exhaustivo**: Probar todos los flujos
4. **Documentación**: Actualizar manual de usuario

## Contacto para Soporte

Si sigues teniendo problemas después de seguir estos pasos, proporciona:
1. Resultado del script de verificación
2. Nuevos logs de consola después de aplicar correcciones
3. Capturas de pantalla de errores específicos 