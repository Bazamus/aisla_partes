# 📊 Actualización Plantilla de Importación - Partes de Empleados con Materiales

**Fecha:** 19 de Enero de 2025  
**Autor:** Equipo de Desarrollo AISLA PARTES  
**Versión:** 3.0.0 - ESTRUCTURA DE MATERIALES

## 🎯 Objetivo

Modificar la plantilla de importación de partes de empleados para incluir los campos de materiales, permitiendo la importación de datos detallados de materiales con sus precios y características técnicas.

## 📋 Análisis de Requerimientos

### **Archivo de Referencia:**
```csv
Fecha;Nº de Parte;Estado del Parte;Trabajador;Cliente;Obra;CODIGO;TIPO;ESPESOR;Diámetro;Ud/Ml;MATERIAL;Precio unitario;Precio Total
18/9/2025;E0003/25;Borrador;Angelo Parra Hidalgo;ACLIMAR;SAN JOSE COLEGIO SAGRADO CORAZON MADRID;CON-40-076;CONO;40;"76 (2""1/2)";10;Aislamiento;2,84;28,4
```

### **Nueva Estructura:**
- **Una fila por material:** Cada material del parte ocupa una fila separada
- **Campos de material:** CODIGO, TIPO, ESPESOR, Diámetro, Ud/Ml, MATERIAL, Precios
- **Tipos de material:** "Aislamiento" o "Aluminio"
- **Cálculos automáticos:** Precio Total = Ud/Ml × Precio unitario

## ✅ Cambios Implementados

### **🔄 1. ESTRUCTURA DE DATOS ACTUALIZADA**

#### **Campos Eliminados:**
- ❌ `Portal`
- ❌ `Vivienda` 
- ❌ `Trabajos Realizados`
- ❌ `Tiempo Empleado`

#### **Campos Añadidos:**
- ✅ `CODIGO` - Código del material
- ✅ `TIPO` - Tipo de material (CONO, TUBO, TAPA, etc.)
- ✅ `ESPESOR` - Espesor en milímetros
- ✅ `Diámetro` - Diámetro con medidas en pulgadas
- ✅ `Ud/Ml` - Unidades o metros lineales
- ✅ `MATERIAL` - Tipo: "Aislamiento" o "Aluminio"
- ✅ `Precio unitario` - Precio por unidad
- ✅ `Precio Total` - Precio total calculado

### **📊 2. DATOS DE EJEMPLO ACTUALIZADOS**

#### **Estructura Nueva:**
```javascript
{
  'Fecha': '2025-01-15',
  'Nº de Parte': 'E0001/25',
  'Estado del Parte': 'Borrador',
  'Trabajador': 'Angelo Parra Hidalgo',
  'Cliente': 'ACLIMAR',
  'Obra': 'SAN JOSE COLEGIO SAGRADO CORAZON MADRID',
  'CODIGO': 'CON-40-076',
  'TIPO': 'CONO',
  'ESPESOR': 40,
  'Diámetro': '76 (2"1/2)',
  'Ud/Ml': 10,
  'MATERIAL': 'Aislamiento',
  'Precio unitario': 2.84,
  'Precio Total': 28.40
}
```

#### **Ejemplos Incluidos:**
- **6 materiales diferentes** distribuidos en 3 partes
- **Variedad de tipos:** CONO, TUBO, TAPA, CODO, REDUCCION
- **Ambos materiales:** Aislamiento y Aluminio
- **Precios realistas:** Basados en el archivo de referencia

### **📏 3. ANCHO DE COLUMNAS OPTIMIZADO**

```javascript
const columnsWidth = [
  { wch: 12 },  // Fecha
  { wch: 15 },  // Nº de Parte
  { wch: 15 },  // Estado del Parte
  { wch: 25 },  // Trabajador
  { wch: 20 },  // Cliente
  { wch: 40 },  // Obra
  { wch: 15 },  // CODIGO
  { wch: 12 },  // TIPO
  { wch: 10 },  // ESPESOR
  { wch: 15 },  // Diámetro
  { wch: 8 },   // Ud/Ml
  { wch: 12 },  // MATERIAL
  { wch: 12 },  // Precio unitario
  { wch: 12 },  // Precio Total
];
```

### **🎨 4. FORMATO NUMÉRICO MEJORADO**

```javascript
// Formatos específicos por columna
if (col === 8) { // ESPESOR
  worksheet[cellAddress].s.numberFormat = '0';
} else if (col === 10) { // Ud/Ml
  worksheet[cellAddress].s.numberFormat = '0';
} else if (col === 12) { // Precio unitario
  worksheet[cellAddress].s.numberFormat = '0.00€';
} else if (col === 13) { // Precio Total
  worksheet[cellAddress].s.numberFormat = '0.00€';
}
```

### **📝 5. INSTRUCCIONES COMPLETAMENTE RENOVADAS**

#### **Nuevas Reglas Importantes:**
- ✅ **Una fila por material:** Cada material del parte va en una fila separada
- ✅ **Nº de Parte igual:** Todos los materiales del mismo parte comparten el código
- ✅ **CODIGO válido:** Debe existir en el catálogo de materiales
- ✅ **MATERIAL restringido:** Solo "Aislamiento" o "Aluminio"
- ✅ **Cálculos correctos:** Precio Total = Ud/Ml × Precio unitario

#### **Ejemplos de Uso:**
- Un parte E0001/25 con 3 materiales = 3 filas con mismo Nº de Parte
- Cada material puede ser Aislamiento o Aluminio
- El coste total del parte = suma de todos los Precios Totales

### **🔍 6. VALIDACIÓN COMPLETA ACTUALIZADA**

#### **Validaciones Nuevas:**
```javascript
// Validar CODIGO del material
if (!fila['CODIGO'] || fila['CODIGO'].toString().trim() === '') {
  erroresFila.push('CODIGO del material es obligatorio');
}

// Validar TIPO del material
const tiposValidos = ['CONO', 'TUBO', 'TAPA', 'CODO', 'REDUCCION', 'TE', 'CURVA', 'BRIDA'];
if (!fila['TIPO'] || !tiposValidos.includes(fila['TIPO'].toString().toUpperCase())) {
  erroresFila.push('TIPO debe ser uno de: CONO, TUBO, TAPA, CODO, REDUCCION, TE, CURVA, BRIDA');
}

// Validar MATERIAL
const materialesValidos = ['Aislamiento', 'Aluminio'];
if (!fila['MATERIAL'] || !materialesValidos.includes(fila['MATERIAL'])) {
  erroresFila.push('MATERIAL debe ser "Aislamiento" o "Aluminio"');
}

// Validar cálculo de precios
const precioCalculado = unidades * precioUnitario;
const diferencia = Math.abs(precioTotal - precioCalculado);
if (diferencia > 0.01) { // Tolerancia de 1 céntimo
  erroresFila.push(`Precio Total no coincide con el cálculo`);
}
```

#### **Datos Procesados Actualizados:**
```javascript
datosProcesados.push({
  fecha: fila['Fecha'],
  numeroParte: fila['Nº de Parte'].toString().trim(),
  estado: fila['Estado del Parte'],
  trabajador: fila['Trabajador'].toString().trim(),
  cliente: fila['Cliente'].toString().trim(),
  obra: fila['Obra'].toString().trim(),
  codigo: fila['CODIGO'].toString().trim(),
  tipo: fila['TIPO'].toString().toUpperCase(),
  espesor: espesor,
  diametro: fila['Diámetro'].toString().trim(),
  unidades: unidades,
  material: fila['MATERIAL'],
  precioUnitario: precioUnitario,
  precioTotal: precioTotal
});
```

## 🎯 Ejemplo de Uso

### **Parte E0001/25 con 3 Materiales:**

| Fecha | Nº de Parte | Trabajador | Obra | CODIGO | TIPO | ESPESOR | Diámetro | Ud/Ml | MATERIAL | Precio Unit. | Precio Total |
|-------|-------------|------------|------|--------|------|---------|----------|-------|----------|--------------|--------------|
| 2025-01-15 | E0001/25 | Angelo Parra | SAN JOSE COLEGIO | CON-40-076 | CONO | 40 | 76 (2"1/2) | 10 | Aislamiento | 2.84 | 28.40 |
| 2025-01-15 | E0001/25 | Angelo Parra | SAN JOSE COLEGIO | TUB-32-050 | TUBO | 32 | 50 (1"1/2) | 15 | Aluminio | 3.25 | 48.75 |
| 2025-01-15 | E0001/25 | Angelo Parra | SAN JOSE COLEGIO | TAP-06-025 | TAPA | 6 | 25 (1") | 8 | Aislamiento | 1.95 | 15.60 |

**Coste Total del Parte:** 28.40 + 48.75 + 15.60 = **92.75€**

## 🔧 Archivos Modificados

- **✅ `src/templates/plantilla_partes_empleados.js`**
  - Datos de ejemplo completamente actualizados
  - Ancho de columnas ajustado para 14 campos
  - Formato numérico específico para precios y números
  - Instrucciones renovadas para materiales
  - Validación completa de todos los campos nuevos
  - Documentación actualizada

## 🎉 Estado Final

**🚀 PLANTILLA COMPLETAMENTE ACTUALIZADA PARA MATERIALES**

La nueva plantilla:
- **✅ Estructura de materiales:** Una fila por material del parte
- **✅ Campos completos:** Todas las características técnicas incluidas
- **✅ Validación robusta:** Control de tipos, precios y cálculos
- **✅ Ejemplos realistas:** Basados en datos reales de AISLA PARTES
- **✅ Instrucciones claras:** Documentación completa del proceso
- **✅ Formato profesional:** Excel con colores y formato optimizado

### **Beneficios de la Nueva Estructura:**
- **📊 Detalle completo:** Cada material con todas sus características
- **💰 Control de costes:** Precios unitarios y totales validados
- **🔍 Trazabilidad:** Códigos de materiales vinculados al catálogo
- **📈 Escalabilidad:** Soporta partes con múltiples materiales
- **✅ Validación:** Control exhaustivo de datos antes de importar

**La plantilla está lista para importar partes de empleados con estructura completa de materiales y precios.** 🎯

---

**© 2025 AISLA PARTES** - Actualización de plantilla exitosa
