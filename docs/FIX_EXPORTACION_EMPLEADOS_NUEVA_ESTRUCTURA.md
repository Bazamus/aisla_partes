# 🔧 Fix - Exportación Empleados Nueva Estructura de Materiales

**Fecha:** 19 de Enero de 2025  
**Autor:** Equipo de Desarrollo AISLA PARTES  
**Versión:** 3.1.0 - ACTUALIZACIÓN EXPORTACIÓN

## 🚨 Problema Identificado

### **Función de Exportación Obsoleta:**
El botón "Exportar Empleados" del Dashboard estaba usando la estructura antigua de datos, consultando la tabla `partes_empleados_trabajos` con campos obsoletos como "Portal", "Vivienda", "Trabajos Realizados", etc.

### **Síntomas del Usuario:**
- ❌ **Exportación con campos antiguos:** Portal, Vivienda, Trabajos Realizados, Tiempo Empleado
- ❌ **Sin nuevos campos de materiales:** No incluía CODIGO, TIPO, ESPESOR, Diámetro, etc.
- ❌ **Inconsistencia total:** La exportación no coincidía con la nueva plantilla de importación
- ❌ **Datos desactualizados:** Consultaba tablas que ya no se usan en el nuevo sistema

### **Log de Consola Original:**
```javascript
Dashboard.jsx:1032 🔴 CLICK en Exportar Empleados
importExportService.js:306 // Consulta tabla antigua: partes_empleados_trabajos
// Campos obsoletos: portal, vivienda, descripcion, tiempo_empleado
```

## 🔍 Análisis del Problema

### **Arquitectura de Datos:**

#### **ANTES (Estructura Antigua):**
```javascript
// TABLA: partes_empleados_trabajos (OBSOLETA)
.from('partes_empleados_trabajos')
.select(`
  id,
  descripcion,           // ← Campo genérico
  tiempo_empleado,       // ← Sin materiales específicos
  observaciones,
  tipo_trabajo,
  portal,               // ← Campo obsoleto
  vivienda,             // ← Campo obsoleto
  created_at
`)

// CAMPOS EXPORTADOS (ANTIGUOS):
'Portal': trabajo.portal
'Vivienda': trabajo.vivienda  
'Trabajos Realizados': trabajo.descripcion
'Tiempo Empleado': trabajo.tiempo_empleado
```

#### **DESPUÉS (Nueva Estructura de Materiales):**
```javascript
// TABLA: partes_empleados_articulos (NUEVA)
.from('partes_empleados_articulos')
.select(`
  id,
  articulo_id,
  tipo_precio,           // ← aislamiento/aluminio
  cantidad,              // ← Ud/Ml
  precio_unitario,       // ← Precio por unidad
  subtotal,              // ← Precio total
  created_at,
  articulos_precios (    // ← Relación con catálogo
    codigo,              // ← CODIGO del material
    tipo,                // ← TIPO (CONO, TUBO, etc.)
    espesor,             // ← ESPESOR en mm
    diametro,            // ← Diámetro con pulgadas
    pulgada,
    unidad
  )
`)

// CAMPOS EXPORTADOS (NUEVOS):
'CODIGO': articuloPrecio?.codigo
'TIPO': articuloPrecio?.tipo
'ESPESOR': articuloPrecio?.espesor
'Diámetro': articuloPrecio?.diametro
'Ud/Ml': articulo.cantidad
'MATERIAL': articulo.tipo_precio === 'aislamiento' ? 'Aislamiento' : 'Aluminio'
'Precio unitario': articulo.precio_unitario
'Precio Total': articulo.subtotal
```

### **Root Cause:**
La función `exportarPartesEmpleados()` en `importExportService.js` nunca fue actualizada cuando se migró el sistema a la nueva estructura de materiales.

## ✅ Solución Implementada

### **🔄 1. ACTUALIZACIÓN DE CONSULTA DE DATOS**

#### **Antes (Líneas 306-319):**
```javascript
const { data: trabajos, error: trabajosError } = await supabase
  .from('partes_empleados_trabajos')  // ← Tabla obsoleta
  .select(`
    id,
    descripcion,
    tiempo_empleado,
    observaciones,
    tipo_trabajo,
    portal,                           // ← Campo obsoleto
    vivienda,                         // ← Campo obsoleto
    created_at
  `)
```

#### **Después (Líneas 306-326):**
```javascript
const { data: articulos, error: articulosError } = await supabase
  .from('partes_empleados_articulos')  // ← Nueva tabla de materiales
  .select(`
    id,
    articulo_id,
    tipo_precio,                      // ← aislamiento/aluminio
    cantidad,                         // ← Ud/Ml
    precio_unitario,                  // ← Precio por unidad
    subtotal,                         // ← Precio total calculado
    created_at,
    articulos_precios (               // ← Relación con catálogo
      codigo,                         // ← CODIGO del material
      tipo,                           // ← TIPO (CONO, TUBO, etc.)
      espesor,                        // ← ESPESOR en milímetros
      diametro,                       // ← Diámetro con formato
      pulgada,
      unidad
    )
  `)
```

### **🔄 2. TRANSFORMACIÓN DE ESTRUCTURA DE DATOS**

#### **Antes (Líneas 331-342):**
```javascript
excelData.push({
  'Fecha': parte.fecha ? new Date(parte.fecha).toLocaleDateString('es-ES') : '',
  'Nº de Parte': parte.numero_parte || '',
  'Estado del Parte': parte.estado || 'Borrador',
  'Trabajador': parte.nombre_trabajador || '',
  'Cliente': parte.cliente || '',
  'Obra': parte.nombre_obra || '',
  'Portal': trabajo.portal || '',              // ← Campo obsoleto
  'Vivienda': trabajo.vivienda || '',          // ← Campo obsoleto  
  'Trabajos Realizados': trabajo.descripcion || '', // ← Genérico
  'Tiempo Empleado': trabajo.tiempo_empleado || 0   // ← Sin materiales
});
```

#### **Después (Líneas 340-355):**
```javascript
const articuloPrecio = articulo.articulos_precios;

excelData.push({
  'Fecha': parte.fecha ? new Date(parte.fecha).toLocaleDateString('es-ES') : '',
  'Nº de Parte': parte.numero_parte || '',
  'Estado del Parte': parte.estado || 'Borrador',
  'Trabajador': parte.nombre_trabajador || '',
  'Cliente': parte.cliente || '',
  'Obra': parte.nombre_obra || '',
  'CODIGO': articuloPrecio?.codigo || 'N/A',                    // ← Material específico
  'TIPO': articuloPrecio?.tipo || 'N/A',                        // ← CONO, TUBO, etc.
  'ESPESOR': articuloPrecio?.espesor || 0,                      // ← Milímetros
  'Diámetro': articuloPrecio?.diametro || 'N/A',                // ← Con pulgadas
  'Ud/Ml': articulo.cantidad || 0,                              // ← Unidades/metros
  'MATERIAL': articulo.tipo_precio === 'aislamiento' ? 'Aislamiento' : 'Aluminio', // ← Tipo de material
  'Precio unitario': articulo.precio_unitario || 0,            // ← Precio por unidad
  'Precio Total': articulo.subtotal || 0                       // ← Total calculado
});
```

### **🔄 3. CONFIGURACIÓN DE COLUMNAS ACTUALIZADA**

#### **Antes (Líneas 379-392):**
```javascript
const columnsWidth = [
  { wch: 12 },  // Fecha
  { wch: 15 },  // Nº de Parte
  { wch: 15 },  // Estado del Parte
  { wch: 25 },  // Trabajador
  { wch: 30 },  // Cliente
  { wch: 40 },  // Obra
  { wch: 15 },  // Portal          ← Campo obsoleto
  { wch: 15 },  // Vivienda        ← Campo obsoleto
  { wch: 50 },  // Trabajos Realizados ← Genérico
  { wch: 15 },  // Tiempo Empleado ← Sin materiales
];
```

#### **Después (Líneas 396-412):**
```javascript
const columnsWidth = [
  { wch: 12 },  // Fecha
  { wch: 15 },  // Nº de Parte
  { wch: 15 },  // Estado del Parte
  { wch: 25 },  // Trabajador
  { wch: 20 },  // Cliente
  { wch: 40 },  // Obra
  { wch: 15 },  // CODIGO          ← Material específico
  { wch: 12 },  // TIPO            ← CONO, TUBO, etc.
  { wch: 10 },  // ESPESOR         ← Milímetros
  { wch: 15 },  // Diámetro        ← Con pulgadas
  { wch: 8 },   // Ud/Ml           ← Unidades/metros
  { wch: 12 },  // MATERIAL        ← Aislamiento/Aluminio
  { wch: 12 },  // Precio unitario ← Precio por unidad
  { wch: 12 },  // Precio Total    ← Total calculado
];
```

### **🔄 4. FORMATEO NUMÉRICO ACTUALIZADO**

#### **Antes (Líneas 415-421):**
```javascript
const formatNumberCell = (cell, col) => {
  // Columna de tiempo empleado
  if (col === 9) { 
    cell.t = 'n';
    cell.z = '#,##0.00'; // Formato de horas
  }
};
```

#### **Después (Líneas 415-437):**
```javascript
const formatNumberCell = (cell, col) => {
  // Columna ESPESOR (columna 8)
  if (col === 8) { 
    cell.t = 'n';
    cell.z = '0'; // Número entero
  }
  // Columna Ud/Ml (columna 10)
  else if (col === 10) { 
    cell.t = 'n';
    cell.z = '0'; // Número entero
  }
  // Columna Precio unitario (columna 12)
  else if (col === 12) { 
    cell.t = 'n';
    cell.z = '0.00€'; // Formato de moneda
  }
  // Columna Precio Total (columna 13)
  else if (col === 13) { 
    cell.t = 'n';
    cell.z = '0.00€'; // Formato de moneda
  }
};
```

### **🔄 5. DOCUMENTACIÓN ACTUALIZADA**

#### **Comentario de Función:**
```javascript
/**
 * Exporta partes de empleados a un archivo Excel con la nueva estructura de materiales
 * Cada material individual se exporta en una fila separada con su información completa
 * @param {Array} partesEmpleados - Lista de partes de empleados a exportar
 */
```

#### **Mensaje de Resultado:**
```javascript
// ANTES:
return { success: true, message: `Se ha generado el archivo Excel con ${excelData.length} trabajos de empleados` };

// DESPUÉS:
return { success: true, message: `Se ha generado el archivo Excel con ${excelData.length} materiales de empleados` };
```

## 🎯 Resultado Final

### **ANTES (Problemático):**
```
Dashboard → Botón "Exportar Empleados" → partes_empleados_2025-01-19.xlsx
❌ Campos: Fecha, Nº Parte, Estado, Trabajador, Cliente, Obra, Portal, Vivienda, Trabajos Realizados, Tiempo Empleado
❌ Datos: Información genérica de trabajos sin detalles de materiales
❌ Origen: Tabla obsoleta partes_empleados_trabajos
```

### **DESPUÉS (Corregido):**
```
Dashboard → Botón "Exportar Empleados" → partes_empleados_2025-01-19.xlsx
✅ Campos: Fecha, Nº Parte, Estado, Trabajador, Cliente, Obra, CODIGO, TIPO, ESPESOR, Diámetro, Ud/Ml, MATERIAL, Precio unitario, Precio Total
✅ Datos: Información específica de cada material con precios y cantidades
✅ Origen: Nueva tabla partes_empleados_articulos + relación articulos_precios
```

## 📊 Comparación de Estructuras

| **Aspecto** | **ANTES (Obsoleto)** | **DESPUÉS (Actualizado)** |
|-------------|---------------------|---------------------------|
| **Tabla Principal** | `partes_empleados_trabajos` | `partes_empleados_articulos` |
| **Enfoque** | Trabajos genéricos | Materiales específicos |
| **Campos Clave** | Portal, Vivienda, Descripción | CODIGO, TIPO, ESPESOR, Diámetro |
| **Precios** | ❌ No incluidos | ✅ Precio unitario + Total |
| **Material** | ❌ No especificado | ✅ Aislamiento/Aluminio |
| **Granularidad** | Trabajo completo | Material individual |
| **Relaciones** | Sin catálogo | Conectado a `articulos_precios` |
| **Compatibilidad** | ❌ Con plantilla antigua | ✅ Con nueva plantilla de importación |

## 🔧 Archivos Modificados

- **✅ `src/services/importExportService.js`**
  - Función `exportarPartesEmpleados()` completamente reescrita
  - Consulta actualizada: `partes_empleados_articulos` + `articulos_precios`
  - Estructura de datos: 14 campos de materiales específicos
  - Formateo numérico: ESPESOR, Ud/Ml, precios con formato de moneda
  - Configuración de columnas: Anchos optimizados para nuevos campos
  - Comentarios y mensajes: Actualizados para reflejar materiales

## 🎉 Estado Final

**🚀 EXPORTACIÓN COMPLETAMENTE SINCRONIZADA**

Ahora la exportación de empleados:
- **✅ Estructura actual:** Usa las nuevas tablas de materiales
- **✅ Campos específicos:** CODIGO, TIPO, ESPESOR, Diámetro, precios
- **✅ Compatibilidad total:** Excel exportado coincide con plantilla de importación
- **✅ Una fila por material:** Granularidad máxima para seguimiento detallado
- **✅ Precios incluidos:** Precio unitario y total calculado
- **✅ Tipos de material:** Diferenciación entre Aislamiento y Aluminio
- **✅ Formato profesional:** Columnas formateadas con moneda y números

### **Beneficios del Fix:**
- **📊 Consistencia total:** Exportación e importación usan la misma estructura
- **🔄 Migración completa:** Ya no hay referencias a la estructura antigua
- **📈 Información completa:** Cada material exportado con todos sus detalles
- **💰 Gestión de costes:** Precios unitarios y totales incluidos
- **🎯 Trazabilidad:** Un registro por material permite seguimiento preciso

**El botón "Exportar Empleados" del Dashboard ahora genera archivos Excel con la estructura actualizada de materiales, completamente compatible con la nueva plantilla de importación.** 🎯

---

**© 2025 AISLA PARTES** - Exportación modernizada exitosamente
