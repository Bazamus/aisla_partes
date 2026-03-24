import React from 'react';
import { generarPlantillaEmpleados } from '../templates/plantilla_empleados';
import { generarPlantillaPartesEmpleados } from '../templates/plantilla_partes_empleados';
import { generarPlantillaObras } from '../templates/plantilla_obras';
import toast from 'react-hot-toast';

/**
 * Componente para descargar plantillas de Excel
 * @param {Object} props - Propiedades del componente
 * @param {string} props.tipo - Tipo de plantilla ('empleados' o 'obras')
 * ACTUALIZADO: empleados ahora descarga plantilla con estructura de materiales
 */
const PlantillaDownloader = ({ tipo }) => {
  const handleDownload = () => {
    try {
      if (tipo === 'empleados') {
        generarPlantillaPartesEmpleados();
        toast.success('Plantilla de partes de empleados con materiales descargada correctamente');
      } else if (tipo === 'obras') {
        generarPlantillaObras();
        toast.success('Plantilla de obras descargada correctamente');
      }
    } catch (error) {
      console.error('Error al generar la plantilla:', error);
      toast.error('Error al generar la plantilla');
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Descargar Plantilla
    </button>
  );
};

export default PlantillaDownloader;
