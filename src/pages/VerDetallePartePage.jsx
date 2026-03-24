import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Importar useAuth
import { useParams, useNavigate } from 'react-router-dom';
import { formatParteNumber } from '../utils/formatUtils'; // Corregida ruta de importación
import { ArrowLeftIcon, PencilIcon, CheckCircleIcon, XCircleIcon, ClockIcon, DocumentIcon } from '@heroicons/react/24/outline';
import * as parteProveedorService from '../services/parteProveedorService';
import * as parteEmpleadoService from '../services/parteEmpleadoService'; // Asumimos que este servicio existe o se creará
import { formatDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import InformacionPrincipalCard from '../components/partes-proveedores/InformacionPrincipalCard';
import TrabajosCardReadOnly from '../components/partes-proveedores/TrabajosCardReadOnly';
import ImagenesCard from '../components/partes-proveedores/ImagenesCard';
import FirmaCard from '../components/partes-proveedores/FirmaCard';

// Componentes para Partes de Empleados
import InformacionPrincipalCardEmpleado from '../components/partes-empleados/InformacionPrincipalCardEmpleado';
import TrabajosDetalleCardEmpleado from '../components/partes-empleados/TrabajosDetalleCardEmpleado';
import ImagenesCardEmpleado from '../components/partes-empleados/ImagenesCardEmpleado';
import FirmaCardEmpleado from '../components/partes-empleados/FirmaCardEmpleado';
import EstadoParteCardEmpleado from '../components/partes-empleados/EstadoParteCardEmpleado';

const VerDetallePartePage = () => {
  const { id } = useParams();
  const tipoParte = 'empleado'; // Asumimos 'empleado' para esta página específica
  const navigate = useNavigate();
  const [parte, setParte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { hasRole } = useAuth(); // Obtener hasRole

  useEffect(() => {
    const cargarParte = async () => {
      try {
        setLoading(true);
        setError(null); // Limpiar errores anteriores
        let data;
        // Como tipoParte ahora es siempre 'empleado' para esta página, simplificamos:
        data = await parteEmpleadoService.getParteById(id);

        if (data) {
          setParte(data);
        } else {
          // Si el servicio devuelve null/undefined sin error, el parte no existe
          setError('No se encontró el parte solicitado o no tienes permiso para verlo.');
          toast.error('Parte no encontrado.');
        }
      } catch (err) {
        console.error('Error al cargar el parte:', err);
        setError(`Error al cargar los datos del parte: ${err.message}`);
        toast.error(`Error al cargar el parte: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) { // Solo necesitamos el id para proceder
      cargarParte();
    } else {
      // Si no hay ID, es un estado de ruta incorrecto
      setError('ID del parte no proporcionado en la URL.');
      toast.error('ID del parte no encontrado en la URL.');
      setLoading(false); // Asegurarse de que el spinner se oculte
    }
  }, [id]); // Dependencia actualizada a solo 'id'

  const renderEstadoIcon = (estado) => {
    switch (estado) {
      case 'Aprobado':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Rechazado':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'Pendiente de Revisión':
      case 'Pendiente': // Añadido para partes de empleado si usan este estado
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getEstadoColorClass = (estado) => {
    switch (estado) {
      case 'Aprobado':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Rechazado':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Pendiente de Revisión':
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleEdit = () => {
    if (tipoParte === 'proveedor') {
      navigate(`/parte-proveedor/editar/${id}`);
    } else if (tipoParte === 'empleado') {
      navigate(`/editar-parte/${id}`); // Ruta confirmada por el usuario
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate(-1)} // Volver al dashboard del SuperAdmin
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!parte) {
    return (
      <div className="text-center py-12">
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontró el parte</h3>
        <p className="mt-1 text-sm text-gray-500">El parte que estás buscando no existe o no tienes permiso para verlo.</p>
        <div className="mt-6">
          <button
            onClick={() => navigate(-1)} // Volver al dashboard del SuperAdmin
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Determinar si el botón de editar debe mostrarse
  // Podríamos necesitar lógica más específica si los estados varían mucho entre tipos de parte
  const puedeEditar = hasRole('SuperAdmin') || hasRole('Administrador') || parte.estado === 'Borrador'; 

  return (
    <div className="max-w-4xl mx-auto p-4 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate(-1)} // Volver al inicio del SuperAdmin
          className="flex items-center px-4 py-2 border border-blue-300 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          aria-label="Volver al listado"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          <span>Volver</span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {loading ? 'Cargando...' : `Detalle del Parte ${formatParteNumber(parte)}`}
        </h1>
        
        {puedeEditar && (
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            aria-label="Editar Parte"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar Parte
          </button>
        )}
      </div>

      <div className={`mb-6 p-4 rounded-md border ${getEstadoColorClass(parte.estado)}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-2">
            {renderEstadoIcon(parte.estado)}
          </div>
          <div>
            <h3 className="text-sm font-medium">
              Estado: {parte.estado || 'No definido'}
            </h3>
            {/* Podríamos añadir más detalles del estado si es necesario, ej. fecha de cambio de estado */}
          </div>
        </div>
      </div>

      {/* La siguiente sección para 'proveedor' ya no es relevante aquí, 
         ya que esta página es específica para 'empleado'. 
         Se podría eliminar o mantener comentado si se prevé reutilización futura. 
         Por ahora, se mantiene la lógica condicional por si acaso, aunque tipoParte siempre será 'empleado'. */}
      {tipoParte === 'proveedor' && parte && (
        <>
          {/* Asumiendo que InformacionPrincipalCard y otros de proveedor esperan `formData` o `parte` y `readOnly` */}
          <InformacionPrincipalCard formData={parte} readOnly={true} />
          <TrabajosCardReadOnly trabajos={parte.trabajos_realizados || []} readOnly={true} />
          <ImagenesCard imagenes={parte.imagenes || []} readOnly={true} />
          <FirmaCard firma={parte.firma} readOnly={true} />
          {/* Podríamos añadir un card de estado para proveedor si es necesario o si tiene notas */}
        </>
      )}

      {tipoParte === 'empleado' && parte && (
        <>
          <InformacionPrincipalCardEmpleado parteInfo={parte} />
          <TrabajosDetalleCardEmpleado parteInfo={parte} />
          <ImagenesCardEmpleado imagenes={parte.imagenes || []} readOnly={true} />
          <FirmaCardEmpleado firma={parte.firma} readOnly={true} />
          <EstadoParteCardEmpleado parteInfo={parte} />
        </>
      )}
    </div>
  );
};

export default VerDetallePartePage;
