import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import SignaturePad from '../components/SignaturePad'
import ImageUploader from '../components/ImageUploader'
import TrabajosCardNuevoRediseniado from '../components/partes-empleados/TrabajosCardNuevoRediseniado'
import ModalObraBloqueada from '../components/common/ModalObraBloqueada'
import { PermissionGuard } from '../components/auth/PermissionGuard'
import { useAuth } from '../contexts/AuthContext'

export default function EditarParte() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission, hasRole, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [obras, setObras] = useState([])
  const [obrasEmpleado, setObrasEmpleado] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loadingObras, setLoadingObras] = useState(false)
  const [loadingEmpleados, setLoadingEmpleados] = useState(false)
  const [formData, setFormData] = useState({
    nombre_obra: '',
    codigo_empleado: '',
    nombre_trabajador: '',
    cliente: '',
    email_contacto: '',
    fecha: '',
    estado: 'Borrador',
    notas: '',
    firma: '',
    imagenes: []
  })

  // Log para debugging del estado del formulario
  useEffect(() => {
    console.log('Estado actual del formulario:', formData)
  }, [formData])
  
  const [tiempoTotal, setTiempoTotal] = useState(0)
  const [trabajos, setTrabajos] = useState([])
  
  // Estados para la nueva estructura de trabajos
  const [datosTrabajos, setDatosTrabajos] = useState({
    articulos: [],
    otrosTrabajos: [],
    totalTrabajos: 0,
    hayTrabajos: false
  })

  const [empleadoTarifas, setEmpleadoTarifas] = useState({
    coste_hora_trabajador: 0,
    coste_hora_empresa: 0
  })

  // Estados para el modal de obra bloqueada
  const [showModalObraBloqueada, setShowModalObraBloqueada] = useState(false)
  const [obraSeleccionada, setObraSeleccionada] = useState('')
  const [nuevaObra, setNuevaObra] = useState('')
  const [obraBloqueada, setObraBloqueada] = useState('')

  useEffect(() => {
    cargarEmpleados()
    fetchParte()
  }, [id])

  const cargarEmpleados = async () => {
    setLoadingEmpleados(true)
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('id, nombre, codigo')
        .order('nombre')

      if (error) throw error
      setEmpleados(data || [])
    } catch (error) {
      console.error('Error al cargar empleados:', error)
      toast.error('Error al cargar empleados')
    } finally {
      setLoadingEmpleados(false)
    }
  }

  const cargarObras = async () => {
    setLoadingObras(true)
    try {
      const { data, error } = await supabase
        .from('obras')
        .select('id, nombre_obra, cliente, numero_obra')
        .order('nombre_obra')

      if (error) throw error
      setObras(data || [])
    } catch (error) {
      console.error('Error al cargar obras:', error)
      toast.error('Error al cargar obras')
    } finally {
      setLoadingObras(false)
    }
  }

  const cargarObrasAsignadas = async (empleadoId) => {
    if (!empleadoId) return
    
    try {
      const { data, error } = await supabase
        .from('empleados_obras')
        .select('obra_id, obras (id, nombre_obra, cliente, numero_obra)')
        .eq('empleado_id', empleadoId)

      if (error) throw error

             const obrasValidas = data.filter(item => item.obras && item.obras.id)
       const obrasTransformadas = obrasValidas.map(item => ({
         id: item.obras.id,
         nombre_obra: item.obras.nombre_obra,
         cliente: item.obras.cliente,
         numero_obra: item.obras.numero_obra
       }))
       
       console.log('Obras asignadas al empleado cargadas:', obrasTransformadas)
       setObrasEmpleado(obrasTransformadas)
    } catch (error) {
      console.error('Error al cargar obras asignadas:', error)
      toast.error('Error al cargar obras asignadas')
    }
  }

  const cargarTrabajosDelParte = async () => {
    if (!id) return
    
    try {
      const { data, error } = await supabase
        .from('partes_empleados_trabajos')
        .select(`
          id,
          descripcion,
          tiempo_empleado,
          observaciones,
          tipo_trabajo,
          portal,
          vivienda,
          cantidad,
          created_at
        `)
        .eq('parte_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      setTrabajos(data || [])
      
      // Calcular tiempo total
      const total = (data || []).reduce((sum, trabajo) => sum + (trabajo.tiempo_empleado || 0), 0)
      setTiempoTotal(total)
    } catch (error) {
      console.error('Error al cargar trabajos del parte:', error)
      toast.error('Error al cargar trabajos del parte')
    }
  }

  const fetchParte = async () => {
    try {
      console.log('Cargando parte con ID:', id)
      const { data, error } = await supabase
        .from('partes')
        .select('*')
        .eq('id', id)
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        const parte = data[0]
        console.log('Datos del parte cargados:', parte)
        
        const formattedData = {
          ...parte,
          fecha: parte.fecha ? parte.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
          imagenes: parte.imagenes || [],
          firma: parte.firma || ''
        }
        console.log('Datos formateados para el formulario:', formattedData)
        setFormData(formattedData)

        // Cargar trabajos del parte
        await cargarTrabajosDelParte()

                 // Buscar las tarifas del empleado y cargar obras asignadas
         let empleadoEncontrado = null
         
         if (parte.codigo_empleado && parte.codigo_empleado !== 'SIN_CODIGO') {
           // Buscar por código de empleado
           const { data: empleadoData, error: empleadoError } = await supabase
             .from('empleados')
             .select('id, codigo, nombre, coste_hora_trabajador, coste_hora_empresa')
             .eq('codigo', parte.codigo_empleado)
             .limit(1)

           if (!empleadoError && empleadoData && empleadoData.length > 0) {
             empleadoEncontrado = empleadoData[0]
           }
         }
         
         // Si no se encontró por código, buscar por email
         if (!empleadoEncontrado && parte.email_contacto) {
           console.log('Buscando empleado por email:', parte.email_contacto)
           const { data: empleadoData, error: empleadoError } = await supabase
             .from('empleados')
             .select('id, codigo, nombre, coste_hora_trabajador, coste_hora_empresa')
             .eq('email', parte.email_contacto)
             .limit(1)

           if (!empleadoError && empleadoData && empleadoData.length > 0) {
             empleadoEncontrado = empleadoData[0]
             console.log('Empleado encontrado por email:', empleadoEncontrado)
             
             // Actualizar el código de empleado en el formulario
             setFormData(prev => ({
               ...prev,
               codigo_empleado: empleadoEncontrado.codigo
             }))
           }
         }
         
         if (empleadoEncontrado) {
           setEmpleadoTarifas({
             coste_hora_trabajador: empleadoEncontrado.coste_hora_trabajador,
             coste_hora_empresa: empleadoEncontrado.coste_hora_empresa
           })
           
           // Cargar las obras asignadas al empleado
           await cargarObrasAsignadas(empleadoEncontrado.id)
         } else {
           console.log('No se encontró empleado para el parte')
           // Si no hay empleado encontrado, limpiar las obras
           setObrasEmpleado([])
         }
      } else {
        toast.error('No se encontró el parte')
        navigate('/')
      }
    } catch (error) {
      console.error('Error al cargar el parte:', error)
      toast.error('Error al cargar el parte')
      navigate('/')
    }
  }

    const handleChange = async (e) => {
    const { name, value } = e.target
    
    // Si el campo modificado es nombre_obra, verificar restricciones
    if (name === 'nombre_obra') {
      // Si ya hay trabajos y se está intentando cambiar la obra
      if (datosTrabajos.hayTrabajos && value !== formData.nombre_obra && value !== '') {
        setObraSeleccionada(formData.nombre_obra)
        setNuevaObra(value)
        setShowModalObraBloqueada(true)
        return // No continuar con el cambio hasta que el usuario confirme
      }
      
      // Si no hay trabajos o es el mismo valor, proceder normalmente
      const obraSeleccionada = obrasEmpleado.find(obra => obra.nombre_obra === value)
      if (obraSeleccionada) {
        setFormData(prevData => ({
          ...prevData,
          [name]: value,
          cliente: obraSeleccionada.cliente || ''
        }))
      } else {
        setFormData(prevData => ({
          ...prevData,
          [name]: value
        }))
      }
      return
    }
    
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }))

    // Si el campo modificado es código_empleado, buscar el nombre del trabajador y sus tarifas
    if (name === 'codigo_empleado') {
      try {
        const { data, error } = await supabase
          .from('empleados')
          .select('id, nombre, coste_hora_trabajador, coste_hora_empresa')
          .eq('codigo', value)
          .limit(1)

        if (error) {
          console.error('Error al buscar empleado:', error)
          return
        }

        if (data && data.length > 0) {
          const empleado = data[0]
          setFormData(prevData => ({
            ...prevData,
            nombre_trabajador: empleado.nombre
          }))
          setEmpleadoTarifas({
            coste_hora_trabajador: empleado.coste_hora_trabajador,
            coste_hora_empresa: empleado.coste_hora_empresa
          })
          
          // Cargar las obras asignadas al empleado
          await cargarObrasAsignadas(empleado.id)
        } else {
          setFormData(prevData => ({
            ...prevData,
            nombre_trabajador: ''
          }))
          setEmpleadoTarifas({
            coste_hora_trabajador: 0,
            coste_hora_empresa: 0
          })
          setObrasEmpleado([])
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }
  }

  // Handler para actualizar el tiempo total cuando cambien los trabajos
  const handleTiempoChange = (nuevoTiempo) => {
    setTiempoTotal(nuevoTiempo);
  };

  // Handler para recibir cambios en los trabajos del componente TrabajosCardNuevoRediseñado
  const handleTrabajosChange = (datos) => {
    setDatosTrabajos(datos);
  };

  const handleImageUpload = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      imagenes: [...prev.imagenes, imageUrl]
    }))
  }

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, index) => index !== indexToRemove)
    }))
  }

  const handleSignatureSave = (signatureData) => {
    setFormData(prev => ({
      ...prev,
      firma: signatureData
    }))
    toast.success('Firma actualizada correctamente')
  }

  // Función para confirmar cambio de obra (eliminar trabajos)
  const handleConfirmarCambioObra = () => {
    // Limpiar todos los trabajos de la nueva estructura
    setDatosTrabajos({
      articulos: [],
      otrosTrabajos: [],
      totalTrabajos: 0,
      hayTrabajos: false
    })
    
    // También limpiar trabajos de la estructura antigua por compatibilidad
    setTrabajos([])
    
    // Cambiar la obra
    const obraSeleccionada = obrasEmpleado.find(obra => obra.nombre_obra === nuevaObra)
    if (obraSeleccionada) {
      setFormData(prevData => ({
        ...prevData,
        nombre_obra: nuevaObra,
        cliente: obraSeleccionada.cliente || ''
      }))
    }
    
    // Cerrar modal
    setShowModalObraBloqueada(false)
    setObraSeleccionada('')
    setNuevaObra('')
    
    toast.success('Obra cambiada. Todos los trabajos han sido eliminados.')
  }

  // Función para cancelar cambio de obra
  const handleCancelarCambioObra = () => {
    setShowModalObraBloqueada(false)
    setObraSeleccionada('')
    setNuevaObra('')
  }

  // Función para determinar si el usuario puede editar el parte
  const puedeEditarParte = () => {
    const puedeEditarEstado = hasRole('SuperAdmin') || hasRole('superadmin') || hasRole('admin') || hasRole('administrador') || hasRole('supervisor') || user?.email === 'admin@vimar.com'
    return puedeEditarEstado || formData.estado === 'Borrador'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Iniciando guardado del parte...')
    setLoading(true)

    // Validar permisos de edición según el estado del parte
    const puedeEditarEstado = hasRole('SuperAdmin') || hasRole('superadmin') || hasRole('admin') || hasRole('administrador') || hasRole('supervisor') || user?.email === 'admin@vimar.com'
    
    if (!puedeEditarEstado && formData.estado !== 'Borrador') {
      toast.error('Solo puedes editar partes en estado "Borrador". Los administradores pueden cambiar el estado.')
      setLoading(false)
      return
    }

    // Validar campos requeridos
    const camposRequeridos = {
      nombre_obra: 'Nombre de la Obra',
      codigo_empleado: 'Código del Empleado',
      nombre_trabajador: 'Nombre del Trabajador',
      cliente: 'Cliente',
      fecha: 'Fecha'
    }

    const camposFaltantes = []
    for (const [campo, nombre] of Object.entries(camposRequeridos)) {
      if (!formData[campo] || formData[campo].toString().trim() === '') {
        camposFaltantes.push(nombre)
      }
    }

    if (camposFaltantes.length > 0) {
      toast.error(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`)
      setLoading(false)
      return
    }

    if (!formData.firma) {
      toast.error('Por favor, añade una firma antes de guardar')
      setLoading(false)
      return
    }

    try {
      console.log('Actualizando parte principal...')
      // Actualizar el parte principal
      const { error: parteError } = await supabase
        .from('partes')
        .update(formData)
        .eq('id', id)

      if (parteError) {
        console.error('Error al actualizar parte:', parteError)
        throw parteError
      }

      console.log('Parte principal actualizado, procesando trabajos...')
      // Actualizar trabajos
      if (trabajos.length > 0) {
        // Primero eliminar todos los trabajos existentes
        const { error: deleteError } = await supabase
          .from('partes_empleados_trabajos')
          .delete()
          .eq('parte_id', id)

        if (deleteError) {
          console.error('Error al eliminar trabajos:', deleteError)
          throw deleteError
        }

        // Luego insertar los nuevos trabajos
        const trabajosParaGuardar = trabajos.map(trabajo => ({
          parte_id: id,
          descripcion: trabajo.descripcion,
          tiempo_empleado: trabajo.tiempo_empleado,
          observaciones: trabajo.observaciones,
          tipo_trabajo: trabajo.tipo_trabajo,
          portal: trabajo.portal,
          vivienda: trabajo.vivienda,
          cantidad: trabajo.cantidad || 1
        }))

        const { error: trabajosError } = await supabase
          .from('partes_empleados_trabajos')
          .insert(trabajosParaGuardar)

        if (trabajosError) {
          console.error('Error al insertar trabajos:', trabajosError)
          throw trabajosError
        }
      }

      console.log('Parte actualizado correctamente')
      toast.success('Parte de trabajo actualizado correctamente')
      navigate('/')
    } catch (error) {
      console.error('Error completo:', error)
      toast.error(`Error al actualizar el parte de trabajo: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Editar Parte de Trabajo</h2>
            <p className="mt-2 text-sm text-gray-600">
              Modifique los campos necesarios para actualizar el parte de trabajo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mx-auto">
               {/* Tarjeta de Información Principal */}
               <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 transform transition-all hover:scale-[1.02]">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Información Principal</h3>
                </div>
                                 <div className="space-y-6">
                   {/* Primera fila: Código del Empleado, Nombre de la Obra y Fecha */}
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div>
                       <label htmlFor="codigo_empleado" className="block text-sm font-medium text-gray-900 mb-2">
                         Código del Empleado
                       </label>
                       <input
                         type="text"
                         name="codigo_empleado"
                         id="codigo_empleado"
                         value={formData.codigo_empleado}
                         onChange={handleChange}
                         readOnly={!puedeEditarParte()}
                         className={`w-full px-4 py-3 rounded-xl border transition-colors duration-200 ${
                           puedeEditarParte() 
                             ? 'bg-gray-50 text-gray-900 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200' 
                             : 'bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed'
                         }`}
                       />
                     </div>
                     <div className="lg:col-span-2 mobile-form-group">
                       <label htmlFor="nombre_obra" className="mobile-field-label">
                         Nombre de la Obra
                       </label>
                       <div className="mobile-obra-field">
                         <select
                           name="nombre_obra"
                           id="nombre_obra"
                           value={formData.nombre_obra}
                           onChange={handleChange}
                           disabled={!puedeEditarParte()}
                           className={`mobile-obra-select mobile-smooth-transition mobile-interactive ${
                             !puedeEditarParte() ? 'opacity-60 cursor-not-allowed' : ''
                           }`}
                         >
                           <option value="">Seleccionar obra...</option>
                           {obrasEmpleado.length > 0 ? (
                             obrasEmpleado.map((obra) => (
                               <option key={obra.id} value={obra.nombre_obra}>
                                 {obra.nombre_obra}
                               </option>
                             ))
                           ) : (
                             <option value="" disabled>
                               No hay obras asignadas al empleado
                             </option>
                           )}
                         </select>
                       </div>
                       {obrasEmpleado.length === 0 && (
                         <p className="mt-2 text-sm text-orange-600">
                           ⚠️ Este empleado no tiene obras asignadas. Contacte al administrador.
                         </p>
                       )}
                       {/* Bloque informativo de obra bloqueada */}
                      {datosTrabajos.hayTrabajos && formData.nombre_obra && (
                        <div className="mobile-obra-blocked desktop-compact">
                          <div className="blocked-header">
                            <svg className="blocked-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="blocked-content">
                              <h4 className="blocked-title">
                                Obra bloqueada: {formData.nombre_obra}
                              </h4>
                              <p className="blocked-text">
                                Este parte tiene trabajos asignados. Para cambiar de obra, debes eliminar todos los trabajos existentes.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                     </div>
                   </div>

                   {/* Segunda fila: Nombre del Trabajador, Cliente y Fecha */}
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div>
                       <label htmlFor="nombre_trabajador" className="block text-sm font-medium text-gray-900 mb-2">
                         Nombre del Trabajador
                       </label>
                       <input
                         type="text"
                         name="nombre_trabajador"
                         id="nombre_trabajador"
                         value={formData.nombre_trabajador}
                         onChange={handleChange}
                         readOnly
                         className="w-full px-4 py-3 bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition-colors duration-200 cursor-not-allowed"
                       />
                     </div>
                     <div>
                       <label htmlFor="cliente" className="block text-sm font-medium text-gray-900 mb-2">
                         Cliente
                       </label>
                       <input
                         type="text"
                         name="cliente"
                         id="cliente"
                         value={formData.cliente}
                         onChange={handleChange}
                         readOnly
                         className="w-full px-4 py-3 bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition-colors duration-200 cursor-not-allowed"
                       />
                     </div>
                     <div>
                       <label htmlFor="fecha" className="block text-sm font-medium text-gray-900 mb-2">
                         Fecha
                       </label>
                       <input
                         type="date"
                         name="fecha"
                         id="fecha"
                         value={formData.fecha}
                         onChange={handleChange}
                         readOnly={!puedeEditarParte()}
                         className={`w-full px-4 py-3 rounded-xl border transition-colors duration-200 ${
                           puedeEditarParte() 
                             ? 'bg-gray-50 text-gray-900 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200' 
                             : 'bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed'
                         }`}
                       />
                     </div>
                   </div>

                   {/* Tercera fila: Estado del Parte */}
                   <div className="mobile-form-group">
                     <label htmlFor="estado" className="mobile-field-label">
                       Estado del Parte
                     </label>
                     {/* Verificar si el usuario tiene un rol que le permita editar el estado */}
                     {(() => {
                       // Prioridad para SuperAdmin (con 'S' mayúscula)
                       if (hasRole('SuperAdmin')) return true;
                       // Caso especial para el superadmin principal por email
                       if (user?.email === 'admin@vimar.com') return true;
                       
                       // Los usuarios con rol proveedor o empleado nunca pueden editar el estado
                       if (hasRole('proveedor') || hasRole('empleado')) return false;
                       
                       // Solo otros roles administrativos pueden editar el estado
                       return hasRole('superadmin') || hasRole('admin') || hasRole('administrador') || hasRole('supervisor');
                     })() ? (
                       <div className="mobile-estado-field">
                         <select
                           id="estado"
                           name="estado"
                           value={formData.estado}
                           onChange={handleChange}
                           className="mobile-estado-select mobile-smooth-transition mobile-interactive"
                         >
                           <option value="Borrador">Borrador</option>
                           <option value="Pendiente de Revisión">Pendiente de Revisión</option>
                           <option value="Aprobado">Aprobado</option>
                           <option value="Rechazado">Rechazado</option>
                         </select>
                       </div>
                     ) : (
                       <div className="mobile-estado-display mobile-smooth-transition">
                         <div className={`${
                           formData.estado === 'Borrador' ? 'borrador' :
                           formData.estado === 'Pendiente de Revisión' ? 'pendiente' :
                           formData.estado === 'Aprobado' ? 'aprobado' :
                           'rechazado'
                         }`}>
                           {formData.estado}
                         </div>
                       </div>
                     )}
                     
                     {/* Descripción del estado */}
                     <div className="mobile-estado-description">
                       <p>
                         {formData.estado === 'Borrador' && 'El parte está en modo borrador y puede ser editado libremente antes de enviarlo para revisión.'}
                         {formData.estado === 'Pendiente de Revisión' && 'El parte ha sido enviado y está pendiente de revisión por el responsable de obra.'}
                         {formData.estado === 'Aprobado' && 'El parte ha sido aprobado por el responsable de obra.'}
                         {formData.estado === 'Rechazado' && 'El parte ha sido rechazado y requiere modificaciones.'}
                       </p>
                     </div>
                   </div>

                   {/* Notas Adicionales (ancho completo) */}
                   <div>
                     <label htmlFor="notas" className="block text-sm font-medium text-gray-900 mb-2">
                       Notas Adicionales
                     </label>
                     <textarea
                       name="notas"
                       id="notas"
                       rows="3"
                       value={formData.notas}
                       onChange={handleChange}
                       readOnly={!puedeEditarParte()}
                       className={`w-full px-4 py-3 rounded-xl border transition-colors duration-200 ${
                         puedeEditarParte() 
                           ? 'bg-gray-50 text-gray-900 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200' 
                           : 'bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed'
                       }`}
                       placeholder="Escribe aquí cualquier información adicional sobre el parte de trabajo..."
                     />
                   </div>
                 </div>
              </div>

                             {/* Tarjeta de Trabajos */}
               <div className="lg:col-span-2">
                 <TrabajosCardNuevoRediseniado
                  parteId={id}
                  readOnly={!puedeEditarParte()}
                  onTrabajosChange={handleTrabajosChange}
                 />
               </div>

              {/* Tarjeta de Imágenes */}
              <div className="bg-white rounded-2xl shadow-lg p-6 transform transition-all hover:scale-[1.02]">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Imágenes</h3>
                </div>
                <ImageUploader
                  onImageUpload={handleImageUpload}
                  onRemoveImage={handleRemoveImage}
                  images={formData.imagenes}
                  parteId={id}
                  readOnly={!puedeEditarParte()}
                />
              </div>

              {/* Tarjeta de Firma */}
              <div className="bg-white rounded-2xl shadow-lg p-6 transform transition-all hover:scale-[1.02]">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Firma Digital</h3>
                </div>
                <SignaturePad
                  onSave={handleSignatureSave}
                  initialValue={formData.firma}
                  readOnly={!puedeEditarParte()}
                />
              </div>
            </div>

            {/* Mensaje informativo cuando no se puede editar */}
            {!puedeEditarParte() && (
              <div className="flex justify-center mb-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-yellow-800">
                      <strong>Modo de solo lectura:</strong> Este parte no está en estado "Borrador" y solo puede ser editado por administradores.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botón de Guardar */}
            <div className="flex justify-center pt-8">
              <button
                type="submit"
                disabled={loading || !puedeEditarParte()}
                className={`
                  px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center space-x-2
                  ${
                    loading || !puedeEditarParte()
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg transform hover:scale-105'
                  }
                `}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
                         </div>
           </form>
         </div>
       </div>
       
       {/* Modal de Obra Bloqueada */}
       <ModalObraBloqueada
         isOpen={showModalObraBloqueada}
         onClose={handleCancelarCambioObra}
         onConfirm={handleConfirmarCambioObra}
         obraSeleccionada={obraSeleccionada}
         nuevaObra={nuevaObra}
       />
     </div>
   )
 }
