import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { MagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

/**
 * Modal para seleccionar múltiples empleados y asignarlos a una obra
 *
 * @param {boolean} isOpen - Controla la visibilidad del modal
 * @param {function} onClose - Callback al cerrar el modal
 * @param {function} onConfirmar - Callback al confirmar selección con array de IDs
 * @param {string} obraNombre - Nombre de la obra para mostrar en el título
 * @param {string[]} empleadosPreseleccionados - IDs de empleados ya seleccionados (opcional)
 * @param {boolean} modoEdicion - Si es true, permite guardar sin empleados y cambia el texto del botón cancelar
 *
 * @example
 * <ModalSeleccionEmpleados
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirmar={(ids) => handleAsignar(ids)}
 *   obraNombre="Obra 123"
 * />
 */
const ModalSeleccionEmpleados = ({
  isOpen,
  onClose,
  onConfirmar,
  obraNombre,
  empleadosPreseleccionados = [],
  modoEdicion = false
}) => {
  const [busqueda, setBusqueda] = useState('')
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Cargar empleados cuando se abre el modal (solo una vez por apertura)
  useEffect(() => {
    if (isOpen && !initialized) {
      cargarEmpleados()
      setEmpleadosSeleccionados(empleadosPreseleccionados || [])
      setInitialized(true)
    }

    // Reset cuando se cierra el modal
    if (!isOpen && initialized) {
      setInitialized(false)
    }
  }, [isOpen])

  const cargarEmpleados = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('empleados')
        .select('id, codigo, nombre, email, categoria, coste_hora_empresa')
        .order('nombre', { ascending: true })

      if (error) throw error
      setEmpleados(data || [])
    } catch (error) {
      console.error('Error al cargar empleados:', error)
      toast.error('Error al cargar empleados')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar empleados por búsqueda (memoizado para performance)
  const empleadosFiltrados = useMemo(() => {
    if (!busqueda) return empleados

    const searchLower = busqueda.toLowerCase()
    return empleados.filter(emp =>
      emp.nombre?.toLowerCase().includes(searchLower) ||
      emp.codigo?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower) ||
      emp.categoria?.toLowerCase().includes(searchLower)
    )
  }, [empleados, busqueda])

  // Toggle selección de empleado individual
  const toggleEmpleado = (empleadoId) => {
    setEmpleadosSeleccionados(prev => {
      const empIdStr = empleadoId.toString()
      return prev.includes(empIdStr)
        ? prev.filter(id => id !== empIdStr)
        : [...prev, empIdStr]
    })
  }

  // Seleccionar/deseleccionar todos los empleados filtrados
  const toggleTodos = () => {
    if (empleadosSeleccionados.length === empleadosFiltrados.length) {
      setEmpleadosSeleccionados([])
    } else {
      setEmpleadosSeleccionados(empleadosFiltrados.map(e => e.id.toString()))
    }
  }

  const handleConfirmar = () => {
    if (!modoEdicion && empleadosSeleccionados.length === 0) {
      toast.error('Debes seleccionar al menos un empleado')
      return
    }
    onConfirmar(empleadosSeleccionados)
  }

  const handleClose = () => {
    setBusqueda('')
    setEmpleadosSeleccionados([])
    setInitialized(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
              Asignar Empleados a la Obra
            </h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Obra: <span className="font-semibold">{obraNombre}</span>
          </p>
        </div>

        {/* Barra de búsqueda y controles */}
        <div className="space-y-4 px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Buscar por nombre, código, email o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Buscar empleados"
            />
          </div>

          {/* Contador y botón seleccionar todos */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-gray-600">
              {empleadosSeleccionados.length} de {empleadosFiltrados.length} empleado(s) seleccionado(s)
            </p>
            <button
              type="button"
              onClick={toggleTodos}
              disabled={empleadosFiltrados.length === 0}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {empleadosSeleccionados.length === empleadosFiltrados.length
                ? 'Deseleccionar todos'
                : 'Seleccionar todos'}
            </button>
          </div>
        </div>

        {/* Lista de empleados */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Cargando empleados...</p>
            </div>
          ) : empleadosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" aria-hidden="true" />
              <p className="text-gray-500">No se encontraron empleados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {empleadosFiltrados.map((empleado) => {
                const isSelected = empleadosSeleccionados.includes(empleado.id.toString())

                return (
                  <div
                    key={empleado.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => toggleEmpleado(empleado.id)}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleEmpleado(empleado.id)
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {empleado.nombre}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          Código: {empleado.codigo || 'N/A'}
                        </p>
                        {empleado.email && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {empleado.email}
                          </p>
                        )}
                        {empleado.categoria && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                            {empleado.categoria}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {modoEdicion ? 'Cancelar' : 'Omitir Asignación'}
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!modoEdicion && empleadosSeleccionados.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {modoEdicion ? 'Guardar' : 'Asignar'} {empleadosSeleccionados.length > 0 && `(${empleadosSeleccionados.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalSeleccionEmpleados
