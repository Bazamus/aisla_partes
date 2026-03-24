# Plan de Desarrollo ACTUALIZADO: Sistema Avanzado de Trabajos para Empleados

## 📋 Respuestas Aprobadas - Cambios Críticos al Plan

### ✅ **Decisiones Confirmadas:**
1. **🔥 ELIMINAR campos actuales completamente** - Migración disruptiva
2. **🔍 Sistema completo**: Grupos/subgrupos + búsqueda libre 
3. **⏱️ Tiempo por línea**: Campo tiempo_empleado en cada trabajo individual
4. **➕ Trabajos extra**: Con tiempo empleado manual
5. **📱 Migración inmediata**: Reemplazar sistema existente
6. **📱 Responsividad avanzada**: Nivel igual a proveedores

## 🚨 Impacto de los Cambios

### **CAMBIOS CRÍTICOS:**
- ❌ **Eliminar**: `num_velas`, `num_puntos_pvc`, `num_montaje_aparatos`
- ❌ **Eliminar**: `tiempo_empleado` global
- ✅ **Añadir**: `tiempo_empleado` por línea de trabajo
- ✅ **Añadir**: Sistema completo grupos/subgrupos
- ✅ **Añadir**: Trabajos extra manuales con tiempo

## 🎯 Análisis de la Situación Actual

### **Sistema Actual de Empleados:**
- **Componente**: `TrabajosDetalleCardEmpleado.jsx` (59 líneas - muy simple)
- **Campos fijos**: `tiempo_empleado`, `num_velas`, `num_puntos_pvc`, `num_montaje_aparatos`, `otros_trabajos`
- **Limitaciones**: Solo modo lectura, sin selección de trabajos, sin flexibilidad

### **Sistema de Proveedores (a adaptar):**
- **Componente**: `TrabajosCard.jsx` (1347 líneas - muy complejo)
- **Funcionalidades**: Búsqueda de trabajos, grupos/subgrupos, gestión de líneas, precios personalizados, responsive design

## 🏗️ PLAN DE DESARROLLO DETALLADO

### **FASE 1: Análisis y Preparación (1-2 horas)**

#### 1.1 **Análisis de Dependencias**
```javascript
// Revisar servicios existentes
- src/services/parteEmpleadoService.js
- src/services/gruposService.js
- src/services/trabajosService.js

// Verificar estructura de base de datos
- tabla: partes (empleados)
- tabla: trabajos
- tabla: grupos_subgrupos
```

#### 1.2 **Identificar Componentes a Crear/Modificar**
- ✅ `TrabajosCardEmpleado.jsx` (nuevo - basado en TrabajosCard.jsx)
- ✅ `TrabajosListEmpleado.jsx` (nuevo - adaptado para empleados)
- ⚠️ `TrabajosDetalleCardEmpleado.jsx` (ELIMINAR y reemplazar)
- 🔄 `NuevoParte.jsx` (modificar integración)
- 🔄 `EditarParte.jsx` (modificar integración)

### **FASE 2: Migración de Esquema de Datos (2-3 horas)**

#### 2.1 **Cambios en Base de Datos**
```sql
-- ELIMINAR campos obsoletos (si existen)
ALTER TABLE partes 
DROP COLUMN IF EXISTS num_velas,
DROP COLUMN IF EXISTS num_puntos_pvc,
DROP COLUMN IF EXISTS num_montaje_aparatos,
DROP COLUMN IF EXISTS tiempo_empleado;

-- ASEGURAR estructura para trabajos empleados
-- (verificar si ya existe tabla de relación partes-trabajos)
```

#### 2.2 **Estructura Nueva de Datos**
```javascript
// Estructura de línea de trabajo para empleado
{
  id: uuid,
  parte_id: uuid,
  trabajo_id: uuid, // De tabla trabajos
  grupo_id: uuid,
  subgrupo_id: uuid,
  descripcion: string,
  tiempo_empleado: number, // NUEVO CAMPO CRÍTICO
  observaciones: string,
  created_at: timestamp
}

// Trabajos extra manuales
{
  id: uuid,
  parte_id: uuid,
  descripcion_trabajo: string, // Texto libre
  tiempo_empleado: number,
  tipo: 'manual',
  created_at: timestamp
}
```

### **FASE 3: Desarrollo de Componentes (8-10 horas)**

#### 3.1 **TrabajosCardEmpleado.jsx** - Componente Principal
```javascript
// Funcionalidades a implementar:
1. 📱 RESPONSIVE AVANZADO (igual que proveedores)
2. 🔍 Sistema de búsqueda por grupos/subgrupos
3. 🔍 Búsqueda libre simplificada
4. ⏱️ Campo tiempo_empleado por línea
5. ➕ Gestión de trabajos extra manuales
6. 📊 Resumen automático de tiempo total
7. 💾 Guardado automático/manual
```

**Características específicas para empleados:**
- Sin precios (eliminamos toda lógica de cálculo de costos)
- Focus en tiempo empleado como métrica principal
- Interface más simple que proveedores pero manteniendo funcionalidad
- Validaciones específicas para tiempo (no negativo, formato correcto)

#### 3.2 **Adaptación de Servicios**
```javascript
// parteEmpleadoService.js - Nuevas funciones
- agregarTrabajoLinea(parteId, trabajoData)
- actualizarTiempoTrabajo(lineaId, tiempo)
- eliminarTrabajoLinea(lineaId)
- agregarTrabajoManual(parteId, descripcion, tiempo)
- obtenerResumenTiempos(parteId)
```

#### 3.3 **Responsive Design Avanzado**
```css
// Igual que en proveedores, enfoque mobile-first
- Cards apilables en móvil
- Búsqueda optimizada touch
- Campos de tiempo fácil input en móvil
- Gestos swipe para eliminar líneas
- Modal full-screen en móvil para selección trabajos
```

### **FASE 4: Integración y Testing (3-4 horas)**

#### 4.1 **Integración con Páginas Existentes**
- 🔄 **NuevoParte.jsx**: Reemplazar componente obsoleto
- 🔄 **EditarParte.jsx**: Actualizar para nuevo sistema
- 🔄 **DashboardEmpleado.jsx**: Verificar navegación

#### 4.2 **Testing Crítico**
```javascript
// Tests prioritarios:
1. ✅ Creación de parte con trabajos + tiempo
2. ✅ Edición de tiempos individuales
3. ✅ Trabajos extra manuales
4. ✅ Responsive en dispositivos móviles
5. ✅ Búsqueda y filtrado de trabajos
6. ✅ Guardado y recuperación de datos
```

### **FASE 5: Migración de Datos Existentes (1-2 horas)**

#### 5.1 **Script de Migración**
```sql
-- Migrar datos existentes si hay partes en producción
-- Convertir campos antiguos a nueva estructura
-- Preservar información crítica
```

#### 5.2 **Backup y Rollback Plan**
- Backup completo antes de migración
- Script de rollback preparado
- Plan de contingencia definido

## 📱 Especificaciones Técnicas Detalladas

### **Campos de Interface**

#### Selector de Trabajos:
- **Grupos/Subgrupos**: Dropdown jerárquico
- **Búsqueda libre**: Input con autocomplete
- **Lista trabajos**: Cards con descripción + botón añadir

#### Línea de Trabajo Individual:
- **Descripción**: Texto del trabajo (readonly)
- **Tiempo Empleado**: Input numérico (horas/minutos)
- **Observaciones**: Textarea opcional
- **Acciones**: Editar tiempo, eliminar línea

#### Trabajos Extra Manuales:
- **Descripción**: Input texto libre
- **Tiempo Empleado**: Input numérico
- **Tipo**: Indicador "Manual"

#### Resumen:
- **Tiempo Total**: Suma automática todos los trabajos
- **Número Líneas**: Contador de trabajos
- **Trabajos Manuales**: Contador separado

### **Validaciones Críticas**
```javascript
// Validaciones tiempo:
- tiempo > 0
- formato válido (decimal permitido)
- límite máximo por línea (ej: 24 horas)
- tiempo total razonable (validación soft)

// Validaciones trabajos:
- descripción no vacía para manuales
- trabajo seleccionado válido
- no duplicados en mismo parte
```

## ⚡ Timeline Estimado

| Fase | Duración | Descripción |
|------|----------|-------------|
| **1** | 1-2h | Análisis y preparación |
| **2** | 2-3h | Migración esquema datos |
| **3** | 8-10h | Desarrollo componentes |
| **4** | 3-4h | Integración y testing |
| **5** | 1-2h | Migración datos |
| **TOTAL** | **15-21h** | **Proyecto completo** |

## 🎯 Criterios de Éxito

### **Funcionalidad:**
- ✅ Empleado puede buscar y seleccionar trabajos por grupos
- ✅ Empleado puede añadir tiempo empleado por línea
- ✅ Empleado puede crear trabajos extra manuales
- ✅ Sistema calcula tiempo total automáticamente
- ✅ Interface responsive funciona perfecto en móvil

### **Performance:**
- ✅ Carga rápida en dispositivos móviles
- ✅ Búsqueda instantánea de trabajos
- ✅ Guardado automático sin lag

### **Usabilidad:**
- ✅ Interface intuitiva para empleados
- ✅ Fácil input de tiempo en móvil
- ✅ Navegación fluida entre trabajos

## 🚨 Riesgos y Mitigación

### **Riesgo Alto:**
- **Pérdida datos existentes**: → Backup completo + testing exhaustivo
- **Interface compleja en móvil**: → Prototipo mobile-first + testing real

### **Riesgo Medio:**
- **Performance en listas grandes**: → Paginación + lazy loading
- **Validaciones tiempo**: → Testing edge cases + UX feedback

### **Riesgo Bajo:**
- **Integración con dashboard**: → Testing de navegación
- **Responsive breakpoints**: → Testing multi-dispositivo

## 📋 Checklist de Aprobación Final

Antes de ejecutar la migración, verificar:

- [ ] Plan técnico revisado y aprobado
- [ ] Timeline confirmado
- [ ] Backup de datos realizado
- [ ] Entorno de testing preparado
- [ ] Script de rollback listo
- [ ] Equipo informado del cambio
- [ ] Dispositivos móviles de prueba disponibles

---

**Fecha de creación**: 2025-01-04  
**Estado**: APROBADO - Listo para ejecución  
**Prioridad**: ALTA - Migración inmediata  
**Responsable**: Equipo de desarrollo 