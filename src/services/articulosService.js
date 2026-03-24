import { supabase } from '../lib/supabase'

// Buscar artículos por término de búsqueda avanzada
export const buscarArticulos = async (termino, limite = 20) => {
  try {
    if (!termino || termino.trim().length < 2) {
      return []
    }

    const terminoLimpio = termino.trim().toLowerCase()
    
    // Normalizar términos comunes de entrada por voz
    const terminoNormalizado = normalizarTerminoBusqueda(terminoLimpio)
    
    // Dividir en términos individuales para búsqueda multi-término
    const terminos = dividirTerminos(terminoNormalizado)
    
    // Realizar múltiples búsquedas para mayor precisión
    const resultados = await Promise.all([
      busquedaPorTexto(terminoNormalizado, limite),
      busquedaPorNumeros(terminoNormalizado, limite),
      busquedaPorPatrones(terminoNormalizado, limite),
      busquedaMultiTermino(terminos, limite) // Nueva búsqueda multi-término
    ])
    
    // Combinar y deduplicar resultados
    const todosLosResultados = resultados.flat()
    const resultadosUnicos = deduplicarResultados(todosLosResultados)
    
    // Ordenar por relevancia con mejora multi-término
    return ordenarPorRelevanciaMultiTermino(resultadosUnicos, terminos, terminoNormalizado).slice(0, limite)
    
  } catch (error) {
    console.error('Error al buscar artículos:', error)
    throw error
  }
}

// Normalizar términos de búsqueda para entrada por voz
const normalizarTerminoBusqueda = (termino) => {
  const normalizaciones = {
    // Números comunes mal interpretados por voz
    'cero': '0', 'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4', 
    'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9',
    'diez': '10', 'once': '11', 'doce': '12', 'trece': '13', 'catorce': '14',
    'quince': '15', 'dieciséis': '16', 'diecisiete': '17', 'dieciocho': '18',
    'diecinueve': '19', 'veinte': '20',
    
    // Términos técnicos comunes
    'tuvo': 'tubo', 'tuve': 'tubo', 'tubo': 'tubo',
    'codo': 'codo', 'código': 'codo',
    'te': 'te', 'té': 'te',
    'reducción': 'reduccion', 'reducir': 'reduccion',
    'pulgada': 'pulgada', 'pulgadas': 'pulgada',
    'milímetro': 'mm', 'milímetros': 'mm', 'mm': 'mm',
    'centímetro': 'cm', 'centímetros': 'cm', 'cm': 'cm',
    
    // Medidas comunes mal interpretadas
    'seis pulgadas': '6"', 'cuatro pulgadas': '4"', 'dos pulgadas': '2"',
    'una pulgada': '1"', 'tres pulgadas': '3"', 'cinco pulgadas': '5"',
    
    // Espesores comunes
    'nueve milímetros': '9', 'trece milímetros': '13', 'quince milímetros': '15',
    'diecisiete milímetros': '17', 'veinte milímetros': '20'
  }
  
  let terminoNormalizado = termino
  Object.entries(normalizaciones).forEach(([original, normalizado]) => {
    const regex = new RegExp(`\\b${original}\\b`, 'gi')
    terminoNormalizado = terminoNormalizado.replace(regex, normalizado)
  })
  
  return terminoNormalizado
}

// Dividir términos para búsqueda multi-término
const dividirTerminos = (termino) => {
  // Dividir por espacios y filtrar términos vacíos
  const terminos = termino.split(/\s+/).filter(t => t.length > 0)
  
  // Clasificar términos
  const terminosTexto = []
  const terminosNumero = []
  
  terminos.forEach(t => {
    if (/^\d+$/.test(t)) {
      terminosNumero.push(parseInt(t))
    } else {
      terminosTexto.push(t)
    }
  })
  
  return {
    todos: terminos,
    texto: terminosTexto,
    numeros: terminosNumero,
    cantidad: terminos.length
  }
}

// Búsqueda multi-término inteligente
const busquedaMultiTermino = async (terminos, limite) => {
  try {
    if (terminos.cantidad < 2) return []
    
    // Construir consultas específicas para combinaciones de términos
    const consultas = []
    
    // Si hay términos de texto y números, buscar combinaciones específicas
    if (terminos.texto.length > 0 && terminos.numeros.length > 0) {
      for (const textoTerm of terminos.texto) {
        for (const numeroTerm of terminos.numeros) {
          // Búsqueda por tipo + diámetro
          consultas.push(
            supabase
              .from('vista_busqueda_articulos')
              .select('*')
              .ilike('tipo', `%${textoTerm}%`)
              .eq('diametro', numeroTerm)
              .limit(limite)
          )
          
          // Búsqueda por tipo + espesor
          consultas.push(
            supabase
              .from('vista_busqueda_articulos')
              .select('*')
              .ilike('tipo', `%${textoTerm}%`)
              .eq('espesor', numeroTerm)
              .limit(limite)
          )
        }
      }
    }
    
    // Búsqueda por múltiples términos de texto
    if (terminos.texto.length >= 2) {
      let query = supabase.from('vista_busqueda_articulos').select('*')
      
      terminos.texto.forEach((textoTerm, index) => {
        if (index === 0) {
          query = query.ilike('tipo', `%${textoTerm}%`)
        } else {
          query = query.or(`codigo.ilike.%${textoTerm}%,tipo.ilike.%${textoTerm}%,pulgada.ilike.%${textoTerm}%`)
        }
      })
      
      consultas.push(query.limit(limite))
    }
    
    if (consultas.length === 0) return []
    
    const resultados = await Promise.all(consultas)
    const datos = resultados.flatMap(result => result.data || [])
    
    return datos.map(item => ({ 
      ...item, 
      relevancia: calcularRelevanciaMultiTermino(item, terminos) 
    }))
    
  } catch (error) {
    console.error('Error en búsqueda multi-término:', error)
    return []
  }
}

// Búsqueda por campos de texto
const busquedaPorTexto = async (termino, limite) => {
  try {
    const { data, error } = await supabase
      .from('vista_busqueda_articulos')
      .select('*')
      .or(`codigo.ilike.%${termino}%,tipo.ilike.%${termino}%,pulgada.ilike.%${termino}%`)
      .limit(limite)
    
    if (error) throw error
    return (data || []).map(item => ({ ...item, relevancia: calcularRelevanciaTexto(item, termino) }))
  } catch (error) {
    console.error('Error en búsqueda por texto:', error)
    return []
  }
}

// Búsqueda por campos numéricos
const busquedaPorNumeros = async (termino, limite) => {
  try {
    const numeros = extraerNumeros(termino)
    if (numeros.length === 0) return []
    
    const consultas = numeros.map(numero => 
      supabase
        .from('vista_busqueda_articulos')
        .select('*')
        .or(`espesor.eq.${numero},diametro.eq.${numero}`)
        .limit(limite)
    )
    
    const resultados = await Promise.all(consultas)
    const datos = resultados.flatMap(result => result.data || [])
    
    return datos.map(item => ({ ...item, relevancia: calcularRelevanciaNumero(item, numeros) }))
  } catch (error) {
    console.error('Error en búsqueda por números:', error)
    return []
  }
}

// Búsqueda por patrones específicos
const busquedaPorPatrones = async (termino, limite) => {
  try {
    const patrones = []
    
    // Patrón: TIPO-ESPESOR-DIAMETRO (ej: "TUB-09-170")
    const patronCodigo = termino.match(/(\w+)-?(\d+)-?(\d+)/i)
    if (patronCodigo) {
      const [, tipo, espesor, diametro] = patronCodigo
      patrones.push(
        supabase
          .from('vista_busqueda_articulos')
          .select('*')
          .ilike('tipo', `%${tipo}%`)
          .eq('espesor', parseInt(espesor))
          .eq('diametro', parseInt(diametro))
          .limit(limite)
      )
    }
    
    // Patrón: "TIPO ESPESOR DIAMETRO" (ej: "tubo 9 170")
    const patronEspacios = termino.match(/(\w+)\s+(\d+)\s+(\d+)/i)
    if (patronEspacios) {
      const [, tipo, espesor, diametro] = patronEspacios
      patrones.push(
        supabase
          .from('vista_busqueda_articulos')
          .select('*')
          .ilike('tipo', `%${tipo}%`)
          .eq('espesor', parseInt(espesor))
          .eq('diametro', parseInt(diametro))
          .limit(limite)
      )
    }
    
    if (patrones.length === 0) return []
    
    const resultados = await Promise.all(patrones)
    const datos = resultados.flatMap(result => result.data || [])
    
    return datos.map(item => ({ ...item, relevancia: 100 })) // Máxima relevancia para patrones exactos
  } catch (error) {
    console.error('Error en búsqueda por patrones:', error)
    return []
  }
}

// Extraer números del término de búsqueda
const extraerNumeros = (termino) => {
  const numeros = termino.match(/\d+/g)
  return numeros ? numeros.map(n => parseInt(n)).filter(n => n > 0 && n < 1000) : []
}

// Calcular relevancia para búsqueda por texto
const calcularRelevanciaTexto = (articulo, termino) => {
  let puntuacion = 0
  
  // Coincidencia exacta en código (máxima prioridad)
  if (articulo.codigo?.toLowerCase().includes(termino)) {
    puntuacion += articulo.codigo.toLowerCase() === termino ? 100 : 80
  }
  
  // Coincidencia en tipo
  if (articulo.tipo?.toLowerCase().includes(termino)) {
    puntuacion += articulo.tipo.toLowerCase() === termino ? 60 : 40
  }
  
  // Coincidencia en pulgada
  if (articulo.pulgada?.toLowerCase().includes(termino)) {
    puntuacion += 30
  }
  
  return puntuacion
}

// Calcular relevancia para búsqueda por números
const calcularRelevanciaNumero = (articulo, numeros) => {
  let puntuacion = 0
  
  numeros.forEach(numero => {
    if (articulo.espesor === numero) puntuacion += 50
    if (articulo.diametro === numero) puntuacion += 50
  })
  
  return puntuacion
}

// Calcular relevancia para búsqueda multi-término
const calcularRelevanciaMultiTermino = (articulo, terminos) => {
  let puntuacion = 0
  let coincidencias = 0
  
  // Bonus por coincidencias múltiples
  const multiplicadorMultiTermino = terminos.cantidad > 1 ? 1.5 : 1
  
  // Evaluar términos de texto
  terminos.texto.forEach(textoTerm => {
    if (articulo.codigo?.toLowerCase().includes(textoTerm)) {
      puntuacion += 80
      coincidencias++
    }
    if (articulo.tipo?.toLowerCase().includes(textoTerm)) {
      puntuacion += 70
      coincidencias++
    }
    if (articulo.pulgada?.toLowerCase().includes(textoTerm)) {
      puntuacion += 40
      coincidencias++
    }
  })
  
  // Evaluar términos numéricos
  terminos.numeros.forEach(numeroTerm => {
    if (articulo.diametro === numeroTerm) {
      puntuacion += 90 // Prioridad alta para diámetro
      coincidencias++
    }
    if (articulo.espesor === numeroTerm) {
      puntuacion += 60
      coincidencias++
    }
  })
  
  // Bonus por coincidencias múltiples (cuantos más términos coincidan, mejor)
  const bonusCoincidencias = (coincidencias / terminos.cantidad) * 50
  
  // Bonus especial si coinciden TODOS los términos
  const bonusCompleto = coincidencias === terminos.cantidad ? 100 : 0
  
  return Math.round((puntuacion + bonusCoincidencias + bonusCompleto) * multiplicadorMultiTermino)
}

// Deduplicar resultados por ID
const deduplicarResultados = (resultados) => {
  const vistos = new Set()
  return resultados.filter(item => {
    if (vistos.has(item.id)) return false
    vistos.add(item.id)
    return true
  })
}

// Ordenar resultados por relevancia
const ordenarPorRelevancia = (resultados, termino) => {
  return resultados.sort((a, b) => {
    // Primero por relevancia calculada
    if (b.relevancia !== a.relevancia) {
      return b.relevancia - a.relevancia
    }
    
    // Luego por coincidencia exacta en código
    const aCodigoExacto = a.codigo?.toLowerCase() === termino ? 1 : 0
    const bCodigoExacto = b.codigo?.toLowerCase() === termino ? 1 : 0
    if (bCodigoExacto !== aCodigoExacto) {
      return bCodigoExacto - aCodigoExacto
    }
    
    // Finalmente alfabético por código
    return (a.codigo || '').localeCompare(b.codigo || '')
  })
}

// Ordenar resultados por relevancia multi-término (nueva función)
const ordenarPorRelevanciaMultiTermino = (resultados, terminos, terminoOriginal) => {
  return resultados.sort((a, b) => {
    // Recalcular relevancia si no existe
    if (!a.relevancia) a.relevancia = calcularRelevanciaMultiTermino(a, terminos)
    if (!b.relevancia) b.relevancia = calcularRelevanciaMultiTermino(b, terminos)
    
    // Primero por relevancia calculada (más importante)
    if (b.relevancia !== a.relevancia) {
      return b.relevancia - a.relevancia
    }
    
    // Segundo: Priorizar coincidencias exactas de múltiples términos
    const aCoincidenciasCompletas = contarCoincidenciasCompletas(a, terminos)
    const bCoincidenciasCompletas = contarCoincidenciasCompletas(b, terminos)
    if (bCoincidenciasCompletas !== aCoincidenciasCompletas) {
      return bCoincidenciasCompletas - aCoincidenciasCompletas
    }
    
    // Tercero: Priorizar por coincidencia exacta en código
    const aCodigoExacto = a.codigo?.toLowerCase() === terminoOriginal ? 1 : 0
    const bCodigoExacto = b.codigo?.toLowerCase() === terminoOriginal ? 1 : 0
    if (bCodigoExacto !== aCodigoExacto) {
      return bCodigoExacto - aCodigoExacto
    }
    
    // Cuarto: Priorizar por tipo exacto si hay término de texto
    if (terminos.texto.length > 0) {
      const primerTerminoTexto = terminos.texto[0]
      const aTipoExacto = a.tipo?.toLowerCase() === primerTerminoTexto ? 1 : 0
      const bTipoExacto = b.tipo?.toLowerCase() === primerTerminoTexto ? 1 : 0
      if (bTipoExacto !== aTipoExacto) {
        return bTipoExacto - aTipoExacto
      }
    }
    
    // Finalmente alfabético por código
    return (a.codigo || '').localeCompare(b.codigo || '')
  })
}

// Contar coincidencias completas de términos
const contarCoincidenciasCompletas = (articulo, terminos) => {
  let coincidencias = 0
  
  // Contar coincidencias de texto
  terminos.texto.forEach(textoTerm => {
    if (articulo.tipo?.toLowerCase() === textoTerm || 
        articulo.codigo?.toLowerCase().includes(textoTerm)) {
      coincidencias++
    }
  })
  
  // Contar coincidencias numéricas
  terminos.numeros.forEach(numeroTerm => {
    if (articulo.diametro === numeroTerm || articulo.espesor === numeroTerm) {
      coincidencias++
    }
  })
  
  return coincidencias
}

// Obtener artículo por ID
export const obtenerArticuloPorId = async (id) => {
  try {
    const { data, error } = await supabase
      .from('vista_busqueda_articulos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al obtener artículo:', error)
    throw error
  }
}

// Obtener tipos únicos para filtros
export const obtenerTipos = async () => {
  try {
    const { data, error } = await supabase
      .from('articulos_precios')
      .select('tipo')
      .eq('activo', true)
      .order('tipo')

    if (error) throw error
    
    const tiposUnicos = [...new Set(data.map(item => item.tipo))].sort()
    return tiposUnicos
  } catch (error) {
    console.error('Error al obtener tipos:', error)
    throw error
  }
}

// Obtener espesores por tipo
export const obtenerEspesoresPorTipo = async (tipo) => {
  try {
    const { data, error } = await supabase
      .from('articulos_precios')
      .select('espesor')
      .eq('activo', true)
      .eq('tipo', tipo)
      .order('espesor')

    if (error) throw error
    
    const espesoresUnicos = [...new Set(data.map(item => item.espesor))].sort((a, b) => a - b)
    return espesoresUnicos
  } catch (error) {
    console.error('Error al obtener espesores:', error)
    throw error
  }
}

// Obtener diámetros por tipo y espesor
export const obtenerDiametrosPorTipoEspesor = async (tipo, espesor) => {
  try {
    const { data, error } = await supabase
      .from('articulos_precios')
      .select('diametro')
      .eq('activo', true)
      .eq('tipo', tipo)
      .eq('espesor', espesor)
      .order('diametro')

    if (error) throw error
    
    const diametrosUnicos = [...new Set(data.map(item => item.diametro))].sort((a, b) => a - b)
    return diametrosUnicos
  } catch (error) {
    console.error('Error al obtener diámetros:', error)
    throw error
  }
}

// Obtener artículo específico por tipo, espesor y diámetro
export const obtenerArticuloPorEspecificaciones = async (tipo, espesor, diametro) => {
  try {
    const { data, error } = await supabase
      .from('vista_busqueda_articulos')
      .select('*')
      .eq('tipo', tipo)
      .eq('espesor', espesor)
      .eq('diametro', diametro)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al obtener artículo por especificaciones:', error)
    throw error
  }
}

// Obtener artículos de un parte
export const obtenerArticulosParte = async (parteId) => {
  try {
    const { data, error } = await supabase
      .from('partes_empleados_articulos')
      .select(`
        *,
        articulos_precios (
          codigo,
          tipo,
          espesor,
          diametro,
          pulgada,
          unidad
        )
      `)
      .eq('parte_id', parteId)
      .order('created_at')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error al obtener artículos del parte:', error)
    throw error
  }
}

// Añadir artículo a un parte
export const añadirArticuloAParte = async (parteId, articuloId, tipoPrecio, cantidad) => {
  try {
    const { data, error } = await supabase
      .from('partes_empleados_articulos')
      .insert([{
        parte_id: parteId,
        articulo_id: articuloId,
        tipo_precio: tipoPrecio,
        cantidad: cantidad
      }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al añadir artículo al parte:', error)
    throw error
  }
}

// Actualizar cantidad de artículo en parte
export const actualizarCantidadArticulo = async (id, cantidad) => {
  try {
    const { data, error } = await supabase
      .from('partes_empleados_articulos')
      .update({ cantidad })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al actualizar cantidad:', error)
    throw error
  }
}

// Eliminar artículo de parte
export const eliminarArticuloDeParte = async (id) => {
  try {
    const { error } = await supabase
      .from('partes_empleados_articulos')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error al eliminar artículo del parte:', error)
    throw error
  }
}
