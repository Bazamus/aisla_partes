import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import ImportadorCodigos from '../components/ImportadorCodigos'
import EjecutarSQL from '../components/EjecutarSQL'
import { useAuth } from '../contexts/AuthContext'

export default function Precios() {
  const { userRoles } = useAuth();
  const [precios, setPrecios] = useState([])
  const [loading, setLoading] = useState(true)
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('')
  const [subgrupoSeleccionado, setSubgrupoSeleccionado] = useState(null)
  const [nuevoTrabajo, setNuevoTrabajo] = useState({
    trabajo: '',
    precio: '',
    grupo_principal: '',
    subgrupo: '',
    unidad: 'UN',
    codigo: ''
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGrupoModalOpen, setIsGrupoModalOpen] = useState(false)
  const [nuevoGrupo, setNuevoGrupo] = useState({
    nombre: '',
    subgrupos: ['']
  })
  const [gruposSubgrupos, setGruposSubgrupos] = useState({})
  const [loadingGrupos, setLoadingGrupos] = useState(true)
  const [grupoExistenteSeleccionado, setGrupoExistenteSeleccionado] = useState('')
  const [nuevoSubgrupo, setNuevoSubgrupo] = useState('')
  const [modoEdicion, setModoEdicion] = useState('nuevo') // 'nuevo' o 'existente'
  const [generandoCodigo, setGenerandoCodigo] = useState(false)
  const [isImportadorCodigosOpen, setIsImportadorCodigosOpen] = useState(false)
  const [isSQLExecutorOpen, setIsSQLExecutorOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPrecio, setEditingPrecio] = useState(null)

  // Verificar si el usuario es SuperAdmin
  const isSuperAdmin = userRoles?.some(role => role.nombre === 'SuperAdmin');

  useEffect(() => {
    cargarPrecios()
    cargarGruposSubgrupos()
  }, [])

  // Función para obtener abreviaturas
  const obtenerAbreviatura = (texto, longitud) => {
    if (!texto) return '';
    // Eliminar espacios y caracteres especiales
    const textoLimpio = texto.replace(/[^\w\s]/gi, '').replace(/\s+/g, '');
    // Convertir a mayúsculas y tomar los primeros caracteres
    return textoLimpio.toUpperCase().substring(0, longitud);
  };

  // Función para generar el código corto
  const generarCodigoCorto = async (grupoPrincipal, subgrupo) => {
    try {
      setGenerandoCodigo(true);
      // Obtener las abreviaturas
      const abreviaturaGrupo = obtenerAbreviatura(grupoPrincipal, 3);
      const abreviaturaSubgrupo = obtenerAbreviatura(subgrupo, 3);
      
      if (!abreviaturaGrupo || !abreviaturaSubgrupo) {
        setGenerandoCodigo(false);
        return '';
      }
      
      // Obtener el último número secuencial para esta combinación
      const { data, error } = await supabase
        .from('lista_de_precios')
        .select('codigo')
        .like('codigo', `${abreviaturaGrupo}-${abreviaturaSubgrupo}-%`)
        .order('codigo', { ascending: false })
        .limit(1);
      
      let numeroSecuencial = 1;
      
      if (!error && data && data.length > 0) {
        // Extraer el número del último código
        const ultimoCodigo = data[0].codigo;
        const ultimoNumero = parseInt(ultimoCodigo.split('-')[2], 10);
        if (!isNaN(ultimoNumero)) {
          numeroSecuencial = ultimoNumero + 1;
        }
      }
      
      // Formatear el número secuencial con ceros a la izquierda
      const numeroFormateado = numeroSecuencial.toString().padStart(3, '0');
      
      setGenerandoCodigo(false);
      return `${abreviaturaGrupo}-${abreviaturaSubgrupo}-${numeroFormateado}`;
    } catch (error) {
      console.error('Error al generar código:', error);
      setGenerandoCodigo(false);
      return '';
    }
  };

  // Efecto para generar código cuando se selecciona grupo y subgrupo
  useEffect(() => {
    const actualizarCodigo = async () => {
      if (nuevoTrabajo.grupo_principal && nuevoTrabajo.subgrupo) {
        const codigo = await generarCodigoCorto(nuevoTrabajo.grupo_principal, nuevoTrabajo.subgrupo);
        setNuevoTrabajo(prev => ({ ...prev, codigo }));
      }
    };
    
    actualizarCodigo();
  }, [nuevoTrabajo.grupo_principal, nuevoTrabajo.subgrupo]);

  const cargarGruposSubgrupos = async () => {
    try {
      setLoadingGrupos(true)
      const { data, error } = await supabase
        .from('grupos_subgrupos')
        .select('*')
        .order('grupo_principal', { ascending: true })
        .order('subgrupo', { ascending: true })

      if (error) throw error

      // Convertir los datos a un objeto agrupado por grupo_principal
      const gruposAgrupados = {}
      data.forEach(item => {
        if (!gruposAgrupados[item.grupo_principal]) {
          gruposAgrupados[item.grupo_principal] = []
        }
        gruposAgrupados[item.grupo_principal].push(item.subgrupo)
      })

      setGruposSubgrupos(gruposAgrupados)
      setLoadingGrupos(false)
    } catch (error) {
      console.error('Error al cargar grupos y subgrupos:', error)
      toast.error('Error al cargar grupos y subgrupos')
      setLoadingGrupos(false)
    }
  }

  const cargarPrecios = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('lista_de_precios')
        .select('*')
        .order('grupo_principal', { ascending: true })
        .order('subgrupo', { ascending: true })
        .order('trabajo', { ascending: true })
      
      if (grupoSeleccionado) {
        query = query.eq('grupo_principal', grupoSeleccionado)
      }
      
      if (subgrupoSeleccionado) {
        query = query.eq('subgrupo', subgrupoSeleccionado)
      }

      const { data, error } = await query
      
      if (error) throw error
      setPrecios(data)
    } catch (error) {
      toast.error('Error al cargar los precios: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPrecios()
  }, [grupoSeleccionado, subgrupoSeleccionado])

  const handleGuardarEdicion = async (id, precio) => {
    try {
      const { error } = await supabase
        .from('lista_de_precios')
        .update({
          trabajo: precio.trabajo,
          precio: precio.precio,
          grupo_principal: precio.grupo_principal,
          subgrupo: precio.subgrupo,
          unidad: precio.unidad,
          codigo: precio.codigo,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      toast.success('Precio actualizado correctamente')
      setIsEditModalOpen(false)
      setEditingPrecio(null)
      cargarPrecios()
    } catch (error) {
      toast.error('Error al actualizar el precio: ' + error.message)
    }
  }

  const handleEditPrecio = (precio) => {
    setEditingPrecio({
      id: precio.id,
      trabajo: precio.trabajo,
      precio: precio.precio,
      grupo_principal: precio.grupo_principal,
      subgrupo: precio.subgrupo,
      unidad: precio.unidad || 'UN',
      codigo: precio.codigo
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateEditingPrecio = (field, value) => {
    setEditingPrecio(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEliminarTrabajo = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este trabajo? Esta acción no se puede deshacer.')) {
      try {
        const { error } = await supabase
          .from('lista_de_precios')
          .delete()
          .eq('id', id)
  
        if (error) throw error
        toast.success('Trabajo eliminado correctamente')
        cargarPrecios()
      } catch (error) {
        toast.error('Error al eliminar el trabajo: ' + error.message)
      }
    }
  }

  const handleNuevoTrabajo = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('lista_de_precios')
        .insert([
          {
            trabajo: nuevoTrabajo.trabajo,
            precio: nuevoTrabajo.precio,
            grupo_principal: nuevoTrabajo.grupo_principal,
            subgrupo: nuevoTrabajo.subgrupo,
            unidad: nuevoTrabajo.unidad,
            codigo: nuevoTrabajo.codigo
          }
        ])

      if (error) throw error
      toast.success('Trabajo añadido correctamente')
      setNuevoTrabajo({
        trabajo: '',
        precio: '',
        grupo_principal: '',
        subgrupo: '',
        unidad: 'UN',
        codigo: ''
      })
      setIsModalOpen(false)
      cargarPrecios()
    } catch (error) {
      toast.error('Error al añadir el trabajo: ' + error.message)
    }
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

        // Verificar que el archivo tenga las columnas necesarias
        const primeraFila = json[0]
        if (!primeraFila['Trabajos'] || !primeraFila['Precio'] || !primeraFila['Grupo Principal'] || !primeraFila['Subgrupo']) {
          toast.error('El archivo no tiene el formato correcto. Debe contener las columnas: Trabajos, Precio, Grupo Principal, Subgrupo')
          return
        }

        // Procesar los datos
        const nuevosPrecios = json.map(row => ({
          trabajo: row['Trabajos'],
          precio: parseFloat(row['Precio']),
          grupo_principal: row['Grupo Principal'],
          subgrupo: row['Subgrupo'],
          unidad: row['Unidad'] || 'UN', // Usar 'UN' como valor por defecto si no existe
          codigo: row['Código'] || '' // Usar cadena vacía como valor por defecto si no existe
        }))

        // Guardar en la base de datos
        Promise.all(
          nuevosPrecios.map(async precio => {
            // Si no tiene código, generarlo
            if (!precio.codigo && precio.grupo_principal && precio.subgrupo) {
              precio.codigo = await generarCodigoCorto(precio.grupo_principal, precio.subgrupo);
            }
            return supabase.from('lista_de_precios').insert([precio]);
          })
        )
          .then(() => {
            toast.success(`Se importaron ${nuevosPrecios.length} precios correctamente`)
            cargarPrecios()
          })
          .catch(error => {
            console.error('Error al importar precios:', error)
            toast.error('Error al importar precios')
          })
      } catch (error) {
        console.error('Error al procesar el archivo:', error)
        toast.error('Error al procesar el archivo')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleExportarExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(precios.map(p => ({
      'Código': p.codigo,
      'Trabajos': p.trabajo,
      'Grupo Principal': p.grupo_principal,
      'Subgrupo': p.subgrupo,
      'Precio': p.precio,
      'Unidad': p.unidad || 'UN',
    })))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Precios')
    XLSX.writeFile(workbook, 'lista_de_precios.xlsx')
  }

  const handleDescargarPlantilla = () => {
    // Crear datos de ejemplo para la plantilla
    const datosEjemplo = [
      {
        'Código': 'FON-INI-001',
        'Trabajos': 'Ejemplo trabajo 1',
        'Grupo Principal': 'FONTANERIA',
        'Subgrupo': 'Instalación Interior',
        'Precio': 50,
        'Unidad': 'UN',
      },
      {
        'Código': 'CAL-INE-001',
        'Trabajos': 'Ejemplo trabajo 2',
        'Grupo Principal': 'CALEFACCION',
        'Subgrupo': 'Instalación Exterior',
        'Precio': 75,
        'Unidad': 'M2',
      },
      {
        'Código': 'AIR-PML-001',
        'Trabajos': 'Ejemplo trabajo 3',
        'Grupo Principal': 'AIRE ACONDICIONADO',
        'Subgrupo': 'Precio metro lineal Cable',
        'Precio': 100,
        'Unidad': 'ML',
      }
    ]

    // Crear la hoja de cálculo con los datos de ejemplo
    const worksheet = XLSX.utils.json_to_sheet(datosEjemplo)
    
    // Ajustar el ancho de las columnas
    const wscols = [
      { wch: 15 }, // Código
      { wch: 40 }, // Trabajos
      { wch: 20 }, // Grupo Principal
      { wch: 30 }, // Subgrupo
      { wch: 10 }, // Precio
      { wch: 10 }, // Unidad
    ]
    worksheet['!cols'] = wscols

    // Crear el libro y añadir la hoja
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla')
    
    // Descargar el archivo
    XLSX.writeFile(workbook, 'plantilla_lista_de_precios.xlsx')
    
    toast.success('Plantilla descargada correctamente')
  }

  const handleNuevoGrupo = async (e) => {
    e.preventDefault()
    
    if (modoEdicion === 'nuevo') {
      // Validar que no exista ya el grupo
      if (Object.keys(gruposSubgrupos).includes(nuevoGrupo.nombre)) {
        toast.error('Este grupo ya existe')
        return
      }
      
      // Filtrar subgrupos vacíos
      const subgruposFiltrados = nuevoGrupo.subgrupos.filter(sg => sg.trim() !== '')
      
      if (subgruposFiltrados.length === 0) {
        toast.error('Debe añadir al menos un subgrupo')
        return
      }
      
      try {
        // Insertar cada combinación de grupo y subgrupo en la base de datos
        const promesas = subgruposFiltrados.map(subgrupo => 
          supabase
            .from('grupos_subgrupos')
            .insert([{
              grupo_principal: nuevoGrupo.nombre,
              subgrupo: subgrupo
            }])
        )
        
        await Promise.all(promesas)
        
        toast.success('Grupo y subgrupos añadidos correctamente')
        setNuevoGrupo({ nombre: '', subgrupos: [''] })
        setIsGrupoModalOpen(false)
        
        // Recargar los grupos y subgrupos
        cargarGruposSubgrupos()
      } catch (error) {
        console.error('Error al guardar grupo y subgrupos:', error)
        toast.error('Error al guardar grupo y subgrupos')
      }
    } else {
      // Modo de añadir subgrupo a grupo existente
      if (!grupoExistenteSeleccionado || !nuevoSubgrupo.trim()) {
        toast.error('Debe seleccionar un grupo y escribir un subgrupo')
        return
      }
      
      try {
        const { error } = await supabase
          .from('grupos_subgrupos')
          .insert([{
            grupo_principal: grupoExistenteSeleccionado,
            subgrupo: nuevoSubgrupo.trim()
          }])
          
        if (error) {
          if (error.code === '23505') { // Código de error de duplicado
            toast.error('Este subgrupo ya existe en el grupo seleccionado')
          } else {
            throw error
          }
        } else {
          toast.success('Subgrupo añadido correctamente')
          setGrupoExistenteSeleccionado('')
          setNuevoSubgrupo('')
          setIsGrupoModalOpen(false)
          
          // Recargar los grupos y subgrupos
          cargarGruposSubgrupos()
        }
      } catch (error) {
        console.error('Error al añadir subgrupo:', error)
        toast.error('Error al añadir subgrupo')
      }
    }
  }
  
  const handleAñadirSubgrupo = () => {
    setNuevoGrupo({
      ...nuevoGrupo,
      subgrupos: [...nuevoGrupo.subgrupos, '']
    })
  }
  
  const handleEliminarSubgrupo = (index) => {
    const nuevosSubgrupos = [...nuevoGrupo.subgrupos]
    nuevosSubgrupos.splice(index, 1)
    setNuevoGrupo({
      ...nuevoGrupo,
      subgrupos: nuevosSubgrupos
    })
  }
  
  const handleCambioSubgrupo = (index, valor) => {
    const nuevosSubgrupos = [...nuevoGrupo.subgrupos]
    nuevosSubgrupos[index] = valor
    setNuevoGrupo({
      ...nuevoGrupo,
      subgrupos: nuevosSubgrupos
    })
  }

  const handleCambioModoEdicion = (modo) => {
    setModoEdicion(modo)
    // Resetear valores al cambiar de modo
    if (modo === 'nuevo') {
      setNuevoGrupo({ nombre: '', subgrupos: [''] })
    } else {
      setGrupoExistenteSeleccionado('')
      setNuevoSubgrupo('')
    }
  }

  return (
    <div className="p-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
          <div className="mb-6 md:mb-0 md:max-w-md">
            <h1 className="text-3xl font-bold text-blue-800">Lista de Precios</h1>
            <p className="mt-2 text-md text-blue-600">
              Gestiona los precios por grupos y subgrupos
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md shadow-sm transition-colors text-sm md:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Añadir nuevo trabajo</span>
              <span className="sm:hidden">Nuevo trabajo</span>
            </button>
            
            <button
              onClick={() => setIsGrupoModalOpen(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm transition-colors text-sm md:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="hidden sm:inline">Gestionar grupos</span>
              <span className="sm:hidden">Grupos</span>
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
            
            <button
              onClick={() => setIsImportadorCodigosOpen(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 border border-purple-300 text-purple-700 bg-white hover:bg-purple-50 rounded-md shadow-sm transition-colors text-sm md:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="hidden sm:inline">Importar Códigos</span>
              <span className="sm:hidden">Códigos</span>
            </button>
            
            {/* Botón Ejecutar SQL - Solo visible para SuperAdmin */}
            {isSuperAdmin && (
              <button
                onClick={() => setIsSQLExecutorOpen(true)}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-orange-300 text-orange-700 bg-white hover:bg-orange-50 rounded-md shadow-sm transition-colors text-sm md:text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="hidden sm:inline">Ejecutar SQL</span>
                <span className="sm:hidden">SQL</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-md font-medium text-blue-700 mb-2">Grupo Principal</label>
              <select
                value={grupoSeleccionado}
                onChange={(e) => {
                  setGrupoSeleccionado(e.target.value)
                  setSubgrupoSeleccionado(null)
                }}
                className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-md py-3 px-4 bg-blue-50 text-blue-800"
              >
                <option value="">Todos los grupos</option>
                {Object.keys(gruposSubgrupos).map((grupo) => (
                  <option key={grupo} value={grupo}>
                    {grupo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-md font-medium text-blue-700 mb-2">Subgrupo</label>
              <select
                value={subgrupoSeleccionado || ''}
                onChange={(e) => setSubgrupoSeleccionado(e.target.value || null)}
                className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-md py-3 px-4 bg-blue-50 text-blue-800"
                disabled={!grupoSeleccionado}
              >
                <option value="">Todos los subgrupos</option>
                {grupoSeleccionado && gruposSubgrupos[grupoSeleccionado].map((subgrupo) => (
                  <option key={subgrupo} value={subgrupo}>
                    {subgrupo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-10 text-center">
              <p className="text-blue-600 text-lg">Cargando precios...</p>
            </div>
          ) : (
            <>
              {/* Vista de tabla para desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-blue-200">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Código</th>
                      <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Trabajo</th>
                      <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Grupo Principal</th>
                      <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Subgrupo</th>
                      <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Precio</th>
                      <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Unidad</th>
                      <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100 bg-white">
                    {precios.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-blue-600">
                          No se encontraron trabajos con los filtros seleccionados
                        </td>
                      </tr>
                    ) : (
                      precios.map((precio) => (
                        <tr key={precio.id} className="hover:bg-blue-50 transition-colors duration-150">
                          <td className="px-6 py-4 text-md text-gray-800">
                            {precio.codigo}
                          </td>
                          <td className="px-6 py-4 text-md text-gray-800">
                            {precio.trabajo}
                          </td>
                          <td className="px-6 py-4 text-md text-gray-800">
                            {precio.grupo_principal}
                          </td>
                          <td className="px-6 py-4 text-md text-gray-800">
                            {precio.subgrupo}
                          </td>
                          <td className="px-6 py-4 text-md text-gray-800">
                            <span className="font-semibold">{precio.precio} €</span>
                          </td>
                          <td className="px-6 py-4 text-md text-gray-800">
                            {precio.unidad || 'UN'}
                          </td>
                          <td className="px-6 py-4 text-md text-gray-800">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditPrecio(precio)}
                                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors duration-200"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleEliminarTrabajo(precio.id)}
                                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors duration-200"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Vista de tarjetas para móvil */}
              <div className="md:hidden">
                {precios.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-blue-600 text-lg">No se encontraron trabajos con los filtros seleccionados</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {precios.map((precio) => (
                      <div key={precio.id} className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
                        {/* Header con código y trabajo */}
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-blue-800 break-words leading-tight">
                            {precio.trabajo}
                          </h3>
                          <p className="text-sm text-blue-600 mt-1">Código: {precio.codigo}</p>
                        </div>
                        
                        {/* Información del precio */}
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Grupo:</span>
                            <span className="font-medium text-sm text-blue-800">{precio.grupo_principal}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Subgrupo:</span>
                            <span className="font-medium text-sm text-blue-800">{precio.subgrupo}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Precio:</span>
                            <span className="font-semibold text-lg text-green-600">{precio.precio} €</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Unidad:</span>
                            <span className="font-medium text-sm text-blue-800">{precio.unidad || 'UN'}</span>
                          </div>
                        </div>
                        
                        {/* Botones de acción */}
                        <div className="flex space-x-2 pt-3 border-t border-blue-100">
                          <button
                            onClick={() => handleEditPrecio(precio)}
                            className="flex-1 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md shadow-sm transition-colors text-sm"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminarTrabajo(precio.id)}
                            className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md shadow-sm transition-colors text-sm"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-10">
        <div className="fixed inset-0 bg-blue-900/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-8">
              <Dialog.Title className="text-xl md:text-2xl font-bold text-blue-800 mb-4 md:mb-6">Añadir nuevo trabajo</Dialog.Title>
              <form onSubmit={handleNuevoTrabajo} className="space-y-4 md:space-y-6">
                <div>
                  <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">Trabajo</label>
                  <input
                    type="text"
                    value={nuevoTrabajo.trabajo}
                    onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, trabajo: e.target.value })}
                    className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    required
                    placeholder="Descripción del trabajo"
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">Precio (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoTrabajo.precio}
                    onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, precio: e.target.value })}
                    className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    required
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">Grupo Principal</label>
                  <select
                    value={nuevoTrabajo.grupo_principal}
                    onChange={(e) => {
                      setNuevoTrabajo({ 
                        ...nuevoTrabajo, 
                        grupo_principal: e.target.value,
                        subgrupo: ''
                      })
                    }}
                    className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    required
                  >
                    <option value="">Seleccionar grupo</option>
                    {Object.keys(gruposSubgrupos).map((grupo) => (
                      <option key={grupo} value={grupo}>
                        {grupo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">Subgrupo</label>
                  <select
                    value={nuevoTrabajo.subgrupo}
                    onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, subgrupo: e.target.value })}
                    className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    required
                    disabled={!nuevoTrabajo.grupo_principal}
                  >
                    <option value="">Seleccionar subgrupo</option>
                    {nuevoTrabajo.grupo_principal && gruposSubgrupos[nuevoTrabajo.grupo_principal].map((subgrupo) => (
                      <option key={subgrupo} value={subgrupo}>
                        {subgrupo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">Unidad</label>
                  <select
                    value={nuevoTrabajo.unidad}
                    onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, unidad: e.target.value })}
                    className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    required
                  >
                    <option value="UN">UN (Unidad)</option>
                    <option value="M2">M2 (Metro Cuadrado)</option>
                    <option value="ML">ML (Metro Lineal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">Código</label>
                  <input
                    type="text"
                    value={nuevoTrabajo.codigo}
                    onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, codigo: e.target.value })}
                    className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                    required
                    placeholder="Código del trabajo"
                  />
                </div>
                <div className="flex justify-end space-x-3 md:space-x-4 pt-3 md:pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-sm md:text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 border border-transparent rounded-md shadow-sm text-sm md:text-base font-medium text-white bg-blue-700 hover:bg-blue-800 transition-colors duration-200"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog open={isGrupoModalOpen} onClose={() => setIsGrupoModalOpen(false)} className="relative z-10">
        <div className="fixed inset-0 bg-blue-900/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl">
            <Dialog.Title className="text-2xl font-bold text-blue-800 mb-6">Gestionar grupos y subgrupos</Dialog.Title>
            
            <div className="mb-6">
              <div className="flex space-x-4 border-b border-blue-200">
                <button
                  type="button"
                  onClick={() => handleCambioModoEdicion('nuevo')}
                  className={`px-4 py-2 font-medium ${modoEdicion === 'nuevo' 
                    ? 'text-blue-700 border-b-2 border-blue-500' 
                    : 'text-gray-500 hover:text-blue-700'}`}
                >
                  Crear nuevo grupo
                </button>
                <button
                  type="button"
                  onClick={() => handleCambioModoEdicion('existente')}
                  className={`px-4 py-2 font-medium ${modoEdicion === 'existente' 
                    ? 'text-blue-700 border-b-2 border-blue-500' 
                    : 'text-gray-500 hover:text-blue-700'}`}
                >
                  Añadir subgrupo a grupo existente
                </button>
              </div>
            </div>
            
            <form onSubmit={handleNuevoGrupo} className="space-y-6">
              {modoEdicion === 'nuevo' ? (
                <>
                  <div>
                    <label className="block text-md font-medium text-blue-700 mb-2">Nombre del nuevo grupo</label>
                    <input
                      type="text"
                      value={nuevoGrupo.nombre}
                      onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, nombre: e.target.value.toUpperCase() })}
                      className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-md py-3 px-4"
                      required
                      placeholder="Nombre del grupo (ej: FONTANERIA)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-md font-medium text-blue-700 mb-2">Subgrupos</label>
                    <div className="space-y-3">
                      {nuevoGrupo.subgrupos.map((subgrupo, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={subgrupo}
                            onChange={(e) => handleCambioSubgrupo(index, e.target.value)}
                            className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-md py-3 px-4"
                            required
                            placeholder={`Subgrupo ${index + 1}`}
                          />
                          {nuevoGrupo.subgrupos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleEliminarSubgrupo(index)}
                              className="inline-flex items-center p-2 border border-red-300 rounded-md text-red-700 bg-white hover:bg-red-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAñadirSubgrupo}
                      className="mt-3 inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Añadir subgrupo
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-md font-medium text-blue-700 mb-2">Seleccionar grupo existente</label>
                    <select
                      value={grupoExistenteSeleccionado}
                      onChange={(e) => setGrupoExistenteSeleccionado(e.target.value)}
                      className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-md py-3 px-4"
                      required
                    >
                      <option value="">Seleccionar grupo</option>
                      {Object.keys(gruposSubgrupos).map((grupo) => (
                        <option key={grupo} value={grupo}>
                          {grupo}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {grupoExistenteSeleccionado && (
                    <div>
                      <label className="block text-md font-medium text-blue-700 mb-2">Subgrupos existentes</label>
                      <div className="bg-blue-50 p-3 rounded-md mb-4 max-h-40 overflow-y-auto">
                        <ul className="list-disc pl-5 space-y-1">
                          {gruposSubgrupos[grupoExistenteSeleccionado]?.map((subgrupo, index) => (
                            <li key={index} className="text-blue-800">{subgrupo}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-md font-medium text-blue-700 mb-2">Nuevo subgrupo</label>
                    <input
                      type="text"
                      value={nuevoSubgrupo}
                      onChange={(e) => setNuevoSubgrupo(e.target.value)}
                      className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-md py-3 px-4"
                      required
                      placeholder="Nombre del nuevo subgrupo"
                    />
                  </div>
                </>
              )}
              
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsGrupoModalOpen(false)}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
                >
                  Guardar
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal de edición de precio */}
      <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} className="relative z-10">
        <div className="fixed inset-0 bg-blue-900/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-8">
              <Dialog.Title className="text-xl md:text-2xl font-bold text-blue-800 mb-4 md:mb-6">Editar trabajo</Dialog.Title>
              {editingPrecio && (
                <form onSubmit={(e) => {
                  e.preventDefault()
                  handleGuardarEdicion(editingPrecio.id, editingPrecio)
                }} className="space-y-4 md:space-y-6">
                  <div>
                    <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">Código</label>
                    <input
                      type="text"
                      value={editingPrecio.codigo}
                      onChange={(e) => handleUpdateEditingPrecio('codigo', e.target.value)}
                      className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                      required
                      placeholder="Código del trabajo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">Trabajo</label>
                    <input
                      type="text"
                      value={editingPrecio.trabajo}
                      onChange={(e) => handleUpdateEditingPrecio('trabajo', e.target.value)}
                      className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                      required
                      placeholder="Descripción del trabajo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">Precio (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPrecio.precio}
                      onChange={(e) => handleUpdateEditingPrecio('precio', e.target.value)}
                      className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">Grupo Principal</label>
                    <select
                      value={editingPrecio.grupo_principal}
                      onChange={(e) => {
                        handleUpdateEditingPrecio('grupo_principal', e.target.value)
                        handleUpdateEditingPrecio('subgrupo', '')
                      }}
                      className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                      required
                    >
                      <option value="">Seleccionar grupo</option>
                      {Object.keys(gruposSubgrupos).map((grupo) => (
                        <option key={grupo} value={grupo}>
                          {grupo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">Subgrupo</label>
                    <select
                      value={editingPrecio.subgrupo}
                      onChange={(e) => handleUpdateEditingPrecio('subgrupo', e.target.value)}
                      className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                      required
                      disabled={!editingPrecio.grupo_principal}
                    >
                      <option value="">Seleccionar subgrupo</option>
                      {editingPrecio.grupo_principal && gruposSubgrupos[editingPrecio.grupo_principal].map((subgrupo) => (
                        <option key={subgrupo} value={subgrupo}>
                          {subgrupo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm md:text-md font-medium text-blue-700 mb-1 md:mb-2">Unidad</label>
                    <select
                      value={editingPrecio.unidad}
                      onChange={(e) => handleUpdateEditingPrecio('unidad', e.target.value)}
                      className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-md py-2 md:py-3 px-3 md:px-4"
                      required
                    >
                      <option value="UN">UN (Unidad)</option>
                      <option value="M2">M2 (Metro Cuadrado)</option>
                      <option value="ML">ML (Metro Lineal)</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 md:space-x-4 pt-3 md:pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false)
                        setEditingPrecio(null)
                      }}
                      className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-sm md:text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 border border-transparent rounded-md shadow-sm text-sm md:text-base font-medium text-white bg-blue-700 hover:bg-blue-800 transition-colors duration-200"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {isImportadorCodigosOpen && (
        <ImportadorCodigos
          onClose={() => setIsImportadorCodigosOpen(false)}
        />
      )}
      
      {/* Componente EjecutarSQL - Solo visible para SuperAdmin */}
      {isSuperAdmin && isSQLExecutorOpen && (
        <EjecutarSQL
          onClose={() => setIsSQLExecutorOpen(false)}
        />
      )}
    </div>
  )
}
