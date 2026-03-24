import React, { useState, useEffect, useRef, useCallback } from 'react';
import TrabajosList from './TrabajosList';
import * as proveedorService from '../../services/proveedorService';
import * as gruposService from '../../services/gruposService';
import * as preciosProveedorService from '../../services/preciosProveedorService';
import PrecioPersonalizadoIndicator from './PrecioPersonalizadoIndicator';
import { useMobileDetect } from '../../hooks/useMediaQuery';
import MobileModal from '../common/MobileModal';
import toast from 'react-hot-toast'; // Importar toast

const TrabajosCard = ({ trabajos = [], setTrabajos, codigoProveedor, readOnly = false }) => {
  // Detectar si estamos en un dispositivo móvil
  const isMobile = useMobileDetect();
  
  // Estados para controlar los modales en dispositivos móviles
  const [showObraModal, setShowObraModal] = useState(false);
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [showSubgrupoModal, setShowSubgrupoModal] = useState(false);
  const [showTrabajosModal, setShowTrabajosModal] = useState(false);
  const [currentTrabajo, setCurrentTrabajo] = useState({
    obra: '',
    portal: '',
    vivienda: '',
    lineas: []
  });
  const [lineaActual, setLineaActual] = useState({
    descripcion: '',
    cantidad: 1,
    precio_unitario: 0,
    descuento: 0,
    total: 0,
    unidad: '',
    codigo: ''
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingLineaIndex, setEditingLineaIndex] = useState(null);
  const [obrasAsignadas, setObrasAsignadas] = useState([]);
  const [loadingObras, setLoadingObras] = useState(false);
  
  // Estado para precios personalizados
  const [isPrecioPersonalizado, setIsPrecioPersonalizado] = useState(false);
  const [precioGeneral, setPrecioGeneral] = useState(0);
  const [precioPersonalizado, setPrecioPersonalizado] = useState(0);
  
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
  const lineasTrabajoRef = useRef(null);

  // Cargar obras asignadas al proveedor
  useEffect(() => {
    const cargarObrasAsignadas = async () => {
      if (!codigoProveedor) return;
      
      setLoadingObras(true);
      try {
        const obras = await proveedorService.getObrasAsignadasProveedor(codigoProveedor);
        setObrasAsignadas(obras);
        
        // Si solo hay una obra, seleccionarla automáticamente
        if (obras.length === 1 && !currentTrabajo.obra) {
          setCurrentTrabajo(prev => ({
            ...prev,
            obra: obras[0].nombre_obra
          }));
        }
      } catch (error) {
        console.error('Error al cargar obras asignadas:', error);
      } finally {
        setLoadingObras(false);
      }
    };
    
    cargarObrasAsignadas();
  }, [codigoProveedor, currentTrabajo.obra]);

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
        setSelectedSubgrupo(null); // Resetear el subgrupo seleccionado
      } catch (error) {
        console.error('Error al cargar subgrupos:', error);
      } finally {
        setLoadingSubgrupos(false);
      }
    };
    
    cargarSubgrupos();
  }, [selectedGrupo]);
  
  // Cargar trabajos cuando cambia el grupo o subgrupo seleccionado
  useEffect(() => {
    const fetchTrabajos = async () => {
      if (selectedGrupo) {
        setLoadingTrabajos(true);
        try {
          const trabajos = await gruposService.getTrabajosByGrupoAndSubgrupo(selectedGrupo, selectedSubgrupo);
          setTrabajosDisponibles(trabajos);
        } catch (error) {
          console.error('Error al cargar trabajos:', error);
          setTrabajosDisponibles([]);
        } finally {
          setLoadingTrabajos(false);
        }
      } else {
        setTrabajosDisponibles([]);
      }
    };

    fetchTrabajos();
  }, [selectedGrupo, selectedSubgrupo]);

  // Calcular el total de una línea
  const calcularTotalLinea = (linea) => {
    const subtotal = linea.cantidad * linea.precio_unitario;
    const descuento = subtotal * (linea.descuento / 100);
    return subtotal - descuento;
  };

  // Manejar cambios en los campos del trabajo actual
  const handleTrabajoChange = (e) => {
    const { name, value } = e.target;
    setCurrentTrabajo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en los campos de la línea actual
  const handleLineaChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === 'cantidad' || name === 'precio_unitario' || name === 'descuento' 
      ? parseFloat(value) || 0 
      : value;
    
    const updatedLinea = {
      ...lineaActual,
      [name]: newValue
    };
    
    // Actualizar el total
    updatedLinea.total = calcularTotalLinea(updatedLinea);
    
    setLineaActual(updatedLinea);
  };

  // Manejar selección de grupo
  const handleGrupoChange = (e) => {
    const grupoId = e.target.value;
    setSelectedGrupo(grupoId || null);
    // Al cambiar el grupo, reseteamos el subgrupo seleccionado
    setSelectedSubgrupo(null);
    // También reseteamos la línea actual para evitar inconsistencias
    setLineaActual({
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      total: 0,
      unidad: '',
      codigo: ''
    });
  };
  
  // Manejar selección de subgrupo
  const handleSubgrupoChange = (e) => {
    const subgrupoId = e.target.value;
    setSelectedSubgrupo(subgrupoId || null);
    // Reseteamos la línea actual al cambiar de subgrupo
    setLineaActual({
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      total: 0,
      unidad: '',
      codigo: ''
    });
  };

  // Seleccionar un trabajo de la lista
  const handleSelectTrabajo = async (trabajo) => {
    setSelectedTrabajoId(trabajo.id);
    
    // Verificar si existe un precio personalizado para este trabajo
    let precioFinal = trabajo.precio_venta || 0;
    let esPrecioPersonalizado = false;
    
    // Guardar el precio general para referencia
    setPrecioGeneral(trabajo.precio_venta || 0);
    
    if (codigoProveedor) {
      try {
        const precioPersonalizado = await preciosProveedorService.getPrecioPersonalizadoTrabajo(
          codigoProveedor, 
          trabajo.id
        );
        
        if (precioPersonalizado) {
          console.log('Precio personalizado encontrado:', precioPersonalizado);
          precioFinal = precioPersonalizado.precio;
          esPrecioPersonalizado = true;
          setPrecioPersonalizado(precioFinal);
        }
      } catch (error) {
        console.error('Error al obtener precio personalizado:', error);
      }
    }
    
    // Actualizar el estado de precio personalizado
    setIsPrecioPersonalizado(esPrecioPersonalizado);
    
    setLineaActual({
      descripcion: trabajo.descripcion,
      cantidad: 1,
      precio_unitario: precioFinal,
      descuento: 0,
      total: precioFinal,
      unidad: trabajo.unidad || 'ud',
      codigo: trabajo.codigo,
      trabajo_id: trabajo.id // Guardar el ID del trabajo para futuras referencias
    });
    
    // Hacer scroll a la sección de líneas de trabajo
    setTimeout(() => {
      if (lineasTrabajoRef.current) {
        lineasTrabajoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    // Detener la animación después de 2 segundos
    setTimeout(() => {
      const element = lineasTrabajoRef.current;
      if (element) {
        element.classList.remove('animate-pulse');
      }
    }, 2000);
  };

  // Añadir línea de trabajo
  const handleAddLinea = useCallback(() => {
    if (!lineaActual.descripcion || lineaActual.cantidad <= 0 || lineaActual.precio_unitario <= 0) {
      toast.error('Por favor, completa todos los campos de la línea.');
      return;
    }
    
    // Calcular total final
    const total = calcularTotalLinea(lineaActual);
    
    // Crear objeto de línea con información completa
    const lineaCompleta = {
      ...lineaActual,
      total,
      esPrecioPersonalizado: isPrecioPersonalizado,
      precioGeneral: isPrecioPersonalizado ? precioGeneral : null
    };
    
    if (editingLineaIndex !== null) {
      // Actualizar línea existente
      const nuevasLineas = [...currentTrabajo.lineas];
      nuevasLineas[editingLineaIndex] = lineaCompleta;
      
      setCurrentTrabajo({
        ...currentTrabajo,
        lineas: nuevasLineas
      });
      
      setEditingLineaIndex(null);
      toast.success('Línea actualizada correctamente.');
    } else {
      // Añadir nueva línea
      setCurrentTrabajo({
        ...currentTrabajo,
        lineas: [
          ...currentTrabajo.lineas,
          lineaCompleta
        ]
      });
      toast.success('Línea añadida correctamente.');
    }
    
    // Resetear línea actual
    setLineaActual({
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      total: 0,
      unidad: '',
      codigo: ''
    });
    
    // Resetear selección de trabajo y estados de precio personalizado
    setSelectedGrupo(null);
    setSelectedSubgrupo(null);
    setTrabajosDisponibles([]);
    setIsPrecioPersonalizado(false);
    setPrecioGeneral(0);
    setPrecioPersonalizado(0);
  }, [lineaActual, currentTrabajo, editingLineaIndex, isPrecioPersonalizado, precioGeneral]);

  // Editar una línea existente
  const handleEditLinea = (index) => {
    const lineaToEdit = currentTrabajo.lineas[index];
    
    setLineaActual({
      ...lineaToEdit
    });
    
    // Si la línea tiene información de precio personalizado, restaurar los estados
    if (lineaToEdit.esPrecioPersonalizado) {
      setIsPrecioPersonalizado(true);
      setPrecioGeneral(lineaToEdit.precioGeneral || 0);
      setPrecioPersonalizado(lineaToEdit.precio_unitario);
    } else {
      setIsPrecioPersonalizado(false);
      setPrecioGeneral(0);
      setPrecioPersonalizado(0);
    }
    
    setEditingLineaIndex(index);
    
    // Hacer scroll a la sección de líneas de trabajo
    setTimeout(() => {
      if (lineasTrabajoRef.current) {
        lineasTrabajoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Actualizar una línea existente
  const handleUpdateLinea = () => {
    if (editingLineaIndex === null) return;
    
    const nuevasLineas = [...currentTrabajo.lineas];
    nuevasLineas[editingLineaIndex] = lineaActual;
    
    setCurrentTrabajo(prev => ({
      ...prev,
      lineas: nuevasLineas
    }));
    
    setLineaActual({
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      total: 0,
      unidad: '',
      codigo: ''
    });
    
    setEditingLineaIndex(null);
  };

  // Eliminar una línea
  const handleDeleteLinea = (index) => {
    const nuevasLineas = currentTrabajo.lineas.filter((_, i) => i !== index);
    
    setCurrentTrabajo(prev => ({
      ...prev,
      lineas: nuevasLineas
    }));
    
    if (editingLineaIndex === index) {
      setLineaActual({
        descripcion: '',
        cantidad: 1,
        precio_unitario: 0,
        descuento: 0,
        total: 0,
        unidad: '',
        codigo: ''
      });
      
      setEditingLineaIndex(null);
    }
  };

  // Añadir el trabajo actual a la lista de trabajos
  const handleAddTrabajo = useCallback(() => {
    if (!currentTrabajo.obra || currentTrabajo.lineas.length === 0) {
      if (!currentTrabajo.obra) {
        toast.error('Debes seleccionar una obra.');
      } else {
        toast.error('El trabajo debe tener al menos una línea.');
      }
      return;
    }
    
    if (editingIndex !== null) {
      // Actualizar trabajo existente
      const nuevosTrabajos = [...trabajos];
      nuevosTrabajos[editingIndex] = { ...currentTrabajo };
      setTrabajos(nuevosTrabajos);
      setEditingIndex(null);
      toast.success('Trabajo actualizado correctamente.');
    } else {
      // Añadir nuevo trabajo
      setTrabajos([...trabajos, { ...currentTrabajo }]);
      toast.success('Trabajo añadido correctamente.');
    }
    
    // Resetear el trabajo actual
    setCurrentTrabajo({
      obra: '',
      portal: '',
      vivienda: '',
      lineas: []
    });
  }, [currentTrabajo, trabajos, editingIndex]);

  // Editar un trabajo existente
  const handleEditTrabajo = (index) => {
    setEditingIndex(index);
    setCurrentTrabajo(trabajos[index]);
  };

  // Eliminar un trabajo
  const handleDeleteTrabajo = (index) => {
    const nuevosTrabajos = trabajos.filter((_, i) => i !== index);
    setTrabajos(nuevosTrabajos);
    
    if (editingIndex === index) {
      setCurrentTrabajo({
        obra: '',
        portal: '',
        vivienda: '',
        lineas: []
      });
      
      setEditingIndex(null);
    }
  };

  // Calcular el total de un trabajo
  const calcularTotalTrabajo = (trabajo) => {
    return trabajo.lineas.reduce((sum, linea) => sum + linea.total, 0);
  };

  // Calcular el total de todos los trabajos
  const calcularTotalGeneral = () => {
    return trabajos.reduce((sum, trabajo) => sum + calcularTotalTrabajo(trabajo), 0);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Trabajos</h2>
      
      {/* Formulario para añadir/editar trabajo */}
      <div className="mb-6 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-700 mb-3">
          {editingIndex !== null ? 'Editar Trabajo' : 'Nuevo Trabajo'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="obra" className="block text-sm font-medium text-gray-700 mb-1">
              Obra
            </label>
            <div className="relative">
              {loadingObras ? (
                <div className="flex items-center">
                  <div className="animate-spin h-5 w-5 mr-2 text-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500">Cargando obras...</span>
                </div>
              ) : obrasAsignadas.length > 0 ? (
                isMobile ? (
                  <>
                    <div 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white cursor-pointer flex justify-between items-center"
                      onClick={() => setShowObraModal(true)}
                      role="button"
                      tabIndex="0"
                      aria-label="Seleccionar obra"
                    >
                      <span className={currentTrabajo.obra ? "text-gray-900" : "text-gray-500"}>
                        {currentTrabajo.obra || "Seleccionar obra"}
                      </span>
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {/* Modal para seleccionar obra en móvil */}
                    <MobileModal
                      isOpen={showObraModal}
                      onClose={() => setShowObraModal(false)}
                      title="Seleccionar Obra"
                    >
                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="Buscar obra..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          onChange={(e) => {
                            // Aquí podríamos implementar una búsqueda en tiempo real
                          }}
                        />
                      </div>
                      <div className="mobile-dropdown-list">
                        {obrasAsignadas.map((obra) => (
                          <div 
                            key={obra.id} 
                            className="mobile-dropdown-item cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              setCurrentTrabajo(prev => ({
                                ...prev,
                                obra: obra.nombre_obra
                              }));
                              setShowObraModal(false);
                            }}
                          >
                            <div className="font-medium">{obra.nombre_obra}</div>
                            <div className="text-sm text-gray-500">{obra.cliente}</div>
                          </div>
                        ))}
                      </div>
                    </MobileModal>
                  </>
                ) : (
                  <select
                    id="obra"
                    name="obra"
                    value={currentTrabajo.obra}
                    onChange={handleTrabajoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Seleccionar obra</option>
                    {obrasAsignadas.map((obra) => (
                      <option key={obra.id} value={obra.nombre_obra}>
                        {obra.nombre_obra} - {obra.cliente}
                      </option>
                    ))}
                  </select>
                )
              ) : (
                <div className="flex flex-col">
                  <input
                    type="text"
                    id="obra"
                    name="obra"
                    value={currentTrabajo.obra}
                    onChange={handleTrabajoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  {codigoProveedor && (
                    <p className="text-xs text-yellow-600 mt-1">
                      No hay obras asignadas para este proveedor
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="portal" className="block text-sm font-medium text-gray-700 mb-1">
              Portal
            </label>
            <input
              type="text"
              id="portal"
              name="portal"
              value={currentTrabajo.portal}
              onChange={handleTrabajoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Seleccionar Portal"
            />
          </div>
          
          <div>
            <label htmlFor="vivienda" className="block text-sm font-medium text-gray-700 mb-1">
              Vivienda
            </label>
            <input
              type="text"
              id="vivienda"
              name="vivienda"
              value={currentTrabajo.vivienda}
              onChange={handleTrabajoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Seleccionar Vivienda"
            />
          </div>
        </div>
        
        {/* Sección de búsqueda de trabajos */}
        <div className="mb-4">
          <h4 className="text-md font-medium text-gray-700 mb-2">Buscar Trabajo</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="grupo" className="block text-sm font-medium text-gray-700 mb-1">
                Grupo Principal
              </label>
              <div className="relative">
                {isMobile ? (
                  <>
                    <div 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white cursor-pointer flex justify-between items-center"
                      onClick={() => setShowGrupoModal(true)}
                      role="button"
                      tabIndex="0"
                      aria-label="Seleccionar grupo principal"
                    >
                      <span className={selectedGrupo ? "text-gray-900" : "text-gray-500"}>
                        {selectedGrupo ? grupos.find(g => g.id === selectedGrupo)?.nombre || "Seleccionar Grupo" : "Seleccionar Grupo"}
                      </span>
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {/* Modal para seleccionar grupo en móvil */}
                    <MobileModal
                      isOpen={showGrupoModal}
                      onClose={() => setShowGrupoModal(false)}
                      title="Seleccionar Grupo Principal"
                    >
                      <div className="mobile-dropdown-list">
                        {grupos.map((grupo) => (
                          <div 
                            key={grupo.id} 
                            className="mobile-dropdown-item cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              handleGrupoChange({ target: { value: grupo.id } });
                              setShowGrupoModal(false);
                            }}
                          >
                            <div className="font-medium">{grupo.nombre}</div>
                          </div>
                        ))}
                      </div>
                    </MobileModal>
                  </>
                ) : (
                  <select
                    id="grupo"
                    name="grupo"
                    value={selectedGrupo || ''}
                    onChange={handleGrupoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccionar Grupo</option>
                    {grupos.map(grupo => (
                      <option key={grupo.id} value={grupo.id}>
                        {grupo.nombre}
                      </option>
                    ))}
                  </select>
                )}
                {loadingGrupos && (
                  <div className="absolute right-3 top-2">
                    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="subgrupo" className="block text-sm font-medium text-gray-700 mb-1">
                Subgrupo
              </label>
              <div className="relative">
                {isMobile ? (
                  <>
                    <div 
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white flex justify-between items-center ${!selectedGrupo || loadingSubgrupos ? 'opacity-50' : 'cursor-pointer'}`}
                      onClick={() => selectedGrupo && !loadingSubgrupos && setShowSubgrupoModal(true)}
                      role="button"
                      tabIndex={selectedGrupo && !loadingSubgrupos ? "0" : "-1"}
                      aria-label="Seleccionar subgrupo"
                      aria-disabled={!selectedGrupo || loadingSubgrupos}
                    >
                      <span className={selectedSubgrupo ? "text-gray-900" : "text-gray-500"}>
                        {selectedSubgrupo ? subgrupos.find(s => s.id === selectedSubgrupo)?.nombre || "Seleccionar Subgrupo" : "Seleccionar Subgrupo"}
                      </span>
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {/* Modal para seleccionar subgrupo en móvil */}
                    <MobileModal
                      isOpen={showSubgrupoModal}
                      onClose={() => setShowSubgrupoModal(false)}
                      title="Seleccionar Subgrupo"
                    >
                      <div className="mobile-dropdown-list">
                        {subgrupos.map((subgrupo) => (
                          <div 
                            key={subgrupo.id} 
                            className="mobile-dropdown-item cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              handleSubgrupoChange({ target: { value: subgrupo.id } });
                              setShowSubgrupoModal(false);
                            }}
                          >
                            <div className="font-medium">{subgrupo.nombre}</div>
                          </div>
                        ))}
                      </div>
                    </MobileModal>
                  </>
                ) : (
                  <select
                    id="subgrupo"
                    name="subgrupo"
                    value={selectedSubgrupo || ''}
                    onChange={handleSubgrupoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={!selectedGrupo || loadingSubgrupos}
                  >
                    <option value="">Seleccionar Subgrupo</option>
                    {subgrupos.map(subgrupo => (
                      <option key={subgrupo.id} value={subgrupo.id}>
                        {subgrupo.nombre}
                      </option>
                    ))}
                  </select>
                )}
                {loadingSubgrupos && (
                  <div className="absolute right-3 top-2">
                    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Mostrar trabajos filtrados por grupo/subgrupo */}
          {selectedGrupo && (
            <div className="mt-4">
              {loadingTrabajos ? (
                <div className="flex justify-center">
                  <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : trabajosDisponibles.length > 0 ? (
                isMobile ? (
                  <div className="mt-2">
                    <button
                      className="w-full px-4 py-3 bg-indigo-50 text-indigo-700 rounded-md flex justify-between items-center"
                      onClick={() => setShowTrabajosModal(true)}
                      aria-label="Ver trabajos disponibles"
                    >
                      <span className="font-medium">Ver {trabajosDisponibles.length} trabajos disponibles</span>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* Modal para seleccionar trabajo en móvil */}
                    <MobileModal
                      isOpen={showTrabajosModal}
                      onClose={() => setShowTrabajosModal(false)}
                      title="Seleccionar Trabajo"
                    >
                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="Buscar trabajo..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          onChange={(e) => {
                            // Aquí podríamos implementar una búsqueda en tiempo real
                          }}
                        />
                      </div>
                      <div className="mobile-dropdown-list">
                        {trabajosDisponibles.map((trabajo) => (
                          <div 
                            key={trabajo.id} 
                            className="mobile-dropdown-item cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              handleSelectTrabajo(trabajo);
                              setShowTrabajosModal(false);
                            }}
                          >
                            <div className="font-medium">{trabajo.descripcion}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              <span className="mr-3">{trabajo.codigo || 'Sin código'}</span>
                              <span>{trabajo.precio_venta}€ - {trabajo.unidad}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </MobileModal>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {trabajosDisponibles.map((trabajo) => (
                        <li 
                          key={trabajo.id} 
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleSelectTrabajo(trabajo)}
                          tabIndex="0"
                          onKeyDown={(e) => e.key === 'Enter' && handleSelectTrabajo(trabajo)}
                          aria-label={`Seleccionar trabajo: ${trabajo.descripcion}`}
                        >
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-2">
                              <span className="text-sm font-medium text-gray-500">{trabajo.codigo || 'Sin código'}</span>
                            </div>
                            <div className="col-span-8">
                              <span className="font-medium">{trabajo.descripcion}</span>
                            </div>
                            <div className="col-span-2 text-right">
                              <span className="text-sm text-gray-500">{trabajo.precio_venta}€ - {trabajo.unidad}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ) : (
                <div className="text-sm text-gray-500 mt-2">
                  No se encontraron trabajos para el grupo/subgrupo seleccionado.
                </div>
              )}
            </div>
          )}
          
          {/* Búsqueda por texto */}
          <div className="mt-4">
            <h4 className="text-md font-medium text-gray-700 mb-2">O buscar por texto</h4>
            <TrabajosList 
              onSelectTrabajo={handleSelectTrabajo}
              codigoProveedor={codigoProveedor}
            />
          </div>
        </div>
        
        {/* Líneas de trabajo */}
        <div 
          className={`mb-4 p-4 rounded-md transition-all duration-300 ${
            selectedTrabajoId ? 'bg-blue-50 border border-blue-200 animate-pulse' : ''
          }`} 
          ref={lineasTrabajoRef}
        >
          <h4 className="text-md font-medium text-gray-700 mb-2">Líneas de Trabajo</h4>
          
          {currentTrabajo.lineas.length > 0 ? (
            <>
              {/* Tabla para Desktop */}
              <div className="overflow-x-auto hidden md:block"> 
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        Código
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Cantidad
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Precio
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Descuento
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Total
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentTrabajo.lineas.map((linea, index) => (
                      <tr key={index} className={editingLineaIndex === index ? 'bg-indigo-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {linea.codigo || 'Sin código'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {linea.descripcion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {linea.cantidad} {linea.unidad}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {linea.precio_unitario.toFixed(2)}€
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {linea.descuento}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {linea.total.toFixed(2)}€
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleEditLinea(index)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            aria-label="Editar línea"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLinea(index)}
                            className="text-red-600 hover:text-red-900"
                            aria-label="Eliminar línea"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        Total del Trabajo:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {calcularTotalTrabajo(currentTrabajo).toFixed(2)}€
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Lista de Tarjetas para Móvil */}
              <div className="md:hidden space-y-3">
                {currentTrabajo.lineas.map((linea, index) => (
                  <div key={index} className={`p-3 border rounded-md shadow-sm ${editingLineaIndex === index ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200'}`}>
                    <div className="mb-2">
                      <span className="block font-medium text-gray-800 break-words whitespace-pre-wrap">{linea.descripcion}</span>
                      <span className="text-xs text-gray-500">Código: {linea.codigo || 'Sin código'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div><span className="font-medium text-gray-600">Cant:</span> {linea.cantidad} {linea.unidad}</div>
                      <div><span className="font-medium text-gray-600">P.U.:</span> {linea.precio_unitario.toFixed(2)}€</div>
                      <div><span className="font-medium text-gray-600">Dto:</span> {linea.descuento}%</div>
                      <div className="font-semibold"><span className="font-medium text-gray-600">Total:</span> {linea.total.toFixed(2)}€</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => handleEditLinea(index)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium py-1 px-2 rounded hover:bg-indigo-50"
                        aria-label="Editar línea"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLinea(index)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium py-1 px-2 rounded hover:bg-red-50"
                        aria-label="Eliminar línea"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total del Trabajo para Móvil (ya que tfoot de la tabla está oculto) */}
              <div className="mt-4 text-right md:hidden">
                  <span className="text-sm font-medium text-gray-900">Total del Trabajo: </span>
                  <span className="text-sm font-bold text-gray-900">{calcularTotalTrabajo(currentTrabajo).toFixed(2)}€</span>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 mb-4">
              No hay líneas de trabajo añadidas.
            </div>
          )}
          
          {/* Formulario para añadir/editar línea */}
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              {editingLineaIndex !== null ? 'Editar Línea' : 'Añadir Línea'}
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4 items-start">
              <div className="lg:col-span-2"> {/* Columna para Descripción y Código */}
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={lineaActual.descripcion}
                  onChange={handleLineaChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 min-h-[60px] resize-y"
                  placeholder="Descripción del trabajo o seleccione de la lista"
                  rows="3"
                  required
                />
                {lineaActual.codigo && (
                  <p className="mt-1 text-xs text-gray-500">
                    Código: {lineaActual.codigo}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    id="cantidad"
                    name="cantidad"
                    value={lineaActual.cantidad}
                    onChange={handleLineaChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    min="0.01"
                    step="0.01"
                    required
                  />
                  {lineaActual.unidad && (
                    <span className="ml-2 text-sm text-gray-500">{lineaActual.unidad}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="mb-6">
                <label htmlFor="precio_unitario" className="block text-sm font-medium text-gray-700 mb-1">
                  Precio unitario
                </label>
                <div className="flex flex-col">
                  <input
                    type="number"
                    id="precio_unitario"
                    name="precio_unitario"
                    value={lineaActual.precio_unitario}
                    onChange={handleLineaChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {/* Indicador de precio personalizado */}
                  <PrecioPersonalizadoIndicator 
                    isPrecioPersonalizado={isPrecioPersonalizado}
                    precioGeneral={precioGeneral}
                    precioPersonalizado={precioPersonalizado}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="descuento" className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento (%)
                </label>
                <input
                  type="number"
                  id="descuento"
                  name="descuento"
                  value={lineaActual.descuento}
                  onChange={handleLineaChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <div>
                <label htmlFor="total" className="block text-sm font-medium text-gray-700 mb-1">
                  Total (€)
                </label>
                <input
                  type="number"
                  id="total"
                  name="total"
                  value={lineaActual.total}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              {editingLineaIndex !== null ? (
                <>
                  <button
                    type="button"
                    onClick={handleUpdateLinea}
                    disabled={!lineaActual.descripcion || lineaActual.cantidad <= 0 || lineaActual.precio_unitario <= 0}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Actualizar Línea
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLineaIndex(null);
                      setLineaActual({
                        descripcion: '',
                        cantidad: 1,
                        precio_unitario: 0,
                        descuento: 0,
                        total: 0,
                        unidad: '',
                        codigo: ''
                      });
                    }}
                    className="ml-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleAddLinea}
                  disabled={!lineaActual.descripcion || lineaActual.cantidad <= 0 || lineaActual.precio_unitario <= 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Añadir Línea
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          {editingIndex !== null ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditingIndex(null);
                  setCurrentTrabajo({
                    obra: '',
                    portal: '',
                    vivienda: '',
                    lineas: []
                  });
                }}
                className="ml-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddTrabajo}
                disabled={!currentTrabajo.obra || currentTrabajo.lineas.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Actualizar Trabajo
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleAddTrabajo}
              disabled={!currentTrabajo.obra || currentTrabajo.lineas.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Añadir Trabajo
            </button>
          )}
        </div>
      </div>
      
      {/* Lista de trabajos añadidos */}
      {Array.isArray(trabajos) && trabajos.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Trabajos Añadidos</h3>
          
          <div className="space-y-4">
            {trabajos.map((trabajo, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">Obra: {trabajo.obra}</h4>
                    {trabajo.portal && <p className="text-sm text-gray-600">Portal: {trabajo.portal}</p>}
                    {trabajo.vivienda && <p className="text-sm text-gray-600">Vivienda: {trabajo.vivienda}</p>}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleEditTrabajo(index)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      aria-label="Editar trabajo"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTrabajo(index)}
                      className="text-red-600 hover:text-red-900"
                      aria-label="Eliminar trabajo"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                
                {/* Tabla de líneas de trabajo (Desktop) */}
                <div className="overflow-x-auto hidden md:block mt-3">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Cantidad
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                          P. Unitario
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Dto (%)
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trabajo.lineas.map((linea, lineaIndex) => (
                        <tr key={lineaIndex}>
                          <td className="px-4 py-2 whitespace-pre-wrap break-words text-sm text-gray-900">
                            {linea.descripcion}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {linea.cantidad} {linea.unidad}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {linea.precio_unitario.toFixed(2)}€
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {linea.descuento}%
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {linea.total.toFixed(2)}€
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-right text-sm font-medium text-gray-500"></td>
                        <td className="px-4 py-2 text-left text-sm font-bold text-gray-700">Total del Trabajo:</td>
                        <td className="px-4 py-2 text-left text-sm font-bold text-gray-900">
                          {calcularTotalTrabajo(trabajo).toFixed(2)}€
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Lista de líneas de trabajo (Móvil) */}
                <div className="md:hidden mt-3 space-y-2">
                  {trabajo.lineas.map((linea, lineaIndex) => (
                    <div key={lineaIndex} className="p-2 border border-gray-100 rounded">
                      <p className="font-medium text-gray-700 break-words whitespace-pre-wrap text-sm">{linea.descripcion}</p>
                      <div className="grid grid-cols-2 gap-x-2 mt-1 text-xs">
                        <p><span className="text-gray-500">Cant:</span> {linea.cantidad} {linea.unidad}</p>
                        <p><span className="text-gray-500">P.U.:</span> {linea.precio_unitario.toFixed(2)}€</p>
                        <p><span className="text-gray-500">Dto:</span> {linea.descuento}%</p>
                        <p className="font-semibold"><span className="text-gray-500">Total:</span> {linea.total.toFixed(2)}€</p>
                      </div>
                    </div>
                  ))}
                  {/* Total del Trabajo para Móvil (dentro de cada tarjeta de trabajo) */}
                  {trabajo.lineas.length > 0 && (
                     <div className="mt-2 pt-2 border-t border-gray-200 text-right">
                        <span className="text-sm font-medium text-gray-700">Total del Trabajo: </span>
                        <span className="text-sm font-bold text-gray-900">{calcularTotalTrabajo(trabajo).toFixed(2)}€</span>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
          
          <div className="mt-4 text-right">
            <span className="text-lg font-medium text-gray-900">Total General:</span>
            <span className="ml-2 text-lg font-bold text-gray-900">{calcularTotalGeneral().toFixed(2)}€</span>
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

export default TrabajosCard;
