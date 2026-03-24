# Fix: Bucle Infinito en Modal de Asignación de Empleados a Obras

**Fecha:** 22 de diciembre de 2025
**Problema:** Bucle infinito al intentar asignar empleados a una obra recién creada
**Componente afectado:** `ModalSeleccionEmpleados.jsx`

---

## 🐛 Descripción del Problema

Cuando un usuario creaba una nueva obra y se abría el modal para asignar empleados, se producía un **bucle infinito** que impedía cargar los empleados y asignarlos a la obra.

### Síntomas:
- El modal se quedaba en estado "Cargando empleados..."
- Se generaban cientos de peticiones HTTP a la API de Supabase
- Error en consola: `Maximum update depth exceeded`
- Múltiples notificaciones toast: "Error al cargar empleados"

### Logs de Consola:
```
Warning: Maximum update depth exceeded. This can happen when a component calls
setState inside useEffect, but useEffect either doesn't have a dependency array,
or one of the dependencies changes on every render.
at ModalSeleccionEmpleados (ModalSeleccionEmpleados.jsx:25:3)
```

---

## 🔍 Causa Raíz

El problema se encontraba en el `useEffect` del componente `ModalSeleccionEmpleados.jsx` (línea 38-43):

```javascript
// ❌ CÓDIGO PROBLEMÁTICO
useEffect(() => {
  if (isOpen) {
    cargarEmpleados()
    setEmpleadosSeleccionados(empleadosPreseleccionados || [])
  }
}, [isOpen, empleadosPreseleccionados])  // ← empleadosPreseleccionados causaba el bucle
```

### ¿Por qué causaba un bucle?

1. El `useEffect` tenía `empleadosPreseleccionados` como dependencia
2. Si el componente padre pasaba un **nuevo array** en cada render (aunque fuera vacío `[]`), React lo consideraba un cambio
3. Esto disparaba el `useEffect` → ejecutaba `cargarEmpleados()` → actualizaba estado → causaba re-render → disparaba `useEffect` de nuevo → **bucle infinito** ♾️

---

## ✅ Solución Implementada

Se implementó un **flag de inicialización** (`initialized`) que garantiza que el modal solo cargue empleados **una vez por apertura**:

```javascript
// ✅ CÓDIGO CORREGIDO
const [initialized, setInitialized] = useState(false)

useEffect(() => {
  if (isOpen && !initialized) {
    cargarEmpleados()
    setEmpleadosSeleccionados(empleadosPreseleccionados || [])
    setInitialized(true)
  }

  // Reset cuando se cierra el modal
  if (!isOpen && initialized) {
    setInitialized(false)
  }
}, [isOpen])  // Solo depende de isOpen
```

### Cambios realizados:

1. **Añadido estado `initialized`**: Controla si el modal ya se inicializó en esta apertura
2. **Condición de carga**: Solo se ejecuta si `isOpen && !initialized`
3. **Reset al cerrar**: Cuando el modal se cierra (`!isOpen && initialized`), se resetea el flag
4. **Eliminada dependencia problemática**: Ya no depende de `empleadosPreseleccionados`
5. **Actualizado `handleClose`**: Resetea el flag `initialized` al cerrar manualmente

```javascript
// ✅ handleClose actualizado
const handleClose = () => {
  setBusqueda('')
  setEmpleadosSeleccionados([])
  setInitialized(false)  // ← Añadido
  onClose()
}
```

---

## 📁 Archivos Modificados

### 1. `src/components/obras/ModalSeleccionEmpleados.jsx`

**Cambios:**
- **Línea 36**: Añadido estado `initialized`
- **Líneas 38-50**: Refactorizado `useEffect` con lógica de inicialización
- **Línea 113**: Actualizado `handleClose` para resetear `initialized`

---

## 🧪 Pruebas Realizadas

### Escenario 1: Crear nueva obra
- ✅ Modal se abre correctamente
- ✅ Carga empleados una sola vez
- ✅ No genera bucle infinito
- ✅ Permite seleccionar empleados
- ✅ Asigna empleados correctamente

### Escenario 2: Editar asignación de empleados en obra existente
- ✅ Modal se abre con empleados preseleccionados
- ✅ Carga correctamente
- ✅ No genera bucle infinito
- ✅ Permite modificar selección

### Escenario 3: Cancelar asignación
- ✅ Modal se cierra correctamente
- ✅ Estado se resetea
- ✅ Siguiente apertura funciona normalmente

---

## 🎯 Resultado

- ✅ **Bucle infinito eliminado completamente**
- ✅ **Modal carga empleados correctamente**
- ✅ **Asignación de empleados funcional**
- ✅ **Performance mejorada** (solo 1 petición HTTP en lugar de cientos)
- ✅ **Experiencia de usuario fluida**

---

## 📝 Notas Técnicas

### Patrón implementado: Initialization Flag

Este patrón es útil cuando necesitas:
- Ejecutar lógica **solo una vez** al abrir un modal/componente
- Evitar que dependencias externas (arrays, objetos) causen re-renders
- Controlar el ciclo de vida de componentes que se montan/desmontan frecuentemente

### Alternativas consideradas:

1. **`useRef` para primera carga**: Podría funcionar pero no resetea al cerrar
2. **`useMemo` en componente padre**: Requeriría cambios en todos los lugares donde se usa el modal
3. **`useCallback` para handlers**: No resuelve el problema de la dependencia del array

---

## 🔗 Referencias

- [React Docs: useEffect](https://react.dev/reference/react/useEffect)
- [React Docs: Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)
- Commit relacionado: [Solucion Bug Partes Empleados](../../)

---

**Autor:** Claude Code
**Estado:** ✅ Completado y probado
**Próximos pasos:** Monitorear en producción para confirmar estabilidad
