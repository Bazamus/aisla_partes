import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getAllGrupos } from '../../services/gruposService';
import { getSubgruposByGrupo } from '../../services/subgruposService';
import { getTrabajosBySubgrupoId } from '../../services/trabajosService';

const TrabajosCardNuevo = ({ 
  parteId, 
  trabajos = [], 
  setTrabajos, 
  codigoEmpleado, 
  readOnly = false 
}) => {
  // Estado para el formulario de trabajo
  const [currentTrabajo, setCurrentTrabajo] = useState({
    portal: '',
    vivienda: '',
    descripcion: '',
    tiempo_empleado: 0,
    observaciones: '',
    tipo_trabajo: 'manual'
  });

  // Estado para edición
  const [editingIndex, setEditingIndex] = useState(null);
  
  // Estado para modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  
  // Estados para búsqueda universal y flujo guiado
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [grupos, setGrupos] = useState([]);
  const [subgrupos, setSubgrupos] = useState([]);
  const [trabajosCatalogo, setTrabajosCatalogo] = useState([]);
  const [selectedGrupo, setSelectedGrupo] = useState('');
  const [selectedSubgrupo, setSelectedSubgrupo] = useState('');
  const [selectedTrabajoCatalogo, setSelectedTrabajoCatalogo] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [loadingSubgrupos, setLoadingSubgrupos] = useState(false);
  const [loadingTrabajos, setLoadingTrabajos] = useState(false);
  
  // Estados para validaciones visuales
  const [validationErrors, setValidationErrors] = useState({});
  const [showHelp, setShowHelp] = useState(false);
  const [formTouched, setFormTouched] = useState(false);

  // Función para convertir horas decimales a formato legible
  const formatTiempo = (horas) => {
    if (!horas || horas === 0) return '0h';
    const horasEnteras = Math.floor(horas);
    const minutos = Math.round((horas - horasEnteras) * 60);
    
    if (minutos === 0) {
      return `${horasEnteras}h`;
    }
    return `${horasEnteras}h ${minutos}m`;
  };
  
  // Cargar grupos al inicializar
  useEffect(() => {
    cargarGrupos();
  }, []);
  
  // Cargar grupos
  const cargarGrupos = async () => {
    setLoadingGrupos(true);
    try {
      const gruposData = await getAllGrupos();
      setGrupos(gruposData || []);
    } catch (error) {
      console.error('Error al cargar grupos:', error);
      toast.error('Error al cargar grupos');
    } finally {
      setLoadingGrupos(false);
    }
  };
  
  // Cargar subgrupos cuando se selecciona un grupo
  const cargarSubgrupos = async (grupoId) => {
    setLoadingSubgrupos(true);
    try {
      const subgruposData = await getSubgruposByGrupo(grupoId);
      setSubgrupos(subgruposData || []);
    } catch (error) {
      console.error('Error al cargar subgrupos:', error);
      toast.error('Error al cargar subgrupos');
    } finally {
      setLoadingSubgrupos(false);
    }
  };
  
  // Cargar trabajos cuando se selecciona un subgrupo
  const cargarTrabajos = async (subgrupoId) => {
    setLoadingTrabajos(true);
    try {
      const trabajosData = await getTrabajosBySubgrupoId(subgrupoId);
      setTrabajosCatalogo(trabajosData || []);
    } catch (error) {
      console.error('Error al cargar trabajos:', error);
      toast.error('Error al cargar trabajos');
    } finally {
      setLoadingTrabajos(false);
    }
  };
  
  // Búsqueda universal de trabajos
  const buscarTrabajos = async (termino) => {
    if (!termino.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    setLoadingSearch(true);
    try {
      const { data, error } = await supabase
        .from('lista_de_precios')
        .select('*')
        .ilike('trabajo', `%${termino}%`)
        .limit(10);
        
      if (error) throw error;
      
      const resultados = data.map(item => ({
        id: item.trabajo_id || item.id,
        descripcion: item.trabajo,
        precio: item.precio,
        grupo: item.grupo_principal,
        subgrupo: item.subgrupo,
        subgrupo_id: item.subgrupo_id
      }));
      
      setSearchResults(resultados);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      toast.error('Error al buscar trabajos');
    } finally {
      setLoadingSearch(false);
    }
  };
  
  // Manejar cambio en búsqueda
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce la búsqueda
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      buscarTrabajos(value);
    }, 300);
  };
  
  // Seleccionar trabajo de búsqueda
  const seleccionarTrabajoBusqueda = (trabajo) => {
    setCurrentTrabajo(prev => ({
      ...prev,
      descripcion: trabajo.descripcion,
      tipo_trabajo: 'catalogo'
    }));
    
    setSearchTerm('');
    setShowSearchResults(false);
    toast.success('Trabajo seleccionado desde búsqueda');
  };
  
  // Manejar selección de grupo
  const handleGrupoChange = (e) => {
    const grupoId = e.target.value;
    setSelectedGrupo(grupoId);
    setSelectedSubgrupo('');
    setSelectedTrabajoCatalogo('');
    setSubgrupos([]);
    setTrabajosCatalogo([]);
    
    if (grupoId) {
      cargarSubgrupos(grupoId);
    }
  };
  
  // Manejar selección de subgrupo
  const handleSubgrupoChange = (e) => {
    const subgrupoId = e.target.value;
    setSelectedSubgrupo(subgrupoId);
    setSelectedTrabajoCatalogo('');
    setTrabajosCatalogo([]);
    
    if (subgrupoId) {
      cargarTrabajos(subgrupoId);
    }
  };
  
  // Manejar selección de trabajo del catálogo
  const handleTrabajoCatalogoChange = (e) => {
    const trabajoId = e.target.value;
    setSelectedTrabajoCatalogo(trabajoId);
    
    if (trabajoId) {
      const trabajo = trabajosCatalogo.find(t => t.id === parseInt(trabajoId));
      if (trabajo) {
        setCurrentTrabajo(prev => ({
          ...prev,
          descripcion: trabajo.descripcion,
          tipo_trabajo: 'catalogo'
        }));
        // Limpiar error de descripción si existe
        setValidationErrors(prev => ({ ...prev, descripcion: null }));
      }
    }
  };
  
  // Validar formulario
  const validateForm = () => {
    const errors = {};
    
    // Validar descripción
    if (!currentTrabajo.descripcion?.trim()) {
      errors.descripcion = 'La descripción del trabajo es obligatoria';
    }
    
    // Validar tiempo
    if (!currentTrabajo.tiempo_empleado || currentTrabajo.tiempo_empleado <= 0) {
      errors.tiempo_empleado = 'El tiempo empleado debe ser mayor a 0';
    }
    
    // Validar portal y vivienda para trabajos del catálogo
    if (currentTrabajo.tipo_trabajo === 'catalogo') {
      if (!currentTrabajo.portal?.trim()) {
        errors.portal = 'El portal es obligatorio para trabajos del catálogo';
      }
      if (!currentTrabajo.vivienda?.trim()) {
        errors.vivienda = 'La vivienda es obligatoria para trabajos del catálogo';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Obtener clase CSS para campos con validación
  const getFieldClassName = (fieldName, baseClassName) => {
    const hasError = validationErrors[fieldName];
    const hasValue = currentTrabajo[fieldName]?.toString().trim();
    
    let className = baseClassName;
    
    if (formTouched) {
      if (hasError) {
        className += ' border-red-500 focus:ring-red-500 focus:border-red-500';
      } else if (hasValue) {
        className += ' border-green-500 focus:ring-green-500 focus:border-green-500';
      }
    }
    
    return className;
  };
  
  // Manejar cambios en campos con validación
  const handleValidatedChange = (e) => {
    const { name, value } = e.target;
    setFormTouched(true);
    
    setCurrentTrabajo(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo si tiene valor
    if (value?.trim()) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Calcular tiempo total
  const calcularTiempoTotal = () => {
    return trabajos.reduce((total, trabajo) => total + (trabajo.tiempo_empleado || 0), 0);
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentTrabajo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Limpiar formulario
  const resetForm = () => {
    setCurrentTrabajo({
      portal: '',
      vivienda: '',
      descripcion: '',
      tiempo_empleado: 0,
      observaciones: '',
      tipo_trabajo: 'manual'
    });
    setEditingIndex(null);
  };

  // Añadir trabajo a la lista
  const handleAddTrabajo = () => {
    setFormTouched(true);
    
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores antes de continuar');
      return;
    }
    
    try {
      const nuevoTrabajo = {
        ...currentTrabajo,
        id: Date.now(), // ID temporal para la lista
        tiempo_empleado: parseFloat(currentTrabajo.tiempo_empleado)
      };
      
      if (editingIndex !== null) {
        // Actualizar trabajo existente
        const updatedTrabajos = [...trabajos];
        updatedTrabajos[editingIndex] = { ...nuevoTrabajo, id: trabajos[editingIndex].id };
        setTrabajos(updatedTrabajos);
        setEditingIndex(null);
        toast.success('✅ Trabajo actualizado correctamente');
      } else {
        // Añadir nuevo trabajo
        setTrabajos(prev => [...prev, nuevoTrabajo]);
        toast.success('✅ Trabajo añadido correctamente');
      }
      
      // Limpiar formulario y estados
      setCurrentTrabajo({
        descripcion: '',
        tiempo_empleado: '',
        portal: '',
        vivienda: '',
        observaciones: '',
        tipo_trabajo: 'manual'
      });
      
      setValidationErrors({});
      setFormTouched(false);
      setSearchTerm('');
      setShowSearchResults(false);
      setSelectedGrupo('');
      setSelectedSubgrupo('');
      setSelectedTrabajoCatalogo('');
      setSubgrupos([]);
      setTrabajosCatalogo([]);
      
    } catch (error) {
      console.error('Error al procesar trabajo:', error);
      toast.error('Error al procesar el trabajo');
    }
  };

  // Editar trabajo
  const handleEditTrabajo = (index) => {
    const trabajo = trabajos[index];
    setCurrentTrabajo({
      portal: trabajo.portal || '',
      vivienda: trabajo.vivienda || '',
      descripcion: trabajo.descripcion || '',
      tiempo_empleado: trabajo.tiempo_empleado || 0,
      observaciones: trabajo.observaciones || '',
      tipo_trabajo: trabajo.tipo_trabajo || 'manual'
    });
    setEditingIndex(index);
  };

  // Eliminar trabajo - mostrar modal de confirmación
  const handleDeleteTrabajo = (index) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };
  
  // Confirmar eliminación
  const confirmDelete = () => {
    if (deleteIndex !== null) {
      const updatedTrabajos = trabajos.filter((_, i) => i !== deleteIndex);
      setTrabajos(updatedTrabajos);
      
      // Si estábamos editando este trabajo, limpiar el formulario
      if (editingIndex === deleteIndex) {
        resetForm();
      }
      
      toast.success('¡Trabajo eliminado correctamente!');
    }
    
    // Cerrar modal
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };
  
  // Cancelar eliminación
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  if (readOnly) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          ✅ Trabajos Realizados
        </h2>
        
        {trabajos.length > 0 ? (
          <div className="space-y-4">
            {trabajos.map((trabajo, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{trabajo.descripcion}</h3>
                  <span className="text-sm font-medium text-blue-600">{formatTiempo(trabajo.tiempo_empleado)}</span>
                </div>
                {(trabajo.portal || trabajo.vivienda) && (
                  <p className="text-sm text-gray-600 mb-2">
                    {trabajo.portal && `Portal: ${trabajo.portal}`}
                    {trabajo.portal && trabajo.vivienda && ' • '}
                    {trabajo.vivienda && `Vivienda: ${trabajo.vivienda}`}
                  </p>
                )}
                {trabajo.observaciones && (
                  <p className="text-sm text-gray-600">{trabajo.observaciones}</p>
                )}
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-gray-200 text-right">
              <span className="text-lg font-medium text-gray-900">
                Total: {formatTiempo(calcularTiempoTotal())}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No hay trabajos registrados</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulario para añadir trabajos */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          🔧 Añadir Trabajo
        </h2>

        <div className="space-y-6">
          {/* Portal y Vivienda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="portal" className="block text-sm font-medium text-gray-700 mb-2">
                🏠 Portal
                {currentTrabajo.tipo_trabajo === 'catalogo' && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                id="portal"
                name="portal"
                value={currentTrabajo.portal}
                onChange={handleValidatedChange}
                placeholder="Ej: Portal 1"
                className={getFieldClassName('portal', 'w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200')}
              />
              {validationErrors.portal && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.portal}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="vivienda" className="block text-sm font-medium text-gray-700 mb-2">
                🚪 Vivienda
                {currentTrabajo.tipo_trabajo === 'catalogo' && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                id="vivienda"
                name="vivienda"
                value={currentTrabajo.vivienda}
                onChange={handleValidatedChange}
                placeholder="Ej: 2ºA"
                className={getFieldClassName('vivienda', 'w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200')}
              />
              {validationErrors.vivienda && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.vivienda}
                </p>
              )}
            </div>
          </div>

          {/* Búsqueda Universal */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              🔍 Búsqueda Universal
            </h3>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Buscar trabajos por descripción..."
                className="w-full px-4 py-3 text-base border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
              />
              {loadingSearch && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              {/* Resultados de búsqueda */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((trabajo) => (
                    <button
                      key={trabajo.id}
                      type="button"
                      onClick={() => seleccionarTrabajoBusqueda(trabajo)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{trabajo.descripcion}</div>
                      <div className="text-sm text-gray-600">
                        {trabajo.grupo} → {trabajo.subgrupo}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Separador */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500 bg-white">o selecciona paso a paso</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
          
          {/* Lista de Trabajos: Grupo → Subgrupo → Trabajo */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="text-lg font-medium text-green-900 mb-3">
              📋 Lista de Trabajos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Selector de Grupo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1️⃣ Grupo
                </label>
                <select
                  value={selectedGrupo}
                  onChange={handleGrupoChange}
                  disabled={loadingGrupos}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2️⃣ Subgrupo
                </label>
                <select
                  value={selectedSubgrupo}
                  onChange={handleSubgrupoChange}
                  disabled={!selectedGrupo || loadingSubgrupos}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                >
                  <option value="">Seleccionar subgrupo...</option>
                  {subgrupos.map((subgrupo) => (
                    <option key={subgrupo.id} value={subgrupo.id}>
                      {subgrupo.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Selector de Trabajo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3️⃣ Trabajo
                </label>
                <select
                  value={selectedTrabajoCatalogo}
                  onChange={handleTrabajoCatalogoChange}
                  disabled={!selectedSubgrupo || loadingTrabajos}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                >
                  <option value="">Seleccionar trabajo...</option>
                  {trabajosCatalogo.map((trabajo) => (
                    <option key={trabajo.id} value={trabajo.id}>
                      {trabajo.descripcion}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Separador */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500 bg-white">o describe trabajo libre</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Otros Trabajos */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              ✏️ Otros Trabajos
            </h3>
            
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                📝 Descripción del Trabajo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="descripcion"
                name="descripcion"
                value={currentTrabajo.descripcion}
                onChange={handleValidatedChange}
                placeholder="Ej: Traslado de Materiales"
                className={getFieldClassName('descripcion', 'w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200')}
                required
              />
              {validationErrors.descripcion && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.descripcion}
                </p>
              )}
            </div>
          </div>

          {/* Tiempo y Observaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tiempo_empleado" className="block text-sm font-medium text-gray-700 mb-2">
                ⏱️ Tiempo Empleado <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Horas</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={Math.floor(currentTrabajo.tiempo_empleado || 0)}
                    onChange={(e) => {
                      setFormTouched(true);
                      const horas = parseInt(e.target.value) || 0;
                      const minutosActuales = Math.round(((currentTrabajo.tiempo_empleado || 0) % 1) * 60);
                      const nuevoTiempo = horas + (minutosActuales / 60);
                      setCurrentTrabajo(prev => ({ ...prev, tiempo_empleado: nuevoTiempo }));
                      // Limpiar error si hay tiempo válido
                      if (nuevoTiempo > 0) {
                        setValidationErrors(prev => ({ ...prev, tiempo_empleado: null }));
                      }
                    }}
                    onFocus={(e) => {
                      // Seleccionar todo el contenido cuando el usuario hace clic en el campo
                      e.target.select();
                    }}
                    placeholder="0"
                    className={getFieldClassName('tiempo_empleado', 'w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200')}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Minutos</label>
                  <select
                    value={Math.round(((currentTrabajo.tiempo_empleado || 0) % 1) * 60)}
                    onChange={(e) => {
                      setFormTouched(true);
                      const minutos = parseInt(e.target.value) || 0;
                      const horasActuales = Math.floor(currentTrabajo.tiempo_empleado || 0);
                      const nuevoTiempo = horasActuales + (minutos / 60);
                      setCurrentTrabajo(prev => ({ ...prev, tiempo_empleado: nuevoTiempo }));
                      // Limpiar error si hay tiempo válido
                      if (nuevoTiempo > 0) {
                        setValidationErrors(prev => ({ ...prev, tiempo_empleado: null }));
                      }
                    }}
                    className={getFieldClassName('tiempo_empleado', 'w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200')}
                  >
                    <option value="0">00</option>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                  </select>
                </div>
              </div>
              <div className="mt-1 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Total: <span className="font-medium text-green-600">{formatTiempo(currentTrabajo.tiempo_empleado || 0)}</span>
                </span>
                {validationErrors.tiempo_empleado && (
                  <span className="text-xs text-red-600 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {validationErrors.tiempo_empleado}
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
                💬 Observaciones
              </label>
              <input
                type="text"
                id="observaciones"
                name="observaciones"
                value={currentTrabajo.observaciones}
                onChange={handleChange}
                placeholder="Observaciones adicionales"
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Botón Añadir Trabajo y Ayuda */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-4">
            {/* Botón de Ayuda */}
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center space-x-2 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>¿Necesitas ayuda?</span>
            </button>
            
            {/* Botón Añadir Trabajo */}
            <button
              type="button"
              onClick={handleAddTrabajo}
              disabled={!currentTrabajo.descripcion?.trim() || !currentTrabajo.tiempo_empleado}
              className={`
                font-medium py-3 px-8 rounded-lg transition-all duration-200 flex items-center space-x-2 min-w-[200px] justify-center
                ${
                  !currentTrabajo.descripcion?.trim() || !currentTrabajo.tiempo_empleado
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg transform hover:scale-105'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{editingIndex !== null ? '✨ Actualizar Trabajo' : 'Añadir Trabajo'}</span>
            </button>
          </div>
          
          {/* Panel de Ayuda */}
          {showHelp && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fade-in">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                💡 Guía de Uso
              </h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>1️⃣ Búsqueda Universal:</strong> Escribe para buscar trabajos del catálogo</p>
                <p><strong>2️⃣ Lista de Trabajos:</strong> Selecciona Grupo → Subgrupo → Trabajo paso a paso</p>
                <p><strong>3️⃣ Otros Trabajos:</strong> Describe manualmente cualquier trabajo</p>
                <p><strong>⏱️ Tiempo:</strong> Usa horas y minutos para mayor precisión</p>
                <p><strong>🏠 Portal/Vivienda:</strong> Obligatorios solo para trabajos del catálogo</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de trabajos añadidos */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            ✅ Trabajos Añadidos
          </div>
          {trabajos.length > 0 && (
            <span className="text-lg font-medium text-blue-600">
              Total: {formatTiempo(calcularTiempoTotal())}
            </span>
          )}
        </h2>
        
        {trabajos.length > 0 ? (
          <div className="space-y-4">
            {trabajos.map((trabajo, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 flex-1">{trabajo.descripcion}</h3>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="text-sm font-medium text-blue-600">{formatTiempo(trabajo.tiempo_empleado)}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditTrabajo(index);
                      }}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors duration-200"
                      title="Editar trabajo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteTrabajo(index);
                      }}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-200"
                      title="Eliminar trabajo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {(trabajo.portal || trabajo.vivienda) && (
                  <p className="text-sm text-gray-600 mb-2">
                    {trabajo.portal && `🏠 Portal: ${trabajo.portal}`}
                    {trabajo.portal && trabajo.vivienda && ' • '}
                    {trabajo.vivienda && `🚪 Vivienda: ${trabajo.vivienda}`}
                  </p>
                )}
                {trabajo.observaciones && (
                  <p className="text-sm text-gray-600">💬 {trabajo.observaciones}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500">No hay trabajos añadidos aún</p>
            <p className="text-sm text-gray-400 mt-1">Añade tu primer trabajo usando el formulario de arriba</p>
          </div>
        )}
      </div>
      
      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar este trabajo? Esta acción no se puede deshacer.
            </p>
            
            {deleteIndex !== null && trabajos[deleteIndex] && (
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <p className="font-medium text-gray-900">{trabajos[deleteIndex].descripcion}</p>
                <p className="text-sm text-gray-600">Tiempo: {formatTiempo(trabajos[deleteIndex].tiempo_empleado)}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrabajosCardNuevo;
