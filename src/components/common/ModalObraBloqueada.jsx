import React from 'react'

const ModalObraBloqueada = ({ isOpen, onClose, onConfirm, obraSeleccionada, nuevaObra }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Restricción de Obra</h3>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Ya tienes trabajos asignados a la obra <strong>"{obraSeleccionada}"</strong>.
          </p>
          
          <p className="text-gray-700 mb-4">
            No puedes cambiar a la obra <strong>"{nuevaObra}"</strong> porque cada parte de trabajo 
            solo puede estar asociado a una obra.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Opciones disponibles:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Crear nuevo parte:</strong> Para la obra "{nuevaObra}"</li>
              <li>• <strong>Eliminar trabajos:</strong> Y empezar de nuevo con la nueva obra</li>
              <li>• <strong>Mantener obra actual:</strong> Continuar con "{obraSeleccionada}"</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors duration-200"
          >
            Eliminar Trabajos y Cambiar Obra
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalObraBloqueada
