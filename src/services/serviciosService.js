import { supabase } from '../lib/supabase'

// Obtener todos los servicios activos
export const obtenerServicios = async () => {
  try {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('activo', true)
      .order('codigo')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error al obtener servicios:', error)
    throw error
  }
}

// Obtener servicio por ID
export const obtenerServicioPorId = async (id) => {
  try {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al obtener servicio:', error)
    throw error
  }
}

// Obtener el siguiente código auto-generado (SER-001, SER-002, etc.)
export const obtenerSiguienteCodigo = async () => {
  try {
    const { data, error } = await supabase
      .from('servicios')
      .select('codigo')
      .order('codigo', { ascending: false })
      .limit(1)

    if (error) throw error

    if (!data || data.length === 0) {
      return 'SER-001'
    }

    const ultimoCodigo = data[0].codigo
    const match = ultimoCodigo.match(/SER-(\d+)/)
    if (match) {
      const siguiente = parseInt(match[1], 10) + 1
      return `SER-${String(siguiente).padStart(3, '0')}`
    }

    return 'SER-001'
  } catch (error) {
    console.error('Error al obtener siguiente código:', error)
    return 'SER-001'
  }
}

// Crear nuevo servicio
export const crearServicio = async ({ descripcion, unidad, precio, codigo }) => {
  try {
    const codigoFinal = codigo || await obtenerSiguienteCodigo()

    const { data, error } = await supabase
      .from('servicios')
      .insert([{
        codigo: codigoFinal,
        descripcion,
        unidad,
        precio
      }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al crear servicio:', error)
    throw error
  }
}

// Actualizar servicio existente
export const actualizarServicio = async (id, { descripcion, unidad, precio, codigo }) => {
  try {
    const updateData = { descripcion, unidad, precio }
    if (codigo) updateData.codigo = codigo

    const { data, error } = await supabase
      .from('servicios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al actualizar servicio:', error)
    throw error
  }
}

// Eliminar servicio (soft delete)
export const eliminarServicio = async (id) => {
  try {
    const { error } = await supabase
      .from('servicios')
      .update({ activo: false })
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error al eliminar servicio:', error)
    throw error
  }
}

// Buscar servicios por término
export const buscarServicios = async (termino) => {
  try {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('activo', true)
      .or(`codigo.ilike.%${termino}%,descripcion.ilike.%${termino}%`)
      .order('codigo')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error al buscar servicios:', error)
    throw error
  }
}
