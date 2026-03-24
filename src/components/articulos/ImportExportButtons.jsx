import * as XLSX from 'xlsx'
import { toast } from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

// Función para generar código automáticamente
const generarCodigo = (tipo, espesor, diametro) => {
  if (!tipo || !espesor || !diametro) return '';
  
  const tipoAbrev = tipo.substring(0, 3).toUpperCase();
  const espesorFormat = String(espesor).padStart(2, '0');
  const diametroFormat = String(diametro).padStart(3, '0');
  
  return `${tipoAbrev}-${espesorFormat}-${diametroFormat}`;
};

export default function ImportExportButtons({ onNuevoArticulo, articulos, onRefreshData }) {
  
  const handleExportarExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(articulos.map(a => ({
      'Código': a.codigo,
      'Tipo': a.tipo,
      'Espesor': a.espesor,
      'Diámetro': a.diametro,
      'Pulgada': a.pulgada || '',
      'Unidad': a.unidad,
      'Precio Aislamiento': a.precio_aislamiento || '',
      'Precio Aluminio': a.precio_aluminio || ''
    })))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Artículos')
    XLSX.writeFile(workbook, 'lista_articulos_precios.xlsx')
    toast.success('Archivo exportado correctamente')
  }

  const handleImportarExcel = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)

        if (json.length === 0) {
          toast.error('El archivo no contiene datos')
          return
        }

        // Procesar los datos
        const nuevosArticulos = json.map(row => {
          const tipo = row['TIPO'] || row['tipo'] || row['Tipo']
          const espesor = parseInt(row['ESPESOR'] || row['espesor'] || row['Espesor'])
          const diametro = parseInt(row['DIAMETRO'] || row['diametro'] || row['Diametro'])
          
          return {
            tipo,
            espesor,
            diametro,
            pulgada: row['PULGADA'] || row['pulgada'] || row['Pulgada'] || '',
            unidad: row['UNIDAD'] || row['unidad'] || row['Unidad'] || 'Ml',
            precio_aislamiento: row['PRECIO AISLAMIENTO'] || row['precio_aislamiento'] || null,
            precio_aluminio: row['PRECIO ALUMINIO'] || row['precio_aluminio'] || null,
            codigo: generarCodigo(tipo, espesor, diametro)
          }
        })

        // Guardar en la base de datos
        Promise.all(
          nuevosArticulos.map(articulo => 
            supabase.from('articulos_precios').insert([articulo])
          )
        )
          .then(() => {
            toast.success(`Se importaron ${nuevosArticulos.length} artículos correctamente`)
            onRefreshData()
          })
          .catch(error => {
            console.error('Error al importar artículos:', error)
            toast.error('Error al importar artículos')
          })
      } catch (error) {
        console.error('Error al procesar el archivo:', error)
        toast.error('Error al procesar el archivo')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleDescargarPlantilla = () => {
    const datosEjemplo = [
      {
        'TIPO': 'TUBO',
        'ESPESOR': 6,
        'DIAMETRO': 15,
        'PULGADA': '1/4"',
        'UNIDAD': 'Ml',
        'PRECIO AISLAMIENTO': 1.30,
        'PRECIO ALUMINIO': ''
      },
      {
        'TIPO': 'CODO',
        'ESPESOR': 9,
        'DIAMETRO': 114,
        'PULGADA': '4"',
        'UNIDAD': 'Ud',
        'PRECIO AISLAMIENTO': 5.71,
        'PRECIO ALUMINIO': 10.30
      },
      {
        'TIPO': 'TAPA',
        'ESPESOR': 13,
        'DIAMETRO': 89,
        'PULGADA': '3"',
        'UNIDAD': 'Ud',
        'PRECIO AISLAMIENTO': '',
        'PRECIO ALUMINIO': 8.50
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(datosEjemplo)
    const wscols = [
      { wch: 10 }, // TIPO
      { wch: 10 }, // ESPESOR
      { wch: 10 }, // DIAMETRO
      { wch: 10 }, // PULGADA
      { wch: 10 }, // UNIDAD
      { wch: 18 }, // PRECIO AISLAMIENTO
      { wch: 15 }, // PRECIO ALUMINIO
    ]
    worksheet['!cols'] = wscols

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla')
    XLSX.writeFile(workbook, 'plantilla_articulos_precios.xlsx')
    toast.success('Plantilla descargada correctamente')
  }

  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 w-full md:w-auto">
      <button
        onClick={onNuevoArticulo}
        className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md shadow-sm transition-colors text-sm md:text-base"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="hidden sm:inline">Añadir nuevo artículo</span>
        <span className="sm:hidden">Nuevo artículo</span>
      </button>
      
      <label className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-blue-700 bg-white hover:bg-blue-50 rounded-md shadow-sm transition-colors text-sm md:text-base cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span className="hidden sm:inline">Importar Excel</span>
        <span className="sm:hidden">Importar</span>
        <input
          type="file"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={handleImportarExcel}
        />
      </label>
      
      <button
        onClick={handleExportarExcel}
        className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors text-sm md:text-base"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="hidden sm:inline">Exportar Excel</span>
        <span className="sm:hidden">Exportar</span>
      </button>
      
      <button
        onClick={handleDescargarPlantilla}
        className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-blue-700 bg-white hover:bg-blue-50 rounded-md shadow-sm transition-colors text-sm md:text-base"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="hidden sm:inline">Descargar Plantilla</span>
        <span className="sm:hidden">Plantilla</span>
      </button>
    </div>
  )
}
