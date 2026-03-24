# Plantillas para Importación de Datos

Este directorio contiene plantillas para la importación de datos en la aplicación Aisla Partes.

## Plantilla de Empleados

La plantilla de empleados (`plantilla_empleados.xlsx`) contiene los siguientes campos:

- **Código**: Identificador único del empleado (obligatorio)
- **Nombre**: Nombre completo del empleado (obligatorio)
- **Email**: Correo electrónico del empleado
- **Categoría**: Categoría profesional del empleado
- **Coste Hora Trabajador (€)**: Coste por hora para el trabajador
- **Coste Hora Empresa (€)**: Coste por hora para la empresa
- **Obra Asignada**: Nombre de la obra asignada al empleado

### Instrucciones de uso:

1. Descarga la plantilla desde la página de Empleados
2. Completa los datos en la plantilla (los campos Código y Nombre son obligatorios)
3. Guarda el archivo Excel
4. Importa el archivo desde la página de Empleados

## Plantilla de Obras

La plantilla de obras (`plantilla_obras.xlsx`) contiene los siguientes campos:

- **Nº de Obra**: Identificador único de la obra (obligatorio)
- **Nombre de Obra**: Nombre descriptivo de la obra (obligatorio)
- **Fecha de Alta**: Fecha en que se dio de alta la obra (formato DD/MM/AAAA)
- **Cliente**: Nombre del cliente
- **Ref. Interna**: Referencia interna (obligatorio)
- **Estado**: Estado actual de la obra (En curso, Planificación, Finalizada, etc.)
- **Dirección Obra**: Dirección física de la obra

### Instrucciones de uso:

1. Descarga la plantilla desde la página de Obras
2. Completa los datos en la plantilla (los campos Nº de Obra, Nombre de Obra y Ref. Interna son obligatorios)
3. Guarda el archivo Excel
4. Importa el archivo desde la página de Obras

## Notas importantes:

- Los campos marcados como obligatorios deben completarse para que la importación sea exitosa
- Si se incluye un código de empleado o número de obra que ya existe, se actualizarán los datos existentes
- Las fechas deben estar en formato DD/MM/AAAA
- Los valores numéricos pueden incluir decimales usando el punto como separador
