import React, { useState, useEffect, useRef } from 'react'
import { obtenerServicios } from '../../services/serviciosService'
import { toast } from 'react-hot-toast'

const ModalOtrosTrabajosMobile = ({ isOpen, onClose, onAñadir, editando = null }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [modo, setModo] = useState(null) // 'servicio' | 'libre'
  const [servicios, setServicios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(false)

  const [formulario, setFormulario] = useState({
    servicio_id: null,
    descripcion: '',
    cantidad: '1',
    unidad: 'Ud',
    precio_unitario: ''
  })

  const scrollContainerRef = useRef(null)

  // Al abrir modal
  useEffect(() => {
    if (isOpen) {
      if (editando) {
        // Edición: ir directo al formulario
        const esServicio = !!editando.servicio_id
        setModo(esServicio ? 'servicio' : 'libre')
        setFormulario({
          servicio_id: editando.servicio_id || null,
          descripcion: editando.descripcion || '',
          cantidad: (editando.cantidad || 1).toString(),
          unidad: editando.unidad || 'Ud',
          precio_unitario: (editando.precio_unitario || '').toString()
        })
        setCurrentStep(esServicio ? 3 : 2)
      } else {
        resetear()
      }
      cargarServicios()
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
    }
  }, [isOpen, editando])

  const cargarServicios = async () => {
    setLoading(true)
    try {
      const data = await obtenerServicios()
      setServicios(data)
    } catch (error) {
      console.error('Error cargando servicios:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetear = () => {
    setCurrentStep(1)
    setModo(null)
    setBusqueda('')
    setFormulario({
      servicio_id: null,
      descripcion: '',
      cantidad: '1',
      unidad: 'Ud',
      precio_unitario: ''
    })
  }

  const handleClose = () => {
    resetear()
    onClose()
  }

  const handleModoSelect = (nuevoModo) => {
    setModo(nuevoModo)
    setCurrentStep(2)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }

  const handleServicioSelect = (servicio) => {
    setFormulario({
      servicio_id: servicio.id,
      descripcion: servicio.descripcion,
      cantidad: '1',
      unidad: servicio.unidad,
      precio_unitario: servicio.precio.toString()
    })
    setCurrentStep(3)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }

  const handleBack = () => {
    if (editando) {
      handleClose()
      return
    }
    if (currentStep === 3) {
      setCurrentStep(2)
      if (modo === 'servicio') {
        setFormulario(prev => ({ ...prev, servicio_id: null, descripcion: '', precio_unitario: '', unidad: 'Ud' }))
      }
    } else if (currentStep === 2) {
      setCurrentStep(1)
      setModo(null)
      setBusqueda('')
    }
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }

  const ajustarCantidad = (delta) => {
    const actual = parseFloat(formulario.cantidad) || 0
    const nueva = Math.max(0.5, actual + delta)
    setFormulario(prev => ({ ...prev, cantidad: nueva.toString() }))
  }

  const handleSubmit = () => {
    if (!formulario.descripcion.trim()) {
      toast.error('La descripción es obligatoria')
      return
    }
    const cantidad = parseFloat(formulario.cantidad)
    if (!cantidad || cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    const trabajo = {
      servicio_id: formulario.servicio_id || null,
      descripcion: formulario.descripcion.trim(),
      cantidad: cantidad,
      unidad: formulario.unidad,
      precio_unitario: parseFloat(formulario.precio_unitario) || 0
    }

    onAñadir(trabajo)
    handleClose()
  }

  // Servicios filtrados por búsqueda
  const serviciosFiltrados = busqueda.trim()
    ? servicios.filter(s =>
        s.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.codigo.toLowerCase().includes(busqueda.toLowerCase())
      )
    : servicios

  const subtotal = (parseFloat(formulario.cantidad) || 0) * (parseFloat(formulario.precio_unitario) || 0)

  // Títulos del header según paso
  const getTitulo = () => {
    if (editando) return 'Editar Trabajo'
    if (currentStep === 1) return 'Otros Trabajos'
    if (currentStep === 2 && modo === 'servicio') return 'Seleccionar Servicio'
    if (currentStep === 2 && modo === 'libre') return 'Texto Libre'
    if (currentStep === 3) return 'Confirmar Datos'
    return 'Otros Trabajos'
  }

  // Pasos del indicador de progreso
  const getSteps = () => {
    if (modo === 'servicio') {
      return [
        { num: 1, label: 'Modo' },
        { num: 2, label: 'Servicio' },
        { num: 3, label: 'Confirmar' }
      ]
    }
    return [
      { num: 1, label: 'Modo' },
      { num: 2, label: 'Datos' }
    ]
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden'
      }}
    >
      {/* Modal Container */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
        style={{
          maxHeight: '92vh',
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-orange-600 text-white rounded-t-3xl shrink-0">
          <div className="flex items-center">
            {(currentStep > 1 || editando) && (
              <button
                type="button"
                onClick={handleBack}
                className="mr-3 p-2 rounded-full hover:bg-orange-700 transition-colors active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h3 className="text-lg font-semibold">{getTitulo()}</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-orange-700 transition-colors active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress indicator */}
        {!editando && (
          <div className="px-4 py-3 bg-gray-50 shrink-0">
            <div className="flex items-center justify-between text-sm">
              {getSteps().map((step) => (
                <div key={step.num} className={`flex items-center ${currentStep >= step.num ? 'text-orange-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep >= step.num ? 'bg-orange-600 text-white' : 'bg-gray-300'}`}>
                    {currentStep > step.num ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step.num}
                  </div>
                  <span className="ml-1.5">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        {modo && !editando && (
          <div className="px-4 py-2 bg-orange-50 border-b shrink-0">
            <div className="flex items-center text-sm text-orange-700">
              <span className="font-medium">{modo === 'servicio' ? 'Servicio del catálogo' : 'Texto libre'}</span>
              {currentStep === 3 && formulario.descripcion && (
                <>
                  <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium truncate">{formulario.descripcion}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* SCROLLABLE CONTENT AREA */}
        <div
          ref={scrollContainerRef}
          className="p-4 grow"
          style={{
            overflowY: 'scroll',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            height: 'auto',
            maxHeight: 'calc(92vh - 180px)',
            position: 'relative'
          }}
        >
          {/* ====== STEP 1: Selección de modo ====== */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-center text-gray-600 mb-2">¿Qué deseas añadir?</p>

              {/* Card: Seleccionar Servicio */}
              <button
                type="button"
                onClick={() => handleModoSelect('servicio')}
                className="w-full p-5 bg-white border-2 border-gray-200 rounded-2xl hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 active:scale-[0.98] shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 text-base">Seleccionar Servicio</div>
                    <div className="text-sm text-gray-500 mt-0.5">Elige del catálogo de servicios con precio predefinido</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Card: Texto Libre */}
              <button
                type="button"
                onClick={() => handleModoSelect('libre')}
                className="w-full p-5 bg-white border-2 border-gray-200 rounded-2xl hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 active:scale-[0.98] shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 text-base">Texto Libre</div>
                    <div className="text-sm text-gray-500 mt-0.5">Describe manualmente el trabajo con precio opcional</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          )}

          {/* ====== STEP 2 (modo=servicio): Lista de servicios ====== */}
          {currentStep === 2 && modo === 'servicio' && (
            <div className="space-y-3">
              {/* Buscador */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar servicio por código o descripción..."
                  className="w-full pl-11 pr-4 py-3.5 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  autoFocus
                />
              </div>

              {/* Lista de servicios */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
                  <span className="text-gray-600">Cargando servicios...</span>
                </div>
              ) : serviciosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {busqueda ? 'No se encontraron servicios' : 'No hay servicios disponibles'}
                </div>
              ) : (
                <div className="space-y-2">
                  {serviciosFiltrados.map((servicio) => (
                    <button
                      key={servicio.id}
                      type="button"
                      onClick={() => handleServicioSelect(servicio)}
                      className="w-full p-4 text-left bg-white border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 shadow-sm active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded shrink-0">
                              {servicio.codigo}
                            </span>
                          </div>
                          <div className="text-sm text-gray-800 leading-snug">
                            {servicio.descripcion}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-base font-bold text-green-600">
                            {Number(servicio.precio).toFixed(2)}€
                          </div>
                          <div className="text-xs text-gray-500">/{servicio.unidad}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====== STEP 2 (modo=libre): Formulario texto libre ====== */}
          {currentStep === 2 && modo === 'libre' && (
            <div className="space-y-5">
              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción del Trabajo
                </label>
                <textarea
                  value={formulario.descripcion}
                  onChange={(e) => setFormulario(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  placeholder="Describe el trabajo realizado..."
                  autoFocus
                />
              </div>

              {/* Cantidad con stepper */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cantidad
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => ajustarCantidad(-0.5)}
                    className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors shrink-0"
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    value={formulario.cantidad}
                    onChange={(e) => setFormulario(prev => ({ ...prev, cantidad: e.target.value }))}
                    min="0.5"
                    step="0.5"
                    className="flex-1 text-center text-xl font-bold px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => ajustarCantidad(0.5)}
                    className="w-12 h-12 rounded-xl bg-orange-100 hover:bg-orange-200 active:bg-orange-300 flex items-center justify-center transition-colors shrink-0"
                  >
                    <svg className="w-6 h-6 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Unidad y Precio en grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unidad
                  </label>
                  <select
                    value={formulario.unidad}
                    onChange={(e) => setFormulario(prev => ({ ...prev, unidad: e.target.value }))}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white mobile-filter-select"
                  >
                    <option value="Ud">Ud</option>
                    <option value="Ml">Ml</option>
                    <option value="M2">M2</option>
                    <option value="Hora">Hora</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Precio (€)
                  </label>
                  <input
                    type="number"
                    value={formulario.precio_unitario}
                    onChange={(e) => setFormulario(prev => ({ ...prev, precio_unitario: e.target.value }))}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Subtotal preview */}
              {subtotal > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700 font-medium">Subtotal</span>
                    <span className="text-xl font-bold text-green-600">{subtotal.toFixed(2)}€</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {formulario.cantidad} {formulario.unidad} × {parseFloat(formulario.precio_unitario || 0).toFixed(2)}€
                  </div>
                </div>
              )}

              {/* Botón Añadir */}
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-xl font-semibold text-base transition-colors duration-200"
              >
                {editando ? 'Actualizar Trabajo' : 'Añadir Trabajo'}
              </button>
            </div>
          )}

          {/* ====== STEP 3 (modo=servicio): Confirmar datos ====== */}
          {currentStep === 3 && (
            <div className="space-y-5">
              {/* Badge del servicio seleccionado */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono font-bold text-orange-600 mb-1">SERVICIO SELECCIONADO</div>
                    <div className="text-base font-semibold text-gray-900">{formulario.descripcion}</div>
                  </div>
                  {!editando && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-orange-500 hover:text-orange-700 shrink-0 p-1"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Cantidad con stepper */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cantidad
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => ajustarCantidad(-0.5)}
                    className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors shrink-0"
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    value={formulario.cantidad}
                    onChange={(e) => setFormulario(prev => ({ ...prev, cantidad: e.target.value }))}
                    min="0.5"
                    step="0.5"
                    className="flex-1 text-center text-xl font-bold px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => ajustarCantidad(0.5)}
                    className="w-12 h-12 rounded-xl bg-orange-100 hover:bg-orange-200 active:bg-orange-300 flex items-center justify-center transition-colors shrink-0"
                  >
                    <svg className="w-6 h-6 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Unidad y Precio en grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unidad
                  </label>
                  <select
                    value={formulario.unidad}
                    onChange={(e) => setFormulario(prev => ({ ...prev, unidad: e.target.value }))}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white mobile-filter-select"
                  >
                    <option value="Ud">Ud</option>
                    <option value="Ml">Ml</option>
                    <option value="M2">M2</option>
                    <option value="Hora">Hora</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Precio (€)
                  </label>
                  <input
                    type="number"
                    value={formulario.precio_unitario}
                    onChange={(e) => setFormulario(prev => ({ ...prev, precio_unitario: e.target.value }))}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Subtotal preview */}
              {subtotal > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700 font-medium">Subtotal</span>
                    <span className="text-xl font-bold text-green-600">{subtotal.toFixed(2)}€</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {formulario.cantidad} {formulario.unidad} × {parseFloat(formulario.precio_unitario || 0).toFixed(2)}€
                  </div>
                </div>
              )}

              {/* Botón Añadir */}
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-xl font-semibold text-base transition-colors duration-200"
              >
                {editando ? 'Actualizar Trabajo' : 'Añadir Trabajo'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default ModalOtrosTrabajosMobile
