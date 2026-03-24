import { useState, useEffect, useCallback } from 'react'
import { 
  obtenerArticulosParte, 
  añadirArticuloAParte,
  actualizarCantidadArticulo,
  eliminarArticuloDeParte 
} from '../services/articulosService'
import { 
  obtenerOtrosTrabajos,
  añadirOtroTrabajo,
  actualizarOtroTrabajo,
  eliminarOtroTrabajo 
} from '../services/otrosTrabajosService'
import { toast } from 'react-hot-toast'

export const useParteTrabajo = (parteId) => {
  const [articulos, setArticulos] = useState([])
  const [otrosTrabajos, setOtrosTrabajos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar todos los datos del parte
  const cargarDatos = useCallback(async () => {
    if (!parteId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const [articulosData, otrosTrabajosData] = await Promise.all([
        obtenerArticulosParte(parteId),
        obtenerOtrosTrabajos(parteId)
      ])
      
      setArticulos(articulosData)
      setOtrosTrabajos(otrosTrabajosData)
    } catch (err) {
      console.error('Error al cargar datos del parte:', err)
      setError(err.message)
      toast.error('Error al cargar los datos del parte')
    } finally {
      setLoading(false)
    }
  }, [parteId])

  // Cargar datos cuando cambia el parteId
  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Funciones para artículos
  const añadirArticulo = async (articuloId, tipoPrecio, cantidad) => {
    try {
      await añadirArticuloAParte(parteId, articuloId, tipoPrecio, cantidad)
      await cargarDatos()
      toast.success('Material añadido correctamente')
    } catch (err) {
      console.error('Error al añadir artículo:', err)
      toast.error('Error al añadir el material')
      throw err
    }
  }

  const actualizarCantidad = async (articuloParteId, nuevaCantidad) => {
    try {
      await actualizarCantidadArticulo(articuloParteId, nuevaCantidad)
      await cargarDatos()
      toast.success('Cantidad actualizada')
    } catch (err) {
      console.error('Error al actualizar cantidad:', err)
      toast.error('Error al actualizar la cantidad')
      throw err
    }
  }

  const eliminarArticulo = async (articuloParteId) => {
    try {
      await eliminarArticuloDeParte(articuloParteId)
      await cargarDatos()
      toast.success('Material eliminado')
    } catch (err) {
      console.error('Error al eliminar artículo:', err)
      toast.error('Error al eliminar el material')
      throw err
    }
  }

  // Funciones para otros trabajos
  const añadirOtroTrabajoFn = async (descripcion, cantidad, unidad, precioUnitario = 0) => {
    try {
      await añadirOtroTrabajo(parteId, descripcion, cantidad, unidad, precioUnitario)
      await cargarDatos()
      toast.success('Trabajo añadido correctamente')
    } catch (err) {
      console.error('Error al añadir otro trabajo:', err)
      toast.error('Error al añadir el trabajo')
      throw err
    }
  }

  const actualizarOtroTrabajoFn = async (trabajoId, descripcion, cantidad, unidad, precioUnitario = 0) => {
    try {
      await actualizarOtroTrabajo(trabajoId, descripcion, cantidad, unidad, precioUnitario)
      await cargarDatos()
      toast.success('Trabajo actualizado')
    } catch (err) {
      console.error('Error al actualizar otro trabajo:', err)
      toast.error('Error al actualizar el trabajo')
      throw err
    }
  }

  const eliminarOtroTrabajoFn = async (trabajoId) => {
    try {
      await eliminarOtroTrabajo(trabajoId)
      await cargarDatos()
      toast.success('Trabajo eliminado')
    } catch (err) {
      console.error('Error al eliminar otro trabajo:', err)
      toast.error('Error al eliminar el trabajo')
      throw err
    }
  }

  // Cálculos derivados
  const totalArticulos = articulos.length
  const totalOtrosTrabajos = otrosTrabajos.length
  const totalTrabajos = totalArticulos + totalOtrosTrabajos

  // Cálculo de costos totales (para futuras exportaciones)
  const costoTotalArticulos = articulos.reduce((total, articulo) => {
    return total + (articulo.subtotal || 0)
  }, 0)

  const costoTotalOtrosTrabajos = otrosTrabajos.reduce((total, trabajo) => {
    return total + (trabajo.subtotal || 0)
  }, 0)

  const costoTotal = costoTotalArticulos + costoTotalOtrosTrabajos

  return {
    // Datos
    articulos,
    otrosTrabajos,
    loading,
    error,
    
    // Estadísticas
    totalArticulos,
    totalOtrosTrabajos,
    totalTrabajos,
    costoTotalArticulos,
    costoTotalOtrosTrabajos,
    costoTotal,
    
    // Funciones para artículos
    añadirArticulo,
    actualizarCantidad,
    eliminarArticulo,
    
    // Funciones para otros trabajos
    añadirOtroTrabajo: añadirOtroTrabajoFn,
    actualizarOtroTrabajo: actualizarOtroTrabajoFn,
    eliminarOtroTrabajo: eliminarOtroTrabajoFn,
    
    // Utilidades
    cargarDatos
  }
}
