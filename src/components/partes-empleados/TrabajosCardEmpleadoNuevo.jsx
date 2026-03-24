import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as parteEmpleadoService from '../../services/parteEmpleadoService';
import * as gruposService from '../../services/gruposService';
import * as trabajosService from '../../services/trabajosService';
import { useMobileDetect } from '../../hooks/useMediaQuery';
import MobileModal from '../common/MobileModal';
import toast from 'react-hot-toast';

const TrabajosCardEmpleadoNuevo = ({ parteId, trabajos = [], setTrabajos, codigoEmpleado, readOnly = false }) => {
  // Detectar si estamos en un dispositivo móvil
  const isMobile = useMobileDetect();
  
  // Estados para controlar los modales en dispositivos móviles
  const [showObraModal, setShowObraModal] = useState(false);
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [showSubgrupoModal, setShowSubgrupoModal] = useState(false);
  const [showTrabajosModal, setShowTrabajosModal] = useState(false);
  
  const [currentTrabajo, setCurrentTrabajo] = useState({
    portal: '',
    vivienda: '',
    descripcion: '',
    tiempo_empleado: 0,
    observaciones: '',
    tipo_trabajo: 'catalogo'
  });
  
  const [editingIndex, setEditingIndex] = useState(null);
  
  // Estados para grupos y subgrupos
  const [grupos, setGrupos] = useState([]);
  const [subgrupos, setSubgrupos] = useState([]);
  const [trabajosDisponibles, setTrabajosDisponibles] = useState([]);
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [selectedSubgrupo, setSelectedSubgrupo] = useState(null);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [loadingSubgrupos, setLoadingSubgrupos] = useState(false);
  const [loadingTrabajos, setLoadingTrabajos] = useState(false);
  const [selectedTrabajoId, setSelectedTrabajoId] = useState(null);
  const trabajosRef = useRef(null);



  // Cargar grupos
  useEffect(() => {
    const cargarGrupos = async () => {
      setLoadingGrupos(true);
      try {
        const data = await gruposService.getGrupos();
        setGrupos(data);
      } catch (error) {
        console.error('Error al cargar grupos:', error);
      } finally {
        setLoadingGrupos(false);
      }
    };
    
    cargarGrupos();
  }, []);
  
  // Cargar subgrupos cuando se selecciona un grupo
  useEffect(() => {
    const cargarSubgrupos = async () => {
      if (!selectedGrupo) {
        setSubgrupos([]);
        return;
      }
      
      setLoadingSubgrupos(true);
      try {
        const data = await gruposService.getSubgruposByGrupoId(selectedGrupo);
        setSubgrupos(data);
      } catch (error) {
        console.error('Error al cargar subgrupos:', error);
      } finally {
        setLoadingSubgrupos(false);
      }
    };
    
    cargarSubgrupos();
  }, [selectedGrupo]);
  
  // Cargar trabajos cuando se selecciona un subgrupo
  useEffect(() => {
    const fetchTrabajos = async () => {
      if (!selectedSubgrupo) {
        setTrabajosDisponibles([]);
        return;
      }
      
      setLoadingTrabajos(true);
      try {
        const data = await trabajosService.getTrabajosBySubgrupoId(selectedSubgrupo);
        setTrabajosDisponibles(data);
      } catch (error) {
        console.error('Error al cargar trabajos:', error);
      } finally {
        setLoadingTrabajos(false);
      }
    };
    
    fetchTrabajos();
  }, [selectedSubgrupo]);

  // Manejar cambios en los campos del trabajo actual
  const handleTrabajoChange = (e) => {
    const { name, value } = e.target;
    setCurrentTrabajo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar selección de grupo
  const handleGrupoChange = (e) => {
    const grupoId = e.target.value;
    setSelectedGrupo(grupoId);
    setSelectedSubgrupo(null);
    setSelectedTrabajoId(null);
    setTrabajosDisponibles([]);
    
    if (isMobile) {
      setShowGrupoModal(false);
      setShowSubgrupoModal(true);
    }
  };

  // Manejar selección de subgrupo
  const handleSubgrupoChange = (e) => {
    const subgrupoId = e.target.value;
    setSelectedSubgrupo(subgrupoId);
    setSelectedTrabajoId(null);
    
    if (isMobile) {
      setShowSubgrupoModal(false);
      setShowTrabajosModal(true);
    }
  };

  // Seleccionar un trabajo de la lista
  const handleSelectTrabajo = (trabajo) => {
    console.log('[Debug] handleSelectTrabajo ejecutado con:', trabajo);
    console.log('[Debug] Estableciendo selectedTrabajoId a:', trabajo.id);
    setSelectedTrabajoId(trabajo.id);
    setCurrentTrabajo(prev => {
      const newTrabajo = {
        ...prev,
        descripcion: trabajo.descripcion,
        tipo_trabajo: 'catalogo'
      };
      console.log('[Debug] Nuevo currentTrabajo:', newTrabajo);
      return newTrabajo;
    });
    
    if (isMobile) {
      setShowTrabajosModal(false);
    }
  };

  // Añadir trabajo al parte
  const handleAddTrabajo = async () => {
    if (!currentTrabajo.descripcion.trim()) {
      toast.error('La descripción del trabajo es obligatoria');
      return;
    }

    if (!currentTrabajo.tiempo_empleado || currentTrabajo.tiempo_empleado <= 0) {
      toast.error('El tiempo empleado debe ser mayor que 0');
      return;
    }

    try {
      const trabajoData = {
        parte_id: parteId,
        grupo_id: selectedGrupo?.id || null,
        subgrupo_id: selectedSubgrupo?.id || null,
        trabajo_id: selectedTrabajoId || null,
        descripcion: currentTrabajo.descripcion,
        tiempo_empleado: parseFloat(currentTrabajo.tiempo_empleado),
        observaciones: currentTrabajo.observaciones || null,
        tipo_trabajo: currentTrabajo.tipo_trabajo,
        portal: currentTrabajo.portal || null,
        vivienda: currentTrabajo.vivienda || null,
        cantidad: 1
      };

      if (editingIndex !== null) {
        if (parteId) {
          // Actualizar trabajo existente en BD
          await parteEmpleadoService.updateTiempoTrabajoEmpleado(trabajos[editingIndex].id, trabajoData);
        } else {
          // Actualizar trabajo en estado local
          const updatedTrabajos = [...trabajos];
          updatedTrabajos[editingIndex] = { ...trabajoData, id: `temp_${Date.now()}` };
          setTrabajos(updatedTrabajos);
        }
        toast.success('Trabajo actualizado correctamente');
      } else {
        if (parteId) {
          // Añadir nuevo trabajo a BD
          await parteEmpleadoService.addTrabajoEmpleado(trabajoData);
          // Recargar trabajos desde BD
          await cargarTrabajos();
        } else {
          // Añadir trabajo temporal al estado local
          const nuevoTrabajo = { ...trabajoData, id: `temp_${Date.now()}` };
          setTrabajos(prev => [...prev, nuevoTrabajo]);
        }
        toast.success('Trabajo añadido correctamente');
      }
      
      // Limpiar formulario
      resetForm();
      
    } catch (error) {
      console.error('Error al guardar trabajo:', error);
      toast.error('Error al guardar el trabajo');
    }
  };

  // Cargar trabajos del parte
  const cargarTrabajos = async () => {
    if (!parteId) return;
    
    try {
      const trabajosData = await parteEmpleadoService.getTrabajosParteEmpleado(parteId);
      setTrabajos(trabajosData.trabajos || []);
    } catch (error) {
      console.error('Error al cargar trabajos:', error);
    }
  };

  // Cargar trabajos cuando cambia el parteId
  useEffect(() => {
    cargarTrabajos();
  }, [parteId]);

  // Editar un trabajo existente
  const handleEditTrabajo = (index) => {
    const trabajo = trabajos[index];
    setCurrentTrabajo({
      obra: trabajo.obra || '',
      portal: trabajo.portal || '',
      vivienda: trabajo.vivienda || '',
      descripcion: trabajo.descripcion,
      tiempo_empleado: trabajo.tiempo_empleado,
      observaciones: trabajo.observaciones || '',
      tipo_trabajo: trabajo.tipo_trabajo || 'catalogo'
    });
    
    setSelectedGrupo(trabajo.grupo_id);
    setSelectedSubgrupo(trabajo.subgrupo_id);
    setSelectedTrabajoId(trabajo.trabajo_id);
    setEditingIndex(index);
  };

  // Eliminar un trabajo
  const handleDeleteTrabajo = async (index) => {
    if (!confirm('¿Está seguro de que desea eliminar este trabajo?')) return;
    
    try {
      await parteEmpleadoService.deleteTrabajoEmpleado(trabajos[index].id);
      toast.success('Trabajo eliminado correctamente');
      await cargarTrabajos();
    } catch (error) {
      console.error('Error al eliminar trabajo:', error);
      toast.error('Error al eliminar el trabajo');
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setCurrentTrabajo({
      portal: '',
      vivienda: '',
      descripcion: '',
      tiempo_empleado: 0,
      observaciones: '',
      tipo_trabajo: 'catalogo'
    });
    setSelectedGrupo(null);
    setSelectedSubgrupo(null);
    setSelectedTrabajoId(null);
    setEditingIndex(null);
  };

  // Calcular tiempo total
  const calcularTiempoTotal = () => {
    return trabajos.reduce((total, trabajo) => total + (trabajo.tiempo_empleado || 0), 0);
  };

  if (readOnly) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trabajos Realizados</h3>
        
        {trabajos.length > 0 ? (
          <div className="space-y-4">
            {trabajos.map((trabajo, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{trabajo.descripcion}</h4>
                  <span className="text-sm font-medium text-blue-600">
                    {trabajo.tiempo_empleado}h
                  </span>
                </div>
                
                {trabajo.observaciones && (
                  <p className="text-sm text-gray-600 mb-2">{trabajo.observaciones}</p>
                )}
                
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {trabajo.portal && (
                    <span className="bg-gray-100 px-2 py-1 rounded">Portal: {trabajo.portal}</span>
                  )}
                  {trabajo.vivienda && (
                    <span className="bg-gray-100 px-2 py-1 rounded">Vivienda: {trabajo.vivienda}</span>
                  )}
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    Tipo: {trabajo.tipo_trabajo === 'catalogo' ? 'Catálogo' : 'Manual'}
                  </span>
                </div>
              </div>
            ))}
            
            <div className="mt-4 text-right">
              <span className="text-lg font-medium text-gray-900">Tiempo Total:</span>
              <span className="ml-2 text-lg font-bold text-blue-600">{calcularTiempoTotal()}h</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            No hay trabajos registrados.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Trabajos Realizados</h3>
      
      {/* Formulario para añadir/editar trabajos */}
      <div className="space-y-4 mb-6">
        {/* Información de portal y vivienda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Portal
            </label>
            <input
              type="text"
              name="portal"
              value={currentTrabajo.portal}
              onChange={handleTrabajoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Portal 1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vivienda
            </label>
            <input
              type="text"
              name="vivienda"
              value={currentTrabajo.vivienda}
              onChange={handleTrabajoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 1A"
            />
          </div>
        </div>

        {/* Selección de trabajo del catálogo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grupo
            </label>
            <select
              value={selectedGrupo || ''}
              onChange={handleGrupoChange}
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subgrupo
            </label>
            <select
              value={selectedSubgrupo || ''}
              onChange={handleSubgrupoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingSubgrupos || !selectedGrupo}
            >
              <option value="">Seleccionar subgrupo...</option>
              {subgrupos.map((subgrupo) => (
                <option key={subgrupo.id} value={subgrupo.id}>
                  {subgrupo.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trabajo
            </label>
            <select
              value={selectedTrabajoId || ''}
              onChange={(e) => {
                const trabajoId = e.target.value;
                console.log('[Debug] Trabajo seleccionado ID (string):', trabajoId);
                console.log('[Debug] Trabajos disponibles:', trabajosDisponibles);
                
                // Convertir a número para coincidir con los IDs en trabajosDisponibles
                const trabajoIdNumber = parseInt(trabajoId, 10);
                console.log('[Debug] Trabajo seleccionado ID (number):', trabajoIdNumber);
                
                const trabajo = trabajosDisponibles.find(t => t.id === trabajoIdNumber);
                console.log('[Debug] Trabajo encontrado:', trabajo);
                if (trabajo) {
                  console.log('[Debug] Llamando handleSelectTrabajo con:', trabajo);
                  handleSelectTrabajo(trabajo);
                } else {
                  console.error('[Debug] No se encontró el trabajo con ID:', trabajoIdNumber);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingTrabajos || !selectedSubgrupo}
            >
              <option value="">Seleccionar trabajo...</option>
              {trabajosDisponibles.map((trabajo) => (
                <option key={trabajo.id} value={trabajo.id}>
                  {trabajo.descripcion}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Descripción y tiempo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción del trabajo *
            </label>
            <textarea
              name="descripcion"
              value={currentTrabajo.descripcion}
              onChange={handleTrabajoChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe el trabajo realizado..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiempo empleado (horas) *
            </label>
            <input
              type="number"
              name="tiempo_empleado"
              value={currentTrabajo.tiempo_empleado}
              onChange={handleTrabajoChange}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.0"
              required
            />
            
            <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={currentTrabajo.observaciones}
              onChange={handleTrabajoChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          {editingIndex !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={handleAddTrabajo}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {editingIndex !== null ? 'Actualizar Trabajo' : 'Añadir Trabajo'}
          </button>
        </div>
      </div>

      {/* Lista de trabajos */}
      {trabajos.length > 0 ? (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Trabajos Añadidos ({trabajos.length})</h4>
          
          {trabajos.map((trabajo, index) => (
            <div key={trabajo.id || index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-gray-900">{trabajo.descripcion}</h5>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-600">
                    {trabajo.tiempo_empleado}h
                  </span>
                  {!readOnly && (
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => handleEditTrabajo(index)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTrabajo(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {trabajo.observaciones && (
                <p className="text-sm text-gray-600 mb-2">{trabajo.observaciones}</p>
              )}
              
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                {trabajo.portal && (
                  <span className="bg-gray-100 px-2 py-1 rounded">Portal: {trabajo.portal}</span>
                )}
                {trabajo.vivienda && (
                  <span className="bg-gray-100 px-2 py-1 rounded">Vivienda: {trabajo.vivienda}</span>
                )}
                <span className="bg-gray-100 px-2 py-1 rounded">
                  Tipo: {trabajo.tipo_trabajo === 'catalogo' ? 'Catálogo' : 'Manual'}
                </span>
              </div>
            </div>
          ))}
          
          <div className="mt-4 text-right">
            <span className="text-lg font-medium text-gray-900">Tiempo Total:</span>
            <span className="ml-2 text-lg font-bold text-blue-600">{calcularTiempoTotal()}h</span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          No hay trabajos añadidos.
        </div>
      )}
    </div>
  );
};

export default TrabajosCardEmpleadoNuevo;
