Objetivo:
Crear parte de trabajo para Proveedores para añadir trabajos realizados de forma diaria.
Este parte constara de varios campos informativos y detalles de los trabajos a realizar distribuidos en forma de tarjetas.


**Tarjeta Información Principal:
Campo "Fecha"
Este campo tendrá por defecto la fecha en la que se genere el parte, pero tendrá opción de calendario para cambiar la fecha.

Campo "Cliente"
Este campo se rellenará de forma automática al introducir en el campo "Codigo Proveedor" el código asignado, recogerá la información asociada en la información del proveedor en el campo "Cliente" (crear este nuevo campo antes en ficha de proveedor)

Campo "Codigo Proveedor":
En esta campo se introducira de forma manual el código de proveedor asignado en la información del proveedore en pagina @proveedores campo "Código"

Campo "Empresa"
Este campo se rellenará de forma automática al introducir en el campo "Codigo Proveedor" el código asignado, recogerá la información asociada en la información del proveedor en el campo "Razón Social"

Campo "Cif"
Este campo se rellenará de forma automática al introducir en el campo "Codigo Proveedor" el código asignado, recogerá la información asociada en la información del proveedor en el campo "CIF"

Campo "Email Contacto"
Este campo se rellenará de forma automática al introducir en el campo "Codigo Proveedor" el código asignado, recogerá la información asociada en la información del proveedor en el campo "EMAIL"

Campo "Teléfono"
Este campo se rellenará de forma automática al introducir en el campo "Codigo Proveedor" el código asignado, recogerá la información asociada en la información del proveedor en el campo "Teléfono"

**Tarjeta Trabajos

Campo "Obra"
Este campo ofrecerá un desplegable para seleccionar una de las obras asignadas en el campo "Obras Asignadas" de la ficha del proveedor, en caso de tener solo una obra asignada aparecerá en esta campo de forma automática, antes de que se cumplimente con información en el campo aparecerá un texto informativo "Seleccionar Obra"

Campo "Portal"
Este campo sera editable de forma manual podrá recoger texto Alfanumerico, en el campo aparecerá un texto informativo "Seleccionar Portal"

Campo "Vivienda"
Este campo sera editable de forma manual podrá recoger texto Alfanumerico, en el campo aparecerá un texto informativo "Seleccionar Vivienda"

Boton "Grupo"
Este botón habilitará la opción de seleccionar un grupo principal de los contenidos en pagina "Precio"

Boton "SubGrupo"
Una vez seleccionado un Grupo principal desde el botón anterior se abrirá un desplegable para seleccionar uno de los Subgrupos que pertenecen al grupo principal seleccionado

Boton "Trabajos"
Este botón abrirá un desplegable con la lista de trabajos perteneciente al "Grupo Principal" y "Subgrupo" seleccionados anteriormente.
Una vez seleccionado el Trabajo se abrirá un campo para introducir de manera manual en numero de unidades realizadas para ese trabajo.
Una vez introducido el numero de unidades, se grabara de forma automática el costes del trabajo que será el resultado de multiplicar el Nº de Unidades por el precio unitario que figura en campo "Precio" de lista de precios

El resultado de estas operaciones se quedara reflejados en dos campos:
"Coste Unitario"  "Coste Total"


**Tarjeta Notas y Otros Trabajos
Campo "Otros Trabajos"
Este campo sera editable de forma manual podrá recoger texto Alfanumerico, en el campo aparecerá un texto informativo "Añadir Trabajos Extra"
 Asociado a este campo crearemos tres campos de "Unidades" "Precio Unitario" "Total" este ultimo ofrecerá el resultado en euros de multiplicar el numero de unidades por el precio unitario
Crearemos un Boton de "Confirmar Trabajo" para grabar la información introducida y otro botón "Añadir Más" para reiniciar el proceso.

**Tarjeta "Total Parte"
Esta tarjeta contendrá campos con las líneas de los trabajos introducidos incluyendo los trabajos seleccionados y los trabajos extra, se visualizara su coste unitario, su coste total.
Añadiremos un campo por cada linea para aplicar un porcentaje de descuento que se aplicara sobre el coste total de la linea donde apliquemos el descuento.
Por ultimo habrá un resumen del coste total sumando todos los conceptos de los trabajos introducidos.

*Tarjeta Imágenes
Boton "Añadir Imagen"
Tendra la función de que se pueda grabar subir y grabar una imagen en el parte de trabajo


Crearemos un botón "Confirmar Trabajos" para confirmar todos los trabajos cumplimentados, tendrá un mensaje informativo "Confirmar Trabajos en Vivienda Seleccionada"

Crearemos un botón "Añadir Mas Trabajos" que iniciará el proceso de introducción de trabajos desde la selección en Campo "Portal"

Crearemos un botón "Confirmar Parte" que grabará toda la información introducida durante todo el proceso.

Una vez Confirmado el parte se abrirá una nueva tarjeta:

*Firmar Parte
Campo "Firma"
En este campo se introducirá un firma de forma manual
 Tendrá asociados dos botones:
"Borrar" (para introducir una nueva firma)
"Guardar" (para grabar la firma introducida)


Finalmente tendremos dos botones de
"Cancelar" (Cerrara el proceso sin guardar nada)
"Guardar Parte" (Guardará toda la información en base de datos)
