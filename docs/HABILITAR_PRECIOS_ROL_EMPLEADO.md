# Habilitar visualización de precios para rol Empleado

**Fecha**: 11 de marzo de 2026  
**Tipo**: Feature  
**Archivos modificados**: 3

---

## Contexto

Los usuarios con rol **empleado** no podían ver los precios de los trabajos y materiales en sus partes de trabajo, ni el importe total en las tarjetas del dashboard. Esta restricción se había implementado intencionalmente en un commit anterior (`da4f63e feat: Ocultar precios de materiales para rol empleado`).

Se ha decidido revertir esta restricción y además añadir el importe total de cada parte directamente visible en las tarjetas del dashboard del empleado, para que pueda consultar de un vistazo el dinero generado por cada parte sin necesidad de entrar en el detalle.

---

## Cambios realizados

### 1. `src/components/partes-empleados/TrabajosDetalleCardEmpleado.jsx`

**Qué se cambió**: Eliminación de la lógica de ocultación de precios para el rol empleado.

- Eliminada la variable `isEmpleado` que evaluaba si el usuario tenía exclusivamente el rol de empleado.
- Eliminado el import de `useAuth` (quedó sin uso tras eliminar la variable).
- Eliminados los 3 bloques condicionales `{!isEmpleado && (...)}` que ocultaban:
  - Precio unitario y subtotal de cada **material** en la sección "Materiales Utilizados"
  - Precio unitario y subtotal de cada entrada en la sección **"Otros Trabajos"**
  - El bloque de **resumen total** al pie de la sección de trabajos

**Resultado**: Todos los roles, incluido el empleado, ven ahora precio unitario, subtotal por línea y total general en el detalle de sus partes.

**Impacto en BD**: Ninguno. Los precios se cargaban ya en todos los casos desde las tablas `partes_empleados_articulos` y `partes_empleados_otros_trabajos`. El cambio es exclusivamente de renderizado.

---

### 2. `src/services/parteEmpleadoService.js`

**Qué se cambió**: Inclusión del campo `coste_trabajos` en la consulta que carga los partes del dashboard del empleado.

La función `getPartesByEmpleadoUserId` realizaba dos consultas SELECT que no incluían el campo `coste_trabajos` de la tabla `partes`. Se ha añadido dicho campo en ambas rutas de consulta:

- Ruta de fallback (búsqueda solo por `user_id`, línea ~166)
- Ruta principal (búsqueda por `user_id`, `codigo_empleado` y `nombre_trabajador`, línea ~192)

**Resultado**: El campo `coste_trabajos` llega ahora al componente del dashboard sin necesidad de consultas adicionales a la base de datos.

---

### 3. `src/components/dashboard/DashboardEmpleado.jsx`

**Qué se cambió**: Añadido un indicador visual del importe total en cada tarjeta de parte.

Se ha insertado un nuevo bloque entre la sección de datos del parte (obra y trabajador) y los botones de acción:

```jsx
{parte.coste_trabajos > 0 && (
  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
    <span className="text-sm text-gray-500">Importe total</span>
    <span className="text-base font-bold text-green-600">
      €{Number(parte.coste_trabajos).toFixed(2)}
    </span>
  </div>
)}
```

**Diseño**:
- Línea separadora fina para delimitar visualmente el importe
- Etiqueta "Importe total" en gris a la izquierda
- Valor en verde negrita a la derecha (`€XXX.XX`)
- Condicional: solo se muestra si `coste_trabajos > 0`, por lo que partes sin precio registrado (datos históricos) no muestran el bloque

**Mobile-first**: El diseño `flex justify-between` se adapta correctamente a cualquier ancho de pantalla, siendo especialmente efectivo en dispositivos móviles donde el empleado consulta habitualmente sus partes.

---

## Estructura de la tarjeta tras el cambio

```
┌──────────────────────────────────────────┐
│ Parte #E0406/26             [Borrador]   │
│ 📅 Ayer                                  │
│ 🏢 ALZA 124 VIV PARLA                   │
│ 👤 Sixto Orlando Orejuela Rivera        │
│ ─────────────────────────────────────── │
│ Importe total                  €101.32  │  ← NUEVO
│ ─────────────────────────────────────── │
│ [PDF]      [Eliminar]      [Ver Parte]  │
└──────────────────────────────────────────┘
```

---

## Análisis de impacto

| Aspecto | Valoración |
|---------|-----------|
| Riesgo de regresión | Mínimo |
| Afecta a otros roles | No |
| Cambios en BD | Ninguno |
| Cambios en rutas | Ninguno |
| Cambios en contextos | Ninguno |
| Partes históricos sin precio | No se ven afectados (condicional `> 0`) |

---

## Verificación recomendada en producción

1. Acceder con un usuario con rol **empleado**
2. Verificar que las tarjetas del dashboard muestran el importe total en verde
3. Entrar en el detalle de un parte → sección "Trabajos Realizados"
4. Confirmar que se muestran precio unitario, subtotal por línea y total general
5. Verificar que la vista móvil muestra el importe correctamente en las tarjetas
