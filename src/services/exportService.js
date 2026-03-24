import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { supabase } from '../lib/supabase'
import { getTrabajosParteEmpleado } from './parteEmpleadoService'
import emailjs from '@emailjs/browser'

/**
 * Añade una imagen al documento PDF manejando diferentes tipos de fuentes de imágenes
 * @param {jsPDF} doc - Documento PDF
 * @param {string} imageSource - URL, ruta o datos base64 de la imagen
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {number} width - Ancho de la imagen
 * @param {number} height - Alto de la imagen
 * @returns {Promise} Promesa que se resuelve cuando la imagen se ha añadido
 */
const addImageToPDF = async (doc, imageSource, x, y, width, height) => {
  // Si no hay fuente de imagen, resolver inmediatamente
  if (!imageSource) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    // Si la imagen ya es base64, añadirla directamente
    if (typeof imageSource === 'string' && imageSource.startsWith('data:image')) {
      try {
        doc.addImage(imageSource, 'AUTO', x, y, width, height);
        resolve();
      } catch (error) {
        console.error('Error al añadir imagen base64:', error);
        resolve(); // Resolver sin error para continuar con el PDF
      }
      return;
    }
    
    // Para URLs o rutas de archivo
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSource;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        doc.addImage(dataUrl, 'JPEG', x, y, width, height);
        resolve();
      } catch (error) {
        console.error('Error al añadir imagen:', error);
        resolve(); // Resolver sin error para continuar con el PDF
      }
    };
    
    img.onerror = () => {
      console.error('Error al cargar imagen:', imageSource);
      resolve(); // Resolver sin error para continuar con el PDF
    };
  });
};

// Función para generar PDF específico para partes de proveedores
export const generateProveedorPDF = async (parte) => {
  // Crear documento PDF
  const doc = new jsPDF();
  
  // Colores AISLA
  const primaryColor = [1, 78, 208]; // Azul principal AISLA #0d9488
  const secondaryColor = [130, 130, 130]; // Gris AISLA #828282
  
  // Configurar fuentes
  doc.setFont('helvetica', 'normal');
  
  try {
    // COLUMNA 1: Logo e información de la empresa
    try {
      await addImageToPDF(doc, './plantilla_partes/aisla_logo.jpg', 15, 8, 40, 16);
    } catch (logoError) {
      console.warn('No se pudo cargar el logo AISLA:', logoError);
      // Continuar sin el logo
    }
    
    // Información de la empresa AISLA
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text('C/ Demo Nº1, 28001 Madrid', 15, 26);
    doc.text('Telf: 900 000 000', 15, 29);
    doc.text('www.aislapartes.com', 15, 32);

    // COLUMNA 2: Datos del Proveedor
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Datos Proveedor', 70, 10);
    
    // Datos del proveedor (espaciado reducido)
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    
    const espaciadoFilas = 4; // Reducido de 6 a 4
    
    doc.setFont('helvetica', 'bold');
    doc.text('Código Proveedor:', 70, 14);
    doc.setFont('helvetica', 'normal');
    doc.text(parte.codigo_proveedor || '', 110, 14);
    
    doc.setFont('helvetica', 'bold');
    doc.text('CIF:', 70, 14 + espaciadoFilas);
    doc.setFont('helvetica', 'normal');
    doc.text(parte.cif || '', 110, 14 + espaciadoFilas);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Razón Social:', 70, 14 + espaciadoFilas * 2);
    doc.setFont('helvetica', 'normal');
    doc.text(parte.razon_social || '', 110, 14 + espaciadoFilas * 2);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', 70, 14 + espaciadoFilas * 3);
    doc.setFont('helvetica', 'normal');
    doc.text(parte.email || '', 110, 14 + espaciadoFilas * 3);
    
    // COLUMNA 3: Datos del Parte
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Datos del Parte', 140, 10);
    
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Nº de Parte:', 140, 14);
    doc.setFont('helvetica', 'normal');
    doc.text(parte.numero_parte || '', 180, 14, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', 140, 14 + espaciadoFilas);
    doc.setFont('helvetica', 'normal');
    doc.text(parte.fecha || '', 180, 14 + espaciadoFilas, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Empresa:', 140, 14 + espaciadoFilas * 2);
    doc.setFont('helvetica', 'normal');
    doc.text(parte.empresa || '', 180, 14 + espaciadoFilas * 2, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', 140, 14 + espaciadoFilas * 3);
    doc.setFont('helvetica', 'normal');
    doc.text(parte.cliente || '', 180, 14 + espaciadoFilas * 3, { align: 'right' });
    
    // Línea separadora (ajustada a la nueva altura)
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(15, 35, 195, 35);
    
    // Posición Y para el siguiente elemento (ajustada para ser más compacta)
    let yPos = 40;
    
    // Sección de trabajos
    if (parte.trabajos && parte.trabajos.length > 0) {
      let totalSuma = 0;
      
      for (let i = 0; i < parte.trabajos.length; i++) {
        const trabajo = parte.trabajos[i];
        
        // Si no hay suficiente espacio para un nuevo trabajo, añadir nueva página
        if (yPos > 230) {
          doc.addPage();
          yPos = 20;
        }
        
        // Título de la sección
        doc.setFontSize(10); // Reducido de 12 a 10
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('Relación de Trabajos', 15, yPos);
        
        // Información de la obra (más compacta)
        doc.setFontSize(8); // Reducido de 10 a 8
        doc.setTextColor(0, 0, 0);
        doc.text(`Obra: ${trabajo.obra || ''}`, 15, yPos + 7); // Reducido de 10 a 7
        doc.text(`Portal: ${trabajo.portal || ''}`, 100, yPos + 7); // Reducido de 10 a 7
        doc.text(`Vivienda: ${trabajo.vivienda || ''}`, 150, yPos + 7); // Reducido de 10 a 7
        
        // Tabla de líneas de trabajo
        const tableHeaders = [['Descripción', 'Cantidad', 'Precio Unitario', 'Descuento (%)', 'Total']];
        
        const tableData = trabajo.lineas.map(linea => [
          linea.descripcion || '',
          linea.cantidad?.toString() || '',
          `${linea.precio_unitario?.toFixed(2)}€` || '',
          `${linea.descuento?.toString()}%` || '',
          `${linea.total?.toFixed(2)}€` || ''
        ]);
        
        // Calcular total del trabajo
        const totalTrabajo = trabajo.lineas.reduce((sum, linea) => sum + (linea.total || 0), 0);
        totalSuma += totalTrabajo;
        
        // Añadir fila con el total
        tableData.push(['', '', '', 'Total del Trabajo:', `${totalTrabajo.toFixed(2)}€`]);
        
        doc.autoTable({
          startY: yPos + 10, // Reducido de 15 a 10
          head: tableHeaders,
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [...primaryColor],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          styles: {
            fontSize: 8, // Reducido de 9 a 8
            cellPadding: 2, // Reducido de 3 a 2
          },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 30, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' },
          },
          margin: { left: 15, right: 15 }
        });
        
        // Actualizar posición Y para el siguiente trabajo
        yPos = doc.lastAutoTable.finalY + 5; // Reducido de 8 a 5
        
      }
      
      // Verificar si hay espacio suficiente para el total y la firma
      const espacioNecesario = 50; // Reducido de 70 a 50
      
      if (yPos + espacioNecesario > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      // Crear una fila con Total Suma y Firma Proveedor en la misma línea
      const hasFirma = parte.firma ? true : false;
      
      // Total suma de todos los trabajos (alineado a la derecha)
      doc.setFillColor(245, 247, 250);
      doc.rect(hasFirma ? 120 : 100, yPos, 95, 15, 'F');
      
      doc.setFontSize(10); // Reducido de 11 a 10
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Total Suma:', hasFirma ? 130 : 110, yPos + 10);
      doc.text(`${totalSuma.toFixed(2)}€`, 180, yPos + 10, { align: 'right' });
      
      // Añadir firma si existe (alineada a la izquierda en la misma línea que el total)
      if (hasFirma) {
        doc.setFontSize(10); // Reducido de 12 a 10
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('Firma Proveedor', 15, yPos + 3); // Ajustado de yPos - 2 a yPos + 3
        
        try {
          await addImageToPDF(doc, parte.firma, 15, yPos + 5, 60, 25); // Ajustado de yPos a yPos + 5
        } catch (firmaError) {
          console.warn('No se pudo cargar la firma:', firmaError);
          // Continuar sin la firma
        }
      }
      
      yPos += 30; // Espacio después del total y firma (reducido de 40 a 30)
    } else if (parte.firma) {
      // Si no hay trabajos pero hay firma, mostrar solo la firma
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Firma Proveedor', 15, yPos);
      
      try {
        await addImageToPDF(doc, parte.firma, 15, yPos + 5, 60, 25);
      } catch (firmaError) {
        console.warn('No se pudo cargar la firma:', firmaError);
        // Continuar sin la firma
      }
      
      yPos += 35;
    }
    
    // Añadir imágenes si existen
    if (parte.imagenes && parte.imagenes.length > 0) {
      // Siempre crear una nueva página para las imágenes
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Imágenes', 15, yPos);
      
      yPos += 10;
      
      // Determinar el layout según el número de imágenes
      const numImagenes = parte.imagenes.length;
      let imageWidth, imageHeight, imagesPerRow;
      
      // Configurar tamaño y layout según cantidad de imágenes
      if (numImagenes <= 6) {
        // Para 1-6 imágenes: formato mediano, 2 por fila
        imageWidth = 85;
        imageHeight = 85;
        imagesPerRow = 2;
      } else {
        // Para 7+ imágenes: formato pequeño, 3 por fila
        imageWidth = 55;
        imageHeight = 55;
        imagesPerRow = 3;
      }
      
      let currentRow = 0;
      let currentCol = 0;
      
      // Mostrar todas las imágenes disponibles
      for (let i = 0; i < parte.imagenes.length; i++) {
        // Verificar si necesitamos una nueva página basado en el número de filas
        // Calculamos cuántas filas caben en una página (aproximadamente 220px de altura disponible)
        const maxRowsPerPage = Math.floor(220 / (imageHeight + 15));
        
        if (currentRow >= maxRowsPerPage) {
          doc.addPage();
          yPos = 20;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...primaryColor);
          doc.text('Imágenes (continuación)', 15, yPos);
          yPos += 10;
          currentRow = 0;
          currentCol = 0;
        }
        
        const x = 15 + (currentCol * (imageWidth + 10));
        const y = yPos + (currentRow * (imageHeight + 15));
        
        try {
          // Añadir imagen con tamaño adaptado
          await addImageToPDF(doc, parte.imagenes[i], x, y, imageWidth, imageHeight);
          
          // Añadir borde a la imagen
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.rect(x, y, imageWidth, imageHeight);
          
          // Añadir número de imagen debajo
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          doc.text(`Imagen ${i + 1}`, x + (imageWidth / 2), y + imageHeight + 5, { align: 'center' });
          
          // Actualizar posición para la siguiente imagen
          currentCol++;
          if (currentCol >= imagesPerRow) {
            currentCol = 0;
            currentRow++;
          }
        } catch (imageError) {
          console.warn(`No se pudo cargar la imagen ${i + 1}:`, imageError);
          // Continuar sin la imagen pero mantener el espacio
          currentCol++;
          if (currentCol >= imagesPerRow) {
            currentCol = 0;
            currentRow++;
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error al generar PDF de proveedor:', error);
  }
  
  return doc;
}

// Función para generar PDF específico para partes de empleados
export const generateEmpleadoPDF = async (parte) => {
  try {
    console.log('Iniciando generación de PDF para empleado, ID:', parte.id);
    
    // Crear documento PDF
    const doc = new jsPDF();
    
    // Colores AISLA
    const primaryColor = [1, 78, 208]; // Azul principal AISLA #0d9488
    const secondaryColor = [130, 130, 130]; // Gris AISLA #828282
    
    // Configurar fuentes
    doc.setFont('helvetica', 'normal');
    
    try {
      // ENCABEZADO: Logo e información de la empresa
      try {
        await addImageToPDF(doc, './plantilla_partes/aisla_logo.jpg', 15, 8, 40, 16);
      } catch (logoError) {
        console.warn('No se pudo cargar el logo AISLA:', logoError);
        // Continuar sin el logo
      }
      
      // Información de la empresa AISLA
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.text('C/ Demo Nº1, 28001 Madrid', 15, 26);
      doc.text('Telf: 900 000 000', 15, 29);
      doc.text('www.aislapartes.com', 15, 32);
      
      // Título grande centrado
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('PARTE DE TRABAJO', 105, 20, { align: 'center' });
      
      // Información del parte
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Nº PARTE: ${parte.numero_parte || 'Sin número'}`, 105, 30, { align: 'center' });
      doc.text(`FECHA: ${new Date(parte.fecha).toLocaleDateString()}`, 105, 36, { align: 'center' });
      
      // SECCIÓN: Datos Básicos
      const yDatosBasicos = 45;
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(10, yDatosBasicos, 190, 30, 2, 2, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('DATOS GENERALES', 15, yDatosBasicos + 8);
      
      // Grid de datos (2 columnas)
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      // Columna 1
      doc.setFont('helvetica', 'bold');
      doc.text('Obra:', 15, yDatosBasicos + 18);
      doc.text('Trabajador:', 15, yDatosBasicos + 25);
      
      // Columna 1 - Valores
      doc.setFont('helvetica', 'normal');
      doc.text(parte.nombre_obra || '', 40, yDatosBasicos + 18);
      doc.text(parte.nombre_trabajador || '', 40, yDatosBasicos + 25);
      
      // Columna 2
      doc.setFont('helvetica', 'bold');
      doc.text('Cliente:', 105, yDatosBasicos + 18);
      doc.text('Email:', 105, yDatosBasicos + 25);
      
      // Columna 2 - Valores
      doc.setFont('helvetica', 'normal');
      doc.text(parte.cliente || '', 130, yDatosBasicos + 18);
      doc.text(parte.email_contacto || '', 130, yDatosBasicos + 25);
      
      // SECCIÓN: Materiales utilizados
      let currentY = yDatosBasicos + 40;
      
      // Obtener materiales del parte desde las nuevas tablas
      let trabajos = [];
      let tiempoTotal = 0;
      
      try {
        console.log('Obteniendo materiales para parte ID:', parte.id);
        
        // Importar supabase para consultar las nuevas tablas
        const { supabase } = await import('../lib/supabase');
        
        // Obtener materiales del parte desde la nueva tabla partes_empleados_articulos
        const { data: articulos, error: articulosError } = await supabase
          .from('partes_empleados_articulos')
          .select(`
            id,
            articulo_id,
            tipo_precio,
            cantidad,
            precio_unitario,
            subtotal,
            created_at,
            articulos_precios (
              codigo,
              tipo,
              espesor,
              diametro,
              pulgada,
              unidad
            )
          `)
          .eq('parte_id', parte.id)
          .order('created_at', { ascending: true });

        if (articulosError) {
          console.error('Error al obtener materiales del parte:', articulosError);
          trabajos = [];
        } else {
          // Transformar materiales a formato para PDF
          trabajos = (articulos || []).map(articulo => {
            const articuloPrecio = articulo.articulos_precios;
            return {
              codigo: articuloPrecio?.codigo || 'N/A',
              tipo: articuloPrecio?.tipo || 'N/A',
              espesor: articuloPrecio?.espesor || 0,
              diametro: articuloPrecio?.diametro || 'N/A',
              cantidad: articulo.cantidad || 0,
              material: articulo.tipo_precio === 'aislamiento' ? 'Aislamiento' : 'Aluminio',
              precio_unitario: articulo.precio_unitario || 0,
              precio_total: articulo.subtotal || 0
            };
          });
          console.log(`Materiales obtenidos: ${trabajos.length}`);
        }
        
        // Calcular total de materiales para el resumen
        tiempoTotal = trabajos.length; // En lugar de tiempo, mostramos cantidad de materiales
        
      } catch (error) {
        console.error('Error al obtener materiales del parte:', error);
        trabajos = [];
        tiempoTotal = 0;
      }
      
      // Título de la sección de materiales
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(10, currentY, 190, 20, 2, 2, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('MATERIALES UTILIZADOS', 15, currentY + 12);
      
      currentY += 25;
      
      if (trabajos.length > 0) {
        // Tabla de materiales con autoTable
        doc.autoTable({
          startY: currentY,
          head: [['CÓDIGO', 'TIPO', 'ESPESOR', 'DIÁMETRO', 'Ud/Ml', 'MATERIAL', 'P.UNIT.', 'TOTAL']],
          body: trabajos.map(material => [
            material.codigo || 'N/A',
            material.tipo || 'N/A',
            material.espesor ? `${material.espesor}mm` : 'N/A',
            material.diametro || 'N/A',
            material.cantidad || 0,
            material.material || 'N/A',
            material.precio_unitario ? `${material.precio_unitario.toFixed(2)}€` : '0.00€',
            material.precio_total ? `${material.precio_total.toFixed(2)}€` : '0.00€'
          ]),
          theme: 'grid',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'center'
          },
          bodyStyles: {
            fontSize: 7,
            cellPadding: 2,
            valign: 'middle'
          },
          columnStyles: {
            0: { cellWidth: 22, halign: 'center' },  // CÓDIGO
            1: { cellWidth: 20, halign: 'center' },  // TIPO
            2: { cellWidth: 18, halign: 'center' },  // ESPESOR
            3: { cellWidth: 25, halign: 'center' },  // DIÁMETRO
            4: { cellWidth: 15, halign: 'center' },  // Ud/Ml
            5: { cellWidth: 25, halign: 'center' },  // MATERIAL
            6: { cellWidth: 20, halign: 'right' },   // P.UNIT.
            7: { cellWidth: 25, halign: 'right' }    // TOTAL
          },
          margin: { left: 10, right: 10 },
          tableWidth: 'auto',
          styles: {
            overflow: 'linebreak',
            cellPadding: 2,
            fontSize: 7
          }
        });
        
        currentY = doc.lastAutoTable.finalY + 10;
      } else {
        // Mensaje cuando no hay materiales
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(10, currentY, 190, 25, 2, 2, 'F');
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('MATERIALES UTILIZADOS', 15, currentY + 8);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('No se han registrado materiales específicos para este parte.', 15, currentY + 18);
        
        currentY += 35;
      }
      
      // SECCIÓN: Otros Trabajos / Servicios
      let otrosTrabajosData = [];
      let costoOtrosTrabajos = 0;
      try {
        const { supabase: sb } = await import('../lib/supabase');
        const { data: otData, error: otError } = await sb
          .from('partes_empleados_otros_trabajos')
          .select('descripcion, cantidad, unidad, precio_unitario, servicio_id, servicios(codigo)')
          .eq('parte_id', parte.id)
          .order('created_at');

        if (!otError && otData && otData.length > 0) {
          otrosTrabajosData = otData;
          costoOtrosTrabajos = otData.reduce((sum, t) => sum + ((t.cantidad || 0) * (t.precio_unitario || 0)), 0);
        }
      } catch (otErr) {
        console.error('Error al obtener otros trabajos:', otErr);
      }

      if (otrosTrabajosData.length > 0) {
        // Comprobar si necesitamos nueva página
        if (currentY > 230) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFillColor(240, 240, 240);
        doc.roundedRect(10, currentY, 190, 20, 2, 2, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('OTROS TRABAJOS / SERVICIOS', 15, currentY + 12);

        currentY += 25;

        doc.autoTable({
          startY: currentY,
          head: [['DESCRIPCIÓN', 'CANT.', 'UD', 'P.UNIT.', 'SUBTOTAL']],
          body: otrosTrabajosData.map(t => {
            const sub = ((t.cantidad || 0) * (t.precio_unitario || 0));
            const desc = t.servicios?.codigo ? `[${t.servicios.codigo}] ${t.descripcion}` : t.descripcion;
            return [
              desc || '',
              t.cantidad || 0,
              t.unidad || 'Ud',
              t.precio_unitario ? `${Number(t.precio_unitario).toFixed(2)}€` : '0.00€',
              `${sub.toFixed(2)}€`
            ];
          }),
          foot: [['', '', '', 'TOTAL:', `${costoOtrosTrabajos.toFixed(2)}€`]],
          theme: 'grid',
          headStyles: {
            fillColor: [234, 88, 12],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'center'
          },
          bodyStyles: { fontSize: 7, cellPadding: 2, valign: 'middle' },
          footStyles: {
            fillColor: [255, 237, 213],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 25, halign: 'right' }
          },
          margin: { left: 10, right: 10 }
        });

        currentY = doc.lastAutoTable.finalY + 10;
      }

      // SECCIÓN: Resumen de materiales y observaciones generales
      // Comprobar si necesitamos nueva página
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      const costeMateriales = trabajos.reduce((sum, material) => sum + (material.precio_total || 0), 0);
      const costeGeneral = costeMateriales + costoOtrosTrabajos;
      const tieneOtrosTrabajos = otrosTrabajosData.length > 0;
      const altoResumen = (parte.notas && parte.notas.trim()) ? (tieneOtrosTrabajos ? 58 : 50) : (tieneOtrosTrabajos ? 42 : 35);

      doc.setFillColor(240, 240, 240);
      doc.roundedRect(10, currentY, 190, altoResumen, 2, 2, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('RESUMEN Y OBSERVACIONES', 15, currentY + 8);

      // Total de materiales
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Total de materiales:', 15, currentY + 18);
      doc.setFont('helvetica', 'normal');
      doc.text(`${trabajos.length} materiales`, 65, currentY + 18);

      // Coste materiales
      if (trabajos.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Coste materiales:', 95, currentY + 18);
        doc.setFont('helvetica', 'normal');
        doc.text(`${costeMateriales.toFixed(2)}€`, 145, currentY + 18);
      }

      // Otros trabajos resumen
      if (otrosTrabajosData.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Otros trabajos:', 15, currentY + 26);
        doc.setFont('helvetica', 'normal');
        doc.text(`${otrosTrabajosData.length} servicio(s)`, 65, currentY + 26);

        doc.setFont('helvetica', 'bold');
        doc.text('Coste servicios:', 95, currentY + 26);
        doc.setFont('helvetica', 'normal');
        doc.text(`${costoOtrosTrabajos.toFixed(2)}€`, 145, currentY + 26);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('COSTE TOTAL:', 95, currentY + 34);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`${costeGeneral.toFixed(2)}€`, 145, currentY + 34);
      }

      // Observaciones generales del parte
      if (parte.notas && parte.notas.trim()) {
        const notasY = otrosTrabajosData.length > 0 ? currentY + 44 : currentY + 28;
        doc.setFont('helvetica', 'bold');
        doc.text('Observaciones:', 15, notasY);
        doc.setFont('helvetica', 'normal');
        const notasLines = doc.splitTextToSize(parte.notas, 130);
        doc.text(notasLines, 55, notasY);
        currentY += altoResumen + (notasLines.length > 1 ? (notasLines.length * 4) : 0);
      } else {
        currentY += altoResumen;
      }
      
      // SECCIÓN: Materiales y coste
      const yMateriales = currentY + 10;
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(10, yMateriales, 190, 30, 2, 2, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('MATERIALES Y COSTE', 15, yMateriales + 8);
      
      // Grid de información de materiales
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      // Calcular estadísticas de materiales
      const costeTotalMateriales = trabajos.reduce((sum, material) => sum + (material.precio_total || 0), 0);
      const materialesAislamiento = trabajos.filter(m => m.material === 'Aislamiento').length;
      const materialesAluminio = trabajos.filter(m => m.material === 'Aluminio').length;
      
      // Columna 1
      doc.setFont('helvetica', 'bold');
      doc.text('Materiales totales:', 15, yMateriales + 18);
      doc.text('Estado:', 15, yMateriales + 25);
      
      // Columna 1 - Valores
      doc.setFont('helvetica', 'normal');
      doc.text(`${trabajos.length} materiales`, 60, yMateriales + 18);
      doc.text(parte.estado || 'Borrador', 60, yMateriales + 25);
      
      // Columna 2
      doc.setFont('helvetica', 'bold');
      doc.text('Aislamiento:', 105, yMateriales + 18);
      doc.text('Coste materiales:', 105, yMateriales + 25);
      
      // Columna 2 - Valores
      doc.setFont('helvetica', 'normal');
      doc.text(`${materialesAislamiento} / Aluminio: ${materialesAluminio}`, 150, yMateriales + 18);
      doc.text(`${costeTotalMateriales.toFixed(2)}€`, 150, yMateriales + 25);
      
      // SECCIÓN: Imágenes (integradas en el documento)
      let yImagenes = yMateriales + 40;
      
      if (parte.imagenes && parte.imagenes.length > 0) {
        // Verificar si necesitamos nueva página
        const pageHeight = doc.internal.pageSize.height;
        const remainingSpace = pageHeight - yImagenes;
        
        // Si queda poco espacio, añadir nueva página
        if (remainingSpace < 80) {
          doc.addPage();
          yImagenes = 20;
        }
        
        // Título de la sección
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(10, yImagenes, 190, 15, 2, 2, 'F');
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('IMÁGENES DEL TRABAJO', 15, yImagenes + 10);
        
        yImagenes += 25;
        
        // Grid de imágenes optimizado (2 por fila, más compactas)
        const imageWidth = 85;
        const imageHeight = 55;
        const margin = 15;
        const imagesPerRow = 2;
        
        for (let i = 0; i < parte.imagenes.length; i++) {
          const row = Math.floor(i / imagesPerRow);
          const col = i % imagesPerRow;
          const x = margin + (col * (imageWidth + margin));
          const y = yImagenes + (row * (imageHeight + 10));
          
          // Verificar si necesitamos nueva página para esta imagen
          if (y + imageHeight > pageHeight - 30) {
            doc.addPage();
            yImagenes = 20;
            
            // Título en nueva página
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(10, yImagenes, 190, 15, 2, 2, 'F');
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('IMÁGENES DEL TRABAJO (CONTINUACIÓN)', 15, yImagenes + 10);
            
            yImagenes += 25;
            
            // Recalcular posición en nueva página
            const newRow = Math.floor((i % (imagesPerRow * 10)) / imagesPerRow);
            const newY = yImagenes + (newRow * (imageHeight + 10));
            
            await addImageToPDF(doc, parte.imagenes[i], x, newY, imageWidth, imageHeight);
            
            // Borde de la imagen
            doc.setDrawColor(...secondaryColor);
            doc.setLineWidth(0.5);
            doc.rect(x, newY, imageWidth, imageHeight);
            
            // Número de imagen
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Imagen ${i + 1}`, x, newY + imageHeight + 8);
          } else {
            await addImageToPDF(doc, parte.imagenes[i], x, y, imageWidth, imageHeight);
            
            // Borde de la imagen
            doc.setDrawColor(...secondaryColor);
            doc.setLineWidth(0.5);
            doc.rect(x, y, imageWidth, imageHeight);
            
            // Número de imagen
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Imagen ${i + 1}`, x, y + imageHeight + 8);
          }
        }
        
        // Actualizar yImagenes para la siguiente sección
        const lastRow = Math.floor((parte.imagenes.length - 1) / imagesPerRow);
        yImagenes += (lastRow + 1) * (imageHeight + 10) + 15;
      }
      
      // SECCIÓN: Firma (integrada en el documento)
      if (parte.firma) {
        const pageHeight = doc.internal.pageSize.height;
        let yFirma = yImagenes + 20;
        
        // Verificar si necesitamos nueva página para la firma
        if (yFirma + 60 > pageHeight - 20) {
          doc.addPage();
          yFirma = 20;
        }
        
        // Título de la sección de firma
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(10, yFirma, 190, 15, 2, 2, 'F');
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('FIRMA DEL TRABAJADOR', 15, yFirma + 10);
        
        yFirma += 25;
        
        // Añadir la firma
        const firmaWidth = 70;
        const firmaHeight = 40;
        const firmaX = (210 - firmaWidth) / 2; // Centrar en la página
        
        await addImageToPDF(doc, parte.firma, firmaX, yFirma, firmaWidth, firmaHeight);
        
        // Borde para la firma
        doc.setDrawColor(...secondaryColor);
        doc.setLineWidth(0.5);
        doc.rect(firmaX, yFirma, firmaWidth, firmaHeight);
        
        // Línea para el nombre y fecha
        yFirma += firmaHeight + 15;
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.3);
        doc.line(15, yFirma, 95, yFirma);
        doc.line(115, yFirma, 195, yFirma);
        
        // Etiquetas
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Nombre y Apellidos', 15, yFirma + 8);
        doc.text('Fecha', 115, yFirma + 8);
        
        // Datos del trabajador y fecha
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(parte.nombre_trabajador || '', 15, yFirma - 2);
        doc.text(new Date(parte.fecha).toLocaleDateString(), 115, yFirma - 2);
      }
      
      console.log('PDF generado correctamente para empleado:', parte.id);
      return doc;
    } catch (innerError) {
      console.error('Error específico al generar contenido del PDF:', innerError);
      throw innerError;
    }
  } catch (error) {
    console.error('Error general al generar PDF de empleado:', error);
    throw error;
  }
};

export const generatePDF = async (parte) => {
  try {
    console.log('Iniciando generación de PDF para parte:', parte.id);
    
    // Validar que el parte tenga los datos necesarios
    if (!parte || !parte.id) {
      throw new Error('Parte inválido o incompleto');
    }
    
    // Crear documento PDF
    const doc = new jsPDF()
    
    // Colores
    const primaryColor = [41, 79, 177] // Azul índigo
    const secondaryColor = [107, 114, 128] // Gris
    
    // Configurar fuentes
    doc.setFont('helvetica', 'bold')
    
    try {
      // Encabezado con fondo azul
      doc.setFillColor(...primaryColor)
      doc.rect(0, 0, 210, 40, 'F')
      
      // Título en blanco
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.text('Parte de Trabajo', 105, 20, { align: 'center' })
      
      // Número de parte
      doc.setFontSize(16)
      doc.text(`Nº ${parte.numero_parte || ''}`, 105, 35, { align: 'center' })
      
      // Resetear color de texto
      doc.setTextColor(0, 0, 0)
      
      // Información principal
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      
      // Crear una caja de información principal
      doc.setFillColor(245, 247, 250)
      doc.roundedRect(10, 50, 190, 40, 3, 3, 'F')
      
      doc.setTextColor(...primaryColor)
      doc.text('Información General', 15, 60)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      
      // Grid de información 2x2
      const infoGrid = [
        ['Obra:', parte.nombre_obra || '', 'Fecha:', new Date(parte.fecha).toLocaleDateString()],
        ['Trabajador:', parte.nombre_trabajador || '', 'Email:', parte.email_contacto || '']
      ]
      
      infoGrid.forEach((row, i) => {
        row.forEach((text, j) => {
          const x = j < 2 ? 15 : 105
          const y = 70 + (i * 15) // Aumentado el espaciado vertical
          if (j % 2 === 0) {
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...secondaryColor)
          } else {
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(0, 0, 0)
            // Si es un valor, añadir más espacio horizontal
            if (j === 1 || j === 3) {
              doc.text(String(text), x + 25, y)
              return
            }
          }
          doc.text(String(text), x, y)
        })
      })
      
      // Detalles del trabajo
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...primaryColor)
      doc.text('Detalles del Trabajo', 15, 100)
      
      // Tabla de detalles
      doc.autoTable({
        startY: 105,
        head: [['Concepto', 'Cantidad']],
        body: [
          ['Velas', String(parte.num_velas || 0)],
          ['Puntos PVC', String(parte.num_puntos_pvc || 0)],
          ['Montaje Aparatos', String(parte.num_montaje_aparatos || 0)],
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [...primaryColor],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 30, halign: 'center' },
        },
        margin: { left: 15, right: 15 }
      })
      
      // Otros detalles
      const startY = doc.lastAutoTable.finalY + 10
      
      // Caja para otros trabajos (datos de tabla relacional con fallback a campo legacy)
      doc.setFillColor(245, 247, 250)
      doc.roundedRect(10, startY, 190, 40, 3, 3, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...primaryColor)
      doc.text('Otros Trabajos', 15, startY + 10)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)

      let otrosTextoLegacy = parte.otros_trabajos || '-'
      try {
        const { data: otLegacy } = await supabase
          .from('partes_empleados_otros_trabajos')
          .select('descripcion, cantidad, unidad, precio_unitario')
          .eq('parte_id', parte.id)
          .order('created_at')
        if (otLegacy && otLegacy.length > 0) {
          otrosTextoLegacy = otLegacy.map(t => {
            const sub = ((t.cantidad || 0) * (t.precio_unitario || 0))
            return `${t.descripcion} (${t.cantidad} ${t.unidad}${sub > 0 ? ` — ${sub.toFixed(2)}€` : ''})`
          }).join('; ')
        }
      } catch (e) {
        // fallback al campo legacy
      }
      const otrosTrabajosLines = doc.splitTextToSize(otrosTextoLegacy, 180)
      doc.text(otrosTrabajosLines, 15, startY + 20)
      
      // Información adicional
      const infoY = startY + 50
      doc.setFillColor(245, 247, 250)
      doc.roundedRect(10, infoY, 190, 45, 3, 3, 'F') // Reducida la altura del rectángulo
      
      // Función para manejar texto largo
      const formatLongText = (text, maxWidth) => {
        if (!text) return ''
        const words = String(text).split(' ')
        let lines = []
        let currentLine = words[0]

        for (let i = 1; i < words.length; i++) {
          const width = doc.getStringUnitWidth(currentLine + ' ' + words[i]) * doc.internal.getFontSize()
          if (width < maxWidth) {
            currentLine += ' ' + words[i]
          } else {
            lines.push(currentLine)
            currentLine = words[i]
          }
        }
        lines.push(currentLine)
        return lines
      }

      // Reorganizar la información en tres líneas
      const additionalInfo = [
        ['Tiempo Empleado:', parte.tiempo_empleado || ''],
        ['Estado:', parte.estado || ''],
        ['Coste:', parte.coste_trabajos ? `${parte.coste_trabajos}€` : '']
      ]
      
      let currentY = infoY + 12 // Reducido el espaciado inicial
      
      additionalInfo.forEach(([label, value]) => {
        // Etiqueta
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...secondaryColor)
        doc.text(label, 15, currentY)
        
        // Valor
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        
        // Formatear el texto si es necesario
        const maxWidth = 100
        const lines = formatLongText(value, maxWidth)
        
        lines.forEach((line, index) => {
          doc.text(line, 85, currentY + (index * 10)) // Reducido el espaciado entre líneas de 12 a 10
        })
        
        currentY += Math.max(15, lines.length * 10 + 5) // Reducido el espaciado mínimo y entre elementos
      })
      
      // Imágenes del trabajo
      if (parte.imagenes && parte.imagenes.length > 0) {
        // Nueva página para las imágenes
        doc.addPage()
        
        doc.setFillColor(...primaryColor)
        doc.rect(0, 0, 210, 20, 'F')
        
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('Imágenes del Trabajo', 105, 15, { align: 'center' })
        
        // Grid de imágenes (2x2)
        const imagesPerPage = 4
        const imageWidth = 85
        const imageHeight = 60
        const margin = 15
        const startImageY = 30
        
        for (let i = 0; i < parte.imagenes.length; i++) {
          if (i > 0 && i % imagesPerPage === 0) {
            doc.addPage()
            doc.setFillColor(...primaryColor)
            doc.rect(0, 0, 210, 20, 'F')
            doc.setTextColor(255, 255, 255)
            doc.text('Imágenes del Trabajo (continuación)', 105, 15, { align: 'center' })
          }
          
          const row = Math.floor((i % imagesPerPage) / 2)
          const col = i % 2
          const x = margin + (col * (imageWidth + margin))
          const y = startImageY + (row * (imageHeight + margin))
          
          await addImageToPDF(doc, parte.imagenes[i], x, y, imageWidth, imageHeight)
          
          // Añadir borde a la imagen
          doc.setDrawColor(...secondaryColor)
          doc.rect(x, y, imageWidth, imageHeight)
        }
      }
      
      // Firma
      if (parte.firma) {
        const lastY = doc.internal.pageSize.height - 40
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...primaryColor)
        doc.text('Firma del Trabajador', 15, lastY - 10)
        
        await addImageToPDF(doc, parte.firma, 15, lastY, 50, 30)
      }
      
    } catch (error) {
      console.error('Error al generar PDF:', error)
    }
    
    return doc
  } catch (error) {
    console.error('Error al generar PDF:', error)
    throw error
  }
}

export const exportToExcel = async (parte) => {
  // Obtener otros trabajos de la tabla relacional
  let otrosTexto = parte.otros_trabajos || ''
  let nOtrosTrabajos = 0
  let costeOtrosTrabajos = 0
  try {
    const { data: otData } = await supabase
      .from('partes_empleados_otros_trabajos')
      .select('descripcion, cantidad, unidad, precio_unitario')
      .eq('parte_id', parte.id)
      .order('created_at')
    if (otData && otData.length > 0) {
      nOtrosTrabajos = otData.length
      costeOtrosTrabajos = otData.reduce((s, t) => s + ((t.cantidad || 0) * (t.precio_unitario || 0)), 0)
      otrosTexto = otData.map(t => {
        const sub = ((t.cantidad || 0) * (t.precio_unitario || 0))
        return `${t.descripcion} (${t.cantidad} ${t.unidad}${sub > 0 ? ` — ${sub.toFixed(2)}€` : ''})`
      }).join('; ')
    }
  } catch (e) {
    // fallback al campo legacy
  }

  const worksheet = XLSX.utils.json_to_sheet([{
    Obra: parte.nombre_obra || '',
    Trabajador: parte.nombre_trabajador || '',
    Fecha: parte.fecha || '',
    Email: parte.email_contacto || '',
    Velas: parte.num_velas || 0,
    'Puntos PVC': parte.num_puntos_pvc || 0,
    'Montaje Aparatos': parte.num_montaje_aparatos || 0,
    'Otros Trabajos': otrosTexto,
    'Nº Otros Trabajos': nOtrosTrabajos,
    'Coste Otros Trabajos (€)': costeOtrosTrabajos > 0 ? costeOtrosTrabajos.toFixed(2) : '',
    'Tiempo Empleado': parte.tiempo_empleado || '',
    Coste: parte.coste_trabajos || '',
    Estado: parte.estado || '',
  }])

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Parte de Trabajo')

  XLSX.writeFile(workbook, `parte_${parte.id}.xlsx`)
}

export const exportAllToExcel = async (partes) => {
  // Obtener todos los otros trabajos de los partes en una sola query
  const parteIds = partes.map(p => p.id).filter(Boolean)
  let otrosTrabajosMap = {}
  try {
    if (parteIds.length > 0) {
      const { data: allOt } = await supabase
        .from('partes_empleados_otros_trabajos')
        .select('parte_id, descripcion, cantidad, unidad, precio_unitario')
        .in('parte_id', parteIds)
        .order('created_at')
      if (allOt) {
        allOt.forEach(t => {
          if (!otrosTrabajosMap[t.parte_id]) otrosTrabajosMap[t.parte_id] = []
          otrosTrabajosMap[t.parte_id].push(t)
        })
      }
    }
  } catch (e) {
    // fallback: map vacío, usará campo legacy
  }

  // Preparar los datos para Excel
  const excelData = partes.map(parte => {
    const otList = otrosTrabajosMap[parte.id] || []
    const costeOt = otList.reduce((s, t) => s + ((t.cantidad || 0) * (t.precio_unitario || 0)), 0)
    const otTexto = otList.length > 0
      ? otList.map(t => {
          const sub = ((t.cantidad || 0) * (t.precio_unitario || 0))
          return `${t.descripcion} (${t.cantidad} ${t.unidad}${sub > 0 ? ` — ${sub.toFixed(2)}€` : ''})`
        }).join('; ')
      : (parte.otros_trabajos || '')

    return {
      'Nº Parte': parte.numero_parte || '',
      'ID': parte.id || '',
      'Fecha': parte.fecha ? new Date(parte.fecha).toLocaleDateString('es-ES') : '',
      'Obra': parte.nombre_obra || '',
      'Trabajador': parte.nombre_trabajador || '',
      'Email': parte.email_contacto || '',
      'Velas': parte.num_velas || 0,
      'Puntos PVC': parte.num_puntos_pvc || 0,
      'Montaje Aparatos': parte.num_montaje_aparatos || 0,
      'Otros Trabajos': otTexto,
      'Nº Otros Trabajos': otList.length,
      'Coste Otros Trabajos (€)': costeOt > 0 ? costeOt.toFixed(2) : '',
      'Tiempo Empleado': parte.tiempo_empleado || '',
      'Coste (€)': parte.coste_trabajos || '',
      'Estado': parte.estado || '',
      'Fecha Creación': parte.created_at ? new Date(parte.created_at).toLocaleString() : '',
      'Última Modificación': parte.updated_at ? new Date(parte.updated_at).toLocaleString() : ''
    }
  })

  // Crear una nueva hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(excelData)

  // Ajustar el ancho de las columnas
  const columnsWidth = [
    { wch: 8 },  // Nº Parte
    { wch: 8 },  // ID
    { wch: 12 }, // Fecha
    { wch: 30 }, // Obra
    { wch: 20 }, // Trabajador
    { wch: 25 }, // Email
    { wch: 8 },  // Velas
    { wch: 12 }, // Puntos PVC
    { wch: 15 }, // Montaje Aparatos
    { wch: 40 }, // Otros Trabajos
    { wch: 15 }, // Nº Otros Trabajos
    { wch: 18 }, // Coste Otros Trabajos
    { wch: 15 }, // Tiempo Empleado
    { wch: 10 }, // Coste
    { wch: 12 }, // Estado
    { wch: 20 }, // Fecha Creación
    { wch: 20 }  // Última Modificación
  ]
  worksheet['!cols'] = columnsWidth

  // Crear el libro de Excel y añadir la hoja
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Partes de Trabajo')

  // Generar el archivo
  const fecha = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `partes_trabajo_${fecha}.xlsx`)
}

export const sendEmail = async (parte, pdfDoc) => {
  try {
    const pdfData = pdfDoc.output('datauristring')

    const templateParams = {
      to_email: parte.email_contacto,
      from_name: 'Sistema de Partes de Trabajo',
      to_name: parte.nombre_trabajador,
      message: `Adjunto encontrará el parte de trabajo para la obra ${parte.nombre_obra}`,
      pdf_data: pdfData,
    }

    const response = await emailjs.send(
      'YOUR_SERVICE_ID',
      'YOUR_TEMPLATE_ID',
      templateParams,
      'YOUR_USER_ID'
    )

    return response
  } catch (error) {
    throw error
  }
}
