import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import * as parteProveedorService from '../../services/parteProveedorService';
import * as exportService from '../../services/exportService';
import { verificarYCorregirPermisosProveedor } from '../../utils/permisosProveedor';
import {
  CalendarIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  BriefcaseIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateUtils';

export default function DashboardProveedor() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [proveedor, setProveedor] = useState(null);
  const [obrasAsignadas, setObrasAsignadas] = useState([]);
  const [partes, setPartes] = useState([]);
  const [filteredPartes, setFilteredPartes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      cargarDatosProveedor(user.id);
      // Verificar y corregir permisos del proveedor
      verificarYAsignarPermisos(user.id);
    }
  }, [user]);

  // Función para verificar y asignar permisos al proveedor
  const verificarYAsignarPermisos = async (userId) => {
    try {
      const resultado = await verificarYCorregirPermisosProveedor(userId);
      if (resultado.success) {
        console.log('Permisos de proveedor verificados y corregidos:', resultado.message);
      } else {
        console.warn('No se pudieron verificar/corregir permisos:', resultado.message);
      }
    } catch (error) {
      console.error('Error al verificar permisos de proveedor:', error);
    }
  };

  // Efecto para filtrar partes cuando cambian los filtros
  useEffect(() => {
    if (!partes.length) return;

    const filtered = partes.filter(parte => {
      // Filtro por búsqueda
      const matchesSearch = searchTerm === '' ||
        parte.numero_parte?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        parte.obra?.nombre_obra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parte.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parte.razon_social?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por estado
      const matchesEstado = estadoFilter === 'todos' ||
        (estadoFilter === 'Aprobado' && parte.estado === 'Aprobado') ||
        (estadoFilter === 'Pendiente de Revisión' && parte.estado === 'Pendiente de Revisión') ||
        (estadoFilter === 'Borrador' && parte.estado === 'Borrador') ||
        (estadoFilter === 'Rechazado' && parte.estado === 'Rechazado');

      // Filtro por fecha
      let matchesDate = true;
      if (dateRange.startDate && dateRange.endDate) {
        const parteDate = new Date(parte.fecha);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // Ajustar al final del día
        matchesDate = parteDate >= startDate && parteDate <= endDate;
      }

      return matchesSearch && matchesEstado && matchesDate;
    });

    setFilteredPartes(filtered);
  }, [searchTerm, estadoFilter, dateRange, partes]);

  const cargarDatosProveedor = async (userId) => {
    try {
      setLoading(true);
      console.log('Iniciando carga de datos para el usuario:', userId);
      
      // 1. Buscar el proveedor por el user_id
      let { data: proveedor, error: errorProveedor } = await supabase
        .from('proveedores')
        .select('*')
        .eq('user_id', userId)
        .single();
      console.log('Resultado de búsqueda de proveedor por user_id:', proveedor, 'Error:', errorProveedor);  
      
      // Si no se encuentra por user_id, buscar por email
      if (!proveedor && user?.email) {
        console.log('Proveedor no encontrado por user_id, buscando por email:', user.email);
        
        const { data: proveedorPorEmail, error: errorEmail } = await supabase
          .from('proveedores')
          .select('*')
          .ilike('email', user.email)
          .single();
          
        if (proveedorPorEmail && !errorEmail) {
          proveedor = proveedorPorEmail;
          
          // Actualizar el user_id en el proveedor si no está establecido
          if (!proveedor.user_id) {
            await supabase
              .from('proveedores')
              .update({ user_id: userId })
              .eq('id', proveedor.id);
          }
        }
      }
      
      if (!proveedor) {
        setError('No se encontró el proveedor asociado a tu cuenta. Por favor, contacta con el administrador.');
        setLoading(false);
        return;
      }
      
      setProveedor(proveedor);
      
      // 2. Cargar obras asignadas al proveedor
      const { data: obrasData, error: errorObras } = await supabase
        .from('proveedores_obras')
        .select(`
          id,
          proveedor_id,
          obra_id,
          obras (
            id,
            nombre_obra,
            numero_obra,
            cliente,
            estado,
            direccion
          )
        `)
        .eq('proveedor_id', proveedor.id);
      console.log('Resultado de carga de obras asignadas:', obrasData, 'Error:', errorObras);  
      if (errorObras) {
        console.error('Error al cargar obras asignadas:', errorObras);
      } else if (obrasData) {
        const obras = obrasData.map(item => item.obras).filter(Boolean);
        console.log('Obras asignadas:', obras);
        setObrasAsignadas(obras);

        // Prueba para verificar RLS o relación en la tabla 'obras'
        if (obrasData && obrasData.length > 0) {
          const firstObraId = obrasData[0].obra_id;
          const { data: testObra, error: testError } = await supabase
            .from('obras')
            .select('*')
            .eq('id', firstObraId)
            .single();
          console.log('Resultado de consulta directa a tabla obras (ID:', firstObraId, '):', testObra, 'Error:', testError);
        }
      }
      
      // 3. Cargar partes de trabajo del proveedor
      await cargarPartesProveedor(proveedor.id, userId);
      
    } catch (error) {
      console.error('Error general al cargar datos:', error);
      setError('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarPartesProveedor = async (proveedorId, userId) => {
    try {
      console.log('Cargando partes para proveedor ID:', proveedorId, 'User ID:', userId);
      
      // Preparamos la consulta base para obtener los partes
      const queryBase = `
        id, 
        numero_parte,
        fecha, 
        estado, 
        obra_id,
        empresa,
        razon_social,
        trabajos,
        obra:obra_id (
          id,
          nombre_obra,
          numero_obra,
          cliente
        )
      `;
      
      // Estrategia 1: Intentar filtrar por proveedor_id
      if (proveedorId) {
        console.log('Intentando filtrar por proveedor_id:', proveedorId);
        const { data: partesPorProveedorId, error: errorProveedorId } = await supabase
          .from('partes_proveedores')
          .select(queryBase)
          .eq('proveedor_id', proveedorId)
          .order('fecha', { ascending: false });
        
        if (!errorProveedorId && partesPorProveedorId && partesPorProveedorId.length > 0) {
          console.log(`Éxito! Se encontraron ${partesPorProveedorId.length} partes por proveedor_id`);
          setPartes(partesPorProveedorId);
          setFilteredPartes(partesPorProveedorId);
          return;
        } else if (errorProveedorId && errorProveedorId.code !== '42703') { // Si el error no es por columna inexistente
          console.error('Error al filtrar por proveedor_id:', errorProveedorId);
        } else {
          console.log('No se encontraron partes por proveedor_id o la columna no existe');
        }
      }
      
      // Estrategia 2: Intentar filtrar por creado_por (user_id)
      if (userId) {
        console.log('Intentando filtrar por creado_por (user_id):', userId);
        const { data: partesPorCreador, error: errorCreador } = await supabase
          .from('partes_proveedores')
          .select(queryBase)
          .eq('creado_por', userId)
          .order('fecha', { ascending: false });
        
        if (!errorCreador && partesPorCreador && partesPorCreador.length > 0) {
          console.log(`Éxito! Se encontraron ${partesPorCreador.length} partes por creado_por`);
          setPartes(partesPorCreador);
          setFilteredPartes(partesPorCreador);
          return;
        } else if (errorCreador && errorCreador.code !== '42703') { // Si el error no es por columna inexistente
          console.error('Error al filtrar por creado_por:', errorCreador);
        } else {
          console.log('No se encontraron partes por creado_por o la columna no existe');
        }
      }
      
      // Estrategia 3: Intentar filtrar por email
      if (user?.email) {
        console.log('Intentando filtrar por email:', user.email);
        const { data: partesPorEmail, error: errorEmail } = await supabase
          .from('partes_proveedores')
          .select(queryBase)
          .eq('email', user.email)
          .order('fecha', { ascending: false });
        
        if (!errorEmail && partesPorEmail && partesPorEmail.length > 0) {
          console.log(`Éxito! Se encontraron ${partesPorEmail.length} partes por email`);
          setPartes(partesPorEmail);
          setFilteredPartes(partesPorEmail);
          return;
        } else if (errorEmail && errorEmail.code !== '42703') { // Si el error no es por columna inexistente
          console.error('Error al filtrar por email:', errorEmail);
        } else {
          console.log('No se encontraron partes por email o la columna no existe');
        }
      }
      
      // Estrategia 4: Intentar filtrar por CIF
      if (proveedor?.cif) {
        console.log('Intentando filtrar por CIF:', proveedor.cif);
        const { data: partesPorCif, error: errorCif } = await supabase
          .from('partes_proveedores')
          .select(queryBase)
          .eq('cif', proveedor.cif)
          .order('fecha', { ascending: false });
        
        if (!errorCif && partesPorCif && partesPorCif.length > 0) {
          console.log(`Éxito! Se encontraron ${partesPorCif.length} partes por CIF`);
          setPartes(partesPorCif);
          setFilteredPartes(partesPorCif);
          return;
        } else if (errorCif && errorCif.code !== '42703') { // Si el error no es por columna inexistente
          console.error('Error al filtrar por CIF:', errorCif);
        } else {
          console.log('No se encontraron partes por CIF o la columna no existe');
        }
      }
      
      // Estrategia 5: Intentar filtrar por código de proveedor
      if (proveedor?.codigo) {
        console.log('Intentando filtrar por código de proveedor:', proveedor.codigo);
        const { data: partesPorCodigo, error: errorCodigo } = await supabase
          .from('partes_proveedores')
          .select(queryBase)
          .eq('codigo_proveedor', proveedor.codigo)
          .order('fecha', { ascending: false });
        
        if (!errorCodigo && partesPorCodigo && partesPorCodigo.length > 0) {
          console.log(`Éxito! Se encontraron ${partesPorCodigo.length} partes por código de proveedor`);
          setPartes(partesPorCodigo);
          setFilteredPartes(partesPorCodigo);
          return;
        } else if (errorCodigo && errorCodigo.code !== '42703') { // Si el error no es por columna inexistente
          console.error('Error al filtrar por código de proveedor:', errorCodigo);
        } else {
          console.log('No se encontraron partes por código de proveedor o la columna no existe');
        }
      }
      
      // Estrategia 6: Intentar filtrar por razón social (búsqueda parcial)
      if (proveedor?.razon_social) {
        console.log('Intentando filtrar por razón social:', proveedor.razon_social);
        const { data: partesPorRazonSocial, error: errorRazonSocial } = await supabase
          .from('partes_proveedores')
          .select(queryBase)
          .ilike('razon_social', `%${proveedor.razon_social}%`)
          .order('fecha', { ascending: false });
        
        if (!errorRazonSocial && partesPorRazonSocial && partesPorRazonSocial.length > 0) {
          console.log(`Éxito! Se encontraron ${partesPorRazonSocial.length} partes por razón social`);
          setPartes(partesPorRazonSocial);
          setFilteredPartes(partesPorRazonSocial);
          return;
        } else if (errorRazonSocial && errorRazonSocial.code !== '42703') { // Si el error no es por columna inexistente
          console.error('Error al filtrar por razón social:', errorRazonSocial);
        } else {
          console.log('No se encontraron partes por razón social o la columna no existe');
        }
      }
      
      // Si llegamos aquí, no se encontraron partes con ninguna estrategia
      console.log('No se encontraron partes para este proveedor con ninguna estrategia de filtrado');
      setPartes([]);
      setFilteredPartes([]);
      
    } catch (error) {
      console.error('Error general al cargar partes del proveedor:', error);
      setPartes([]);
      setFilteredPartes([]);
    }
  };

  const handleDescargarPDF = async (parte) => {
    try {
      // Obtener el parte completo con todos los detalles
      const parteCompleto = await parteProveedorService.getParteProveedorById(parte.id);

      if (!parteCompleto) {
        throw new Error('No se pudo obtener la información completa del parte');
      }

      // Usar la plantilla específica para partes de proveedores
      const doc = await exportService.generateProveedorPDF(parteCompleto);

      // Generar el nombre del archivo
      const fileName = `parte_${parte.numero_parte || 'sin_numero'}_${new Date().toISOString().split('T')[0]}.pdf`;

      // Descargar el PDF
      doc.save(fileName);
      toast.success('PDF descargado correctamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  const handleVerParte = (parte) => {
    navigate(`/parte-proveedor/ver/${parte.id}`);
  };

  const handleNuevoParte = () => {
    try {
      navigate('/parte-proveedor/nuevo');
    } catch (error) {
      console.error('Error al navegar a nuevo parte:', error);
      
      // Si hay un error de permisos, mostrar un mensaje amigable
      if (error.message && error.message.includes('permission')) {
        toast.error('No tienes permisos para crear nuevos partes. Contacta al administrador.');
      } else {
        toast.error('Ocurrió un error al intentar crear un nuevo parte.');
      }
    }
  };

  // Navegar a la página de obras asignadas
  const handleVerObrasAsignadas = async () => {
    try {
      // Verificar si el usuario tiene el rol de proveedor
      if (hasRole && !hasRole('proveedor')) {
        toast.error('No tienes permisos para ver obras asignadas');
        return;
      }
      
      // Navegar a la página de obras asignadas
      navigate('/obras-asignadas');
    } catch (error) {
      console.error('Error al navegar a obras asignadas:', error);
      toast.error('Ocurrió un error al intentar acceder a obras asignadas');
    }
  };

  const handleDeleteParte = async (e, parte) => {
    e.stopPropagation();

    // Solo permitir eliminar partes en estado Borrador
    if (parte.estado !== 'Borrador') {
      toast.error('Solo se pueden eliminar partes en estado Borrador');
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar este parte? Esta acción no se puede deshacer.')) {
      try {
        setLoading(true);
        await parteProveedorService.deleteParteProveedor(parte.id);
        
        // Recargar partes
        if (proveedor) {
          await cargarPartesProveedor(proveedor.id, user.id);
        }
        
        toast.success('Parte eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar el parte:', error);
        toast.error('Error al eliminar el parte');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!proveedor) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p className="text-gray-500">No se encontraron datos de proveedor asociados a tu cuenta.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera con información del proveedor */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Bienvenido, {proveedor.razon_social}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600"><span className="font-medium">CIF:</span> {proveedor.cif || '-'}</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Contacto:</span> {proveedor.persona_contacto || '-'}</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Email:</span> {proveedor.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600"><span className="font-medium">Teléfono:</span> {proveedor.telefono || '-'}</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Dirección:</span> {proveedor.direccion || '-'}</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Código:</span> {proveedor.codigo || '-'}</p>
          </div>
        </div>
      </div>

      {/* Bloque de acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta de Nuevo Parte */}
        <div 
          onClick={handleNuevoParte}
          className="bg-white shadow-md rounded-lg p-6 flex items-center cursor-pointer hover:shadow-lg transition-all duration-200"
        >
          <div className="bg-blue-100 rounded-full p-4 mr-4">
            <PlusIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Nuevo Parte</h3>
            <p className="text-sm text-gray-500">Crear un nuevo parte de trabajo</p>
          </div>
        </div>

        {/* Tarjeta de Obras Asignadas */}
        <div 
          onClick={handleVerObrasAsignadas}
          className="bg-white shadow-md rounded-lg p-6 flex items-center cursor-pointer hover:shadow-lg transition-all duration-200"
        >
          <div className="bg-green-100 rounded-full p-4 mr-4">
            <BuildingOfficeIcon className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Obras Asignadas</h3>
            <p className="text-sm text-gray-500">Ver listado de obras asignadas ({obrasAsignadas.length})</p>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Buscador */}
          <div className="relative">
            <input
              type="search"
              placeholder="Buscar partes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>

          {/* Filtro por fecha */}
          <div className="flex space-x-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-full"
              placeholder="Fecha inicio"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-full"
              placeholder="Fecha fin"
            />
          </div>

          {/* Selector de estado */}
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-full"
          >
            <option value="todos">Todos los estados</option>
            <option value="Borrador">Borrador</option>
            <option value="Pendiente de Revisión">Pendiente de Revisión</option>
            <option value="Aprobado">Aprobado</option>
            <option value="Rechazado">Rechazado</option>
          </select>
        </div>
      </div>

      {/* Listado de partes */}
      <h2 id="partes-trabajo-section" className="text-xl font-bold text-gray-900 mb-4">Mis Partes de Trabajo</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredPartes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPartes.map(parte => (
            <div
              key={parte.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex flex-col"
            >
              <div className="p-4 flex flex-col h-full">
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
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    parte.estado === 'Aprobado'
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : parte.estado === 'Pendiente de Revisión'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : parte.estado === 'Rechazado'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : parte.estado === 'Borrador'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-800 border border-gray-300'
                  }`}>
                    {parte.estado || 'Borrador'}
                  </span>
                </div>

                <div className="space-y-2">
                  {parte.obra?.nombre_obra && (
                    <div className="flex items-center text-gray-700">
                      <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-500" />
                      <h4 className="text-md font-medium text-gray-900">{parte.obra.nombre_obra}</h4>
                    </div>
                  )}
                  
                  {parte.trabajos && parte.trabajos.length > 0 && (
                    <div className="mt-2">
                      <h5 className="text-sm font-medium text-gray-800 mb-1">Trabajos Añadidos:</h5>
                      <div className="pl-2 border-l-2 border-gray-200">
                        {parte.trabajos.map((trabajo, index) => (
                          <div key={index} className="mb-2">
                            <p className="text-sm">{trabajo.obra_nombre || trabajo.obra}</p>
                            {trabajo.descripcion && (
                              <p className="text-xs text-gray-500 mt-1">{trabajo.descripcion}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-700">
                    <BriefcaseIcon className="w-4 h-4 mr-2 text-gray-500" />
                    <p className="text-sm truncate">{parte.razon_social || parte.empresa || 'Sin asignar'}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  {/* Botones con espaciado uniforme */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDescargarPDF(parte);
                      }}
                      className="inline-flex items-center justify-center px-2 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all"
                    >
                      <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                      PDF
                    </button>
                    <button
                      onClick={(e) => handleDeleteParte(e, parte)}
                      className={`inline-flex items-center justify-center px-2 py-1.5 text-xs border rounded-lg transition-all ${
                        parte.estado === 'Borrador' 
                          ? 'border-red-300 text-red-600 bg-white hover:bg-red-50' 
                          : 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                      }`}
                      disabled={parte.estado !== 'Borrador'}
                    >
                      <TrashIcon className="w-3 h-3 mr-1" />
                      Eliminar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerParte(parte);
                      }}
                      className="inline-flex items-center justify-center px-2 py-1.5 text-xs border border-indigo-300 rounded-lg text-indigo-600 bg-white hover:bg-indigo-50 transition-all"
                    >
                      Ver Parte
                      <ChevronRightIcon className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-500">No se encontraron partes de trabajo</p>
        </div>
      )}
    </div>
  );
}
