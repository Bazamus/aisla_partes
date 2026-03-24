**Preguntas de Clarificación
1. Flujo de Confirmación de Trabajos
Mencionas dos botones diferentes:
"Añadir Línea" - para confirmar un trabajo individual
"Añadir Trabajo" - para confirmar todos los trabajos
¿Esto significa que:
El empleado puede agregar múltiples líneas de trabajo una por una
Al final confirma TODOS los trabajos agregados con un solo botón?
¿O cada trabajo se confirma individualmente?
 **El empleado añadirá multiples líneas de trabajo una por una donde indicara el trabajo seleccionado y las horas empleadas, una vez que ha terminado de añadir líneas de trabajo, confirmará todas estas líneas de trabajos con el botón "Añadir Trabajos"

2. Campos Portal y Vivienda
¿Estos campos se aplican a TODO el parte o son específicos por cada línea de trabajo?
 **Estos campos se aplican a todas las líneas de trabajo introducidas, una vez que se confirmen estas líneas de trabajo, mediante el botón "Añadir Trabajo", se podrán seleccionar de nuevo los campos Portal y Vivienda para añadir mas líneas de trabajo.
  Contexto: Usuario introduce en Campo portal: 1, y en Campo Vivienda 2ºA, añade dos líneas de trabajo (Bajadas por tubo, Cantidad 2, Horas 4) y (Velas Fontaneria, Cantidad: 8, Horas: 6) Confirma líneas pulsado en botón "Añadir Trabajos" y Vuelve a introducir en Campo portal: 2 y en campo Vivienda: 3B donde vuelve a añadir otra linea de trabajo (Colocación de bocas, Cantidad: 3, Horas: 4) y vuelve a confirmar estos trabajos con el botón "Añadir Trabajo" por lo que en el parte resumen de trabajos quedará:
Portal uno Vivienda 2ªA:
 Bajadas por tubo, Cantidad 2, Horas 4
 Velas Fontaneria, Cantidad: 8, Horas: 6
Portal: 2 Vivienda: 3B:
 Colocación de bocas, Cantidad: 3, Horas: 4
Total Horas: 14
¿Son campos obligatorios o opcionales?
 **Son campos obligatorios siempre que se introduzcan trabajos que vengan del listado de precios
 **Habilitaremos un campo libre para introducir trabajos que no sea obligatorio que esten asociados a ningún portal o vivienda ni vengan de listado de precios (ejemplo: "Trabajo en Sotanos 2 horas)
¿Tienen alguna validación específica (formato, longitud, etc.)?
 **Serán tipos de campos Alfanumericos

3. Gestión de Horas
¿Las horas se introducen por cada línea de trabajo individual?
 **Si, las horas las debe introducir el empleado de forma manual por cada linea de trabajo introducida.
¿Hay un total de horas que se calcula automáticamente?
 **El total de horas se calculará automáticamente en función de las horas introducidas en cada linea.
¿Existe algún límite máximo/mínimo de horas por trabajo?
 **No esta contemplado pero no descartamos introducirlo mas adelante ajustando un numero máximo de horas en función de su calendario laboral, en esta fase de desarrollo no lo tengas en cuenta.

4. Obras Asignadas
¿El empleado solo puede ver las obras que tiene asignadas en su ficha?
 **Si, el empleado solo puede ver las obras que tenga asignadas en su ficha de empleado.
¿Si tiene una sola obra asignada, se selecciona automáticamente?
 **Si solo tiene una obra asignada esta se seleccionara de forma automática.
¿Puede cambiar de obra una vez seleccionada?
**Solo podría cambiar de obra en caso de no tener líneas de trabajo grabadas, se creará un parte de trabajo por cada obra.

5. Estado del Parte
¿El estado "Borrador" permite al empleado editar el parte después de guardarlo?
 **Si, este es el único estado en el cual se permite al empleado con rol de acceso "Empleado" poder editar o eliminar el parte.
¿Quién puede cambiar el estado de "Borrador" a otros estados?
 **Usuarios con perfil "SuperAdmin" o "Administrador" o aquellos a los que otorguemos permisos desde la pagina de "gestion-roles"
¿Qué otros estados existen además de "Borrador"?
 **Pendiente de Revision, Aprobado, Rechazado.
 
6. Firma e Imágenes
¿La firma es obligatoria para guardar el parte o solo para enviarlo/finalizarlo?
 **La firma debe ser obligatoria cuando se finaliza el parte y se quiere guardar.
¿Las imágenes son obligatorias o recomendadas?
 **Las subida de imágenes es opcional
¿Hay límite en el número de imágenes?
 **No se contempla, quizá mas adelante

7. Compatibilidad con Sistema Actual
Según la documentación analizada, ya existe un sistema de trabajos implementado. ¿Quieres:
Reemplazar completamente el sistema actual con la lógica de proveedores?
Adaptar el sistema actual para incluir la lógica de proveedores?
Mantener ambos sistemas y permitir elegir?
 **Quiero adaptar el sistema actual para incluir la lógica de selección de trabajos de proveedores, ya hay funciones que están desarrolladas y no es necesario crear de nuevo, el objetivo es incluir la lógica de selección de trabajos y creación de partes que tenemos en partes de proveedor en partes de empleados, para cumplir con el objetivo durante el desarrollo del trabajo se valorara si es necesario rediseñar totalmente el sistema de partes de empleado o se puede aprovechar alguna de las funciones ya desarrolladas.
 
8. Búsqueda de Trabajos
¿La búsqueda debe funcionar igual que en proveedores (búsqueda por texto libre)?
 **La busqueda debe funcionar igual que en provedores incluyendo un campo de busqueda por texto libre.
¿Debe mostrar los mismos resultados o filtrar por algún criterio específico para empleados?
 **Debe mostrar los mismos resultados ya que usa la misma base de datos con listado de trabajos y precios.
 

