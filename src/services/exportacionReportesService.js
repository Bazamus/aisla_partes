import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Servicio para exportar reportes de materiales a Excel y PDF
 */

const formatearNumero = (numero, decimales = 2) => {
  if (numero === null || numero === undefined) return '0';
  return Number(numero).toLocaleString('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  });
};

const formatearMoneda = (numero) => {
  return formatearNumero(numero, 2) + ' €';
};

/**
 * Exporta el reporte completo a Excel con múltiples hojas
 */
export const exportarReporteExcel = (datosGenerales, datosEmpleados, datosObras, datosMateriales, filtros, datosServicios = []) => {
  try {
    const wb = XLSX.utils.book_new();
    
    // HOJA 1: Estadísticas Generales
    const datosGeneralesFormateados = [{
      'Total Partes': datosGenerales.total_partes || 0,
      'Empleados Activos': datosGenerales.total_empleados_activos || 0,
      'Obras Activas': datosGenerales.total_obras_activas || 0,
      'Total Materiales': formatearNumero(datosGenerales.total_materiales_cantidad, 0),
      'Costo Total': formatearMoneda(datosGenerales.costo_total_materiales),
      'Promedio por Parte': formatearMoneda(datosGenerales.promedio_costo_por_parte)
    }];
    
    const wsGeneral = XLSX.utils.json_to_sheet(datosGeneralesFormateados);
    XLSX.utils.book_append_sheet(wb, wsGeneral, 'Resumen General');
    
    // HOJA 2: Resumen por Empleados
    if (datosEmpleados && datosEmpleados.length > 0) {
      const datosEmpleadosFormateados = datosEmpleados.map(emp => ({
        'Código': emp.empleado_codigo || '',
        'Empleado': emp.empleado_nombre || '',
        'Total Partes': emp.total_partes || 0,
        'Aprobados': emp.partes_aprobados || 0,
        'Pendientes': emp.partes_pendientes || 0,
        'Borrador': emp.partes_borrador || 0,
        'Materiales': formatearNumero(emp.total_materiales_cantidad, 0),
        'Costo Total €': formatearNumero(emp.costo_total)
      }));
      
      const wsEmpleados = XLSX.utils.json_to_sheet(datosEmpleadosFormateados);
      XLSX.utils.book_append_sheet(wb, wsEmpleados, 'Por Empleado');
    }
    
    // HOJA 3: Resumen por Obras
    if (datosObras && datosObras.length > 0) {
      const datosObrasFormateados = datosObras.map(obra => ({
        'Número Obra': obra.obra_numero || '',
        'Obra': obra.obra_nombre || '',
        'Cliente': obra.cliente || '',
        'Partes': obra.total_partes || 0,
        'Empleados': obra.total_empleados || 0,
        'Materiales': formatearNumero(obra.total_materiales_cantidad, 0),
        'Costo Total €': formatearNumero(obra.costo_total)
      }));
      
      const wsObras = XLSX.utils.json_to_sheet(datosObrasFormateados);
      XLSX.utils.book_append_sheet(wb, wsObras, 'Por Obra');
    }
    
    // HOJA 4: Detalle de Materiales
    if (datosMateriales && datosMateriales.length > 0) {
      const datosMaterialesFormateados = datosMateriales.map(mat => ({
        'Nº Parte': mat.numero_parte || '',
        'Fecha': mat.fecha || '',
        'Empleado': mat.empleado_nombre || '',
        'Obra': mat.obra_numero || '',
        'Código': mat.codigo_material || '',
        'Tipo': mat.tipo_material || '',
        'Espesor': mat.espesor || '',
        'Diámetro': mat.diametro || '',
        'Cantidad': formatearNumero(mat.cantidad, 2),
        'Precio Unit. €': formatearNumero(mat.precio_unitario),
        'Subtotal €': formatearNumero(mat.subtotal),
        'Material': mat.tipo_precio || ''
      }));
      
      const wsMateriales = XLSX.utils.json_to_sheet(datosMaterialesFormateados);
      XLSX.utils.book_append_sheet(wb, wsMateriales, 'Detalle Materiales');
    }
    
    // HOJA 5: Servicios y Otros Trabajos
    if (datosServicios && datosServicios.length > 0) {
      const datosServiciosFormateados = datosServicios.map(srv => ({
        'Código': srv.codigo || 'Libre',
        'Descripción': srv.descripcion || '',
        'Unidad': srv.unidad || '',
        'Registros': srv.num_registros || 0,
        'Cantidad Total': formatearNumero(srv.total_cantidad, 2),
        'Costo Total €': formatearNumero(srv.total_costo)
      }));

      const wsServicios = XLSX.utils.json_to_sheet(datosServiciosFormateados);
      XLSX.utils.book_append_sheet(wb, wsServicios, 'Servicios');
    }

    const fechaArchivo = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Reporte_Materiales_${fechaArchivo}.xlsx`;

    XLSX.writeFile(wb, nombreArchivo);
    return true;
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    throw new Error('Error al generar el archivo Excel');
  }
};

/**
 * Exporta el reporte a PDF
 */
export const exportarReportePDF = (datosGenerales, datosEmpleados, datosObras, filtros, usuarioNombre = 'Usuario', datosServicios = []) => {
  try {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // ENCABEZADO
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('AISLA - Reporte de Materiales', 105, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${filtros.fechaDesde} - ${filtros.fechaHasta}`, 105, yPosition, { align: 'center' });
    
    yPosition += 15;
    
    // ESTADÍSTICAS GENERALES
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Resumen General', 14, yPosition);
    yPosition += 5;
    
    const estadisticas = [
      ['Total Partes', datosGenerales.total_partes || 0],
      ['Empleados Activos', datosGenerales.total_empleados_activos || 0],
      ['Obras Activas', datosGenerales.total_obras_activas || 0],
      ['Total Materiales', formatearNumero(datosGenerales.total_materiales_cantidad, 0)],
      ['Costo Total', formatearMoneda(datosGenerales.costo_total_materiales)],
      ['Promedio por Parte', formatearMoneda(datosGenerales.promedio_costo_por_parte)]
    ];
    
    doc.autoTable({
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: estadisticas,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 14, right: 14 }
    });
    
    yPosition = doc.lastAutoTable.finalY + 15;
    
    // TABLA DE EMPLEADOS (Top 10)
    if (datosEmpleados && datosEmpleados.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Top 10 Empleados por Costo', 14, yPosition);
      yPosition += 5;
      
      const empleadosTop10 = datosEmpleados.slice(0, 10).map(emp => [
        emp.empleado_codigo || '',
        emp.empleado_nombre || '',
        emp.total_partes || 0,
        formatearMoneda(emp.costo_total || 0)
      ]);
      
      doc.autoTable({
        startY: yPosition,
        head: [['Código', 'Empleado', 'Partes', 'Costo Total']],
        body: empleadosTop10,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: 14, right: 14 }
      });
      
      yPosition = doc.lastAutoTable.finalY + 15;
    }
    
    // TABLA DE OBRAS (Top 10)
    if (datosObras && datosObras.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Top 10 Obras por Costo', 14, yPosition);
      yPosition += 5;
      
      const obrasTop10 = datosObras.slice(0, 10).map(obra => [
        obra.obra_numero || '',
        obra.obra_nombre || '',
        obra.total_partes || 0,
        formatearMoneda(obra.costo_total || 0)
      ]);
      
      doc.autoTable({
        startY: yPosition,
        head: [['Número', 'Obra', 'Partes', 'Costo Total']],
        body: obrasTop10,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: 14, right: 14 }
      });
    }
    
    // TABLA DE SERVICIOS (Top 10)
    if (datosServicios && datosServicios.length > 0) {
      yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : yPosition + 15;
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Top Servicios por Costo', 14, yPosition);
      yPosition += 5;

      const serviciosTop10 = datosServicios.slice(0, 10).map(srv => [
        srv.codigo || 'Libre',
        srv.descripcion || '',
        srv.num_registros || 0,
        formatearNumero(srv.total_cantidad, 2) + ' ' + (srv.unidad || ''),
        formatearMoneda(srv.total_costo || 0)
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Código', 'Descripción', 'Registros', 'Cantidad', 'Costo Total']],
        body: serviciosTop10,
        theme: 'striped',
        headStyles: { fillColor: [234, 88, 12] },
        margin: { left: 14, right: 14 }
      });
    }

    // FOOTER
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generado por: ${usuarioNombre} - ${new Date().toLocaleDateString('es-ES')}`,
        14,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        `Página ${i} de ${totalPages}`,
        doc.internal.pageSize.width - 40,
        doc.internal.pageSize.height - 10
      );
    }
    
    const fechaArchivo = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Reporte_Materiales_${fechaArchivo}.pdf`;
    
    doc.save(nombreArchivo);
    return true;
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    throw new Error('Error al generar el archivo PDF');
  }
};
