import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, CheckCircleIcon, XCircleIcon, ClockIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext'; // Importar useAuth
import * as parteProveedorService from '../services/parteProveedorService';
import { formatDate } from '../utils/dateUtils';
import { formatParteNumber } from '../utils/formatUtils';
import toast from 'react-hot-toast';
import InformacionPrincipalCard from '../components/partes-proveedores/InformacionPrincipalCard';
import TrabajosCardReadOnly from '../components/partes-proveedores/TrabajosCardReadOnly';
import ImagenesCard from '../components/partes-proveedores/ImagenesCard';
import FirmaCard from '../components/partes-proveedores/FirmaCard';

const VerParteProveedorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth(); // Usar el hook de autenticación
  const [parte, setParte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // No necesitamos estados para secciones colapsables ya que usamos componentes independientes

  // Cargar datos del parte
  useEffect(() => {
    const cargarParte = async () => {
      try {
        setLoading(true);
        const data = await parteProveedorService.getParteProveedorById(id);
        if (data) {
          setParte(data);
        } else {
          setError('No se encontró el parte solicitado');
        }
      } catch (err) {
        console.error('Error al cargar el parte:', err);
        setError('Error al cargar los datos del parte');
        toast.error('Error al cargar el parte');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      cargarParte();
    }
  }, [id]);

  // Función para renderizar el icono de estado
  const renderEstadoIcon = (estado) => {
    switch (estado) {
      case 'Aprobado':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Rechazado':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'Pendiente de Revisión':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Función para obtener la clase de color según el estado
  const getEstadoColorClass = (estado) => {
    switch (estado) {
      case 'Aprobado':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Rechazado':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Pendiente de Revisión':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Volver al listado
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
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Volver al listado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-16">
      {/* Encabezado con botón de volver y título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center px-4 py-2 border border-blue-300 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          <span>Volver al listado</span>
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 text-center sm:text-left flex-grow">
          Parte #{formatParteNumber(parte)}
        </h1>
        
        { (hasRole('SuperAdmin') || hasRole('Administrador') || parte.estado === 'Borrador') && (
          <button
            onClick={() => navigate(`/parte-proveedor/editar/${id}`)}
            className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar Parte
          </button>
        )}
      </div>

      {/* Estado del parte */}
      <div className={`mb-6 p-4 rounded-md border ${getEstadoColorClass(parte.estado)}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-2">
            {renderEstadoIcon(parte.estado)}
          </div>
          <div>
            <h3 className="text-sm font-medium">
              Estado: {parte.estado || 'Borrador'}
            </h3>
          </div>
        </div>
      </div>

      {/* Información Principal */}
      <InformacionPrincipalCard 
        formData={parte} 
        setFormData={() => {}} 
        readOnly={true} 
      />

      {/* Trabajos Realizados */}
      <TrabajosCardReadOnly 
        trabajos={parte.trabajos || []} 
      />

      {/* Imágenes */}
      <ImagenesCard 
        imagenes={parte.imagenes || []} 
        setImagenes={() => {}} 
        readOnly={true} 
      />

      {/* Firma */}
      <FirmaCard 
        firma={parte.firma} 
        setFirma={() => {}} 
        onUploadSignature={() => Promise.resolve()} 
        readOnly={true} 
      />
    </div>
  );
};

export default VerParteProveedorPage;
