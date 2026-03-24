import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { toast } from 'react-hot-toast'
import { crearServicio, actualizarServicio, obtenerSiguienteCodigo } from '../../services/serviciosService'

export default function ModalServicio({ isOpen, onClose, onRefreshData, servicio = null }) {
  const isEditing = !!servicio

  const [formulario, setFormulario] = useState({
    descripcion: '',
    unidad: 'Ud',
    precio: '',
    codigo: ''
  })
  const [cargandoCodigo, setCargandoCodigo] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (servicio) {
        setFormulario({
          descripcion: servicio.descripcion || '',
          unidad: servicio.unidad || 'Ud',
          precio: servicio.precio?.toString() || '',
          codigo: servicio.codigo || ''
        })
      } else {
        setFormulario({ descripcion: '', unidad: 'Ud', precio: '', codigo: '' })
        cargarSiguienteCodigo()
      }
    }
  }, [isOpen, servicio])

  const cargarSiguienteCodigo = async () => {
    setCargandoCodigo(true)
    try {
      const codigo = await obtenerSiguienteCodigo()
      setFormulario(prev => ({ ...prev, codigo }))
    } catch {
      setFormulario(prev => ({ ...prev, codigo: 'SER-001' }))
    } finally {
      setCargandoCodigo(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formulario.descripcion.trim()) {
      toast.error('La descripción es obligatoria')
      return
    }
    if (!formulario.precio || parseFloat(formulario.precio) < 0) {
      toast.error('El precio debe ser un valor válido')
      return
    }

    try {
      if (isEditing) {
        await actualizarServicio(servicio.id, {
          descripcion: formulario.descripcion.trim(),
          unidad: formulario.unidad,
          precio: parseFloat(formulario.precio),
          codigo: formulario.codigo
        })
        toast.success('Servicio actualizado correctamente')
      } else {
        await crearServicio({
          descripcion: formulario.descripcion.trim(),
          unidad: formulario.unidad,
          precio: parseFloat(formulario.precio),
          codigo: formulario.codigo
        })
        toast.success('Servicio creado correctamente')
      }

      onClose()
      onRefreshData()
    } catch (error) {
      toast.error('Error al guardar el servicio: ' + error.message)
    }
  }

  const handleClose = () => {
    setFormulario({ descripcion: '', unidad: 'Ud', precio: '', codigo: '' })
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-10">
      <div className="fixed inset-0 bg-gray-900/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 md:p-8">
            <Dialog.Title className="text-xl md:text-2xl font-bold text-orange-800 mb-4 md:mb-6">
              {isEditing ? 'Editar Servicio' : 'Añadir Servicio'}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              {/* Código */}
              <div>
                <label className="block text-sm md:text-md font-medium text-orange-700 mb-1 md:mb-2">
                  Código (auto-generado)
                </label>
                <input
                  type="text"
                  value={cargandoCodigo ? 'Generando...' : formulario.codigo}
                  onChange={(e) => setFormulario({ ...formulario, codigo: e.target.value })}
                  className="block w-full rounded-md border-orange-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4 bg-orange-50 font-mono"
                  required
                  readOnly={!isEditing}
                  placeholder="SER-001"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm md:text-md font-medium text-orange-700 mb-1 md:mb-2">
                  Descripción *
                </label>
                <textarea
                  value={formulario.descripcion}
                  onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                  rows={3}
                  className="block w-full rounded-md border-orange-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                  required
                  placeholder="Describe el servicio..."
                />
              </div>

              {/* Unidad y Precio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm md:text-md font-medium text-orange-700 mb-1 md:mb-2">
                    Unidad *
                  </label>
                  <select
                    value={formulario.unidad}
                    onChange={(e) => setFormulario({ ...formulario, unidad: e.target.value })}
                    className="block w-full rounded-md border-orange-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    required
                  >
                    <option value="Ud">Ud (Unidad)</option>
                    <option value="Ml">Ml (Metro lineal)</option>
                    <option value="M2">M2 (Metro cuadrado)</option>
                    <option value="Hora">Hora</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm md:text-md font-medium text-orange-700 mb-1 md:mb-2">
                    Precio (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formulario.precio}
                    onChange={(e) => setFormulario({ ...formulario, precio: e.target.value })}
                    className="block w-full rounded-md border-orange-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    required
                    placeholder="12.50"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 md:space-x-4 pt-3 md:pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-sm md:text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 border border-transparent rounded-md shadow-sm text-sm md:text-base font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200"
                >
                  {isEditing ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
