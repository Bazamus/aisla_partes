import React, { useState } from 'react'
import { añadirOtroTrabajo, actualizarOtroTrabajo, eliminarOtroTrabajo } from '../../services/otrosTrabajosService'
import { toast } from 'react-hot-toast'
import SelectorServicios from './SelectorServicios'
import ModalOtrosTrabajosMobile from './ModalOtrosTrabajosMobile'

const OtrosTrabajosTemporal = ({
  parteId,
  otrosTrabajos,
  otrosTrabajosTemporales,
  setOtrosTrabajosTemporales,
  onActualizar,
  readOnly = false
}) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [modalMobileOpen, setModalMobileOpen] = useState(false)
  const [editandoMobile, setEditandoMobile] = useState(null)
  const [editando, setEditando] = useState(null)
  const [formulario, setFormulario] = useState({
    modo: 'libre',
    servicio_id: null,
    descripcion: '',
    cantidad: '1',
    unidad: 'Ud',
    precio_unitario: ''
  })

  // Combinar trabajos guardados y temporales
  const todosLosTrabajos = [
    ...otrosTrabajos,
    ...otrosTrabajosTemporales.map(trabajo => ({ ...trabajo, temporal: true }))
  ]

  const resetFormulario = () => {
    setFormulario({
      modo: 'libre',
      servicio_id: null,
      descripcion: '',
      cantidad: '1',
      unidad: 'Ud',
      precio_unitario: ''
    })
    setMostrarFormulario(false)
    setEditando(null)
  }

  const handleSeleccionarServicio = (servicio) => {
    setFormulario(prev => ({
      ...prev,
      servicio_id: servicio.id,
      descripcion: servicio.descripcion,
      unidad: servicio.unidad,
      precio_unitario: servicio.precio.toString()
    }))
  }

  const handleSubmit = async () => {
    if (!formulario.descripcion.trim() || !formulario.cantidad || parseFloat(formulario.cantidad) <= 0) {
      toast.error('Por favor completa todos los campos correctamente')
      return
    }

    const precioUnitario = parseFloat(formulario.precio_unitario) || 0

    try {
      if (editando) {
        if (editando.temporal) {
          setOtrosTrabajosTemporales(prev =>
            prev.map(trabajo =>
              trabajo.id === editando.id
                ? {
                    ...trabajo,
                    descripcion: formulario.descripcion.trim(),
                    cantidad: parseFloat(formulario.cantidad),
                    unidad: formulario.unidad,
                    precio_unitario: precioUnitario,
                    servicio_id: formulario.servicio_id || null
                  }
                : trabajo
            )
          )
          toast.success('Trabajo actualizado')
        } else {
          await actualizarOtroTrabajo(
            editando.id,
            formulario.descripcion.trim(),
            parseFloat(formulario.cantidad),
            formulario.unidad,
            precioUnitario,
            formulario.servicio_id || null
          )
          toast.success('Trabajo actualizado')
          onActualizar()
        }
      } else {
        if (!parteId) {
          const nuevoTrabajo = {
            id: `temp_${Date.now()}`,
            descripcion: formulario.descripcion.trim(),
            cantidad: parseFloat(formulario.cantidad),
            unidad: formulario.unidad,
            precio_unitario: precioUnitario,
            servicio_id: formulario.servicio_id || null,
            temporal: true
          }
          setOtrosTrabajosTemporales(prev => [...prev, nuevoTrabajo])
          toast.success('Trabajo añadido (se guardará al completar el parte)')
        } else {
          await añadirOtroTrabajo(
            parteId,
            formulario.descripcion.trim(),
            parseFloat(formulario.cantidad),
            formulario.unidad,
            precioUnitario,
            formulario.servicio_id || null
          )
          toast.success('Trabajo añadido')
          onActualizar()
        }
      }

      resetFormulario()
    } catch (error) {
      console.error('Error al guardar trabajo:', error)
      toast.error('Error al guardar el trabajo')
    }
  }

  const handleEditar = (trabajo) => {
    setFormulario({
      modo: trabajo.servicio_id ? 'servicio' : 'libre',
      servicio_id: trabajo.servicio_id || null,
      descripcion: trabajo.descripcion,
      cantidad: trabajo.cantidad.toString(),
      unidad: trabajo.unidad,
      precio_unitario: (trabajo.precio_unitario || '').toString()
    })
    setEditando(trabajo)
    setMostrarFormulario(true)
  }

  const handleEliminar = async (trabajo) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este trabajo?')) {
      try {
        if (trabajo.temporal) {
          setOtrosTrabajosTemporales(prev => prev.filter(t => t.id !== trabajo.id))
          toast.success('Trabajo eliminado')
        } else {
          await eliminarOtroTrabajo(trabajo.id)
          toast.success('Trabajo eliminado')
          onActualizar()
        }
      } catch (error) {
        console.error('Error al eliminar trabajo:', error)
        toast.error('Error al eliminar el trabajo')
      }
    }
  }

  const isMobile = () => window.innerWidth < 1024

  const handleAñadirClick = () => {
    if (isMobile()) {
      setEditandoMobile(null)
      setModalMobileOpen(true)
    } else {
      setMostrarFormulario(true)
    }
  }

  const handleEditarClick = (trabajo) => {
    if (isMobile()) {
      setEditandoMobile(trabajo)
      setModalMobileOpen(true)
    } else {
      handleEditar(trabajo)
    }
  }

  const handleAñadirDesdeMobile = async (trabajo) => {
    const precioUnitario = trabajo.precio_unitario || 0

    try {
      if (editandoMobile) {
        // Edición
        if (editandoMobile.temporal) {
          setOtrosTrabajosTemporales(prev =>
            prev.map(t =>
              t.id === editandoMobile.id
                ? {
                    ...t,
                    descripcion: trabajo.descripcion,
                    cantidad: trabajo.cantidad,
                    unidad: trabajo.unidad,
                    precio_unitario: precioUnitario,
                    servicio_id: trabajo.servicio_id
                  }
                : t
            )
          )
          toast.success('Trabajo actualizado')
        } else {
          await actualizarOtroTrabajo(
            editandoMobile.id,
            trabajo.descripcion,
            trabajo.cantidad,
            trabajo.unidad,
            precioUnitario,
            trabajo.servicio_id
          )
          toast.success('Trabajo actualizado')
          onActualizar()
        }
      } else {
        // Nuevo
        if (!parteId) {
          const nuevoTrabajo = {
            id: `temp_${Date.now()}`,
            descripcion: trabajo.descripcion,
            cantidad: trabajo.cantidad,
            unidad: trabajo.unidad,
            precio_unitario: precioUnitario,
            servicio_id: trabajo.servicio_id,
            temporal: true
          }
          setOtrosTrabajosTemporales(prev => [...prev, nuevoTrabajo])
          toast.success('Trabajo añadido (se guardará al completar el parte)')
        } else {
          await añadirOtroTrabajo(
            parteId,
            trabajo.descripcion,
            trabajo.cantidad,
            trabajo.unidad,
            precioUnitario,
            trabajo.servicio_id
          )
          toast.success('Trabajo añadido')
          onActualizar()
        }
      }
    } catch (error) {
      console.error('Error al guardar trabajo:', error)
      toast.error('Error al guardar el trabajo')
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            Otros Trabajos
          </h3>
          <p className="text-xs md:text-sm text-gray-600 ml-11 mt-1">
            Servicios del catálogo o trabajos no incluidos en materiales
          </p>
        </div>

        {!readOnly && !mostrarFormulario && (
          <button
            type="button"
            onClick={handleAñadirClick}
            className="w-full md:w-auto px-5 py-2.5 md:px-4 md:py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold md:font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-base md:text-sm"
          >
            <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Añadir</span>
          </button>
        )}
      </div>

      {/* Formulario */}
      {mostrarFormulario && !readOnly && (
        <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
          <div className="space-y-4">
            {/* Toggle de modo */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setFormulario(prev => ({ ...prev, modo: 'servicio', servicio_id: null, descripcion: '', precio_unitario: '', unidad: 'Ud' }))}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  formulario.modo === 'servicio'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-orange-600'
                }`}
              >
                Seleccionar Servicio
              </button>
              <button
                type="button"
                onClick={() => setFormulario(prev => ({ ...prev, modo: 'libre', servicio_id: null }))}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  formulario.modo === 'libre'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-orange-600'
                }`}
              >
                Texto Libre
              </button>
            </div>

            {/* Modo Servicio: selector */}
            {formulario.modo === 'servicio' && !formulario.servicio_id && (
              <SelectorServicios onSeleccionar={handleSeleccionarServicio} />
            )}

            {/* Servicio seleccionado o modo libre */}
            {(formulario.modo === 'libre' || formulario.servicio_id) && (
              <>
                {/* Badge de servicio seleccionado */}
                {formulario.servicio_id && (
                  <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                    <span className="text-sm text-orange-800 font-medium truncate">
                      Servicio seleccionado: {formulario.descripcion}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormulario(prev => ({ ...prev, servicio_id: null, descripcion: '', precio_unitario: '', unidad: 'Ud' }))}
                      className="ml-2 text-orange-500 hover:text-orange-700 shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Descripción (solo en modo libre) */}
                {formulario.modo === 'libre' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción del Trabajo
                    </label>
                    <textarea
                      value={formulario.descripcion}
                      onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                      placeholder="Describe el trabajo realizado..."
                      required
                    />
                  </div>
                )}

                {/* Cantidad, Unidad y Precio */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      value={formulario.cantidad}
                      onChange={(e) => setFormulario({ ...formulario, cantidad: e.target.value })}
                      min="0.5"
                      step="0.5"
                      className="w-full px-3 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad
                    </label>
                    <select
                      value={formulario.unidad}
                      onChange={(e) => setFormulario({ ...formulario, unidad: e.target.value })}
                      className="w-full px-3 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mobile-filter-select"
                    >
                      <option value="Ud">Ud</option>
                      <option value="Ml">Ml</option>
                      <option value="M2">M2</option>
                      <option value="Hora">Hora</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio (€)
                    </label>
                    <input
                      type="number"
                      value={formulario.precio_unitario}
                      onChange={(e) => setFormulario({ ...formulario, precio_unitario: e.target.value })}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Subtotal preview */}
                {formulario.precio_unitario && parseFloat(formulario.precio_unitario) > 0 && (
                  <div className="text-right text-sm text-gray-600">
                    Subtotal: <span className="font-semibold text-green-600">
                      {(parseFloat(formulario.cantidad || 0) * parseFloat(formulario.precio_unitario || 0)).toFixed(2)}€
                    </span>
                  </div>
                )}

                {/* Botones */}
                <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={resetFormulario}
                    className="w-full md:flex-1 px-4 py-3 md:py-2 text-base md:text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full md:flex-1 px-4 py-3 md:py-2 text-base md:text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    {editando ? 'Actualizar' : 'Añadir'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lista de otros trabajos */}
      {todosLosTrabajos.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <svg className="mx-auto h-10 w-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>No hay otros trabajos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todosLosTrabajos.map((trabajo) => {
            const subtotal = (trabajo.cantidad || 0) * (trabajo.precio_unitario || 0)
            return (
              <div key={trabajo.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {trabajo.servicio_id && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-orange-100 text-orange-700">
                          {trabajo.servicios?.codigo || 'SER'}
                        </span>
                      )}
                      <p className="text-gray-800 leading-relaxed flex-1">
                        {trabajo.descripcion}
                      </p>
                      {trabajo.temporal && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Temporal
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-semibold text-orange-600">
                        {trabajo.cantidad} {trabajo.unidad}
                      </span>
                      {trabajo.precio_unitario > 0 && (
                        <>
                          <span className="text-gray-400">×</span>
                          <span className="text-gray-600">{Number(trabajo.precio_unitario).toFixed(2)}€</span>
                          <span className="text-gray-400">=</span>
                          <span className="font-semibold text-green-600">{subtotal.toFixed(2)}€</span>
                        </>
                      )}
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        type="button"
                        onClick={() => handleEditarClick(trabajo)}
                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(trabajo)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal móvil para Otros Trabajos */}
      <ModalOtrosTrabajosMobile
        isOpen={modalMobileOpen}
        onClose={() => { setModalMobileOpen(false); setEditandoMobile(null) }}
        onAñadir={handleAñadirDesdeMobile}
        editando={editandoMobile}
      />
    </div>
  )
}

export default OtrosTrabajosTemporal
