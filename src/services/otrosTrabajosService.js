import { supabase } from '../lib/supabase'

// Obtener otros trabajos de un parte
export const obtenerOtrosTrabajos = async (parteId) => {
  try {
    const { data, error } = await supabase
      .from('partes_empleados_otros_trabajos')
      .select('*')
      .eq('parte_id', parteId)
      .order('created_at')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error al obtener otros trabajos:', error)
    throw error
  }
}

// Añadir otro trabajo a un parte
export const añadirOtroTrabajo = async (parteId, descripcion, cantidad, unidad, precioUnitario = 0, servicioId = null) => {
  try {
    const insertData = {
      parte_id: parteId,
      descripcion,
      cantidad,
      unidad,
      precio_unitario: precioUnitario
    }
    if (servicioId) insertData.servicio_id = servicioId

    const { data, error } = await supabase
      .from('partes_empleados_otros_trabajos')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al añadir otro trabajo:', error)
    throw error
  }
}

// Actualizar otro trabajo
export const actualizarOtroTrabajo = async (id, descripcion, cantidad, unidad, precioUnitario = 0, servicioId = null) => {
  try {
    const updateData = {
      descripcion,
      cantidad,
      unidad,
      precio_unitario: precioUnitario
    }
    if (servicioId !== undefined) updateData.servicio_id = servicioId

    const { data, error } = await supabase
      .from('partes_empleados_otros_trabajos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al actualizar otro trabajo:', error)
    throw error
  }
}

// Eliminar otro trabajo
export const eliminarOtroTrabajo = async (id) => {
  try {
    const { error } = await supabase
      .from('partes_empleados_otros_trabajos')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error al eliminar otro trabajo:', error)
    throw error
  }
}
