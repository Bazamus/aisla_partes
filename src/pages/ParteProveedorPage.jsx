import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as parteProveedorService from '../services/parteProveedorService';
import { supabase } from '../lib/supabase';
import { generateParteNumber } from '../utils/parteUtils';
import InformacionPrincipalCard from '../components/partes-proveedores/InformacionPrincipalCard';
import TrabajosCard from '../components/partes-proveedores/TrabajosCard';
import ImagenesCard from '../components/partes-proveedores/ImagenesCard';
import FirmaCard from '../components/partes-proveedores/FirmaCard';
import { useAuth } from '../contexts/AuthContext';

const ParteProveedorPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { hasRole, user } = useAuth();
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    cliente: '',
    codigo_proveedor: '',
    empresa: '',
    razon_social: '', // ✅ AGREGADO: Campo razon_social
    cif: '',
    email: '',
    telefono: '',
    proveedor_id: null, // Campo para almacenar el ID del proveedor seleccionado
    trabajos: [], // Aseguramos que siempre sea un array
    imagenes: [],
    firma: null,
    coste_total: 0,
    estado: 'Borrador' // Estado por defecto al crear un nuevo parte
  });
  const [imagenes, setImagenes] = useState([]);
  const [firma, setFirma] = useState(null); // Este estado contendrá la URL de la firma de Supabase

  // Cargar datos si estamos editando un parte existente
  useEffect(() => {
    const cargarParte = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const parte = await parteProveedorService.getParteProveedorById(id);
        
        if (parte) {
          setFormData({
            fecha: parte.fecha,
            cliente: parte.cliente || '',
            codigo_proveedor: parte.codigo_proveedor || '',
            empresa: parte.empresa || '',
            razon_social: parte.razon_social || '', // ✅ AGREGADO: Campo razon_social
            cif: parte.cif || '',
            email: parte.email || '',
            telefono: parte.telefono || '',
            proveedor_id: parte.proveedor_id || null,
            trabajos: Array.isArray(parte.trabajos) ? parte.trabajos : [], // Aseguramos que sea un array
            imagenes: parte.imagenes || [],
            firma: parte.firma || null,
            coste_total: parte.coste_total || 0,
            estado: parte.estado || 'Borrador' // Estado por defecto si no existe en la base de datos
          });
          
          // Preparar imágenes para visualización
          if (parte.imagenes && parte.imagenes.length > 0) {
            setImagenes(parte.imagenes.map(url => ({ url })));
          }
          
          // Preparar firma para visualización
          if (parte.firma) {
            setFirma(parte.firma); // Aquí se carga la URL de la firma desde la BD
          }
        }
      } catch (err) {
        console.error('Error al cargar parte de proveedor:', err);
        setError('Error al cargar los datos del parte. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    
    cargarParte();
  }, [id]);

  // Cargar automáticamente los datos del proveedor cuando se crea un nuevo parte
  useEffect(() => {
    const cargarDatosProveedorAutomatico = async () => {
      // Solo ejecutar si es un nuevo parte (no hay ID) y el usuario tiene rol de proveedor
      if (id || !user || !hasRole('proveedor')) return;
      
      try {
        console.log('Cargando datos automáticos del proveedor...');
        setLoading(true);
        
        // Buscar el proveedor por el email del usuario actual
        const { data: proveedorData, error: proveedorError } = await supabase
          .from('proveedores')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (proveedorError) {
          console.error('Error al buscar proveedor por email:', proveedorError);
          return;
        }
        
        if (proveedorData) {
          console.log('Proveedor encontrado:', proveedorData);
          
          // Actualizar el formulario con los datos del proveedor
          setFormData(prev => ({
            ...prev,
            codigo_proveedor: proveedorData.codigo || '',
            empresa: proveedorData.empresa || '',
            razon_social: proveedorData.razon_social || '',
            cif: proveedorData.cif || '',
            email: proveedorData.email || '',
            telefono: proveedorData.telefono || ''
          }));
        } else {
          console.log('No se encontró el proveedor por email, intentando buscar por user_id...');
          
          // Si no se encuentra por email, intentar buscar por user_id
          const { data: proveedorPorUserId, error: errorUserId } = await supabase
            .from('proveedores')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (errorUserId) {
            console.error('Error al buscar proveedor por user_id:', errorUserId);
            return;
          }
          
          if (proveedorPorUserId) {
            console.log('Proveedor encontrado por user_id:', proveedorPorUserId);
            
            // Actualizar el formulario con los datos del proveedor
            setFormData(prev => ({
              ...prev,
              codigo_proveedor: proveedorPorUserId.codigo || '',
              empresa: proveedorPorUserId.empresa || '',
              razon_social: proveedorPorUserId.razon_social || '',
              cif: proveedorPorUserId.cif || '',
              email: proveedorPorUserId.email || '',
              telefono: proveedorPorUserId.telefono || ''
            }));
          }
        }
      } catch (error) {
        console.error('Error al cargar datos automáticos del proveedor:', error);
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatosProveedorAutomatico();
  }, [id, user, hasRole]);

  // Nueva función para manejar la subida de la firma desde FirmaCard
  const handleUploadFirmaParaCard = async (signatureDataUrl) => {
    try {
      // Ahora podemos subir la firma incluso sin ID de parte
      // El servicio guardará la firma en una ubicación temporal si no hay ID
      const publicUrl = await parteProveedorService.uploadParteProveedorSignature(signatureDataUrl, id);
      
      // No actualizamos el formData.firma aquí directamente.
      // La actualización del estado 'firma' se hace a través de la prop 'setFirma' que se pasa a FirmaCard,
      // la cual FirmaCard llamará después de que esta función (onUploadSignature) tenga éxito.
      return publicUrl; // Devolver la URL para que FirmaCard la use
    } catch (error) {
      console.error('Error al subir la firma desde ParteProveedorPage:', error);
      // El error ya se loguea en el servicio y FirmaCard mostrará un toast.
      throw error; // Re-lanzar para que FirmaCard lo maneje
    }
  };

  // Calcular coste total cuando cambien los trabajos
  useEffect(() => {
    const calcularTotal = () => {
      const total = formData.trabajos.reduce((sum, trabajo) => {
        const trabajoTotal = trabajo.lineas.reduce((lineaSum, linea) => lineaSum + linea.total, 0);
        return sum + trabajoTotal;
      }, 0);
      
      setFormData(prev => ({
        ...prev,
        coste_total: total
      }));
    };
    
    calcularTotal();
  }, [formData.trabajos]);

  // Manejar el guardado del parte
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Guardando parte...', formData);
    
    if (!formData.codigo_proveedor || !formData.cliente || formData.trabajos.length === 0) {
      setError('Por favor, completa todos los campos obligatorios y añade al menos un trabajo.');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      let parteId = id;
      let parteGuardado;
      
      // Generar número de parte para proveedores
      const numeroParte = id ? formData.numero_parte : await generateParteNumber(supabase, 'proveedor');
      
      // Preparar datos para guardar
      const datosParaGuardar = {
        fecha: formData.fecha,
        cliente: formData.cliente,
        codigo_proveedor: formData.codigo_proveedor,
        empresa: formData.empresa,
        cif: formData.cif,
        email: formData.email,
        telefono: formData.telefono,
        trabajos: formData.trabajos.map(t => ({ ...t, lineas: t.lineas.map(l => ({...l}))})), // Asegurar copia profunda
        imagenes: [], // Se actualizarán después de subir
        firma: firma, // El estado 'firma' ya contiene la URL de Supabase si se subió desde FirmaCard
        coste_total: formData.coste_total,
        estado: formData.estado,
        numero_parte: numeroParte
      };

      // Incluir proveedor_id si está disponible (caso SuperAdmin)
      if (formData.proveedor_id) {
        datosParaGuardar.proveedor_id = formData.proveedor_id;
      }
      
      console.log('Datos para guardar:', datosParaGuardar);
      
      // Crear o actualizar el parte
      if (id) {
        // Actualizar parte existente
        parteGuardado = await parteProveedorService.updateParteProveedor(id, datosParaGuardar);
        console.log('Parte actualizado:', parteGuardado);
      } else {
        // Crear nuevo parte
        parteGuardado = await parteProveedorService.createParteProveedor(datosParaGuardar);
        console.log('Parte creado:', parteGuardado);
        parteId = parteGuardado.id;
      }
      
      // Las imágenes ya se subieron en ImagenesCard, solo extraer las URLs
      const todasImagenes = imagenes
        .filter(img => img.url) // Solo imágenes que tienen URL (ya subidas)
        .map(img => img.url);
      
      console.log('URLs de imágenes para guardar:', todasImagenes);
      
      // Subir firma si existe
      let firmaUrl = null;
      if (firma && firma.startsWith('data:')) {
        firmaUrl = await parteProveedorService.uploadParteProveedorSignature(firma, parteId);
        console.log('Firma subida:', firmaUrl);
      } else if (firma) {
        firmaUrl = firma; // Mantener URL existente
      }
      
      // Actualizar parte con URLs de imágenes y firma
      await parteProveedorService.updateParteProveedor(parteId, {
        imagenes: todasImagenes,
        firma: firmaUrl
      });
      
              // Mostrar mensaje de éxito y navegar al inicio
      alert('Parte guardado correctamente');
      navigate('/');
    } catch (err) {
      console.error('Error al guardar parte de proveedor:', err);
      setError('Error al guardar el parte. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    // Se eliminó container mx-auto px-4 py-8 para que Layout.jsx controle el contenedor
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {id ? 'Editar Parte de Proveedor' : 'Nuevo Parte de Proveedor'}
      </h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <form>
        <InformacionPrincipalCard formData={formData} setFormData={setFormData} />
        
        <TrabajosCard 
          trabajos={Array.isArray(formData.trabajos) ? formData.trabajos : []} 
          setTrabajos={(trabajos) => setFormData(prev => ({ ...prev, trabajos: Array.isArray(trabajos) ? trabajos : [] }))}
          codigoProveedor={formData.codigo_proveedor}
        />
        
        <ImagenesCard imagenes={imagenes} setImagenes={setImagenes} />
        
        {/* Asegurarse de que 'firma' y 'setFirma' se refieren al estado 'firma' de ParteProveedorPage */}
        <FirmaCard 
          firma={firma} 
          setFirma={setFirma} // Esta prop permite a FirmaCard actualizar el estado 'firma' localmente después de una subida exitosa
          onUploadSignature={handleUploadFirmaParaCard} 
        />
        
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Estado del Parte</h3>
          </div>
          
          <div className="mb-4">
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            {/* Verificar si el usuario tiene un rol que le permita editar el estado */}
            {/* Los roles proveedor y empleado no pueden cambiar el estado, excepto el superadmin admin@partes.com */}
            {/* Implementamos una condición más clara y robusta */}
            {(() => {
              // Prioridad para SuperAdmin (con 'S' mayúscula)
              if (hasRole('SuperAdmin')) return true;
              // Caso especial para el superadmin principal por email
              if (user?.email === 'admin@partes.com') return true;
              
              // Los usuarios con rol proveedor o empleado nunca pueden editar el estado
              if (hasRole('proveedor') || hasRole('empleado')) return false;
              
              // Solo otros roles administrativos pueden editar el estado
              return hasRole('superadmin') || hasRole('admin') || hasRole('administrador') || hasRole('supervisor');
            })() ? (
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                className="w-full md:w-1/3 px-4 py-2.5 bg-white text-gray-900 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <option value="Borrador">Borrador</option>
                <option value="Pendiente de Revisión">Pendiente de Revisión</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Rechazado">Rechazado</option>
              </select>
            ) : (
              <div className="flex items-center">
                <div className={`px-4 py-2.5 rounded-lg border ${
                  formData.estado === 'Borrador' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                  formData.estado === 'Pendiente de Revisión' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                  formData.estado === 'Aprobado' ? 'bg-green-100 text-green-800 border-green-300' :
                  'bg-red-100 text-red-800 border-red-300'
                }`}>
                  {formData.estado}
                </div>
                <span className="ml-3 text-sm text-gray-500 italic">
                  (Solo administradores pueden cambiar el estado)
                </span>
              </div>
            )}
            
            <p className="mt-2 text-sm text-gray-500">
              {formData.estado === 'Borrador' && 'El parte está en modo borrador y puede ser editado libremente antes de enviarlo para revisión.'}
              {formData.estado === 'Pendiente de Revisión' && 'El parte ha sido enviado y está pendiente de revisión por el responsable de obra.'}
              {formData.estado === 'Aprobado' && 'El parte ha sido aprobado por el responsable de obra.'}
              {formData.estado === 'Rechazado' && 'El parte ha sido rechazado y requiere modificaciones.'}
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/partes-proveedores')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || formData.trabajos.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ParteProveedorPage;
