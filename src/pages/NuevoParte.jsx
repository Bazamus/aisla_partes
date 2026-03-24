import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, getCurrentUser } from "../lib/supabase";
import toast from 'react-hot-toast';
import SignaturePad from '../components/SignaturePad';
import ImageUploaderUnified from '../components/ImageUploaderUnified';
import TrabajosCardNuevoRediseniado from '../components/partes-empleados/TrabajosCardNuevoRediseniado';
import { PermissionGuard } from "../components/auth/PermissionGuard";
import { generateParteNumber } from '../utils/parteUtils';
import { useAuth } from '../contexts/AuthContext';
import ModalObraBloqueada from '../components/common/ModalObraBloqueada';

const NuevoParte = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole } = useAuth();

  // ELIMINADO: Hook de detección de móvil ya no necesario
  // Ahora usamos ImageUploaderUnified que funciona en todos los viewports

  // Detectar adminMode automáticamente basado en roles
  const [adminMode, setAdminMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [empleado, setEmpleado] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [obrasEmpleado, setObrasEmpleado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingObras, setLoadingObras] = useState(false);
  const [formData, setFormData] = useState({
    id_obra: '',
    nombre_empleado: '',
    nombre_obra: '',
    cliente: '',
    fecha: new Date().toISOString().slice(0, 10),
    estado: 'Borrador',
    notas: '',
    imagenes: [],
    firma: '',
  });
  
  const [tiempoTotal, setTiempoTotal] = useState(0);
  const [trabajos, setTrabajos] = useState([]);
  const [datosTrabajos, setDatosTrabajos] = useState({
    articulos: [],
    otrosTrabajos: [],
    totalTrabajos: 0,
    hayTrabajos: false
  });
  const [parteCreado, setParteCreado] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [tempParteId, setTempParteId] = useState(() => `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [errorShown, setErrorShown] = useState(false);

  // Estados para el modal de obra bloqueada
  const [showModalObraBloqueada, setShowModalObraBloqueada] = useState(false);
  const [obraSeleccionada, setObraSeleccionada] = useState('');
  const [nuevaObra, setNuevaObra] = useState('');

  // Detectar automáticamente si el usuario es admin
  useEffect(() => {
    const detectAdminMode = () => {
      // Priorizar el adminMode del location.state si existe
      if (location.state?.adminMode !== undefined) {
        setAdminMode(location.state.adminMode);
        console.log('[NuevoParte] AdminMode desde location.state:', location.state.adminMode);
        return;
      }
      
      // Detectar automáticamente basado en roles
      const isAdmin = hasRole('superadmin') || hasRole('administrador');
      setAdminMode(isAdmin);
      console.log('[NuevoParte] AdminMode detectado automáticamente:', isAdmin, {
        superadmin: hasRole('superadmin'),
        administrador: hasRole('administrador')
      });
    };

    detectAdminMode();
  }, [location.state?.adminMode, hasRole]);

  const cargarObrasAsignadas = useCallback(async (empleadoId) => {
    console.log('[Debug NP] Iniciando cargarObrasAsignadas para empleadoId:', empleadoId);
    if (!empleadoId) {
      console.error("[Debug NP] cargarObrasAsignadas: No empleadoId provided");
      setObrasEmpleado([]);
      setLoadingObras(false);
      return;
    }
    setLoadingObras(true);
    try {
      // Filtrar solo obras en estado "En Curso" o "Garantía" (estados activos para trabajo)
      const { data: obrasData, error: obrasError } = await supabase
        .from('empleados_obras')
        .select('obra_id, obras!inner (id, nombre_obra, cliente, numero_obra, estado)')
        .eq('empleado_id', empleadoId)
        .in('obras.estado', ['En Curso', 'Garantía']);

      if (obrasError) {
        console.error('[Debug NP] Error fetching obras asignadas:', obrasError);
        toast.error(`Error al cargar obras asignadas: ${obrasError.message}`);
        setObrasEmpleado([]);
      } else {
        console.log('[Debug NP] Obras asignadas (filtradas por estado activo):', JSON.stringify(obrasData, null, 2));
        
        const obrasValidas = obrasData.filter(item => item.obras && item.obras.id);
        
        const obrasTransformadas = obrasValidas.map(item => ({
          value: String(item.obras.id),
          label: `${item.obras.numero_obra || 'S/N'} - ${item.obras.nombre_obra || 'Sin nombre'} [${item.obras.estado}] (Cliente: ${item.obras.cliente || 'No especificado'})`,
          nombreObra: item.obras.nombre_obra || '',
          cliente: item.obras.cliente || 'No especificado',
          obraId: item.obras.id,
          estado: item.obras.estado
        }));
        
        console.log('[Debug NP] Obras transformadas para el select:', JSON.stringify(obrasTransformadas, null, 2));
        setObrasEmpleado(obrasTransformadas);
        
        if (obrasTransformadas.length > 0 && location.state?.obraId) {
          const obraIdStr = String(location.state.obraId);
          setFormData(prev => ({ ...prev, id_obra: obraIdStr }));
        }
      }
    } catch (error) {
      console.error('[Debug NP] Catch block error in cargarObrasAsignadas:', error);
      toast.error('Error al procesar obras asignadas.');
      setObrasEmpleado([]);
    } finally {
      setLoadingObras(false);
      console.log('[Debug NP] Finalizado cargarObrasAsignadas. LoadingObras:', false);
    }
  }, [supabase, location.state?.obraId]);

  const fetchAllEmployees = useCallback(async () => {
    setLoading(true);
    console.log('[NuevoParte] Cargando lista de empleados para modo administrador...');
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('id, nombre, email, coste_hora_trabajador, coste_hora_empresa');

      if (error) {
        toast.error('Error al cargar la lista de empleados.');
        console.error('Error fetching employees:', error);
      } else {
        console.log('[NuevoParte] Empleados cargados:', data);
        setAllEmployees(data);
      }
    } catch (error) {
      toast.error('Error inesperado al cargar empleados.');
      console.error('Unexpected error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchUserDataForAuthenticatedUser = useCallback(async (userId) => {
    console.log('[NuevoParte] Cargando datos del usuario autenticado:', userId);
    if (!userId) {
      console.error('[NuevoParte] fetchUserDataForAuthenticatedUser: No userId provided');
      setLoading(false);
      return;
    }
    try {
      const { data: empleadoData, error: empleadoError } = await supabase
        .from('empleados')
        .select('id, nombre, email, coste_hora_trabajador, coste_hora_empresa')
        .eq('user_id', userId)
        .single();

      if (empleadoError) {
        console.error('Error fetching employee data for user:', userId, empleadoError);
        
        // Si es admin y no tiene registro de empleado, no mostrar error
        if (hasRole('superadmin') || hasRole('administrador')) {
          console.log('[NuevoParte] Usuario admin sin registro de empleado - modo admin activado');
          setEmpleado(null);
          setLoading(false);
          return;
        }
        
        // Solo mostrar error para usuarios no admin
        if (!errorShown) {
          toast.error('No se encontraron datos de empleado para este usuario. Contacte a un administrador.');
          setErrorShown(true);
        }
        setLoading(false);
        return;
      }

      if (empleadoData) {
        setEmpleado(empleadoData);
        setFormData(prev => ({
          ...prev,
          nombre_empleado: `${empleadoData.nombre}`.trim(),
        }));
        await cargarObrasAsignadas(empleadoData.id);
      }
    } catch (error) {
      toast.error('Ocurrió un error al cargar tus datos.');
      console.error('Error in fetchUserDataForAuthenticatedUser:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, cargarObrasAsignadas, hasRole]);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    // SISTEMA AUTH PERSONALIZADO - obtener usuario actual
    const user = getCurrentUser();

    if (!user) {
      toast.error('Error al obtener el usuario. Por favor, inicia sesión de nuevo.');
      console.error('No user found');
      setLoading(false);
      navigate('/login');
      return;
    }

    console.log('✅ [NuevoParte] Usuario obtenido:', user);
    
    setCurrentUser(user);
    console.log('[NuevoParte useEffect] adminMode:', adminMode, 'Location state:', location.state);
    await fetchUserDataForAuthenticatedUser(user.id);
    
  }, [supabase, navigate, fetchUserDataForAuthenticatedUser]);

  // useEffect separado para inicialización basada en adminMode
  useEffect(() => {
    console.log('[NuevoParte] useEffect inicial - adminMode:', adminMode, 'location.state:', location.state);
    
    // Solo ejecutar si adminMode ya está determinado
    if (adminMode === true) {
      console.log('[NuevoParte] Modo administrador detectado, cargando empleados...');
      fetchAllEmployees();
    } else if (adminMode === false) {
      console.log('[NuevoParte] Modo empleado normal, cargando datos del usuario...');
      fetchInitialData();
    }
    // Si adminMode es undefined, esperar a que se determine
  }, [adminMode, fetchAllEmployees, fetchInitialData]);

  useEffect(() => {
    if (adminMode && allEmployees.length > 0) {
      if (employeeSearch.trim() === '') {
        setFilteredEmployees(allEmployees);
      } else {
        const search = employeeSearch.toLowerCase();
        setFilteredEmployees(
          allEmployees.filter(emp => emp.nombre.toLowerCase().includes(search))
        );
      }
    }
  }, [employeeSearch, allEmployees, adminMode]);

  const handleEmployeeChange = async (e) => {
    const employeeId = e.target.value;
    setSelectedEmployeeId(employeeId);
    setFormData(prevState => ({ ...prevState, id_obra: '' }));

    if (employeeId) {
      const selected = allEmployees.find(emp => emp.id === parseInt(employeeId));
      if (selected) {
        setEmpleado(selected);
        setFormData(prevState => ({
          ...prevState,
          nombre_empleado: `${selected.nombre}`
        }));
      }
      await cargarObrasAsignadas(employeeId);
    } else {
      setObrasEmpleado([]);
    }
  };

  const handleObraChange = (e) => {
    const obraId = e.target.value;
    const obraSeleccionada = obrasEmpleado.find(obra => obra.value === obraId);

    // Verificar si hay trabajos y se está intentando cambiar la obra
    if (datosTrabajos.hayTrabajos && formData.id_obra && obraId !== formData.id_obra && obraId !== '') {
      const obraActual = obrasEmpleado.find(obra => obra.value === formData.id_obra);
      setObraSeleccionada(obraActual ? obraActual.nombreObra : 'Obra actual');
      setNuevaObra(obraSeleccionada ? obraSeleccionada.nombreObra : 'Nueva obra');
      setShowModalObraBloqueada(true);
      return; // No continuar con el cambio hasta que el usuario confirme
    }

    if (obraSeleccionada) {
      setFormData(prevState => ({
        ...prevState,
        id_obra: obraId,
        nombre_obra: obraSeleccionada.nombreObra,
        cliente: obraSeleccionada.cliente,
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        id_obra: '',
        nombre_obra: '',
        cliente: '',
      }));
    }
  };

  // Función para confirmar cambio de obra (eliminar trabajos)
  const handleConfirmarCambioObra = () => {
    // Limpiar todos los trabajos temporales
    setDatosTrabajos({
      articulos: [],
      otrosTrabajos: [],
      totalTrabajos: 0,
      hayTrabajos: false
    });
    
    // Cambiar la obra
    const obraSeleccionada = obrasEmpleado.find(obra => obra.nombreObra === nuevaObra);
    if (obraSeleccionada) {
      setFormData(prevState => ({
        ...prevState,
        id_obra: obraSeleccionada.value,
        nombre_obra: obraSeleccionada.nombreObra,
        cliente: obraSeleccionada.cliente,
      }));
    }
    
    // Cerrar modal
    setShowModalObraBloqueada(false);
    setObraSeleccionada('');
    setNuevaObra('');
    
    toast.success('Obra cambiada. Todos los trabajos han sido eliminados.');
  };

  // Función para cancelar cambio de obra
  const handleCancelarCambioObra = () => {
    setShowModalObraBloqueada(false);
    setObraSeleccionada('');
    setNuevaObra('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Handler para actualizar el tiempo total cuando cambien los trabajos
  const handleTiempoChange = (nuevoTiempo) => {
    setTiempoTotal(nuevoTiempo);
  };

  const handleImageUpload = (filePath) => {
    setFormData(prev => {
      const nuevasImagenes = [...prev.imagenes, filePath];
      return {
        ...prev,
        imagenes: nuevasImagenes
      };
    });
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index)
    }));
  };

  const handleSignatureSave = (signatureDataUrl) => {
    if (signatureDataUrl) {
      setFormData(prev => ({
        ...prev,
        firma: signatureDataUrl
      }));
      toast.success('Firma guardada correctamente');
    } else {
      toast.error('No se puede guardar una firma vacía.');
    }
  };

  // Función para validar si los campos mínimos están completos
  const isFormValid = () => {
    const employeeIdToSave = adminMode ? selectedEmployeeId : empleado?.id;
    const tieneObra = formData.id_obra && formData.id_obra.trim() !== '';
    const tieneFirma = formData.firma && formData.firma.trim() !== '';
    const tieneTrabajos = datosTrabajos.hayTrabajos;
    
    return employeeIdToSave && tieneObra && tieneFirma && tieneTrabajos;
  };

  // Handler para recibir cambios en los trabajos
  const handleTrabajosChange = useCallback((datos) => {
    setDatosTrabajos(datos);
  }, []);

  const handleGuardarParte = async (e) => {
    e.preventDefault();

    // VALIDACIÓN CRÍTICA: Evitar múltiples creaciones de partes
    if (parteCreado && parteCreado.id) {
      toast('El parte ya está guardado.');
      return;
    }

    // Validar campos obligatorios
    const employeeIdToSave = adminMode ? selectedEmployeeId : empleado?.id;

    if (!employeeIdToSave) {
      toast.error('No se ha podido identificar al empleado. Por favor, selecciónalo.');
      return;
    }

    if (!formData.id_obra) {
      toast.error('Debes seleccionar una obra.');
      return;
    }

    if (!formData.firma) {
      toast.error('Debes añadir una firma.');
      return;
    }

    if (!datosTrabajos.hayTrabajos) {
      toast.error('Debes añadir al menos un trabajo o material.');
      return;
    }

    // Datos del parte completo
    const parteData = {
      nombre_obra: formData.nombre_obra,
      cliente: formData.cliente,
      fecha: formData.fecha,
      estado: 'Borrador', // Estado inicial debe ser Borrador
      notas: formData.notas,
      imagenes: formData.imagenes,
      firma: formData.firma,
      empleado_id: employeeIdToSave,
      nombre_trabajador: empleado?.nombre || formData.nombre_empleado || '',
      email_contacto: empleado?.email || '',
      numero_parte: await generateParteNumber(supabase),
      id_obra: formData.id_obra
    };

    setLoading(true);
    try {
      // Si hay trabajos temporales, usar la función completa
      const tieneArticulosTemporales = datosTrabajos.articulos.some(art => art.temporal);
      const tieneOtrosTrabajos = datosTrabajos.otrosTrabajos.length > 0;
      
      let data, error;
      
      if (tieneArticulosTemporales || tieneOtrosTrabajos) {
        // Preparar artículos temporales
        const articulosTemporales = datosTrabajos.articulos
          .filter(art => art.temporal)
          .map(art => ({
            articulo_id: art.articulo_id,
            tipo_precio: art.tipo_precio,
            cantidad: art.cantidad
          }));
        
        // Usar función completa que maneja trabajos temporales
        const response = await supabase.rpc('crear_parte_empleado_completo', {
          parte_data: parteData,
          articulos_temporales: articulosTemporales,
          otros_trabajos_temporales: datosTrabajos.otrosTrabajos
        });
        
        data = response.data;
        error = response.error;
      } else {
        // Usar función básica
        const response = await supabase.rpc('crear_parte_empleado', {
          parte: parteData,
        });
        
        data = response.data;
        error = response.error;
      }

      if (error) {
        throw error;
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      // Manejar ambos formatos: UUID directo o objeto {id, message}
      let parteId;
      if (typeof data === 'string') {
        // Nuevo formato: UUID directo
        parteId = data;
      } else if (data && data.id) {
        // Formato anterior: objeto con id
        parteId = data.id;
      } else {
        throw new Error('Formato de respuesta no válido');
      }

      // Establecer el parte creado
      setParteCreado({ id: parteId });
      
      toast.success('Parte de trabajo guardado exitosamente.');
      
      // Redirigir al inicio después de un momento
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error al crear el parte:', error);
      toast.error(`Error al crear el parte: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 nuevo-parte-mobile mobile-content-wrapper">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <PermissionGuard requiredPermission="partes:crear">
          <form onSubmit={handleGuardarParte} className="space-y-6 md:space-y-8 nuevo-parte-mobile">
                {adminMode && (
                  <div className="bg-blue-50 rounded-xl p-4 md:p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      Seleccionar Empleado
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="employee-search" className="block text-sm font-medium text-gray-700 mb-2">Buscar Empleado</label>
                        <input
                          id="employee-search"
                          type="text"
                          value={employeeSearch}
                          onChange={e => setEmployeeSearch(e.target.value)}
                          placeholder="Escribe para buscar..."
                          className="w-full px-4 py-3 md:py-2 text-base md:text-sm bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out mobile-search-input"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 mb-2">Empleado Seleccionado</label>
                        <select
                          id="employee-select"
                          name="employee-select"
                          value={selectedEmployeeId}
                          onChange={handleEmployeeChange}
                          className="w-full px-4 py-3 md:py-2 text-base md:text-sm bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out mobile-filter-select"
                        >
                          <option value="">-- Elige un empleado --</option>
                          {filteredEmployees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Información Principal */}
                <div className="bg-gray-50 rounded-xl p-4 md:p-6 nuevo-parte-mobile">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        Información Principal
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="mobile-form-group">
                          <label htmlFor="id_obra" className="mobile-field-label">Obra</label>
                          <div className="mobile-obra-field">
                            <select
                              id="id_obra"
                              name="id_obra"
                              value={formData.id_obra || ''}
                              onChange={handleObraChange}
                              disabled={loadingObras}
                              className={`mobile-obra-select mobile-smooth-transition mobile-interactive ${
                                loadingObras ? 'opacity-60 cursor-not-allowed' : ''
                              }`}
                            >
                              <option value="">-- Selecciona una obra --</option>
                              {obrasEmpleado.map((obra) => (
                                <option key={obra.value} value={obra.value}>
                                  {obra.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Bloque informativo de obra bloqueada */}
                          {datosTrabajos.hayTrabajos && formData.nombre_obra && (
                            <div className="mobile-obra-blocked desktop-compact">
                              <div className="blocked-header">
                                <svg className="blocked-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="blocked-content">
                                  <h4 className="blocked-title">
                                    Obra bloqueada: {formData.nombre_obra}
                                  </h4>
                                  <p className="blocked-text">
                                    Este parte tiene trabajos asignados. Para cambiar de obra, debes eliminar todos los trabajos existentes.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                          <input
                            type="date"
                            id="fecha"
                            name="fecha"
                            value={formData.fecha}
                            onChange={handleChange}
                            className="w-full px-4 py-3 md:py-2 text-base md:text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                          />
                        </div>

                        <div>
                          <label htmlFor="nombre_empleado" className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
                          <input
                            type="text"
                            id="nombre_empleado"
                            name="nombre_empleado"
                            value={formData.nombre_empleado}
                            readOnly
                            className="w-full px-4 py-3 md:py-2 text-base md:text-sm bg-gray-100 border border-gray-300 rounded-lg shadow-sm text-gray-600"
                          />
                        </div>

                        <div>
                          <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                          <input
                            type="text"
                            id="cliente"
                            name="cliente"
                            value={formData.cliente}
                            readOnly
                            className="w-full px-4 py-3 md:py-2 text-base md:text-sm bg-gray-100 border border-gray-300 rounded-lg shadow-sm text-gray-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Trabajos Realizados - NUEVA ESTRUCTURA */}
                    <div data-section="trabajos">
                      <TrabajosCardNuevoRediseniado 
                        parteId={parteCreado?.id}
                        readOnly={parteCreado?.estado !== 'Borrador' && parteCreado?.estado !== undefined}
                        onTrabajosChange={handleTrabajosChange}
                      />
                    </div>

                    {/* Botón para finalizar el parte */}
                    {parteCreado && (
                      <div className="bg-green-50 rounded-xl p-6 mb-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-green-800">Parte de trabajo listo</h3>
                              <p className="text-sm text-green-700">
                                Has registrado ${tiempoTotal} horas de trabajo. Parte completado exitosamente.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            Finalizar Parte
                          </button>
                        </div>
                      </div>
                    )}



                    {/* Notas */}
                    <div className="bg-gray-50 rounded-xl p-4 md:p-6 nuevo-parte-mobile">
                      <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        Notas Adicionales
                      </h2>
                      
                      <textarea
                        id="notas"
                        name="notas"
                        value={formData.notas}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-3 md:py-2 text-base md:text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                        placeholder="Añade notas o comentarios..."
                      />
                    </div>

                    {/* Firma */}
                    <div className="bg-gray-50 rounded-xl p-4 md:p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        Firma
                      </h2>
                      
                      <SignaturePad onSave={handleSignatureSave} />
                    </div>

                    {/* Imágenes - Componente Unificado Responsive */}
                    <div
                      className="bg-gray-50 rounded-xl p-4 md:p-6"
                      data-section="imagenes"
                    >
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        Imágenes
                      </h2>

                      <ImageUploaderUnified
                        onImageUpload={handleImageUpload}
                        onRemoveImage={handleRemoveImage}
                        images={formData.imagenes}
                        parteId={parteCreado?.id || tempParteId}
                        isTemporary={!parteCreado?.id}
                      />
                    </div>

                    {/* Botón de Envío */}
                    <div className="bg-gray-50 rounded-xl p-4 md:p-6">
                      {parteCreado && parteCreado.id ? (
                        <button
                          type="button"
                          disabled={true}
                          className="w-full bg-green-600 text-white py-4 md:py-3 px-6 text-base md:text-sm rounded-lg font-medium transition duration-150 ease-in-out disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Parte Guardado Exitosamente
                        </button>
                      ) : (
                        <div className="space-y-3">
                          {/* Indicadores de validación */}
                          <div className="text-sm space-y-1">
                            <div className={`flex items-center ${formData.id_obra ? 'text-green-600' : 'text-gray-500'}`}>
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={formData.id_obra ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                              </svg>
                              Obra seleccionada
                            </div>
                            <div className={`flex items-center ${formData.firma ? 'text-green-600' : 'text-gray-500'}`}>
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={formData.firma ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                              </svg>
                              Firma añadida
                            </div>
                            <div className={`flex items-center ${datosTrabajos.hayTrabajos ? 'text-green-600' : 'text-gray-500'}`}>
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={datosTrabajos.hayTrabajos ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                              </svg>
                              Al menos un trabajo añadido ({datosTrabajos.totalTrabajos})
                            </div>
                          </div>
                          
                          <button
                            type="submit"
                            disabled={loading || !isFormValid()}
                            className={`w-full py-4 md:py-3 px-6 text-base md:text-sm rounded-lg font-medium transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${
                              isFormValid() && !loading
                                ? 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                                : 'bg-gray-400 text-white cursor-not-allowed'
                            }`}
                          >
                            {loading ? 'Guardando Parte...' : 'Guardar Parte'}
                          </button>
                        </div>
                      )}
                    </div>
          </form>
        </PermissionGuard>
      </div>
      
      {/* Modal de Obra Bloqueada */}
      <ModalObraBloqueada
        isOpen={showModalObraBloqueada}
        onClose={handleCancelarCambioObra}
        onConfirm={handleConfirmarCambioObra}
        obraSeleccionada={obraSeleccionada}
        nuevaObra={nuevaObra}
      />
    </div>
  );
};

export default NuevoParte;