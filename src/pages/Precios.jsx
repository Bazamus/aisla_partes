import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import FiltrosArticulos from '../components/articulos/FiltrosArticulos'
import TablaArticulos from '../components/articulos/TablaArticulos'
import ModalArticulo from '../components/articulos/ModalArticulo'
import ModalEditarArticulo from '../components/articulos/ModalEditarArticulo'
import ImportExportButtons from '../components/articulos/ImportExportButtons'
import TablaServicios from '../components/servicios/TablaServicios'
import ModalServicio from '../components/servicios/ModalServicio'
import { obtenerServicios, eliminarServicio } from '../services/serviciosService'

export default function Precios() {
  const { userRoles } = useAuth();
  const [tabActiva, setTabActiva] = useState('materiales')

  // Estado de materiales (existente)
  const [articulos, setArticulos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    tipos: [],
    espesores: [],
    diametros: []
  })
  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState({
    tipo: '',
    espesor: '',
    diametro: ''
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingArticulo, setEditingArticulo] = useState(null)

  // Estado de servicios (nuevo)
  const [servicios, setServicios] = useState([])
  const [loadingServicios, setLoadingServicios] = useState(false)
  const [isModalServicioOpen, setIsModalServicioOpen] = useState(false)
  const [editingServicio, setEditingServicio] = useState(null)

  const isSuperAdmin = userRoles?.some(role => role.nombre === 'SuperAdmin');

  useEffect(() => {
    cargarArticulos()
    cargarFiltros()
    cargarServicios()
  }, [])

  // --- Funciones de Materiales (sin cambios) ---

  const cargarFiltros = async () => {
    try {
      const { data, error } = await supabase
        .from('articulos_precios')
        .select('tipo, espesor, diametro')
        .eq('activo', true)

      if (error) throw error

      const tipos = [...new Set(data.map(item => item.tipo))].sort()
      const espesores = [...new Set(data.map(item => item.espesor))].sort((a, b) => a - b)
      const diametros = [...new Set(data.map(item => item.diametro))].sort((a, b) => a - b)

      setFiltros({ tipos, espesores, diametros })
    } catch (error) {
      console.error('Error al cargar filtros:', error)
      toast.error('Error al cargar filtros')
    }
  }

  const cargarArticulos = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('articulos_precios')
        .select('*')
        .eq('activo', true)
        .order('tipo', { ascending: true })
        .order('espesor', { ascending: true })
        .order('diametro', { ascending: true })

      if (filtrosSeleccionados.tipo) {
        query = query.eq('tipo', filtrosSeleccionados.tipo)
      }

      if (filtrosSeleccionados.espesor) {
        query = query.eq('espesor', parseInt(filtrosSeleccionados.espesor))
      }

      if (filtrosSeleccionados.diametro) {
        query = query.eq('diametro', parseInt(filtrosSeleccionados.diametro))
      }

      const { data, error } = await query
      if (error) throw error
      setArticulos(data)
    } catch (error) {
      toast.error('Error al cargar los artículos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarArticulos()
  }, [filtrosSeleccionados])

  const handleFiltroChange = (filtro, valor) => {
    setFiltrosSeleccionados(prev => ({
      ...prev,
      [filtro]: valor
    }))
  }

  const handleEditArticulo = (articulo) => {
    setEditingArticulo({
      id: articulo.id,
      tipo: articulo.tipo,
      espesor: articulo.espesor,
      diametro: articulo.diametro,
      pulgada: articulo.pulgada || '',
      unidad: articulo.unidad || 'Ml',
      precio_aislamiento: articulo.precio_aislamiento || '',
      precio_aluminio: articulo.precio_aluminio || '',
      codigo: articulo.codigo
    })
    setIsEditModalOpen(true)
  }

  const handleEliminarArticulo = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este artículo?')) {
      try {
        const { error } = await supabase
          .from('articulos_precios')
          .update({ activo: false })
          .eq('id', id)

        if (error) throw error
        toast.success('Artículo eliminado correctamente')
        cargarArticulos()
        cargarFiltros()
      } catch (error) {
        toast.error('Error al eliminar el artículo: ' + error.message)
      }
    }
  }

  const refreshData = () => {
    cargarArticulos()
    cargarFiltros()
  }

  // --- Funciones de Servicios (nuevo) ---

  const cargarServicios = async () => {
    try {
      setLoadingServicios(true)
      const data = await obtenerServicios()
      setServicios(data)
    } catch (error) {
      toast.error('Error al cargar servicios: ' + error.message)
    } finally {
      setLoadingServicios(false)
    }
  }

  const handleEditServicio = (servicio) => {
    setEditingServicio(servicio)
    setIsModalServicioOpen(true)
  }

  const handleEliminarServicio = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      try {
        await eliminarServicio(id)
        toast.success('Servicio eliminado correctamente')
        cargarServicios()
      } catch (error) {
        toast.error('Error al eliminar el servicio: ' + error.message)
      }
    }
  }

  const handleCloseModalServicio = () => {
    setEditingServicio(null)
    setIsModalServicioOpen(false)
  }

  return (
    <div className="p-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary-700">Lista de Precios</h1>
          <p className="mt-2 text-md text-primary-600">
            Gestiona materiales y servicios para partes de trabajo
          </p>
        </div>

        {/* Pestañas */}
        <div className="flex bg-white rounded-lg p-1 border border-blue-200 mb-6 max-w-xs">
          <button
            onClick={() => setTabActiva('materiales')}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-md transition-colors duration-200 ${
              tabActiva === 'materiales'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
            }`}
          >
            Materiales
          </button>
          <button
            onClick={() => setTabActiva('servicios')}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-md transition-colors duration-200 ${
              tabActiva === 'servicios'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
            }`}
          >
            Servicios
          </button>
        </div>

        {/* Contenido de Materiales */}
        {tabActiva === 'materiales' && (
          <>
            <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
              <div />
              <ImportExportButtons
                onNuevoArticulo={() => setIsModalOpen(true)}
                articulos={articulos}
                onRefreshData={refreshData}
              />
            </div>

            <FiltrosArticulos
              filtros={filtros}
              filtrosSeleccionados={filtrosSeleccionados}
              onFiltroChange={handleFiltroChange}
            />

            <TablaArticulos
              articulos={articulos}
              loading={loading}
              onEditArticulo={handleEditArticulo}
              onEliminarArticulo={handleEliminarArticulo}
            />

            <ModalArticulo
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onRefreshData={refreshData}
            />

            <ModalEditarArticulo
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              editingArticulo={editingArticulo}
              setEditingArticulo={setEditingArticulo}
              onRefreshData={refreshData}
            />
          </>
        )}

        {/* Contenido de Servicios */}
        {tabActiva === 'servicios' && (
          <>
            <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between space-y-4 md:space-y-0">
              <p className="text-sm text-gray-600">
                Servicios y trabajos no incluidos en el catálogo de materiales
              </p>
              <button
                onClick={() => {
                  setEditingServicio(null)
                  setIsModalServicioOpen(true)
                }}
                className="inline-flex items-center px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold shadow-sm transition-colors duration-200 text-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Añadir Servicio
              </button>
            </div>

            <TablaServicios
              servicios={servicios}
              loading={loadingServicios}
              onEditServicio={handleEditServicio}
              onEliminarServicio={handleEliminarServicio}
            />

            <ModalServicio
              isOpen={isModalServicioOpen}
              onClose={handleCloseModalServicio}
              onRefreshData={cargarServicios}
              servicio={editingServicio}
            />
          </>
        )}
      </div>
    </div>
  )
}
