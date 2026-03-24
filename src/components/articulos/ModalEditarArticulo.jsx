import { useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-hot-toast'

// Función para generar código automáticamente
const generarCodigo = (tipo, espesor, diametro) => {
  if (!tipo || !espesor || !diametro) return '';
  
  const tipoAbrev = tipo.substring(0, 3).toUpperCase();
  const espesorFormat = String(espesor).padStart(2, '0');
  const diametroFormat = String(diametro).padStart(3, '0');
  
  return `${tipoAbrev}-${espesorFormat}-${diametroFormat}`;
};

export default function ModalEditarArticulo({ isOpen, onClose, editingArticulo, setEditingArticulo, onRefreshData }) {
  
  // Efecto para generar código automáticamente cuando se editan tipo, espesor o diámetro
  useEffect(() => {
    if (editingArticulo && editingArticulo.tipo && editingArticulo.espesor && editingArticulo.diametro) {
      const codigo = generarCodigo(editingArticulo.tipo, editingArticulo.espesor, editingArticulo.diametro);
      setEditingArticulo(prev => ({ ...prev, codigo }));
    }
  }, [editingArticulo?.tipo, editingArticulo?.espesor, editingArticulo?.diametro, setEditingArticulo]);

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Validar que al menos un precio esté presente
      if (!editingArticulo.precio_aislamiento && !editingArticulo.precio_aluminio) {
        toast.error('Debe especificar al menos un precio (Aislamiento o Aluminio)')
        return
      }

      const { error } = await supabase
        .from('articulos_precios')
        .update({
          tipo: editingArticulo.tipo,
          espesor: parseInt(editingArticulo.espesor),
          diametro: parseInt(editingArticulo.diametro),
          pulgada: editingArticulo.pulgada,
          unidad: editingArticulo.unidad,
          precio_aislamiento: editingArticulo.precio_aislamiento ? parseFloat(editingArticulo.precio_aislamiento) : null,
          precio_aluminio: editingArticulo.precio_aluminio ? parseFloat(editingArticulo.precio_aluminio) : null,
          codigo: editingArticulo.codigo
        })
        .eq('id', editingArticulo.id)

      if (error) throw error
      toast.success('Artículo actualizado correctamente')
      onClose()
      onRefreshData()
    } catch (error) {
      toast.error('Error al actualizar el artículo: ' + error.message)
    }
  }

  const handleUpdateField = (field, value) => {
    setEditingArticulo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleClose = () => {
    setEditingArticulo(null)
    onClose()
  }

  if (!editingArticulo) return null

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-10">
      <div className="fixed inset-0 bg-blue-900/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 md:p-8">
            <Dialog.Title className="text-xl md:text-2xl font-bold text-blue-800 mb-4 md:mb-6">
              Editar artículo
            </Dialog.Title>
            
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">
                    Tipo *
                  </label>
                  <input
                    type="text"
                    value={editingArticulo.tipo}
                    onChange={(e) => handleUpdateField('tipo', e.target.value.toUpperCase())}
                    className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    required
                    placeholder="TUBO, CODO, TAPA..."
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">
                    Espesor *
                  </label>
                  <input
                    type="number"
                    value={editingArticulo.espesor}
                    onChange={(e) => handleUpdateField('espesor', e.target.value)}
                    className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    required
                    placeholder="6, 9, 13..."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">
                    Diámetro *
                  </label>
                  <input
                    type="number"
                    value={editingArticulo.diametro}
                    onChange={(e) => handleUpdateField('diametro', e.target.value)}
                    className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    required
                    placeholder="15, 18, 22..."
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">
                    Pulgada
                  </label>
                  <input
                    type="text"
                    value={editingArticulo.pulgada}
                    onChange={(e) => handleUpdateField('pulgada', e.target.value)}
                    className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    placeholder='1/4", 3/8", 1/2"...'
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">
                    Unidad
                  </label>
                  <select
                    value={editingArticulo.unidad}
                    onChange={(e) => handleUpdateField('unidad', e.target.value)}
                    className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    required
                  >
                    <option value="Ml">Ml (Metro lineal)</option>
                    <option value="Ud">Ud (Unidad)</option>
                    <option value="M2">M2 (Metro cuadrado)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">
                    Código (generado automáticamente)
                  </label>
                  <input
                    type="text"
                    value={editingArticulo.codigo}
                    onChange={(e) => handleUpdateField('codigo', e.target.value)}
                    className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4 bg-gray-50 font-mono"
                    required
                    placeholder="TUB-06-15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">
                    Precio Aislamiento (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingArticulo.precio_aislamiento}
                    onChange={(e) => handleUpdateField('precio_aislamiento', e.target.value)}
                    className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    placeholder="1.30"
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">
                    Precio Aluminio (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingArticulo.precio_aluminio}
                    onChange={(e) => handleUpdateField('precio_aluminio', e.target.value)}
                    className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    placeholder="10.30"
                  />
                </div>
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                <strong>Nota:</strong> Debe especificar al menos un precio (Aislamiento o Aluminio). 
                Ambos campos pueden estar vacíos, tener solo uno, o tener ambos precios.
              </div>

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
                  className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 border border-transparent rounded-md shadow-sm text-sm md:text-base font-medium text-white bg-blue-700 hover:bg-blue-800 transition-colors duration-200"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
