# 🔧 Fix - Generación PDF Empleados Nueva Estructura de Materiales

**Fecha:** 19 de Enero de 2025  
**Autor:** Equipo de Desarrollo AISLA PARTES  
**Versión:** 3.1.1 - ACTUALIZACIÓN PDF

## 🚨 Problema Identificado

### **Función PDF con RPC Obsoleta:**
La generación de PDF para partes de empleados estaba utilizando una función RPC `obtener_trabajos_parte_empleado` que **no existe** en la base de datos, y mostraba información con la estructura antigua (Portal, Vivienda, Descripción del Trabajo, Tiempo).

### **Error Log del Usuario:**
```javascript
Dashboard.jsx:832 Generando PDF para parte: {id: '297bb4c3-31c7-451b-9a52-a79060b2e863'}
exportService.js:468 Obteniendo trabajos para parte ID: 297bb4c3-31c7-451b-9a52-a79060b2e863
parteEmpleadoService.js:14 Error in RPC/obtener_trabajos_parte_empleado: 
Could not find the function public.obtener_trabajos_parte_empleado(p_parte_id) in the schema cache
exportService.js:486 Error al obtener trabajos del parte: {code: 'PGRST202'}
exportService.js:761 PDF generado correctamente para empleado: 297bb4c3-31c7-451b-9a52-a79060b2e863
```

### **Síntomas:**
- ❌ **RPC Error 404:** `obtener_trabajos_parte_empleado` no encontrada
- ❌ **PDF con estructura antigua:** Portal/Vivienda, Descripción del Trabajo, Tiempo (h), Observaciones
- ❌ **Sin datos de materiales:** No mostraba códigos, tipos, espesores, precios
- ❌ **Información irrelevante:** Tiempo empleado en lugar de costes de materiales

## 🔍 Análisis del Problema

### **Arquitectura Obsoleta:**

#### **ANTES (Función RPC Inexistente):**
```javascript
// parteEmpleadoService.js - LÍNEA 261
export const getTrabajosParteEmpleado = (parteId) => {
  return callRpc('obtener_trabajos_parte_empleado', { p_parte_id: parteId });
  //             ↑ FUNCIÓN QUE NO EXISTE EN BASE DE DATOS
};

// exportService.js - LÍNEAS 467-489
const trabajosData = await getTrabajosParteEmpleado(parte.id);
// ↑ Llamada a función inexistente → Error 404
```

#### **PDF con Estructura Antigua:**
```javascript
// TABLA PDF ANTERIOR (Líneas 496-502):
head: [['Portal/Vivienda', 'Descripción del Trabajo', 'Tiempo (h)', 'Observaciones']]
body: trabajos.map(trabajo => [
  trabajo.portal && trabajo.vivienda ? `${trabajo.portal} - ${trabajo.vivienda}` : 'N/A',
  trabajo.descripcion || 'Sin descripción',
  trabajo.tiempo_empleado ? `${trabajo.tiempo_empleado}h` : '0h',
  trabajo.observaciones || '-'
])
```

### **Nueva Arquitectura de Materiales:**

#### **DESPUÉS (Consulta Directa a Tablas):**
```javascript
// CONSULTA DIRECTA (Líneas 474-494):
const { data: articulos, error: articulosError } = await supabase
  .from('partes_empleados_articulos')    // ← Nueva tabla de materiales
  .select(`
    id,
    articulo_id,
    tipo_precio,                         // ← aislamiento/aluminio
    cantidad,                            // ← Ud/Ml
    precio_unitario,                     // ← Precio por unidad
    subtotal,                            // ← Precio total
    created_at,
    articulos_precios (                  // ← Relación con catálogo
      codigo,                            // ← CODIGO del material
      tipo,                              // ← TIPO (CONO, TUBO, etc.)
      espesor,                           // ← ESPESOR en mm
      diametro,                          // ← Diámetro con pulgadas
      pulgada,
      unidad
    )
  `)
```

#### **PDF con Nueva Estructura:**
```javascript
// TABLA PDF ACTUALIZADA (Líneas 530-553):
head: [['CÓDIGO', 'TIPO', 'ESPESOR', 'DIÁMETRO', 'Ud/Ml', 'MATERIAL', 'P.UNIT.', 'TOTAL']]
body: trabajos.map(material => [
  material.codigo || 'N/A',                                    // ← Material específico
  material.tipo || 'N/A',                                      // ← CONO, TUBO, etc.
  material.espesor ? `${material.espesor}mm` : 'N/A',         // ← Milímetros
  material.diametro || 'N/A',                                 // ← Con pulgadas
  material.cantidad || 0,                                     // ← Unidades/metros
  material.material || 'N/A',                                 // ← Aislamiento/Aluminio
  material.precio_unitario ? `${material.precio_unitario.toFixed(2)}€` : '0.00€', // ← Precio unitario
  material.precio_total ? `${material.precio_total.toFixed(2)}€` : '0.00€'        // ← Total calculado
])
```

## ✅ Solución Implementada

### **🔄 1. ELIMINACIÓN DE FUNCIÓN RPC OBSOLETA**

#### **Antes (Líneas 467-490):**
```javascript
try {
  console.log('Obteniendo trabajos para parte ID:', parte.id);
  const trabajosData = await getTrabajosParteEmpleado(parte.id);  // ← RPC INEXISTENTE
  
  if (trabajosData && trabajosData.success && trabajosData.trabajos) {
    trabajos = trabajosData.trabajos;                           // ← Estructura antigua
    tiempoTotal = trabajosData.tiempo_total || 0;
  }
} catch (error) {
  console.error('Error al obtener trabajos del parte:', error); // ← Error 404
}
```

#### **Después (Líneas 467-524):**
```javascript
try {
  console.log('Obteniendo materiales para parte ID:', parte.id);
  
  const { supabase } = await import('../lib/supabase');         // ← Import dinámico
  
  const { data: articulos, error: articulosError } = await supabase
    .from('partes_empleados_articulos')                         // ← Nueva tabla
    .select(`...campos_materiales...`)                          // ← Campos específicos
    .eq('parte_id', parte.id);
    
  trabajos = (articulos || []).map(articulo => ({              // ← Transformación
    codigo: articuloPrecio?.codigo || 'N/A',
    tipo: articuloPrecio?.tipo || 'N/A',
    // ... resto de campos de materiales
  }));
} catch (error) {
  console.error('Error al obtener materiales del parte:', error); // ← Sin errores RPC
}
```

### **🔄 2. ACTUALIZACIÓN COMPLETA DE TABLA PDF**

#### **Cabeceras Actualizadas:**
```javascript
// ANTES: 4 columnas obsoletas
head: [['Portal/Vivienda', 'Descripción del Trabajo', 'Tiempo (h)', 'Observaciones']]

// DESPUÉS: 8 columnas de materiales
head: [['CÓDIGO', 'TIPO', 'ESPESOR', 'DIÁMETRO', 'Ud/Ml', 'MATERIAL', 'P.UNIT.', 'TOTAL']]
```

#### **Configuración de Columnas:**
```javascript
columnStyles: {
  0: { cellWidth: 22, halign: 'center' },  // CÓDIGO
  1: { cellWidth: 20, halign: 'center' },  // TIPO
  2: { cellWidth: 18, halign: 'center' },  // ESPESOR
  3: { cellWidth: 25, halign: 'center' },  // DIÁMETRO
  4: { cellWidth: 15, halign: 'center' },  // Ud/Ml
  5: { cellWidth: 25, halign: 'center' },  // MATERIAL
  6: { cellWidth: 20, halign: 'right' },   // P.UNIT.
  7: { cellWidth: 25, halign: 'right' }    // TOTAL
}
```

### **🔄 3. REDISEÑO DE SECCIONES DEL PDF**

#### **Título de Sección:**
```javascript
// ANTES:
doc.text('TRABAJOS REALIZADOS', 15, currentY + 8);

// DESPUÉS:
doc.text('MATERIALES UTILIZADOS', 15, currentY + 8);
```

#### **Mensaje Sin Datos:**
```javascript
// ANTES:
doc.text('No se han registrado trabajos específicos para este parte.', 15, currentY + 18);

// DESPUÉS:
doc.text('No se han registrado materiales específicos para este parte.', 15, currentY + 18);
```

### **🔄 4. SECCIÓN DE RESUMEN ACTUALIZADA**

#### **Antes (Líneas 592-616):**
```javascript
doc.text('RESUMEN Y OBSERVACIONES', 15, currentY + 8);

// Tiempo total
doc.text('Tiempo total empleado:', 15, currentY + 18);
doc.text(`${tiempoTotal} horas`, 70, currentY + 18);

// Total de trabajos
doc.text('Total de trabajos:', 105, currentY + 18);
doc.text(`${trabajos.length} trabajos`, 150, currentY + 18);
```

#### **Después (Líneas 592-616):**
```javascript
doc.text('RESUMEN Y OBSERVACIONES', 15, currentY + 8);

// Total de materiales
doc.text('Total de materiales:', 15, currentY + 18);
doc.text(`${trabajos.length} materiales`, 70, currentY + 18);

// Coste total (si hay materiales)
if (trabajos.length > 0) {
  const costeTotal = trabajos.reduce((sum, material) => sum + (material.precio_total || 0), 0);
  doc.text('Coste total:', 105, currentY + 18);
  doc.text(`${costeTotal.toFixed(2)}€`, 150, currentY + 18);
}
```

### **🔄 5. SECCIÓN DE COSTES REDISEÑADA**

#### **Antes (Líneas 630-667):**
```javascript
doc.text('TIEMPO Y COSTE', 15, yTiempo + 8);

// Columna 1
doc.text('Tiempo empleado:', 15, yTiempo + 18);
doc.text(`${tiempoTotal} horas`, 60, yTiempo + 18);

// Columna 2
doc.text('Coste trabajador:', 105, yTiempo + 18);
doc.text(`${parte.coste_trabajos || 0}€`, 150, yTiempo + 18);
```

#### **Después (Líneas 630-667):**
```javascript
doc.text('MATERIALES Y COSTE', 15, yMateriales + 8);

// Calcular estadísticas de materiales
const costeTotalMateriales = trabajos.reduce((sum, material) => sum + (material.precio_total || 0), 0);
const materialesAislamiento = trabajos.filter(m => m.material === 'Aislamiento').length;
const materialesAluminio = trabajos.filter(m => m.material === 'Aluminio').length;

// Columna 1
doc.text('Materiales totales:', 15, yMateriales + 18);
doc.text(`${trabajos.length} materiales`, 60, yMateriales + 18);

// Columna 2
doc.text('Aislamiento:', 105, yMateriales + 18);
doc.text(`${materialesAislamiento} / Aluminio: ${materialesAluminio}`, 150, yMateriales + 18);
doc.text('Coste materiales:', 105, yMateriales + 25);
doc.text(`${costeTotalMateriales.toFixed(2)}€`, 150, yMateriales + 25);
```

## 🎯 Resultado Final

### **ANTES (Problemático):**
```
Dashboard → PDF Button → Error 404 RPC
❌ Estructura: Portal/Vivienda, Descripción del Trabajo, Tiempo (h), Observaciones
❌ Datos: Información genérica de trabajos sin detalles de materiales
❌ Error: Could not find the function obtener_trabajos_parte_empleado
❌ Resumen: Tiempo empleado, trabajos realizados
```

### **DESPUÉS (Corregido):**
```
Dashboard → PDF Button → PDF con materiales ✅
✅ Estructura: CÓDIGO, TIPO, ESPESOR, DIÁMETRO, Ud/Ml, MATERIAL, P.UNIT., TOTAL
✅ Datos: Información específica de cada material con precios y cantidades
✅ Sin errores: Consulta directa a partes_empleados_articulos
✅ Resumen: Total materiales, coste total, aislamiento vs aluminio
```

## 📊 Comparación de Estructuras PDF

| **Aspecto** | **ANTES (Obsoleto)** | **DESPUÉS (Actualizado)** |
|-------------|---------------------|---------------------------|
| **Fuente de datos** | RPC inexistente | Consulta directa a tabla |
| **Error al generar** | ❌ Error 404 | ✅ Sin errores |
| **Columnas tabla** | 4 columnas obsoletas | 8 columnas de materiales |
| **Información** | Portal, Vivienda, Tiempo | Código, Tipo, Espesor, Precios |
| **Resumen** | Tiempo empleado | Coste total de materiales |
| **Estadísticas** | Trabajos realizados | Aislamiento vs Aluminio |
| **Formato** | Genérico | Profesional con precios |
| **Compatibilidad** | ❌ Con estructura antigua | ✅ Con nueva estructura de materiales |

## 🔧 Archivos Modificados

- **✅ `src/services/exportService.js`**
  - Función `generateEmpleadoPDF()` completamente actualizada
  - Eliminada dependencia de RPC `obtener_trabajos_parte_empleado`
  - Consulta directa: `partes_empleados_articulos` + `articulos_precios`
  - Tabla PDF: 8 columnas de materiales específicos
  - Secciones rediseñadas: títulos, resúmenes, estadísticas
  - Formateo de precios: unidades con formato €
  - Configuración de columnas: anchos optimizados

## 🎉 Estado Final

**🚀 GENERACIÓN PDF COMPLETAMENTE MODERNIZADA**

Ahora el PDF de empleados:
- **✅ Sin errores RPC:** Consulta directa a base de datos
- **✅ Estructura actual:** Usa las nuevas tablas de materiales
- **✅ Información específica:** Código, tipo, espesor, diámetro, precios
- **✅ Tabla profesional:** 8 columnas con formato optimizado
- **✅ Resumen completo:** Total materiales, coste, tipos de material
- **✅ Estadísticas útiles:** Aislamiento vs Aluminio
- **✅ Formato de precios:** Precios unitarios y totales en euros
- **✅ Compatibilidad total:** Alineado con exportación Excel e importación

### **Beneficios del Fix:**
- **📄 PDF funcional:** Sin errores de funciones inexistentes
- **📊 Información completa:** Cada material con todos sus detalles
- **💰 Gestión de costes:** Precios unitarios y totales incluidos
- **🔄 Consistencia:** PDF, Excel e importación usan la misma estructura
- **📈 Estadísticas útiles:** Desglose por tipo de material
- **🎨 Diseño profesional:** Tabla optimizada para materiales

**El botón "PDF" del Dashboard ahora genera documentos con la estructura actualizada de materiales, sin errores y con información completa y profesional.** 🎯

---

**© 2025 AISLA PARTES** - PDF modernizado exitosamente
