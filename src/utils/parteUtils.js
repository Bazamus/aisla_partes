export const generateParteNumber = async (supabase, tipoParte = 'empleado') => {
  const currentYear = new Date().getFullYear().toString().slice(-2)
  const prefijo = tipoParte === 'proveedor' ? 'P' : 'E'
  
  // Obtener el último número del año actual según el tipo de parte
  const { data, error } = await supabase
    .from(tipoParte === 'proveedor' ? 'partes_proveedores' : 'partes')
    .select('numero_parte')
    .ilike('numero_parte', `%${prefijo}%/${currentYear}`)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error(`Error al obtener el último número para ${tipoParte}:`, error)
    throw error
  }

  let nextNumber = 1
  if (data && data.length > 0 && data[0].numero_parte) {
    // Extraer el número de la parte numérica del número de parte
    const lastNumberStr = data[0].numero_parte.split('/')[0]
    const lastNumber = parseInt(lastNumberStr.replace(prefijo, ''))
    nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1
  }

  // Formatear el número con ceros a la izquierda
  const formattedNumber = nextNumber.toString().padStart(4, '0')
  return `${prefijo}${formattedNumber}/${currentYear}`
}

export const formatParteNumber = (numeroParte) => {
  if (!numeroParte) return ''
  return numeroParte
}
