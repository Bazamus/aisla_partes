# 📋 Plan de Trabajo: Adaptación de Lógica de Trabajos de Proveedor a Empleado

## 🎯 Objetivo Principal
Adaptar el sistema actual de partes de empleado para incluir la lógica de selección y creación de trabajos de proveedores, manteniendo las funcionalidades existentes.

## 📊 Análisis de Diferencias Clave

| Aspecto | Partes Proveedor | Partes Empleado (Nuevo) |
|---------|------------------|-------------------------|
| **Campos adicionales** | - | Portal + Vivienda (obligatorios) |
| **Métrica principal** | Cantidad × Precio | Cantidad + Horas |
| **Confirmación** | Por línea individual | Por grupo de líneas |
| **Agrupación** | Por trabajo | Por Portal/Vivienda |
| **Trabajos libres** | Precios personalizados | Trabajos sin portal/vivienda |
| **Estado inicial** | Configurable | Borrador (fijo) |
| **Obras** | Todas disponibles | Solo asignadas al empleado |

---

## 🏗️ PLAN DE DESARROLLO - 5 FASES

### FASE 1: Análisis y Preparación (2-3h)
- [ ] Auditoría del sistema actual
- [ ] Análisis de componentes de proveedor
- [ ] Verificación de base de datos

### FASE 2: Modificaciones de Base de Datos (2-3h)
- [ ] Extensión de tabla `partes_empleados_trabajos`
- [ ] Actualización de funciones RPC
- [ ] Nuevas funciones específicas

### FASE 3: Desarrollo de Componentes Frontend (8-10h)
- [ ] Nuevo componente principal: `TrabajosCardEmpleadoV2.jsx`
- [ ] Componentes de apoyo
- [ ] Adaptación de componentes existentes

### FASE 4: Integración y Flujo de Datos (4-5h)
- [ ] Actualización de servicios
- [ ] Gestión de estados
- [ ] Integración con páginas principales

### FASE 5: Validaciones y Optimizaciones (3-4h)
- [ ] Validaciones de negocio
- [ ] Optimizaciones de UX
- [ ] Pruebas y refinamiento

---

## 🔧 Consideraciones Técnicas

### Reutilización vs. Reescritura
- **Reutilizar**: Funciones RPC base, servicios, componentes de búsqueda
- **Adaptar**: Lógica de confirmación, agrupación, validaciones
- **Reescribir**: Componente principal, flujo de estados

### Puntos Críticos de Validación
1. Obras asignadas al empleado
2. Estados editables (solo Borrador)
3. Firma obligatoria
4. Agrupación por portal/vivienda

---

## 📋 Entregables por Fase
1. **Fase 1**: Documento de análisis
2. **Fase 2**: Scripts SQL y RPC
3. **Fase 3**: Componentes React
4. **Fase 4**: Integración completa
5. **Fase 5**: Sistema validado

## ⏱️ Estimación Total: 19-25 horas

---

## 📅 Fecha de Creación: 17/07/2025
## 📝 Última Actualización: 17/07/2025

> **Nota**: Este documento servirá como guía de referencia para el desarrollo continuo del módulo de partes de empleado.
