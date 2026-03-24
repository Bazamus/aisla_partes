# 🚀 Acceso Rápido al Módulo de Importación

## 📋 Descripción

Se ha habilitado un acceso rápido al módulo de importación de partes de trabajo de empleados desde el Dashboard principal, exclusivamente para usuarios con rol **"SuperAdmin"**.

## 🎯 Funcionalidad Implementada

### ✅ **Acceso Rápido en Dashboard**
- **Ubicación**: Dashboard principal → Sección "Acciones Rápidas"
- **Visibilidad**: Solo para usuarios con rol "SuperAdmin"
- **Acción**: Botón "Importar Partes" con icono y color distintivo
- **Ruta**: `/importar-partes-empleados`

### 🔐 **Control de Acceso**
- **Permiso requerido**: `partes:importar`
- **Rol autorizado**: `superadmin`
- **Restricción**: Deshabilitado para todos los demás roles

## 🛠️ Configuración Requerida

### Paso 1: Crear el Permiso en Base de Datos

Ejecutar el script SQL para crear el permiso y asignarlo al rol SuperAdmin:

```sql
-- Ejecutar en el Editor SQL de Supabase
-- Archivo: sql/script_supabase/crear_permiso_importar_partes.sql
```

**Este script:**
1. ✅ Crea el permiso `partes:importar`
2. ✅ Lo asigna al rol SuperAdmin
3. ✅ Verifica la creación exitosa

### Paso 2: Verificar Configuración

Después de ejecutar el script, verificar que:

1. **El permiso existe**:
   ```sql
   SELECT * FROM permisos WHERE codigo = 'partes:importar';
   ```

2. **Está asignado al rol SuperAdmin**:
   ```sql
   SELECT p.nombre, p.codigo, r.nombre as rol
   FROM permisos p
   JOIN roles_permisos rp ON p.id = rp.permiso_id
   JOIN roles r ON rp.rol_id = r.id
   WHERE p.codigo = 'partes:importar';
   ```

## 🎨 Interfaz de Usuario

### **Dashboard - Acciones Rápidas**

```
┌─────────────────────────────────────────────────────────────┐
│                    Acciones Rápidas                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 📄 Importar │  │ ➕ Crear     │  │ ➕ Crear     │         │
│  │    Partes   │  │   Parte     │  │   Parte     │         │
│  │             │  │ Empleado    │  │ Proveedor   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│     (Solo        │     (Admin/     │     (Todos)            │
│    SuperAdmin)   │   Supervisor)   │                       │
└─────────────────────────────────────────────────────────────┘
```

### **Características del Botón**
- **Color**: Púrpura (`bg-purple-500`)
- **Icono**: DocumentPlusIcon
- **Texto**: "Importar Partes"
- **Estado**: Solo visible para SuperAdmin

## 🔧 Código Implementado

### **DashboardPersonalizado.jsx**

```javascript
// Acciones rápidas para SuperAdmin
...(hasRole('superadmin') ? [
  {
    id: 'importar-partes-empleados',
    name: 'Importar Partes',
    to: '/importar-partes-empleados',
    icon: DocumentPlusIcon,
    color: 'bg-purple-500',
    permission: 'superadmin'
  }
] : []),
```

### **App.jsx - Rutas**

```javascript
{/* Importar Partes Empleados - Solo para SuperAdmin */}
<Route path="importar-partes-empleados" element={
  <ProtectedRoute requiredPermission="partes:importar">
    <ImportarPartesEmpleados />
  </ProtectedRoute>
} />
```

## 🔍 Verificación de Funcionamiento

### **Para Usuarios SuperAdmin:**
1. ✅ Acceder al Dashboard
2. ✅ Ver botón "Importar Partes" en Acciones Rápidas
3. ✅ Hacer clic → Redirige a `/importar-partes-empleados`
4. ✅ Acceder al módulo de importación

### **Para Otros Roles:**
1. ❌ No ven el botón "Importar Partes"
2. ❌ Si intentan acceder directamente a la URL → Acceso denegado
3. ❌ No pueden usar el módulo de importación

## 🚨 Solución de Problemas

### **Problema: No aparece el botón**
**Causas posibles:**
1. Usuario no tiene rol `superadmin`
2. Permiso `partes:importar` no está creado
3. Permiso no está asignado al rol

**Solución:**
```sql
-- Verificar rol del usuario
SELECT r.nombre 
FROM roles r 
JOIN usuarios_roles ur ON r.id = ur.rol_id 
WHERE ur.user_id = 'ID_DEL_USUARIO';

-- Verificar permiso
SELECT * FROM permisos WHERE codigo = 'partes:importar';

-- Verificar asignación
SELECT p.codigo, r.nombre 
FROM permisos p 
JOIN roles_permisos rp ON p.id = rp.permiso_id 
JOIN roles r ON rp.rol_id = r.id 
WHERE p.codigo = 'partes:importar';
```

### **Problema: Error de acceso denegado**
**Causa:** Usuario no tiene el permiso `partes:importar`

**Solución:**
1. Ejecutar el script SQL de creación de permisos
2. Verificar que el usuario tenga rol `superadmin`
3. Reiniciar la aplicación

## 📊 Logs de Depuración

El sistema incluye logs detallados para depuración:

```javascript
console.log('[DashboardPersonalizado] Roles del usuario:', {
  isAdmin: isAdminCallback(),
  isSupervisor: isSupervisorCallback(),
  isEmpleado: isEmpleadoCallback(),
  isProveedor: isProveedorCallback(),
  hasSuperAdmin: hasRole('superadmin')
});
```

## 🔄 Flujo Completo

```
1. Usuario SuperAdmin accede al Dashboard
   ↓
2. Sistema verifica rol 'superadmin'
   ↓
3. Muestra botón "Importar Partes"
   ↓
4. Usuario hace clic en el botón
   ↓
5. Sistema verifica permiso 'partes:importar'
   ↓
6. Redirige a /importar-partes-empleados
   ↓
7. Muestra módulo de importación
```

## 📝 Notas Importantes

- **Seguridad**: El acceso está doblemente protegido (rol + permiso)
- **Escalabilidad**: Fácil de extender a otros roles si es necesario
- **Mantenimiento**: El código está bien documentado y estructurado
- **Compatibilidad**: Funciona con el sistema de permisos existente

## 🆘 Soporte

Para problemas o dudas:
1. Verificar logs del navegador
2. Ejecutar scripts de verificación SQL
3. Contactar al administrador del sistema
