# 📋 Plantilla de Importación de Partes de Trabajo de Empleados

## 🎯 Descripción General

Esta plantilla Excel permite importar de forma masiva los partes de trabajo creados por empleados, con la capacidad de manejar múltiples trabajos por parte de forma individual.

## 📊 Estructura de la Plantilla

### Columnas de la Plantilla

| Columna | Descripción | Obligatorio | Formato | Ejemplo |
|---------|-------------|-------------|---------|---------|
| **Fecha** | Fecha del parte | ✅ | YYYY-MM-DD | 2025-01-15 |
| **Nº de Parte** | Código único del parte | ✅ | Texto | P-2025-001 |
| **Estado del Parte** | Estado actual del parte | ✅ | Lista | Borrador, En Revisión, Completado, Aprobado |
| **Trabajador** | Nombre completo del empleado | ✅ | Texto | Juan Pérez García |
| **Cliente** | Nombre del cliente de la obra | ✅ | Texto | Constructora Alza |
| **Obra** | Nombre completo de la obra | ✅ | Texto | Alza 145 - Residencial Las Palmeras |
| **Portal** | Portal o zona de la obra | ❌ | Texto | Portal A |
| **Vivienda** | Número o identificador de vivienda/local | ❌ | Texto | Vivienda 3A |
| **Trabajos Realizados** | Descripción detallada del trabajo | ✅ | Texto | Instalación de puntos de luz |
| **Tiempo Empleado** | Tiempo en horas con decimales | ✅ | Número | 2.5 |

## 🔄 Concepto de Trabajos Individuales

### Estructura de Datos

**Cada fila representa un trabajo individual de un parte.** Esto significa que:

- Si un parte tiene 3 trabajos diferentes, se crearán 3 filas
- Cada fila tendrá el mismo Nº de Parte
- Cada trabajo puede tener diferentes Portal/Vivienda
- El tiempo total del parte será la suma de todos los trabajos

### Ejemplo Práctico

```
Parte P-2025-001 (Juan Pérez García):
├── Fila 1: Instalación de puntos de luz (Portal A, Vivienda 3A) - 2.5 horas
├── Fila 2: Montaje de interruptores (Portal A, Vivienda 3A) - 1.75 horas
└── Fila 3: Instalación de cuadro eléctrico (Portal A, Vivienda 3B) - 3.0 horas

Total del parte: 7.25 horas
```

## 📝 Reglas de Validación

### Campos Obligatorios
- **Fecha**: Debe tener formato YYYY-MM-DD
- **Nº de Parte**: No puede estar vacío
- **Estado del Parte**: Debe ser uno de los valores válidos
- **Trabajador**: No puede estar vacío
- **Cliente**: No puede estar vacío
- **Obra**: No puede estar vacío
- **Trabajos Realizados**: No puede estar vacío
- **Tiempo Empleado**: Debe ser un número mayor que 0

### Estados Válidos
- `Borrador`
- `En Revisión`
- `Completado`
- `Aprobado`

### Campos Opcionales
- **Portal**: Puede estar vacío
- **Vivienda**: Puede estar vacío

## 🚀 Proceso de Importación

### Paso 1: Descargar Plantilla
1. Acceder al módulo de importación
2. Hacer clic en "📄 Descargar Plantilla Excel"
3. Se descargará un archivo Excel con:
   - Hoja "Partes Empleados" con datos de ejemplo
   - Hoja "Instrucciones" con documentación completa

### Paso 2: Completar Datos
1. Abrir la plantilla descargada
2. Eliminar las filas de ejemplo (mantener encabezados)
3. Completar con los datos reales siguiendo el formato
4. Guardar el archivo

### Paso 3: Subir y Validar
1. Seleccionar el archivo completado
2. El sistema validará automáticamente los datos
3. Mostrará un resumen con estadísticas
4. Indicará errores si los hay

### Paso 4: Importar
1. Si no hay errores, hacer clic en "🚀 Importar Partes de Trabajo"
2. El sistema creará los partes y trabajos en la base de datos
3. Mostrará confirmación de cada parte importado

## 📊 Resumen de Datos

Durante la validación, el sistema mostrará:

- **Trabajos Totales**: Número total de filas con datos
- **Partes Únicos**: Número de partes diferentes
- **Trabajadores**: Número de empleados diferentes
- **Horas Totales**: Suma de todos los tiempos empleados

## 🔧 Integración con la Base de Datos

### Tabla `partes`
Se crea un registro por cada Nº de Parte único con:
- `numero_parte`: Código del parte
- `fecha`: Fecha del parte
- `estado`: Estado del parte
- `nombre_trabajador`: Nombre del empleado
- `cliente`: Cliente de la obra
- `nombre_obra`: Nombre de la obra

### Tabla `partes_empleados_trabajos`
Se crea un registro por cada fila con:
- `parte_id`: Referencia al parte creado
- `descripcion`: Descripción del trabajo
- `tiempo_empleado`: Tiempo empleado
- `observaciones`: Información de Portal y Vivienda
- `tipo_trabajo`: 'manual' (para trabajos importados)

## ⚠️ Consideraciones Importantes

### Validaciones de Negocio
- Los datos se importan como trabajos manuales
- No se validan relaciones con empleados/obras existentes
- Los campos Portal y Vivienda se almacenan en observaciones
- No se calculan costes automáticamente

### Limitaciones
- No se pueden importar trabajos del catálogo (solo manuales)
- No se validan permisos de empleados por obra
- No se generan automáticamente números de parte

### Recomendaciones
- Verificar que los empleados existan en el sistema
- Verificar que las obras existan en el sistema
- Usar formatos consistentes para Portal y Vivienda
- Revisar los datos antes de importar

## 🛠️ Uso del Componente

```jsx
import ImportarPartesEmpleados from '../components/importacion/ImportarPartesEmpleados';

// En tu componente o página
<ImportarPartesEmpleados />
```

## 📋 Funciones Disponibles

### `generarPlantillaPartesEmpleados()`
Genera y descarga la plantilla Excel con formato y ejemplos.

### `validarDatosPartesEmpleados(datos)`
Valida un array de datos y retorna:
- `errores`: Array de errores encontrados
- `datosProcesados`: Datos validados y procesados
- `esValido`: Boolean indicando si hay errores

## 🔍 Ejemplo de Uso Programático

```javascript
import { generarPlantillaPartesEmpleados, validarDatosPartesEmpleados } from '../templates/plantilla_partes_empleados';

// Generar plantilla
generarPlantillaPartesEmpleados();

// Validar datos
const datos = [
  {
    'Fecha': '2025-01-15',
    'Nº de Parte': 'P-2025-001',
    'Estado del Parte': 'Borrador',
    'Trabajador': 'Juan Pérez García',
    'Cliente': 'Constructora Alza',
    'Obra': 'Alza 145 - Residencial Las Palmeras',
    'Portal': 'Portal A',
    'Vivienda': 'Vivienda 3A',
    'Trabajos Realizados': 'Instalación de puntos de luz',
    'Tiempo Empleado': 2.5
  }
];

const validacion = validarDatosPartesEmpleados(datos);
console.log(validacion.esValido); // true/false
console.log(validacion.errores); // Array de errores
console.log(validacion.datosProcesados); // Datos procesados
```

## 📞 Soporte

Para dudas o problemas con la importación:
1. Revisar la hoja "Instrucciones" de la plantilla
2. Verificar que todos los campos obligatorios estén completos
3. Comprobar que los formatos sean correctos
4. Contactar al administrador del sistema si persisten los problemas
