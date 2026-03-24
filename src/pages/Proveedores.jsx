import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { exportarProveedores, importarProveedores } from '../services/importExportService';
import { generarPlantillaProveedores } from '../templates/plantilla_proveedores';
import { TrashIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import TablaPreciosProveedor from '../components/TablaPreciosProveedor';
import { useAuth } from '../contexts/AuthContext';

export default function Proveedores() {
  const { hasRole } = useAuth();
  const [proveedores, setProveedores] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProveedor, setCurrentProveedor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProveedores, setFilteredProveedores] = useState([]);
  const [activeTab, setActiveTab] = useState('info'); // 'info' o 'precios'
  const [formData, setFormData] = useState({
    codigo: '',
    razon_social: '',
    cif: '',
    persona_contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    notas: '',
    obras_asignadas: [],
    password: '',
    crearUsuario: false
  });
  const [obrasModalOpen, setObrasModalOpen] = useState(false);
  const [obrasSearchTerm, setObrasSearchTerm] = useState('');

  useEffect(() => {
    cargarProveedores();
    cargarObras();
  }, []);

  useEffect(() => {
    filtrarProveedores();
  }, [searchTerm, proveedores]);

  const filtrarProveedores = () => {
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = proveedores.filter(proveedor => {
      const codigo = String(proveedor.codigo || '').toLowerCase();
      const razonSocial = String(proveedor.razon_social || '').toLowerCase();
      const cif = String(proveedor.cif || '').toLowerCase();
      const personaContacto = String(proveedor.persona_contacto || '').toLowerCase();

      return codigo.includes(searchTermLower) ||
             razonSocial.includes(searchTermLower) ||
             cif.includes(searchTermLower) ||
             personaContacto.includes(searchTermLower);
    });
    setFilteredProveedores(filtered);
  };

  const cargarProveedores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .order('razon_social', { ascending: true });

      if (error) throw error;
      setProveedores(data || []);
      setFilteredProveedores(data || []);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      toast.error('Error al cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  const cargarObras = async () => {
    try {
      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .order('nombre_obra');

      if (error) throw error;
      setObras(data || []);
    } catch (error) {
      console.error('Error al cargar obras:', error);
      toast.error('Error al cargar las obras');
    }
  };

  const cargarObrasAsignadas = async (proveedorId) => {
    try {
      const { data, error } = await supabase
        .from('proveedores_obras')
        .select('obra_id')
        .eq('proveedor_id', proveedorId);

      if (error) throw error;
      
      // Obtener los IDs de las obras asignadas
      const obrasIds = data.map(item => item.obra_id);
      
      return obrasIds;
    } catch (error) {
      console.error('Error al cargar obras asignadas:', error);
      return [];
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleObrasChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      obras_asignadas: selectedOptions
    }));
  };

  const handleObraToggle = (obraId) => {
    setFormData(prev => {
      const obraIdStr = obraId.toString();
      const isSelected = prev.obras_asignadas.includes(obraIdStr);
      
      if (isSelected) {
        return {
          ...prev,
          obras_asignadas: prev.obras_asignadas.filter(id => id !== obraIdStr)
        };
      } else {
        return {
          ...prev,
          obras_asignadas: [...prev.obras_asignadas, obraIdStr]
        };
      }
    });
  };

  const filteredObras = obras.filter(obra => 
    obra.nombre_obra.toLowerCase().includes(obrasSearchTerm.toLowerCase()) ||
    (obra.numero_obra && obra.numero_obra.toString().includes(obrasSearchTerm)) ||
    (obra.cliente && obra.cliente.toLowerCase().includes(obrasSearchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setFormData({
      codigo: '',
      razon_social: '',
      cif: '',
      persona_contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      notas: '',
      obras_asignadas: [],
      password: '',
      crearUsuario: false
    });
    setCurrentProveedor(null);
    setActiveTab('info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!formData.codigo || !formData.razon_social) {
        toast.error('El código y la razón social son obligatorios');
        return;
      }

      const proveedorData = {
        codigo: formData.codigo,
        razon_social: formData.razon_social,
        cif: formData.cif || null,
        persona_contacto: formData.persona_contacto || null,
        telefono: formData.telefono || null,
        email: formData.email || null,
        direccion: formData.direccion || null,
        notas: formData.notas || null
      };

      let proveedorId;

      if (currentProveedor) {
        const { error } = await supabase
          .from('proveedores')
          .update(proveedorData)
          .eq('id', currentProveedor.id);

        if (error) throw error;
        proveedorId = currentProveedor.id;
        toast.success('Proveedor actualizado correctamente');
      } else {
        const { data: existingProveedor } = await supabase
          .from('proveedores')
          .select('id')
          .or(`codigo.eq.${formData.codigo},cif.eq.${formData.cif}`)
          .maybeSingle();

        if (existingProveedor) {
          toast.error('Ya existe un proveedor con ese código o CIF');
          return;
        }

        const { data, error } = await supabase
          .from('proveedores')
          .insert([proveedorData])
          .select();

        if (error) throw error;
        proveedorId = data[0].id;
        toast.success('Proveedor creado correctamente');
      }
      
      // Actualizar las obras asignadas
      if (proveedorId) {
        // Primero eliminamos todas las asignaciones existentes
        await supabase
          .from('proveedores_obras')
          .delete()
          .eq('proveedor_id', proveedorId);
        
        // Luego insertamos las nuevas asignaciones
        if (formData.obras_asignadas.length > 0) {
          const asignaciones = formData.obras_asignadas.map(obraId => ({
            proveedor_id: proveedorId,
            obra_id: parseInt(obraId)
          }));
          
          const { error } = await supabase
            .from('proveedores_obras')
            .insert(asignaciones);
          
          if (error) throw error;
        }
      }
      
      // Crear usuario con rol de proveedor si es necesario
      if (formData.crearUsuario && formData.email && formData.password) {
        try {
          // Verificar si ya existe un usuario pendiente con ese email
          const { data: existingUsers, error: checkError } = await supabase
            .from('usuarios_pendientes')
            .select('*')
            .eq('email', formData.email)
            .eq('procesado', false);
          
          if (checkError) {
            console.error('Error al verificar usuario existente:', checkError);
            toast.error('Error al verificar si ya existe un usuario con ese email');
            return;
          }
          
          if (existingUsers && existingUsers.length > 0) {
            toast.error('Ya existe un usuario pendiente con ese email');
          } else {
            // Registrar el usuario pendiente de creación
            const { error: insertError } = await supabase
              .from('usuarios_pendientes')
              .insert([{
                email: formData.email,
                nombre: formData.razon_social,
                rol_asignar: 'proveedor',
                entidad_tipo: 'proveedores',
                entidad_id: proveedorId,
                password_temporal: formData.password,
                fecha_creacion: new Date().toISOString(),
                procesado: false
              }]);
            
            if (insertError) {
              console.error('Error al registrar usuario pendiente:', insertError);
              toast.error('Error al registrar el usuario');
            } else {
              toast.success('Usuario registrado para aprobación. Aparecerá en la página de Usuarios Pendientes.');
            }
          }
        } catch (error) {
          console.error('Error general al crear usuario:', error);
          toast.error('Error al crear el usuario');
        }
      }
      
      cargarProveedores();
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      toast.error('Error al guardar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proveedor?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Proveedor eliminado correctamente');
      cargarProveedores();
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      toast.error('Error al eliminar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (proveedor) => {
    try {
      // Cargar las obras asignadas al proveedor
      const obrasIds = await cargarObrasAsignadas(proveedor.id);
      
      setCurrentProveedor(proveedor);
      setFormData({
        codigo: proveedor.codigo || '',
        razon_social: proveedor.razon_social || '',
        cif: proveedor.cif || '',
        persona_contacto: proveedor.persona_contacto || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        direccion: proveedor.direccion || '',
        notas: proveedor.notas || '',
        obras_asignadas: obrasIds,
        password: '',
        crearUsuario: false
      });
      setModalOpen(true);
    } catch (error) {
      console.error('Error al cargar datos para edición:', error);
      toast.error('Error al cargar los datos del proveedor');
    }
  };

  const handleExport = () => {
    try {
      exportarProveedores(proveedores);
      toast.success('Proveedores exportados correctamente');
    } catch (error) {
      console.error('Error al exportar proveedores:', error);
      toast.error('Error al exportar los proveedores');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImportLoading(true);
      const resultado = await importarProveedores(file);
      
      if (resultado.success) {
        toast.success(resultado.message);
        cargarProveedores(); // Recargar la lista de proveedores
      } else {
        toast.error(resultado.message);
        if (resultado.errores && resultado.errores.length > 0) {
          console.error('Errores de importación:', resultado.errores);
        }
      }
    } catch (error) {
      console.error('Error al importar proveedores:', error);
      toast.error('Error al importar los proveedores');
    } finally {
      setImportLoading(false);
      // Limpiar el input de archivo
      e.target.value = null;
    }
  };

  const handleDescargarPlantilla = () => {
    try {
      generarPlantillaProveedores();
      toast.success('Plantilla descargada correctamente');
    } catch (error) {
      console.error('Error al descargar la plantilla:', error);
      toast.error('Error al descargar la plantilla');
    }
  };

  // Función para obtener los detalles completos de las obras asignadas
  const obtenerDetallesObrasAsignadas = () => {
    return formData.obras_asignadas.map(obraId => {
      const obra = obras.find(o => o.id === parseInt(obraId));
      return obra || null;
    }).filter(obra => obra !== null);
  };

  return (
    // Se eliminó container mx-auto px-4 py-8 para que Layout.jsx controle el contenedor
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
          Gestión de Proveedores
        </h1>
        
        {/* Barra de búsqueda */}
        <div className="relative w-full md:w-64 mb-4 md:mb-0 mx-4">
          <input
            type="text"
            placeholder="Buscar proveedores..."
            className="mobile-search-proveedores w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm md:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nuevo Proveedor</span>
            <span className="sm:hidden">Nuevo</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm md:text-base"
            disabled={loading || importLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="hidden sm:inline">Exportar Excel</span>
            <span className="sm:hidden">Exportar</span>
          </button>

          <button
            onClick={handleDescargarPlantilla}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm md:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="hidden sm:inline">Descargar Plantilla</span>
            <span className="sm:hidden">Plantilla</span>
          </button>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
            id="importFile"
            disabled={loading || importLoading}
          />
          <label
            htmlFor="importFile"
            className={`flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg cursor-pointer transition-colors text-sm md:text-base ${
              (loading || importLoading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {importLoading ? 'Importando...' : (
              <>
                <span className="hidden sm:inline">Importar Excel</span>
                <span className="sm:hidden">Importar</span>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Vista de tabla para desktop */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[20%]" />
            <col className="w-[10%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón Social</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CIF</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProveedores.map((proveedor) => (
              <tr key={proveedor.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{proveedor.codigo}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{proveedor.razon_social}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{proveedor.cif}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{proveedor.persona_contacto}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{proveedor.telefono}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{proveedor.email}</td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(proveedor)}
                      className="inline-flex items-center px-2 py-1 bg-white text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-300 rounded-md transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span className="ml-1">Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(proveedor.id)}
                      className="inline-flex items-center px-2 py-1 bg-white text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-md transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span className="ml-1">Eliminar</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

            {/* Vista de tarjetas para móvil */}
      <div className="md:hidden">
        {/* Indicador de resultados para móvil */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {filteredProveedores.length} {filteredProveedores.length === 1 ? 'proveedor' : 'proveedores'} encontrado{filteredProveedores.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="space-y-4">
          {filteredProveedores.map((proveedor) => (
            <div key={proveedor.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              {/* Header con nombre y código */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 break-words leading-tight">
                  {proveedor.razon_social}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Código: {proveedor.codigo}</p>
              </div>
              
              {/* Información del proveedor */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">CIF:</span>
                  <span className="font-medium text-sm">{proveedor.cif || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Contacto:</span>
                  <span className="font-medium text-sm">{proveedor.persona_contacto || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Teléfono:</span>
                  <span className="font-medium text-sm">{proveedor.telefono || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Email:</span>
                  <span className="font-medium text-sm break-all">{proveedor.email || '-'}</span>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="flex space-x-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(proveedor)}
                  className="flex-1 flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-md shadow-sm transition-colors text-sm"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(proveedor.id)}
                  className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md shadow-sm transition-colors text-sm"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para crear/editar proveedor */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-[60]">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-6xl mx-auto max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {currentProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h2>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Pestañas de navegación */}
              {currentProveedor && (
                <div className="border-b border-gray-200 mb-4">
                  <nav className="-mb-px flex" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('info')}
                      className={`py-2 px-4 text-sm font-medium border-b-2 ${
                        activeTab === 'info'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Información
                    </button>
                    <button
                      onClick={() => setActiveTab('precios')}
                      className={`py-2 px-4 text-sm font-medium border-b-2 ${
                        activeTab === 'precios'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Precios Personalizados
                    </button>
                  </nav>
                </div>
              )}

              {/* Contenido de las pestañas */}
              {activeTab === 'info' ? (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Columna 1 */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                        <input
                          type="text"
                          name="codigo"
                          value={formData.codigo}
                          onChange={handleChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
                        <input
                          type="text"
                          name="razon_social"
                          value={formData.razon_social}
                          onChange={handleChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CIF</label>
                        <input
                          type="text"
                          name="cif"
                          value={formData.cif}
                          onChange={handleChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Persona de Contacto</label>
                        <input
                          type="text"
                          name="persona_contacto"
                          value={formData.persona_contacto}
                          onChange={handleChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Columna 2 */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                          type="tel"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                        <textarea
                          name="direccion"
                          value={formData.direccion}
                          onChange={handleChange}
                          rows="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                        <textarea
                          name="notas"
                          value={formData.notas}
                          onChange={handleChange}
                          rows="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Columna 3 - Asignación de obras */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Asignar Obras
                        </label>
                        
                        {/* Selector para desktop */}
                        <div className="hidden md:block">
                          <select
                            name="obras_asignadas"
                            id="obras_asignadas"
                            multiple
                            value={formData.obras_asignadas}
                            onChange={handleObrasChange}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            size={4}
                          >
                            {obras.map((obra) => (
                              <option key={obra.id} value={obra.id}>
                                {obra.nombre_obra}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            Mantén Ctrl/Cmd para seleccionar múltiples
                          </p>
                        </div>

                        {/* Botón para abrir modal en móvil */}
                        <div className="md:hidden">
                          <button
                            type="button"
                            onClick={() => setObrasModalOpen(true)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 text-sm">
                                {formData.obras_asignadas.length > 0 
                                  ? `${formData.obras_asignadas.length} obra${formData.obras_asignadas.length !== 1 ? 's' : ''} seleccionada${formData.obras_asignadas.length !== 1 ? 's' : ''}`
                                  : 'Seleccionar obras'
                                }
                              </span>
                              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>
                          <p className="mt-1 text-xs text-gray-500">
                            Toca para seleccionar obras
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Obras Asignadas ({formData.obras_asignadas.length})
                        </label>
                        <div className="border border-gray-200 rounded-md p-2 bg-gray-50 h-24 overflow-y-auto">
                          {formData.obras_asignadas.length > 0 ? (
                            <div className="grid grid-cols-1 gap-1">
                              {obtenerDetallesObrasAsignadas().map(obra => (
                                <div key={obra.id} className="flex items-center justify-between bg-white p-1 rounded-md border border-gray-200 shadow-sm">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 text-xs truncate">{obra.nombre_obra}</div>
                                    <div className="text-xs text-gray-500 flex flex-row gap-1">
                                      <span>Nº: {obra.numero_obra || '-'}</span>
                                      <span>Cliente: {obra.cliente || '-'}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <span className={`px-1 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      obra.estado === 'Pendiente' ? 'bg-orange-100 text-orange-800' :
                                      obra.estado === 'En Curso' ? 'bg-green-100 text-green-800' : 
                                      obra.estado === 'Finalizada' ? 'bg-blue-100 text-blue-800' : 
                                      obra.estado === 'Garantía' ? 'bg-yellow-100 text-yellow-800' : 
                                      obra.estado === 'Cerrada' ? 'bg-gray-100 text-gray-800' : 
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {obra.estado || '-'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-2 text-gray-500 text-xs">
                              No hay obras asignadas
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Crear Usuario</label>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="crearUsuario"
                            checked={formData.crearUsuario}
                            onChange={handleChange}
                            className="mr-2"
                          />
                          <span>Crear un usuario con rol de proveedor</span>
                        </div>
                      </div>

                      {formData.crearUsuario && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-2 py-1 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-3 pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        resetForm();
                      }}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-3 py-1 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {loading ? 'Guardando...' : currentProveedor ? 'Actualizar' : 'Guardar'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-2">
                  {currentProveedor && (
                    <TablaPreciosProveedor proveedorId={currentProveedor.id} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para seleccionar obras en móvil */}
      {obrasModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-4 z-[80] md:hidden">
          <div className="bg-white rounded-t-xl shadow-xl w-full max-h-[80vh] flex flex-col">
            {/* Header del modal */}
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Seleccionar Obras ({formData.obras_asignadas.length} seleccionadas)
              </h3>
              <button
                onClick={() => setObrasModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar obras por nombre, número o cliente..."
                  value={obrasSearchTerm}
                  onChange={(e) => setObrasSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Lista de obras */}
            <div className="flex-1 overflow-y-auto">
              {filteredObras.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No se encontraron obras
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredObras.map((obra) => {
                    const isSelected = formData.obras_asignadas.includes(obra.id.toString());
                    return (
                      <div
                        key={obra.id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleObraToggle(obra.id)}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleObraToggle(obra.id)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {obra.nombre_obra}
                            </div>
                            <div className="text-sm text-gray-500">
                              Nº: {obra.numero_obra || '-'} | Cliente: {obra.cliente || '-'}
                            </div>
                            <div className="mt-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                obra.estado === 'Pendiente' ? 'bg-orange-100 text-orange-800' :
                                obra.estado === 'En Curso' ? 'bg-green-100 text-green-800' : 
                                obra.estado === 'Finalizada' ? 'bg-blue-100 text-blue-800' : 
                                obra.estado === 'Garantía' ? 'bg-yellow-100 text-yellow-800' : 
                                obra.estado === 'Cerrada' ? 'bg-gray-100 text-gray-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {obra.estado || '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setObrasModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, obras_asignadas: [] }));
                    setObrasModalOpen(false);
                  }}
                  className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
