import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom' // Importar useLocation
import toast from 'react-hot-toast'
import SkeletonLoader from '../components/SkeletonLoader'
import DashboardStats from '../components/DashboardStats'
import DashboardPersonalizado from '../components/dashboard/DashboardPersonalizado'
import DashboardProveedor from '../components/dashboard/DashboardProveedor'
import DashboardEmpleado from '../components/dashboard/DashboardEmpleado'
import { useAuth } from '../contexts/AuthContext'
import { useStats } from '../contexts/StatsContext'
import InstallPWA from '../components/pwa/InstallPWA'
import * as parteProveedorService from '../services/parteProveedorService'
import * as parteService from '../services/parteService'
import * as exportService from '../services/exportService'
import * as proveedorService from '../services/proveedorService'
import { exportarPartesEmpleados, exportarPartesProveedores, exportarTodosPartes, showExportLog } from '../services/importExportService'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import {
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ArrowDownTrayIcon,
  BriefcaseIcon,
  ClipboardDocumentIcon,
  TrashIcon, // Icono para eliminar
  ChevronDownIcon,
  ChevronUpIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import { formatDate } from '../utils/dateUtils'
import ConfirmModal from '../components/ConfirmModal'; // Importar ConfirmModal

const FILTERS_STORAGE_KEY = 'dashboard_filters'
const DATA_CACHE_KEY = 'dashboard_data_cache'
const CACHE_TTL = 2 * 60 * 1000 // 2 minutos de vida útil del caché

const getSavedFilters = () => {
  try {
    const saved = sessionStorage.getItem(FILTERS_STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

const getCachedData = () => {
  try {
    const saved = sessionStorage.getItem(DATA_CACHE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

const isCacheFresh = () => {
  const cached = getCachedData()
  if (!cached?.cachedAt || !cached?.allPartes?.length) return false
  return (Date.now() - cached.cachedAt) < CACHE_TTL
}

function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation() // Obtener location
  const { isAdmin, isSupervisor, hasRole, user, isEmpleado, isProveedor } = useAuth()
  const { globalStats } = useStats()
  const savedFilters = getSavedFilters()
  const [allPartes, setAllPartes] = useState([])
  const [filteredPartes, setFilteredPartes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewType, setViewType] = useState(savedFilters?.viewType || 'card')
  const [searchTerm, setSearchTerm] = useState(savedFilters?.searchTerm || '')
  const [filterBy, setFilterBy] = useState(savedFilters?.filterBy || 'todos')
  const [tipoParteFilter, setTipoParteFilter] = useState(savedFilters?.tipoParteFilter || 'todos')
  const [fechaDesde, setFechaDesde] = useState(savedFilters?.fechaDesde || '')
  const [fechaHasta, setFechaHasta] = useState(savedFilters?.fechaHasta || '')
  const [obraFilter, setObraFilter] = useState(savedFilters?.obraFilter || '')
  const [empleadoFilter, setEmpleadoFilter] = useState(savedFilters?.empleadoFilter || '')
  const [proveedorFilter, setProveedorFilter] = useState(savedFilters?.proveedorFilter || '')
  const [obras, setObras] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [loadingFilters, setLoadingFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(savedFilters?.currentPage || 1)
  const [showPersonalizado, setShowPersonalizado] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false); // Estado para controlar el modal de confirmación
  const [parteToDelete, setParteToDelete] = useState(null); // Estado para guardar el parte a eliminar
  const [showMobileFilters, setShowMobileFilters] = useState(false); // Estado para mostrar/ocultar filtros en móvil
  const itemsPerPage = 15 // 15 elementos por página (3x5 en tarjetas o 15 filas en tabla)
  const isSuperAdmin = user?.email === 'admin@partes.com'
  const isInitialLoad = useRef(true) // Evitar resetear página en la carga inicial

  // Actualizar caché de datos cuando cambian las listas de filtros
  useEffect(() => {
    if (!allPartes.length) return;
    try {
      const existing = getCachedData();
      sessionStorage.setItem(DATA_CACHE_KEY, JSON.stringify({
        allPartes, obras, empleados, proveedores,
        cachedAt: existing?.cachedAt || Date.now()
      }));
    } catch { /* sessionStorage lleno, ignorar */ }
  }, [allPartes, obras, empleados, proveedores])

  // Persistir filtros en sessionStorage para mantenerlos al navegar y volver
  useEffect(() => {
    const filters = {
      viewType, searchTerm, filterBy, tipoParteFilter,
      fechaDesde, fechaHasta, obraFilter, empleadoFilter,
      proveedorFilter, currentPage
    }
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters))
  }, [viewType, searchTerm, filterBy, tipoParteFilter, fechaDesde, fechaHasta, obraFilter, empleadoFilter, proveedorFilter, currentPage])

  // Función para cargar los partes de empleados
  const fetchPartesEmpleados = async () => {
    try {
      setError(null);

      // Importar el cliente admin para saltarse RLS
      const { supabaseAdmin } = await import('../lib/supabase');

      // Consulta directa a la tabla de partes
      const { data: partesData, error: partesError } = await supabaseAdmin
        .from('partes')
        .select('*, estado, cliente')
        .order('created_at', { ascending: false });

      if (partesError) {
        console.error('[Dashboard] Error al cargar partes de empleados:', partesError);
        setError(partesError.message);
        toast.error('Error al cargar partes de empleados.');
        return [];
      }

      const partesConTipo = (partesData || []).map(p => ({ ...p, tipo_parte: 'empleado' }));

      // Cargar datos de empleados y obras relacionados
      const userIds = [...new Set(partesConTipo.filter(p => p.user_id).map(p => p.user_id))];
      const obraIds = [...new Set(partesConTipo.filter(p => p.id_obra).map(p => p.id_obra))];

      // Cargar empleados y obras en paralelo
      const [empleadosResult, obrasResult] = await Promise.all([
        userIds.length > 0
          ? supabase.from('empleados').select('id, nombre, codigo, user_id').in('user_id', userIds)
          : { data: [], error: null },
        obraIds.length > 0
          ? supabase.from('obras').select('id, nombre_obra, numero_obra, cliente').in('id', obraIds)
          : { data: [], error: null }
      ]);

      const empleadosData = empleadosResult.data || [];
      const obrasData = obrasResult.data || [];

      // Crear mapas para búsqueda rápida O(1) en vez de .find() O(n)
      const empleadosMap = new Map(empleadosData.map(emp => [emp.user_id, emp]));
      const obrasMap = new Map(obrasData.map(o => [o.id, o]));

      // Combinar datos de empleados y obras con partes
      const partesConRelaciones = partesConTipo.map(parte => ({
        ...parte,
        empleado: empleadosMap.get(parte.user_id) || null,
        obra: obrasMap.get(parte.id_obra) || null
      }));

      return partesConRelaciones;
    } catch (error) {
      console.error('Error general en fetchPartesEmpleados:', error);
      setError(error.message);
      toast.error('Error al cargar los partes de trabajo de empleados');
      return [];
    }
  };

  // Función para cargar los partes de proveedores
  const fetchPartesProveedores = async () => {
    try {
      const data = await parteProveedorService.getPartesProveedores()

      // Marcar estos partes como de tipo "proveedor"
      const partesConTipo = (data || []).map(parte => ({
        ...parte,
        tipo_parte: 'proveedor'
      }))

      return partesConTipo; // Devolver los datos procesados

    } catch (error) {
      console.error('Error en fetchPartesProveedores:', error);
      toast.error('Error al cargar los partes de trabajo de proveedores');
      return []; // Devolver un array vacío en caso de error
    } finally {
      // setLoading(false); // Ya no se maneja el loading individualmente aquí
    }
  }

  // Función para cargar datos de filtros
  const loadFilterData = async () => {
    if (!showPersonalizado) return;

    setLoadingFilters(true);
    try {
      // Paso 1: Queries paralelas para obtener IDs de obras y empleados
      const [
        { data: obrasEmpleados },
        { data: userIdsConPartes },
        { data: nombresConPartes }
      ] = await Promise.all([
        supabase.from('partes').select('id_obra').not('id_obra', 'is', null),
        supabase.from('partes').select('user_id').not('user_id', 'is', null),
        supabase.from('partes').select('nombre_trabajador').not('nombre_trabajador', 'is', null)
      ]);

      // IDs únicos de obras
      const obrasIds = new Set();
      if (obrasEmpleados) obrasEmpleados.forEach(o => obrasIds.add(o.id_obra));

      // Preparar datos para query de empleados
      const userIds = userIdsConPartes ? [...new Set(userIdsConPartes.map(p => p.user_id))] : [];
      const nombresTrabajadores = nombresConPartes ? [...new Set(nombresConPartes.map(p => p.nombre_trabajador))] : [];

      // Paso 2: Queries paralelas para obtener datos completos
      const buildEmpleadosQuery = () => {
        if (userIds.length === 0 && nombresTrabajadores.length === 0) return null;
        let query = supabase.from('empleados').select('id, nombre, codigo, user_id');
        if (userIds.length > 0 && nombresTrabajadores.length > 0) {
          query = query.or(`user_id.in.(${userIds.join(',')}),nombre.in.(${nombresTrabajadores.map(n => `"${n}"`).join(',')})`);
        } else if (userIds.length > 0) {
          query = query.in('user_id', userIds);
        } else {
          query = query.in('nombre', nombresTrabajadores);
        }
        return query.order('nombre');
      };

      const empleadosQuery = buildEmpleadosQuery();
      const [obrasResult, empleadosResult] = await Promise.all([
        obrasIds.size > 0
          ? supabase.from('obras').select('id, nombre_obra, numero_obra').in('id', Array.from(obrasIds)).order('nombre_obra')
          : { data: [], error: null },
        empleadosQuery || { data: [], error: null }
      ]);

      if (!obrasResult.error) setObras(obrasResult.data || []);
      if (!empleadosResult.error) setEmpleados(empleadosResult.data || []);

    } catch (error) {
      console.error('Error al cargar datos de filtros:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (!user) return;

    // Restaurar datos desde caché para mostrar instantáneamente al volver
    const cached = getCachedData();
    if (cached?.allPartes?.length) {
      setAllPartes(cached.allPartes);
      if (cached.obras) setObras(cached.obras);
      if (cached.empleados) setEmpleados(cached.empleados);
      if (cached.proveedores) setProveedores(cached.proveedores);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // Si el caché es fresco (< 2 min), no re-fetchar
    if (isCacheFresh()) {
      setLoading(false);
      setTimeout(() => { isInitialLoad.current = false }, 100);
      return;
    }

    // Refrescar datos desde la BD
    const loadData = async () => {
      try {
        let empleadosData = [];

        // Solo cargar datos según el tipo de usuario
        if (isEmpleado || showPersonalizado) {
          empleadosData = await fetchPartesEmpleados();
        }

        const safeEmpleadosData = Array.isArray(empleadosData) ? empleadosData : [];

        setAllPartes(safeEmpleadosData);

        // Cargar datos de filtros
        if (showPersonalizado) {
          await loadFilterData();
        }

        // Guardar en caché con timestamp
        try {
          sessionStorage.setItem(DATA_CACHE_KEY, JSON.stringify({
            allPartes: safeEmpleadosData,
            obras: obras,
            empleados: empleados,
            proveedores: proveedores,
            cachedAt: Date.now()
          }));
        } catch { /* sessionStorage lleno, ignorar */ }
      } catch (error) {
        console.error("[Dashboard] Error al cargar datos iniciales:", error);
        toast.error("Error al cargar datos iniciales.");
        setAllPartes([]);
      } finally {
        setLoading(false);
        setTimeout(() => { isInitialLoad.current = false }, 100)
      }
    };

    loadData();
  }, [user, isEmpleado, isProveedor, showPersonalizado]);


  // Efecto para filtrar los partes
  useEffect(() => {
    if (!allPartes.length) return // Evitar filtrado innecesario si no hay datos

    const filtered = allPartes.filter(parte => {
      // Filtro por búsqueda global - Mejorado para buscar en todos los campos relevantes
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' ||
        // Número de parte
        parte.numero_parte?.toString().toLowerCase().includes(searchTermLower) ||
        // Obra (nombre y número)
        (parte.obra?.nombre_obra || parte.nombre_obra || '')?.toLowerCase().includes(searchTermLower) ||
        (parte.obra?.numero_obra || parte.numero_obra || '')?.toLowerCase().includes(searchTermLower) ||
        // Empleado (nombre y código)
        (parte.empleado?.nombre || parte.nombre_trabajador || '')?.toLowerCase().includes(searchTermLower) ||
        (String(parte.empleado?.codigo || parte.codigo_empleado || ''))?.toLowerCase().includes(searchTermLower) ||
        // Cliente/Empresa
        (parte.empresa || parte.cliente || '')?.toLowerCase().includes(searchTermLower) ||
        // Proveedor (razón social y código)
        (parte.proveedor?.razon_social || parte.razon_social || '')?.toLowerCase().includes(searchTermLower) ||
        (String(parte.proveedor?.codigo || parte.codigo_proveedor || ''))?.toLowerCase().includes(searchTermLower) ||
        // Estado
        (parte.estado || '')?.toLowerCase().includes(searchTermLower) ||
        // Fecha (convertir a string para búsqueda)
        (parte.fecha ? new Date(parte.fecha).toLocaleDateString('es-ES').toLowerCase().includes(searchTermLower) : false) ||
        // Tipo de parte
        (parte.tipo_parte || '')?.toLowerCase().includes(searchTermLower)

      // Filtro por estado
      const matchesEstado = filterBy === 'todos' ||
        (filterBy === 'aprobados' && parte.estado === 'Aprobado') ||
        (filterBy === 'pendientes_revision' && parte.estado === 'Pendiente de Revisión') ||
        (filterBy === 'borrador' && parte.estado === 'Borrador') ||
        (filterBy === 'rechazados' && parte.estado === 'Rechazado')

      // Filtro por tipo de parte
      const matchesTipo = tipoParteFilter === 'todos' ||
        (tipoParteFilter === 'empleado' && parte.tipo_parte === 'empleado') ||
        (tipoParteFilter === 'proveedor' && parte.tipo_parte === 'proveedor')

      // Filtro por fecha desde
      const matchesFechaDesde = !fechaDesde || 
        (parte.fecha && new Date(parte.fecha) >= new Date(fechaDesde))

      // Filtro por fecha hasta
      const matchesFechaHasta = !fechaHasta || 
        (parte.fecha && new Date(parte.fecha) <= new Date(fechaHasta))

      // Filtro por obra (funciona con ID seleccionado para empleados y proveedores)
      let matchesObra = false;
      
      if (!obraFilter || obraFilter === '') {
        matchesObra = true;
      } else {
        // obraFilter es siempre un ID del select, comparar solo por ID exacto
        const obraSeleccionada = obras.find(o => o.id.toString() === obraFilter);
        const nombreObraSeleccionada = obraSeleccionada?.nombre_obra;

        // Para partes de empleado: comparar por ID de obra
        if (parte.tipo_parte === 'empleado') {
          matchesObra = (parte.obra?.id?.toString() === obraFilter) ||
            (parte.id_obra?.toString() === obraFilter);
        }
        // Para partes de proveedor: comparar por ID de obra o por nombre exacto en trabajos
        else if (parte.tipo_parte === 'proveedor') {
          matchesObra = (parte.obra?.id?.toString() === obraFilter) ||
            (parte.obra_id?.toString() === obraFilter);

          // Si no coincide con obra directa, buscar en trabajos por nombre exacto
          if (!matchesObra && parte.trabajos && Array.isArray(parte.trabajos) && nombreObraSeleccionada) {
            matchesObra = parte.trabajos.some(trabajo =>
              trabajo.obra === nombreObraSeleccionada
            );
          }
        }
      }


      // Filtro por empleado (buscar por ID o por nombre)
      let matchesEmpleado = false;
      if (!empleadoFilter || empleadoFilter === '') {
        matchesEmpleado = true;
      } else {
        // Buscar el empleado seleccionado para obtener su nombre
        const empleadoSeleccionado = empleados.find(e => e.id.toString() === empleadoFilter);
        
        if (empleadoSeleccionado) {
          // Comparar por ID (si el parte tiene empleado.id) o por nombre
          matchesEmpleado = 
            (parte.empleado?.id?.toString() === empleadoFilter) ||
            (parte.empleado?.nombre === empleadoSeleccionado.nombre) ||
            (parte.nombre_trabajador === empleadoSeleccionado.nombre);
        } else {
          // Fallback: búsqueda por texto (si empleadoFilter no es un ID válido)
          matchesEmpleado = 
            (parte.empleado?.nombre || parte.nombre_trabajador || '').toLowerCase().includes(empleadoFilter.toLowerCase()) ||
            (String(parte.empleado?.codigo || parte.codigo_empleado || '')).toLowerCase().includes(empleadoFilter.toLowerCase());
        }
      }

      // Filtro por proveedor (ahora funciona con ID seleccionado)
      const matchesProveedor = !proveedorFilter || proveedorFilter === '' ||
        (parte.proveedor?.id?.toString() === proveedorFilter) ||
        (String(parte.proveedor?.razon_social || parte.razon_social || '')).toLowerCase().includes(proveedorFilter.toLowerCase()) ||
        (String(parte.proveedor?.codigo || parte.codigo_proveedor || '')).toLowerCase().includes(proveedorFilter.toLowerCase())

      return matchesSearch && matchesEstado && matchesTipo && matchesFechaDesde && matchesFechaHasta && matchesObra && matchesEmpleado && matchesProveedor
    })

    setFilteredPartes(filtered)

    // Resetear a la primera página solo cuando el usuario cambia filtros manualmente
    // No resetear durante la carga inicial ni cuando cambian datos de soporte (empleados, proveedores, allPartes)
    if (!isInitialLoad.current) {
      setCurrentPage(1)
    }
  }, [searchTerm, filterBy, tipoParteFilter, fechaDesde, fechaHasta, obraFilter, empleadoFilter, proveedorFilter, allPartes, empleados, proveedores])

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredPartes.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredPartes.length / itemsPerPage)

  // Función para cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber)


  const handleDescargarPDF = async (parte, event) => {
    try {
      
      // Prevenir propagación del evento de click (evita navegación a la página de detalle)
      // cuando se hace click en el botón de descargar
      event.stopPropagation();
      
      // Determinar el tipo de parte y usar el servicio correspondiente
      if (parte.tipo_parte === 'proveedor') {
        try {
          // Obtener el parte completo con todos los detalles
          const parteCompleto = await parteProveedorService.getParteProveedorById(parte.id)
          
          if (!parteCompleto) {
            throw new Error('No se pudo obtener la información completa del parte')
          }
          
          // Generar el PDF utilizando la plantilla para partes de proveedores
          const doc = await exportService.generateProveedorPDF(parteCompleto)
          
          // Generar el nombre del archivo
          const fileName = `parte_proveedor_${parte.numero_parte || 'sin_numero'}_${new Date().toISOString().split('T')[0]}.pdf`
          
          // Descargar el PDF
          doc.save(fileName)
        } catch (provError) {
          console.error('Error específico al generar PDF de proveedor:', provError)
          throw provError;
        }
      } else {
        try {
          // Para partes de empleados
          
          // Asegurar que el ID esté en el formato correcto (string)
          const parteId = String(parte.id).trim();
          
          const parteCompleto = await parteService.getParteById(parteId);
          
          if (!parteCompleto) {
            console.error('No se pudo obtener la información completa del parte de empleado');
            
            // Intento alternativo: obtener directamente de la tabla con supabaseAdmin
            try {
              const { supabaseAdmin } = await import('../lib/supabase');
              const { data: parteAlternativo, error } = await supabaseAdmin
                .from('partes')
                .select('*')
                .eq('id', parteId)
                .maybeSingle();
                
              if (error) {
                console.error('Error en búsqueda alternativa:', error);
                throw new Error('No se pudo obtener la información del parte después de múltiples intentos');
              }
              
              if (parteAlternativo) {
                const doc = await exportService.generateEmpleadoPDF(parteAlternativo);
                const fileName = `parte_empleado_${parteAlternativo.numero_parte || 'sin_numero'}_${new Date().toISOString().split('T')[0]}.pdf`;
                doc.save(fileName);
                setLoading(false);
                return;
              } else {
                throw new Error('No se pudo obtener la información completa del parte de empleado');
              }
            } catch (alternativeError) {
              console.error('Error en método alternativo:', alternativeError);
              toast.error('Error al generar el PDF');
              setLoading(false);
              return;
            }
          }
          
          
          // Generar el PDF utilizando la función específica para partes de empleados
          const doc = await exportService.generateEmpleadoPDF(parteCompleto)
          
          // Generar el nombre del archivo
          const fileName = `parte_empleado_${parte.numero_parte || 'sin_numero'}_${new Date().toISOString().split('T')[0]}.pdf`
          
          // Descargar el PDF
          doc.save(fileName)
        } catch (empError) {
          console.error('Error específico al generar PDF de empleado:', empError)
          throw empError;
        }
      }
      
      toast.success('PDF descargado correctamente')
    } catch (error) {
      console.error('Error al generar PDF:', error)
      toast.error('Error al generar el PDF: ' + (error.message || 'Error desconocido'))
    }
  }

  // Función para navegar al detalle del parte
  const handleParteClick = (parte) => {
    if (parte.tipo_parte === 'proveedor') {
      navigate(`/parte-proveedor/ver/${parte.id}`);
    } else { // Asume que 'else' corresponde a partes de tipo 'empleado'
      navigate(`/ver-detalle/empleado/${parte.id}`);
    }
  }

  // Función para eliminar un parte
  const canUserDeleteParte = (parte) => {
    if (isSuperAdmin) {
      return true;
    }

    if (parte.estado !== 'Borrador') {
      return false;
    }

    const isOwner = user?.id === parte.user_id;

    if (isAdmin) {
      return true;
    }
    if (isSupervisor && user?.id === parte.supervisor_id) {
      return true;
    }
    if (hasRole('Empleado') && isOwner) {
      return true;
    }
    if (hasRole('Proveedor') && isOwner) {
      return true;
    }

    return false;
  }

  // Función para eliminar un parte
  const handleDeleteParte = async (e, parte) => {
    e.stopPropagation(); // Evitar que se propague al clic de la tarjeta
    
    // Usar la función centralizada para verificar permisos
    const canDelete = canUserDeleteParte(parte);

    if (!canDelete) {
      toast.error('No tienes permiso para eliminar este parte o el parte no está en estado Borrador.');
      return;
    }
    
    setParteToDelete(parte);
    setShowConfirmModal(true);
  }

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      
      if (parteToDelete.tipo_parte === 'proveedor') {
        await parteProveedorService.deleteParteProveedor(parteToDelete.id);
      } else {
        await parteService.deleteParte(parteToDelete.id);
      }
      
      // Recargar datos
      const [empleados, proveedores] = await Promise.all([fetchPartesEmpleados(), fetchPartesProveedores()]);
      setAllPartes([...(empleados || []), ...(proveedores || [])]);

      toast.success('Parte eliminado correctamente');
    } catch (error) {
      console.error('❌ [handleDeleteParte] Error al eliminar el parte:', error);
      toast.error(error.message || 'Error al eliminar el parte');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  // Funciones de exportación disponibles: exportarPartesEmpleados, exportarPartesProveedores, exportarTodosPartes, showExportLog

  // Función para exportar partes de empleados
  const handleExportEmpleados = async () => {
    alert('Exportando partes de empleados - Verificar consola...');
    
    if (!(isSuperAdmin || isAdmin)) {
      toast.error('Solo SuperAdmin o Administrador pueden exportar');
      return;
    }
    try {
      toast.loading('Generando archivo Excel de partes de empleados...');
      const partesEmpleados = filteredPartes.filter(parte => parte.tipo_parte === 'empleado');
      if (partesEmpleados.length === 0) {
        toast.dismiss();
        toast.error('No hay partes de empleados para exportar');
        return;
      }
      try {
        const resultado = await exportarPartesEmpleados(partesEmpleados);
        
        toast.dismiss();
        if (resultado && resultado.success === false) {
          toast.error(resultado.message || 'Error al exportar');
        } else {
          toast.success(`Archivo Excel generado con ${partesEmpleados.length} partes de empleados`);
        }
      } catch (exportError) {
        console.error('❌ Error al usar exportarPartesEmpleados:', exportError);
        toast.dismiss();
        toast.error('Error al generar el archivo Excel: ' + (exportError.message || 'Error desconocido'));
        
        // Intento de fallback manual en caso de error
        try {
          showExportLog();
        } catch(fallbackError) {
          console.error('Error en fallback:', fallbackError);
        }
      }
    } catch (error) {
      console.error('Error al exportar partes de empleados:', error);
      toast.dismiss();
      toast.error('Error al generar el archivo Excel: ' + (error.message || 'Error desconocido'));
    }
  };

  // Función para exportar partes de proveedores
  const handleExportProveedores = async () => {
    if (!(isSuperAdmin || isAdmin)) {
      toast.error('Solo SuperAdmin o Administrador pueden exportar');
      return;
    }
    try {
      toast.loading('Generando archivo Excel de partes de proveedores...');
      const partesProveedores = filteredPartes.filter(parte => parte.tipo_parte === 'proveedor');
      if (partesProveedores.length === 0) {
        toast.dismiss();
        toast.error('No hay partes de proveedores para exportar');
        return;
      }
      try {
        const resultado = await exportarPartesProveedores(partesProveedores);
        toast.dismiss();
        if (resultado && resultado.success === false) {
          toast.error(resultado.message || 'Error al exportar');
        } else {
          toast.success(`Archivo Excel generado con ${partesProveedores.length} partes de proveedores`);
        }
      } catch (exportError) {
        console.error('Error al usar exportarPartesProveedores:', exportError);
        toast.dismiss();
        toast.error('Error al generar el archivo Excel: ' + (exportError.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error al exportar partes de proveedores:', error);
      toast.dismiss();
      toast.error('Error al generar el archivo Excel: ' + (error.message || 'Error desconocido'));
    }
  };

  // Función para exportar todos los partes
  const handleExportTodos = async () => {
    if (!isSuperAdmin) {
      toast.error('Solo el SuperAdmin puede exportar');
      return;
    }
    try {
      toast.loading('Generando archivo Excel de todos los partes...');
      if (filteredPartes.length === 0) {
        toast.dismiss();
        toast.error('No hay partes para exportar');
        return;
      }
      try {
        const resultado = await exportarTodosPartes(filteredPartes);
        toast.dismiss();
        if (resultado && resultado.success === false) {
          toast.error(resultado.message || 'Error al exportar');
        } else {
          toast.success(`Archivo Excel generado con ${filteredPartes.length} partes`);
        }
      } catch (exportError) {
        console.error('Error al usar exportarTodosPartes:', exportError);
        toast.dismiss();
        toast.error('Error al generar el archivo Excel: ' + (exportError.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error al exportar todos los partes:', error);
      toast.dismiss();
      toast.error('Error al generar el archivo Excel: ' + (error.message || 'Error desconocido'));
    }
  };

  // Renderizar parte en formato tarjeta
  const renderParteCard = (parte) => (
    <div
      key={parte.id}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => handleParteClick(parte)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Parte #{parte.numero_parte || 'Sin número'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              <CalendarIcon className="w-3 h-3 inline mr-1" />
              {formatDate(parte.fecha)}
            </p>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              parte.estado === 'Aprobado'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : parte.estado === 'Pendiente de Revisión'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                : parte.estado === 'Rechazado'
                ? 'bg-red-100 text-red-800 border border-red-300'
                : parte.estado === 'Borrador'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            }`}
          >
            {parte.estado || 'Borrador'}
          </span>
        </div>

        <div className="space-y-2">
          {parte.tipo_parte === 'empleado' ? (
            <>
              <div className="flex items-center text-gray-700">
                <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-500" />
                <p className="text-sm truncate font-medium">
                  {parte.obra?.nombre_obra || parte.nombre_obra || 'Sin obra asignada'}
                </p>
              </div>
              <div className="flex items-center text-gray-700">
                <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
                <p className="text-sm truncate">
                  {parte.empleado?.nombre || parte.nombre_trabajador || 'Sin trabajador asignado'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center text-gray-700">
                <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-500" />
                <p className="text-sm truncate font-medium">
                  {parte.obra?.nombre_obra || (parte.trabajos && parte.trabajos.length > 0 ? parte.trabajos[0].obra : 'Sin obra asignada')}
                </p>
              </div>
              <div className="flex items-center text-gray-700">
                <BriefcaseIcon className="w-4 h-4 mr-2 text-gray-500" />
                <p className="text-sm truncate">
                  {parte.proveedor?.razon_social || parte.razon_social || 'Sin proveedor asignado'}
                </p>
              </div>
            </>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-start gap-2 flex-wrap">
          <button
            onClick={(e) => { e.stopPropagation(); handleDescargarPDF(parte, e); }}
            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Descargar PDF"
            aria-label="Descargar PDF del parte"
            tabIndex="0"
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
            PDF
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleParteClick(parte); }}
            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Ver Detalle"
            aria-label="Ver detalle del parte"
            tabIndex="0"
          >
            <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
            Ver
          </button>
          {canUserDeleteParte(parte) && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteParte(e, parte); }}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="Eliminar Parte"
              aria-label="Eliminar parte"
              tabIndex="0"
            >
              <TrashIcon className="w-4 h-4 mr-1" />
              Eliminar
            </button>
          )}
        </div> {/* Fin del div de botones */}
      </div> {/* Fin del div con className="p-4" */}
    </div> // Fin del div principal de la tarjeta (key={parte.id})
  ); // Fin de renderParteCard

  // Comienzo de renderParteTable
  const renderParteTable = (parte) => (
    <tr
      key={parte.id}
      className="hover:bg-gray-50 cursor-pointer"
      onClick={() => handleParteClick(parte)}
    >
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {parte.numero_parte || 'Sin número'}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {parte.tipo_parte === 'empleado' ? (
          <div className="text-sm text-gray-900 truncate max-w-[200px] font-medium">
            {parte.obra?.nombre_obra || parte.nombre_obra || 'Sin obra asignada'}
          </div>
        ) : (
          <div className="text-sm text-gray-900 truncate max-w-[200px] font-medium">
            {parte.obra?.nombre_obra || (parte.trabajos && parte.trabajos.length > 0 ? parte.trabajos[0].obra : 'Sin obra asignada')}
          </div>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {parte.tipo_parte === 'empleado' ? (
          <div className="text-sm text-gray-900 truncate max-w-[200px]">
            {parte.empleado?.nombre || parte.nombre_trabajador || 'Sin trabajador asignado'}
          </div>
        ) : (
          <div className="text-sm text-gray-900 truncate max-w-[200px]">
            {parte.proveedor?.razon_social || parte.razon_social || 'Sin proveedor asignado'}
          </div>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {formatDate(parte.fecha)}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            parte.estado === 'Aprobado'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : parte.estado === 'Pendiente de Revisión'
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
              : parte.estado === 'Rechazado'
              ? 'bg-red-100 text-red-800 border border-red-300'
              : parte.estado === 'Borrador'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-800 border border-gray-300'
          }`}
        >
          {parte.estado || 'Borrador'}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-start gap-2 flex-wrap">
          <button
            onClick={(e) => { e.stopPropagation(); handleDescargarPDF(parte, e); }}
            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Descargar PDF"
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
            PDF
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleParteClick(parte); }}
            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Ver Detalle"
          >
            <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
            Ver
          </button>
          {canUserDeleteParte(parte) && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteParte(e, parte); }}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="Eliminar Parte"
            >
              <TrashIcon className="w-4 h-4 mr-1" />
              Eliminar
            </button>
          )}
        </div>
      </td>
    </tr>
  )

  return (
    <div className="space-y-6">
      {/* Inicio personalizado para proveedores */}
      {isProveedor() ? (
        <DashboardProveedor />
      ) : isEmpleado() ? (
        <DashboardEmpleado />
      ) : (
        <>
          {/* Inicio personalizado para administradores y supervisores */}
          {(isAdmin || isSupervisor) && (
            <div className="mb-6">
              <DashboardPersonalizado />
            </div>
          )}

          {/* Estadísticas generales */}
          <DashboardStats partes={filteredPartes} statsData={globalStats} />
          
          {/* Prompt de instalación PWA */}
          <InstallPWA showOnDashboard={true} />

          {/* Título y filtros */}
          <div id="partes-trabajo-section" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Partes de Trabajo</h1>
          </div> {/* Close the title container div */}
            
          {/* Filtros y búsqueda */}
          <div className="bg-white p-4 rounded-xl shadow-sm w-full mb-6"> 

            {/* Vista Desktop: Mantener el diseño original */}
            <div className="hidden md:block">
            {/* Fila 1: Búsqueda y Botones de Vista */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-4 mb-4">
              {/* Buscador */}
              <div className="relative flex-1 min-w-80">
                <input
                  type="search"
                  placeholder="Buscar partes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all bg-white"
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>

              {/* Grupo de Botones de Vista */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewType('card')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                    viewType === 'card'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{ backgroundColor: viewType === 'card' ? 'white' : 'transparent' }}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">Tarjetas</span>
                </button>
                <button
                  onClick={() => setViewType('table')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                    viewType === 'table'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{ backgroundColor: viewType === 'table' ? 'white' : 'transparent' }}
                >
                  <TableCellsIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Tabla</span>
                </button>
              </div>
            </div>

            {/* Fila 2: Filtros por Estado y Tipo */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-4 mb-4">
              {/* Selector de estado */}
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white text-gray-700 transition-all"
              >
                <option value="todos">Todos los estados</option>
                <option value="aprobados">Aprobados</option>
                <option value="pendientes_revision">Pendientes de Revisión</option>
                <option value="borrador">Borrador</option>
                <option value="rechazados">Rechazados</option>
              </select>

              {/* Selector de tipo de parte */}
              <select
                value={tipoParteFilter}
                onChange={(e) => setTipoParteFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white text-gray-700 transition-all"
              >
                <option value="todos">Todos los tipos de partes</option>
                <option value="empleado">Partes de empleados</option>
                <option value="proveedor">Partes de proveedores</option>
              </select>

              {/* Filtros de fecha */}
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white text-gray-700 transition-all"
                  placeholder="Desde"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white text-gray-700 transition-all"
                  placeholder="Hasta"
                />
              </div>
            </div>

            {/* Fila 3: Filtros específicos (Obra, Empleado, Proveedor) */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-4 mb-4">
              {/* Filtro por obra */}
              <div className="relative">
                  <BuildingOfficeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                  <select
                  value={obraFilter}
                  onChange={(e) => setObraFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 w-full sm:w-48 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Todas las obras</option>
                    {obras.map((obra) => (
                      <option key={obra.id} value={obra.id}>
                        {obra.nombre_obra} {obra.numero_obra ? `(${obra.numero_obra})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Filtro por empleado */}
              <div className="relative">
                  <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                  <select
                  value={empleadoFilter}
                  onChange={(e) => setEmpleadoFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 w-full sm:w-48 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Todos los empleados</option>
                    {empleados.map((empleado) => (
                      <option key={empleado.id} value={empleado.id}>
                        {empleado.nombre} {empleado.codigo ? `(${empleado.codigo})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Filtro por proveedor */}
              <div className="relative">
                  <BriefcaseIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
                  <select
                  value={proveedorFilter}
                  onChange={(e) => setProveedorFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 w-full sm:w-48 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Todos los proveedores</option>
                    {proveedores.map((proveedor) => (
                      <option key={proveedor.id} value={proveedor.id}>
                        {proveedor.razon_social} {proveedor.codigo ? `(${proveedor.codigo})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Botón para limpiar filtros */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('todos');
                  setTipoParteFilter('todos');
                  setFechaDesde('');
                  setFechaHasta('');
                  setObraFilter('');
                  setEmpleadoFilter('');
                  setProveedorFilter('');
                  setCurrentPage(1);
                  sessionStorage.removeItem(FILTERS_STORAGE_KEY);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              >
                Limpiar filtros
              </button>
              </div>
            </div>

            {/* Vista Móvil: Diseño optimizado */}
            <div className="block md:hidden">
              {/* Encabezado móvil con búsqueda y botón de filtros */}
              <div className="flex flex-col space-y-3 mb-4">
                {/* Buscador móvil con mejor separación */}
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Buscar partes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mobile-search-input pl-14 pr-4 py-4 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all bg-white text-base font-medium h-14"
                    style={{
                      fontSize: "16px",
                      lineHeight: "1.4",
                      paddingLeft: "56px"
                    }}
                  />
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                </div>

                {/* Fila con botones de vista y filtros */}
                <div className="flex items-center justify-between">
                  {/* Grupo de Botones de Vista */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewType('card')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                        viewType === 'card'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Squares2X2Icon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewType('table')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                        viewType === 'table'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <TableCellsIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Botón para mostrar/ocultar filtros */}
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
                  >
                    <AdjustmentsHorizontalIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Filtros</span>
                    {showMobileFilters ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Panel de filtros colapsable móvil */}
              {showMobileFilters && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  {/* Selector de estado móvil */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value)}
                      className="mobile-filter-select w-full px-3 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white text-gray-900 transition-all text-base font-medium h-14 appearance-none overflow-hidden"
                      style={{ 
                        backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")", 
                        backgroundPosition: "right 12px center", 
                        backgroundRepeat: "no-repeat", 
                        backgroundSize: "20px 20px", 
                        paddingRight: "40px",
                        lineHeight: "1.4",
                        fontSize: "16px",
                        WebkitAppearance: "none",
                        MozAppearance: "none"
                      }}
                    >
                      <option value="todos">Todos los estados</option>
                      <option value="aprobados">Aprobados</option>
                      <option value="pendientes_revision">Pendientes</option>
                      <option value="borrador">Borrador</option>
                      <option value="rechazados">Rechazados</option>
                    </select>
                  </div>

                  {/* Selector de tipo de parte móvil */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Parte</label>
                    <select
                      value={tipoParteFilter}
                      onChange={(e) => setTipoParteFilter(e.target.value)}
                      className="mobile-filter-select w-full px-3 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white text-gray-900 transition-all text-base font-medium h-14 appearance-none overflow-hidden"
                      style={{ 
                        backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")", 
                        backgroundPosition: "right 12px center", 
                        backgroundRepeat: "no-repeat", 
                        backgroundSize: "20px 20px", 
                        paddingRight: "40px",
                        lineHeight: "1.4",
                        fontSize: "16px",
                        WebkitAppearance: "none",
                        MozAppearance: "none"
                      }}
                    >
                      <option value="todos">Todos los tipos</option>
                      <option value="empleado">Empleados</option>
                      <option value="proveedor">Proveedores</option>
                    </select>
                  </div>

                  {/* Filtros de fecha móvil */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
                      <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white text-gray-900 transition-all text-base font-medium min-h-[48px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                      <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white text-gray-900 transition-all text-base font-medium min-h-[48px]"
                      />
                    </div>
                  </div>

                  {/* Filtros específicos móvil con mejor separación de iconos */}
                  <div className="space-y-3">
                    {/* Filtro por obra móvil */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                        Obra
                      </label>
                      <select
                        value={obraFilter}
                        onChange={(e) => setObraFilter(e.target.value)}
                        className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all bg-white text-base font-medium min-h-[48px] mobile-filter-select"
                      >
                        <option value="">Todas las obras</option>
                        {obras.map((obra) => (
                          <option key={obra.id} value={obra.id}>
                            {obra.nombre_obra} {obra.numero_obra ? `(${obra.numero_obra})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro por empleado móvil */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        Empleado
                      </label>
                      <select
                        value={empleadoFilter}
                        onChange={(e) => setEmpleadoFilter(e.target.value)}
                        className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all bg-white text-base font-medium min-h-[48px] mobile-filter-select"
                      >
                        <option value="">Todos los empleados</option>
                        {empleados.map((empleado) => (
                          <option key={empleado.id} value={empleado.id}>
                            {empleado.nombre} {empleado.codigo ? `(${empleado.codigo})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro por proveedor móvil */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <BriefcaseIcon className="w-4 h-4 text-gray-500" />
                        Proveedor
                      </label>
                      <select
                        value={proveedorFilter}
                        onChange={(e) => setProveedorFilter(e.target.value)}
                        className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all bg-white text-base font-medium min-h-[48px] mobile-filter-select"
                      >
                        <option value="">Todos los proveedores</option>
                        {proveedores.map((proveedor) => (
                          <option key={proveedor.id} value={proveedor.id}>
                            {proveedor.razon_social} {proveedor.codigo ? `(${proveedor.codigo})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Botón para limpiar filtros móvil */}
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterBy('todos');
                      setTipoParteFilter('todos');
                      setFechaDesde('');
                      setFechaHasta('');
                      setObraFilter('');
                      setEmpleadoFilter('');
                      setProveedorFilter('');
                      setCurrentPage(1);
                      sessionStorage.removeItem(FILTERS_STORAGE_KEY);
                    }}
                    className="w-full px-4 py-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all text-base font-medium min-h-[48px]"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>

            {/* Fila 2: Botones de Exportación */}
            {(isSuperAdmin || isAdmin) && (
              <div className="flex flex-row items-center space-x-2">
                <button
                  id="boton-exportar-empleados"
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-white text-blue-600 border border-blue-200 hover:text-blue-800 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportEmpleados();
                  }}
                  aria-label="Exportar empleados a Excel"
                  tabIndex={0}
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Empleados</span>
                </button>
                <button
                  id="boton-exportar-proveedores"
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-white text-green-600 border border-green-200 hover:text-green-800 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-100 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportProveedores();
                  }}
                  aria-label="Exportar proveedores a Excel"
                  tabIndex={0}
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Proveedores</span>
                </button>
                {isSuperAdmin && (
                  <button
                    id="boton-log-exportacion"
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-white text-orange-600 border border-orange-200 hover:text-orange-800 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-100 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    showExportLog();
                  }}
                  aria-label="Ver log de exportación"
                  tabIndex={0}
                >
                  <ClipboardDocumentIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Log</span>
                  </button>
                )}
              </div>
            )}

          </div> {/* Fin del contenedor blanco */}

          {/* Conditional Rendering: Error / Loading / Content */}
          {error ? (
            <div className="text-center py-10 bg-white rounded-xl shadow-sm">
              <p className="text-red-600 text-lg mb-4">Error al cargar los datos.</p>
              <p className="text-gray-500 mb-6">{typeof error === 'string' ? error : 'Error desconocido'}</p>
              <button
                onClick={() => Promise.all([fetchPartesEmpleados(), fetchPartesProveedores()])}
                className="px-6 py-2 bg-white border border-gray-300 text-blue-600 rounded-lg hover:bg-gray-50 transition-all"
              >
                Reintentar
              </button>
            </div>
          ) : ( // No error
            <> {/* Fragment for loading/content */}
              {loading ? (
                <SkeletonLoader />
              ) : filteredPartes.length > 0 ? (
                <>
                  {/* Render Cards or Table based on viewType */}
                  {viewType === 'card' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 xl:gap-5">
                      {currentItems.map(parte => renderParteCard(parte))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                              Número
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[22%]">
                              Obra/Empresa
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                              Trabajador/Proveedor
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[18%]">
                              Fecha
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
                              Estado
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentItems.map(parte => renderParteTable(parte))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {/* Controles de paginación */}
                  {totalPages > 1 && (
                    <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Información de resultados */}
                        <div className="text-sm text-gray-700">
                          Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                          <span className="font-medium">{Math.min(indexOfLastItem, filteredPartes.length)}</span> de{' '}
                          <span className="font-medium">{filteredPartes.length}</span> resultados
                        </div>

                        {/* Botones de paginación */}
                        <div className="flex items-center gap-2">
                          {/* Botón Primera Página */}
                          <button
                            onClick={() => paginate(1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                            title="Primera página"
                          >
                            ««
                          </button>

                          {/* Botón Página Anterior */}
                          <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                            title="Página anterior"
                          >
                            «
                          </button>

                          {/* Números de página (mostrar máximo 5 páginas) */}
                          {(() => {
                            const pageNumbers = [];
                            const maxVisiblePages = 5;
                            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                            // Ajustar startPage si estamos cerca del final
                            if (endPage - startPage + 1 < maxVisiblePages) {
                              startPage = Math.max(1, endPage - maxVisiblePages + 1);
                            }

                            for (let i = startPage; i <= endPage; i++) {
                              pageNumbers.push(
                                <button
                                  key={i}
                                  onClick={() => paginate(i)}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    currentPage === i
                                      ? 'bg-blue-600 text-white shadow-sm'
                                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {i}
                                </button>
                              );
                            }

                            return pageNumbers;
                          })()}

                          {/* Botón Página Siguiente */}
                          <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                            title="Página siguiente"
                          >
                            »
                          </button>

                          {/* Botón Última Página */}
                          <button
                            onClick={() => paginate(totalPages)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                            title="Última página"
                          >
                            »»
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // No parts found message
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                  <p className="text-gray-500 text-lg mb-4">No se encontraron partes de trabajo con los filtros actuales.</p>
                </div>
              )}
            </> // End fragment for loading/content
          )} {/* End conditional rendering error/content */}
        </> // End fragment for Admin/Supervisor branch
      )} {/* End outer ternary else branch */}
      {showConfirmModal && (
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmDelete}
          message={`¿Estás seguro de eliminar el parte ${parteToDelete.numero_parte}?`}
        />
      )}
    </div> // End main container div
  ); // End of return statement
}
export default Dashboard;
