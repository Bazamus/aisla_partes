import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as parteEmpleadoService from '../../services/parteEmpleadoService';
import * as gruposService from '../../services/gruposService';
import * as trabajosService from '../../services/trabajosService';
import { useMobileDetect } from '../../hooks/useMediaQuery';
import MobileModal from '../common/MobileModal';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { generateParteNumber } from '../../utils/parteUtils';

const TrabajosCardEmpleado = ({ 
  parteId, 
  readOnly = false, 
  onTiempoChange,
  formData = null,
  adminMode = false,
  selectedEmployeeId = null,
  empleado = null,
  onParteCreado = null
}) => {
  // Detectar si estamos en un dispositivo móvil
  const isMobile = useMobileDetect();
  
  // Estados para controlar los modales en dispositivos móviles
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [showSubgrupoModal, setShowSubgrupoModal] = useState(false);
  const [showTrabajosModal, setShowTrabajosModal] = useState(false);
  const [showBusquedaModal, setShowBusquedaModal] = useState(false);
  
  // Estados principales
  const [trabajosLineas, setTrabajosLineas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    tiempo_total: 0,
    total_lineas: 0,
    trabajos_catalogo: 0,
    trabajos_manuales: 0,
    tiempo_promedio_por_trabajo: 0
  });
  
  // Estados para grupos y subgrupos
  const [grupos, setGrupos] = useState([]);
  const [subgrupos, setSubgrupos] = useState([]);
  const [trabajosDisponibles, setTrabajosDisponibles] = useState([]);
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [selectedSubgrupo, setSelectedSubgrupo] = useState(null);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [loadingSubgrupos, setLoadingSubgrupos] = useState(false);
  const [loadingTrabajos, setLoadingTrabajos] = useState(false);
  
  // Estados para búsqueda libre
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  
  // Estados para trabajos manuales
  const [showTrabajoManual, setShowTrabajoManual] = useState(false);
  const [trabajoManual, setTrabajoManual] = useState({
    descripcion: '',
    tiempo_empleado: 1.0,
    observaciones: ''
  });
  
  // Estados para edición de líneas
  const [editingLineaId, setEditingLineaId] = useState(null);
  const [tiempoTemporal, setTiempoTemporal] = useState({});
  
  // Estado para prevenir múltiples creaciones de partes
  const [creandoParte, setCreandoParte] = useState(false);
  
  const trabajosRef = useRef(null);

  // Cargar trabajos del parte al montar el componente
  useEffect(() => {
    console.log('🔄 [DEBUG] useEffect TrabajosCardEmpleado ejecutándose');
    console.log('🔄 [DEBUG] parteId en useEffect:', parteId);
    console.log('🔄 [DEBUG] Tipo de parteId en useEffect:', typeof parteId);
    
    if (parteId) {
      console.log('✅ [DEBUG] parteId existe, llamando cargarTrabajosDelParte');
      cargarTrabajosDelParte();
    } else {
      console.log('⚠️ [DEBUG] parteId es null/undefined, no se carga nada');
    }
  }, [parteId]);

  // Cargar grupos al montar el componente
  useEffect(() => {
    cargarGrupos();
  }, []);

  // Cargar estadísticas cuando cambien los trabajos
  useEffect(() => {
    if (trabajosLineas.length >= 0) {
      cargarEstadisticas();
    }
  }, [trabajosLineas]);

  // Función para validar si un string es UUID válido
  const isValidUUID = (str) => {
    if (!str || typeof str !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Función para cargar trabajos del parte
  const cargarTrabajosDelParte = async () => {
    console.log('🔍 [DEBUG] cargarTrabajosDelParte - parteId recibido:', parteId);
    console.log('🔍 [DEBUG] Tipo de parteId:', typeof parteId);
    
    if (!parteId) {
      console.log('⚠️ [DEBUG] No hay parteId, limpiando trabajos');
      setTrabajosLineas([]);
      setLoading(false);
      return;
    }
    
    // Validar que parteId es UUID válido
    if (!isValidUUID(parteId)) {
      console.error('❌ [ERROR] parteId no es UUID válido:', parteId);
      console.error('❌ [ERROR] Se esperaba UUID pero se recibió:', typeof parteId, parteId);
      toast.error('Error: ID de parte inválido. Debe ser UUID.');
      setTrabajosLineas([]);
      setLoading(false);
      return;
    }
    
    console.log('✅ [DEBUG] parteId es UUID válido, procediendo con la carga');
    setLoading(true);
    
    try {
      console.log('🔄 [DEBUG] Llamando a obtenerTrabajosParteEmpleado con parteId:', parteId);
      const data = await parteEmpleadoService.obtenerTrabajosParteEmpleado(parteId);
      console.log('📥 [DEBUG] Respuesta del servicio:', data);
      
      if (data.success) {
        console.log('✅ [DEBUG] Trabajos cargados exitosamente:', data.trabajos?.length || 0, 'trabajos');
        setTrabajosLineas(data.trabajos || []);
        // Notificar cambio de tiempo total al componente padre
        if (onTiempoChange) {
          onTiempoChange(data.tiempo_total || 0);
        }
      } else {
        console.error('❌ [ERROR] Error al cargar trabajos:', data.error);
        toast.error('Error al cargar trabajos del parte');
      }
    } catch (error) {
      console.error('❌ [ERROR] Excepción al cargar trabajos del parte:', error);
      toast.error('Error al cargar trabajos del parte');
    } finally {
      setLoading(false);
    }
  };

  // Función para crear parte automáticamente cuando se agrega el primer trabajo
  const crearParteAutomaticamente = async () => {
    // Si ya se está creando un parte, esperar
    if (creandoParte) {
      throw new Error('Ya se está creando un parte. Por favor espera...');
    }

    setCreandoParte(true);
    let toastId = null;

    try {
      toastId = toast.loading('Creando parte automáticamente...');

      // Validar que existen los datos del formulario
      if (!formData) {
        throw new Error('No hay datos del formulario disponibles. Completa la información básica primero.');
      }

      // Usar empleado del contexto o seleccionado en modo admin
      const employeeIdToSave = adminMode ? selectedEmployeeId : empleado?.id;
      
      if (!employeeIdToSave) {
        throw new Error('No se ha podido identificar al empleado. Por favor, selecciónalo.');
      }

      // Validar campos obligatorios
      if (!formData.id_obra) {
        throw new Error('Debes seleccionar una obra antes de agregar trabajos.');
      }

      if (!formData.fecha) {
        throw new Error('Debes especificar una fecha antes de agregar trabajos.');
      }

      if (!formData.firma) {
        throw new Error('Debes agregar tu firma antes de agregar trabajos.');
      }

      // Datos completos del parte
      const parteData = {
        nombre_obra: formData.nombre_obra,
        cliente: formData.cliente,
        fecha: formData.fecha,
        estado: 'En Progreso',
        notas: formData.notas || '',
        imagenes: formData.imagenes || [],
        firma: formData.firma,
        empleado_id: employeeIdToSave,
        nombre_trabajador: empleado?.nombre || formData.nombre_empleado || '',
        email_contacto: empleado?.email || '',
        numero_parte: await generateParteNumber(supabase),
        id_obra: formData.id_obra
      };

      console.log('🚀 Creando parte automáticamente con datos completos:', parteData);

      const { data, error } = await supabase.rpc('crear_parte_empleado', {
        parte: parteData,
      });

      if (error) {
        throw error;
      }

      // data es directamente el UUID del parte
      const nuevoParteId = typeof data === 'string' ? data : data.id;
      
      console.log('✅ Parte creado automáticamente:', nuevoParteId);
      
      // Cerrar toast de loading
      if (toastId) {
        toast.dismiss(toastId);
      }
      
      // Mostrar éxito
      toast.success('Parte creado automáticamente');
      
      // Notificar al componente padre que se creó el parte
      if (onParteCreado) {
        onParteCreado({ id: nuevoParteId });
      }

      return nuevoParteId;
    } catch (error) {
      // Cerrar toast de loading si existe
      if (toastId) {
        toast.dismiss(toastId);
      }
      throw error;
    } finally {
      setCreandoParte(false);
    }
  };

  // Función para cargar estadísticas
  const cargarEstadisticas = async () => {
    if (!parteId) return;
    
    try {
      const stats = await parteEmpleadoService.obtenerEstadisticasTrabajosParte(parteId);
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  // Función para cargar grupos
  const cargarGrupos = async () => {
    setLoadingGrupos(true);
    try {
      const data = await gruposService.getGrupos();
      setGrupos(data);
    } catch (error) {
      console.error('Error al cargar grupos:', error);
      toast.error('Error al cargar grupos');
    } finally {
      setLoadingGrupos(false);
    }
  };

  // Función para cargar subgrupos
  const cargarSubgrupos = async (grupoId) => {
    if (!grupoId) {
      setSubgrupos([]);
      setSelectedSubgrupo(null);
      return;
    }
    
    setLoadingSubgrupos(true);
    try {
      const data = await gruposService.getSubgruposByGrupoId(grupoId);
      setSubgrupos(data);
    } catch (error) {
      console.error('Error al cargar subgrupos:', error);
      toast.error('Error al cargar subgrupos');
    } finally {
      setLoadingSubgrupos(false);
    }
  };

  // Función para cargar trabajos por grupo/subgrupo
  const cargarTrabajosPorGrupo = async (grupoId, subgrupoId = null) => {
    if (!grupoId) {
      setTrabajosDisponibles([]);
      return;
    }
    
    setLoadingTrabajos(true);
    try {
      const data = await gruposService.getTrabajosByGrupoAndSubgrupo(grupoId, subgrupoId);
      setTrabajosDisponibles(data);
    } catch (error) {
      console.error('Error al cargar trabajos:', error);
      toast.error('Error al cargar trabajos');
    } finally {
      setLoadingTrabajos(false);
    }
  };

  // Función para búsqueda libre de trabajos
  const buscarTrabajos = async (texto) => {
    if (!texto || texto.length < 2) {
      setResultadosBusqueda([]);
      return;
    }
    
    setLoadingBusqueda(true);
    try {
      const data = await trabajosService.buscarTrabajosPorTexto(texto);
      setResultadosBusqueda(data);
    } catch (error) {
      console.error('Error en búsqueda de trabajos:', error);
      toast.error('Error en la búsqueda');
    } finally {
      setLoadingBusqueda(false);
    }
  };

  // Handlers para selección de grupo/subgrupo
  const handleGrupoSelect = (grupo) => {
    setSelectedGrupo(grupo);
    setSelectedSubgrupo(null);
    cargarSubgrupos(grupo.id);
    cargarTrabajosPorGrupo(grupo.id);
    if (isMobile) setShowGrupoModal(false);
  };

  const handleSubgrupoSelect = (subgrupo) => {
    setSelectedSubgrupo(subgrupo);
    cargarTrabajosPorGrupo(selectedGrupo.id, subgrupo.id);
    if (isMobile) setShowSubgrupoModal(false);
  };

  // Handler para agregar trabajo del catálogo
  const handleAgregarTrabajo = async (trabajo) => {
    try {
      // Si no hay parteId, crear el parte automáticamente
      let currentParteId = parteId;
      if (!currentParteId) {
        currentParteId = await crearParteAutomaticamente();
      }

      const trabajoData = {
        trabajo_id: trabajo.id,
        descripcion: trabajo.descripcion,
        tiempo_empleado: 1.0, // Tiempo por defecto
        tipo_trabajo: 'catalogo',
        grupo_id: selectedGrupo?.id || null,
        subgrupo_id: selectedSubgrupo?.id || null
      };

      const result = await parteEmpleadoService.agregarTrabajoEmpleado(currentParteId, trabajoData);
      
      if (result.success) {
        toast.success('Trabajo agregado exitosamente');
        await cargarTrabajosDelParte(); // Recargar lista
        // Limpiar selecciones
        setSelectedGrupo(null);
        setSelectedSubgrupo(null);
        setSubgrupos([]);
        setTrabajosDisponibles([]);
        if (isMobile) setShowTrabajosModal(false);
      } else {
        toast.error(result.error || 'Error al agregar trabajo');
      }
    } catch (error) {
      console.error('Error al agregar trabajo:', error);
      toast.error(`Error al agregar trabajo: ${error.message}`);
    }
  };

  // Handler para agregar trabajo manual
  const handleAgregarTrabajoManual = async () => {
    if (!trabajoManual.descripcion.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }

    if (trabajoManual.tiempo_empleado <= 0) {
      toast.error('El tiempo empleado debe ser mayor que 0');
      return;
    }

    try {
      // Si no hay parteId, crear el parte automáticamente
      let currentParteId = parteId;
      if (!currentParteId) {
        currentParteId = await crearParteAutomaticamente();
      }

      const trabajoData = {
        descripcion: trabajoManual.descripcion.trim(),
        tiempo_empleado: parseFloat(trabajoManual.tiempo_empleado),
        observaciones: trabajoManual.observaciones.trim(),
        tipo_trabajo: 'manual'
      };

      const result = await parteEmpleadoService.agregarTrabajoEmpleado(currentParteId, trabajoData);
      
      if (result.success) {
        toast.success('Trabajo manual agregado exitosamente');
        await cargarTrabajosDelParte(); // Recargar lista
        // Limpiar formulario
        setTrabajoManual({
          descripcion: '',
          tiempo_empleado: 1.0,
          observaciones: ''
        });
        setShowTrabajoManual(false);
      } else {
        toast.error(result.error || 'Error al agregar trabajo manual');
      }
    } catch (error) {
      console.error('Error al agregar trabajo manual:', error);
      toast.error(`Error al agregar trabajo manual: ${error.message}`);
    }
  };

  // Handler para actualizar tiempo empleado
  const handleActualizarTiempo = async (lineaId, nuevoTiempo) => {
    if (nuevoTiempo <= 0) {
      toast.error('El tiempo debe ser mayor que 0');
      return;
    }

    try {
      const result = await parteEmpleadoService.actualizarTiempoTrabajoEmpleado(lineaId, nuevoTiempo);
      
      if (result.success) {
        toast.success('Tiempo actualizado');
        await cargarTrabajosDelParte(); // Recargar lista
        setEditingLineaId(null);
        setTiempoTemporal({});
      } else {
        toast.error(result.error || 'Error al actualizar tiempo');
      }
    } catch (error) {
      console.error('Error al actualizar tiempo:', error);
      toast.error('Error al actualizar tiempo');
    }
  };

  // Handler para eliminar línea de trabajo
  const handleEliminarTrabajo = async (lineaId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este trabajo?')) {
      return;
    }

    try {
      const result = await parteEmpleadoService.eliminarTrabajoEmpleado(lineaId);
      
      if (result.success) {
        toast.success('Trabajo eliminado');
        await cargarTrabajosDelParte(); // Recargar lista
      } else {
        toast.error(result.error || 'Error al eliminar trabajo');
      }
    } catch (error) {
      console.error('Error al eliminar trabajo:', error);
      toast.error('Error al eliminar trabajo');
    }
  };

  // Handler para búsqueda libre
  const handleBusquedaChange = useCallback((texto) => {
    setBusquedaTexto(texto);
    if (texto.length >= 2) {
      buscarTrabajos(texto);
    } else {
      setResultadosBusqueda([]);
    }
  }, []);

  // Handler para agregar trabajo desde búsqueda libre
  const handleAgregarDesdeBusqueda = async (trabajo) => {
    try {
      // Si no hay parteId, crear el parte automáticamente
      let currentParteId = parteId;
      if (!currentParteId) {
        currentParteId = await crearParteAutomaticamente();
      }

      const trabajoData = {
        trabajo_id: trabajo.id,
        descripcion: trabajo.descripcion,
        tiempo_empleado: 1.0,
        tipo_trabajo: 'catalogo'
      };

      const result = await parteEmpleadoService.agregarTrabajoEmpleado(currentParteId, trabajoData);
      
      if (result.success) {
        toast.success('Trabajo agregado exitosamente');
        await cargarTrabajosDelParte();
        setBusquedaTexto('');
        setResultadosBusqueda([]);
        if (isMobile) setShowBusquedaModal(false);
      } else {
        toast.error(result.error || 'Error al agregar trabajo');
      }
    } catch (error) {
      console.error('Error al agregar trabajo:', error);
      toast.error(`Error al agregar trabajo: ${error.message}`);
    }
  };

  // Función para validar si se pueden agregar trabajos
  const puedeAgregarTrabajos = () => {
    if (parteId) return true; // Si ya existe el parte, permitir agregar trabajos
    
    // Solo validar que haya un empleado seleccionado (igual que en NuevoParte.jsx)
    const employeeIdToSave = adminMode ? selectedEmployeeId : empleado?.id;
    return employeeIdToSave; // Solo requiere empleado, no obra, fecha ni firma
  };

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // Si no se pueden agregar trabajos, mostrar mensaje informativo
  if (!puedeAgregarTrabajos() && !readOnly) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Trabajos Realizados</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-amber-800">Selecciona un empleado</h3>
              <p className="text-sm text-amber-700 mt-1">
                Para agregar trabajos, debes seleccionar un <strong>empleado</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

return (
<div className="bg-white shadow-md rounded-lg p-6 mb-6">
<div className="flex justify-between items-center mb-6">
<h2 className="text-xl font-semibold text-gray-800">Trabajos Realizados</h2>
{!readOnly && (
<div className="flex flex-wrap gap-2">
<button
type="button"
onClick={() => isMobile ? setShowGrupoModal(true) : null}
className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
disabled={loadingGrupos || creandoParte}
>
{isMobile ? 'Añadir por Grupo' : 'Grupos'}
</button>
<button
type="button"
onClick={() => isMobile ? setShowBusquedaModal(true) : null}
className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
disabled={creandoParte}
>
{isMobile ? 'Buscar Trabajo' : 'Búsqueda Libre'}
</button>
<button
type="button"
onClick={() => setShowTrabajoManual(true)}
className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
disabled={creandoParte}
>
Trabajo Manual
</button>
</div>
)}
</div>


{/* Estadísticas */}
<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
<div className="text-center">
<div className="text-2xl font-bold text-blue-600">{estadisticas.tiempo_total}h</div>
<div className="text-xs text-gray-600">Tiempo Total</div>
</div>
<div className="text-center">
<div className="text-2xl font-bold text-green-600">{estadisticas.total_lineas}</div>
<div className="text-xs text-gray-600">Trabajos</div>
</div>
<div className="text-center">
<div className="text-2xl font-bold text-purple-600">{estadisticas.trabajos_catalogo}</div>
<div className="text-xs text-gray-600">Catálogo</div>
</div>
<div className="text-center">
<div className="text-2xl font-bold text-orange-600">{estadisticas.trabajos_manuales}</div>
<div className="text-xs text-gray-600">Manuales</div>
</div>
<div className="text-center">
<div className="text-2xl font-bold text-gray-600">{estadisticas.tiempo_promedio_por_trabajo}h</div>
<div className="text-xs text-gray-600">Promedio</div>
</div>
</div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{estadisticas.tiempo_total}h</div>
          <div className="text-xs text-gray-600">Tiempo Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{estadisticas.total_lineas}</div>
          <div className="text-xs text-gray-600">Trabajos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{estadisticas.trabajos_catalogo}</div>
          <div className="text-xs text-gray-600">Catálogo</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{estadisticas.trabajos_manuales}</div>
          <div className="text-xs text-gray-600">Manuales</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{estadisticas.tiempo_promedio_por_trabajo}h</div>
          <div className="text-xs text-gray-600">Promedio</div>
        </div>
      </div>

      {/* Sección Desktop para selección de grupos (solo si no es móvil) */}
      {!isMobile && !readOnly && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-4">Añadir Trabajo por Grupos</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Selector de Grupo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
              <select
                value={selectedGrupo?.id || ''}
                onChange={(e) => {
                  const grupo = grupos.find(g => g.id === e.target.value);
                  handleGrupoSelect(grupo);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingGrupos}
              >
                <option value="">Seleccionar grupo...</option>
                {grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Subgrupo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subgrupo</label>
              <select
                value={selectedSubgrupo?.id || ''}
                onChange={(e) => {
                  const subgrupo = subgrupos.find(s => s.id === e.target.value);
                  handleSubgrupoSelect(subgrupo);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedGrupo || loadingSubgrupos}
              >
                <option value="">Seleccionar subgrupo...</option>
                {subgrupos.map((subgrupo) => (
                  <option key={subgrupo.id} value={subgrupo.id}>
                    {subgrupo.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Búsqueda libre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda Libre</label>
              <input
                type="text"
                value={busquedaTexto}
                onChange={(e) => handleBusquedaChange(e.target.value)}
                placeholder="Buscar trabajo..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Lista de trabajos disponibles */}
          {trabajosDisponibles.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-2">Trabajos Disponibles</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {trabajosDisponibles.map((trabajo) => (
                  <div
                    key={trabajo.id}
                    className={`flex justify-between items-center p-2 border rounded ${creandoParte ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}`}
                    onClick={creandoParte ? null : () => handleAgregarTrabajo(trabajo)}
                  >
                    <span className="text-sm">{trabajo.descripcion}</span>
                    <button 
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={creandoParte}
                    >
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resultados de búsqueda libre */}
          {resultadosBusqueda.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-2">Resultados de Búsqueda</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {resultadosBusqueda.map((trabajo) => (
                  <div
                    key={trabajo.id}
                    className={`flex justify-between items-center p-2 border rounded ${creandoParte ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}`}
                    onClick={creandoParte ? null : () => handleAgregarDesdeBusqueda(trabajo)}
                  >
                    <div>
                      <span className="text-sm font-medium">{trabajo.descripcion}</span>
                      {trabajo.grupo_principal && (
                        <span className="text-xs text-gray-500 ml-2">
                          {trabajo.grupo_principal} - {trabajo.subgrupo}
                        </span>
                      )}
                    </div>
                    <button className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de trabajos agregados */}
      <div ref={trabajosRef}>
        <h3 className="text-lg font-medium mb-4">Trabajos Agregados ({trabajosLineas.length})</h3>
        
        {trabajosLineas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay trabajos agregados todavía.</p>
            {!readOnly && (
              <p className="text-sm mt-2">Utiliza los botones de arriba para agregar trabajos.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {trabajosLineas.map((linea, index) => (
              <div key={linea.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Descripción del trabajo */}
                  <div className="md:col-span-5">
                    <div className="font-medium text-gray-800">
                      {linea.descripcion}
                    </div>
                    {linea.tipo_trabajo === 'manual' && (
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded mt-1">
                        Trabajo Manual
                      </span>
                    )}
                    {linea.observaciones && (
                      <div className="text-sm text-gray-600 mt-1">
                        {linea.observaciones}
                      </div>
                    )}
                  </div>

                  {/* Tiempo empleado */}
                  <div className="md:col-span-3">
                    {editingLineaId === linea.id && !readOnly ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={tiempoTemporal[linea.id] || linea.tiempo_empleado}
                          onChange={(e) => setTiempoTemporal({
                            ...tiempoTemporal,
                            [linea.id]: parseFloat(e.target.value) || 0
                          })}
                          min="0.1"
                          step="0.1"
                          className="w-20 px-2 py-1 border rounded text-sm"
                        />
                        <span className="text-sm text-gray-600">h</span>
                        <button
                          onClick={() => handleActualizarTiempo(linea.id, tiempoTemporal[linea.id] || linea.tiempo_empleado)}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingLineaId(null);
                            setTiempoTemporal({});
                          }}
                          className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-600">
                          {linea.tiempo_empleado}h
                        </span>
                        {!readOnly && (
                          <button
                            onClick={() => {
                              setEditingLineaId(linea.id);
                              setTiempoTemporal({
                                ...tiempoTemporal,
                                [linea.id]: linea.tiempo_empleado
                              });
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fecha de creación */}
                  <div className="md:col-span-2 text-sm text-gray-500">
                    {new Date(linea.created_at).toLocaleDateString()}
                  </div>

                  {/* Acciones */}
                  {!readOnly && (
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        onClick={() => handleEliminarTrabajo(linea.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para trabajo manual */}
      {showTrabajoManual && !readOnly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Agregar Trabajo Manual</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del Trabajo *
                </label>
                <textarea
                  value={trabajoManual.descripcion}
                  onChange={(e) => setTrabajoManual({
                    ...trabajoManual,
                    descripcion: e.target.value
                  })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Describe el trabajo realizado..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo Empleado (horas) *
                </label>
                <input
                  type="number"
                  value={trabajoManual.tiempo_empleado}
                  onChange={(e) => setTrabajoManual({
                    ...trabajoManual,
                    tiempo_empleado: parseFloat(e.target.value) || 0
                  })}
                  min="0.1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={trabajoManual.observaciones}
                  onChange={(e) => setTrabajoManual({
                    ...trabajoManual,
                    observaciones: e.target.value
                  })}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTrabajoManual(false);
                  setTrabajoManual({
                    descripcion: '',
                    tiempo_empleado: 1.0,
                    observaciones: ''
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAgregarTrabajoManual}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!trabajoManual.descripcion.trim() || trabajoManual.tiempo_empleado <= 0 || creandoParte}
              >
                Agregar Trabajo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales móviles */}
      {isMobile && (
        <>
          {/* Modal de grupos */}
          <MobileModal
            isOpen={showGrupoModal}
            onClose={() => setShowGrupoModal(false)}
            title="Seleccionar Grupo"
          >
            <div className="space-y-2">
              {grupos.map((grupo) => (
                <button
                  key={grupo.id}
                  onClick={() => handleGrupoSelect(grupo)}
                  className="w-full text-left p-3 border rounded hover:bg-gray-100"
                >
                  {grupo.nombre}
                </button>
              ))}
            </div>
          </MobileModal>

          {/* Modal de subgrupos */}
          <MobileModal
            isOpen={showSubgrupoModal}
            onClose={() => setShowSubgrupoModal(false)}
            title="Seleccionar Subgrupo"
          >
            <div className="space-y-2">
              <button
                onClick={() => {
                  setSelectedSubgrupo(null);
                  cargarTrabajosPorGrupo(selectedGrupo.id);
                  setShowSubgrupoModal(false);
                  setShowTrabajosModal(true);
                }}
                className="w-full text-left p-3 border rounded hover:bg-gray-100 font-medium"
              >
                Todos los trabajos del grupo
              </button>
              {subgrupos.map((subgrupo) => (
                <button
                  key={subgrupo.id}
                  onClick={() => {
                    handleSubgrupoSelect(subgrupo);
                    setShowTrabajosModal(true);
                  }}
                  className="w-full text-left p-3 border rounded hover:bg-gray-100"
                >
                  {subgrupo.nombre}
                </button>
              ))}
            </div>
          </MobileModal>

          {/* Modal de trabajos */}
          <MobileModal
            isOpen={showTrabajosModal}
            onClose={() => setShowTrabajosModal(false)}
            title="Seleccionar Trabajo"
          >
            <div className="space-y-2">
              {trabajosDisponibles.map((trabajo) => (
                <button
                  key={trabajo.id}
                  onClick={() => handleAgregarTrabajo(trabajo)}
                  className="w-full text-left p-3 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={creandoParte}
                >
                  <div className="font-medium">{trabajo.descripcion}</div>
                  {trabajo.codigo && (
                    <div className="text-sm text-gray-600">Código: {trabajo.codigo}</div>
                  )}
                </button>
              ))}
            </div>
          </MobileModal>

          {/* Modal de búsqueda libre */}
          <MobileModal
            isOpen={showBusquedaModal}
            onClose={() => setShowBusquedaModal(false)}
            title="Buscar Trabajo"
          >
            <div className="space-y-4">
              <input
                type="text"
                value={busquedaTexto}
                onChange={(e) => handleBusquedaChange(e.target.value)}
                placeholder="Buscar trabajo..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              
              {loadingBusqueda && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                </div>
              )}
              
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {resultadosBusqueda.map((trabajo) => (
                  <button
                    key={trabajo.id}
                    onClick={() => handleAgregarDesdeBusqueda(trabajo)}
                    className="w-full text-left p-3 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={creandoParte}
                  >
                    <div className="font-medium">{trabajo.descripcion}</div>
                    {trabajo.grupo_principal && (
                      <div className="text-sm text-gray-600">
                        {trabajo.grupo_principal} - {trabajo.subgrupo}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </MobileModal>
        </>
      )}
    </div>
  );
};

export default TrabajosCardEmpleado; 