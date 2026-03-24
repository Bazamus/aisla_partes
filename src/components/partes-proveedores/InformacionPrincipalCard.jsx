import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import * as proveedorService from '../../services/proveedorService';
import { useAuth } from '../../contexts/AuthContext';

const InformacionPrincipalCard = ({ formData, setFormData, readOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allProveedores, setAllProveedores] = useState([]);
  const [filteredProveedores, setFilteredProveedores] = useState([]);
  const [proveedorSearch, setProveedorSearch] = useState('');
  const [selectedProveedorId, setSelectedProveedorId] = useState('');
  const { hasRole, user } = useAuth();

  console.log('[InformacionPrincipalCard] Componente montado. Usuario:', user?.email);
  console.log('[InformacionPrincipalCard] Roles del usuario:', user?.user_metadata?.roles || 'No roles');

  // Verificar si el usuario es SuperAdmin o Administrador
  const isAdminOrSuperAdmin = hasRole('superadmin') || hasRole('administrador') || hasRole('admin') || hasRole('SuperAdmin') || user?.email === 'admin@vimar.com';
  
  console.log('[InformacionPrincipalCard] Verificación de roles:');
  console.log('- hasRole("superadmin"):', hasRole('superadmin'));
  console.log('- hasRole("administrador"):', hasRole('administrador'));
  console.log('- hasRole("admin"):', hasRole('admin'));
  console.log('- hasRole("SuperAdmin"):', hasRole('SuperAdmin'));
  console.log('- user?.email === "admin@vimar.com":', user?.email === 'admin@vimar.com');
  console.log('- isAdminOrSuperAdmin final:', isAdminOrSuperAdmin);

  // Establecer "Demo" como cliente por defecto al montar el componente
  useEffect(() => {
    if (!formData.cliente) {
      setFormData(prev => ({
        ...prev,
        cliente: 'Demo Client'
      }));
    }
  }, []);

  // Cargar todos los proveedores si es SuperAdmin
  useEffect(() => {
    const cargarProveedores = async () => {
      console.log('[InformacionPrincipalCard] Verificando si es SuperAdmin:', isAdminOrSuperAdmin);
      console.log('[InformacionPrincipalCard] Usuario actual:', user?.email);
      
      if (!isAdminOrSuperAdmin) {
        console.log('[InformacionPrincipalCard] No es SuperAdmin, no cargando proveedores');
        return;
      }
      
      try {
        console.log('[InformacionPrincipalCard] Cargando proveedores...');
        setLoading(true);
        const { data: proveedores, error } = await supabase
          .from('proveedores')
          .select('*')
          .order('razon_social');
        
        if (error) {
          console.error('Error al cargar proveedores:', error);
          return;
        }
        
        console.log('[InformacionPrincipalCard] Proveedores cargados:', proveedores?.length || 0);
        if (proveedores && proveedores.length > 0) {
          console.log('[InformacionPrincipalCard] Primeros 3 proveedores:', proveedores.slice(0, 3));
          console.log('[InformacionPrincipalCard] Ejemplo de estructura de proveedor:', {
            id: proveedores[0].id,
            codigo: proveedores[0].codigo,
            tipo_codigo: typeof proveedores[0].codigo,
            razon_social: proveedores[0].razon_social,
            empresa: proveedores[0].empresa
          });
        }
        
        setAllProveedores(proveedores || []);
        setFilteredProveedores(proveedores || []);
      } catch (err) {
        console.error('Error al cargar proveedores:', err);
      } finally {
        setLoading(false);
      }
    };
    
    cargarProveedores();
  }, [isAdminOrSuperAdmin, user]);

  // Filtrar proveedores cuando cambie la búsqueda
  useEffect(() => {
    console.log('[InformacionPrincipalCard] Filtrando proveedores. Búsqueda:', proveedorSearch);
    console.log('[InformacionPrincipalCard] Total de proveedores:', allProveedores.length);
    
    if (proveedorSearch.trim() === '') {
      console.log('[InformacionPrincipalCard] Sin búsqueda, mostrando todos los proveedores');
      setFilteredProveedores(allProveedores);
    } else {
      const search = proveedorSearch.toLowerCase();
      const filtered = allProveedores.filter(prov => 
        (prov.razon_social || '').toLowerCase().includes(search) ||
        String(prov.codigo || '').toLowerCase().includes(search) ||
        (prov.empresa || '').toLowerCase().includes(search)
      );
      console.log('[InformacionPrincipalCard] Proveedores filtrados:', filtered.length);
      setFilteredProveedores(filtered);
    }
  }, [proveedorSearch, allProveedores]);

  // ✅ NUEVO: Establecer proveedor seleccionado cuando se cargan datos existentes
  useEffect(() => {
    console.log('[InformacionPrincipalCard] Efecto proveedor seleccionado ejecutándose...');
    console.log('[InformacionPrincipalCard] - isAdminOrSuperAdmin:', isAdminOrSuperAdmin);
    console.log('[InformacionPrincipalCard] - formData.proveedor_id:', formData.proveedor_id);
    console.log('[InformacionPrincipalCard] - allProveedores.length:', allProveedores.length);
    console.log('[InformacionPrincipalCard] - selectedProveedorId actual:', selectedProveedorId);
    
    if (isAdminOrSuperAdmin && formData.proveedor_id && allProveedores.length > 0) {
      console.log('[InformacionPrincipalCard] Estableciendo proveedor seleccionado:', formData.proveedor_id);
      console.log('[InformacionPrincipalCard] Tipo de formData.proveedor_id:', typeof formData.proveedor_id);
      
      // Buscar el proveedor correspondiente al proveedor_id del formData
      // Intentar búsqueda tanto por número como por string
      const proveedorEncontrado = allProveedores.find(prov => 
        prov.id === formData.proveedor_id || 
        prov.id === Number(formData.proveedor_id) ||
        String(prov.id) === String(formData.proveedor_id)
      );
      
      if (proveedorEncontrado) {
        console.log('[InformacionPrincipalCard] Proveedor encontrado para parte existente:', proveedorEncontrado);
        console.log('[InformacionPrincipalCard] Estableciendo selectedProveedorId:', String(proveedorEncontrado.id));
        setSelectedProveedorId(String(proveedorEncontrado.id));
      } else {
        console.log('[InformacionPrincipalCard] No se encontró proveedor con ID:', formData.proveedor_id);
        console.log('[InformacionPrincipalCard] IDs de proveedores disponibles:', allProveedores.map(p => `${p.id} (${typeof p.id})`));
        console.log('[InformacionPrincipalCard] Ejemplo proveedor:', allProveedores[0]);
      }
    } else {
      console.log('[InformacionPrincipalCard] Condiciones no cumplidas para establecer proveedor');
    }
  }, [isAdminOrSuperAdmin, formData, allProveedores]);

  // Buscar información del proveedor cuando cambie el código (solo si no es SuperAdmin)
  useEffect(() => {
    if (isAdminOrSuperAdmin || !formData.codigo_proveedor || formData.codigo_proveedor.length < 3) return;
    
    const buscarProveedor = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const proveedor = await proveedorService.getProveedorByCodigo(formData.codigo_proveedor);
        
        if (proveedor) {
          setFormData(prev => ({
            ...prev,
            empresa: proveedor.empresa || '',
            razon_social: proveedor.razon_social || '',
            cif: proveedor.cif || '',
            email: proveedor.email || '',
            telefono: proveedor.telefono || ''
          }));
        }
      } catch (err) {
        console.error('Error al buscar proveedor:', err);
        setError('Error al buscar información del proveedor');
      } finally {
        setLoading(false);
      }
    };
    
    buscarProveedor();
  }, [formData.codigo_proveedor, setFormData, isAdminOrSuperAdmin]);

  // Manejar cambio de proveedor seleccionado (modo Administrador)
  const handleProveedorChange = (e) => {
    const proveedorId = e.target.value;
    console.log('[InformacionPrincipalCard] Proveedor seleccionado ID:', proveedorId);
    setSelectedProveedorId(proveedorId);
    
    if (proveedorId) {
      const selectedProveedor = allProveedores.find(prov => prov.id === parseInt(proveedorId));
      console.log('[InformacionPrincipalCard] Proveedor encontrado:', selectedProveedor);
      
      if (selectedProveedor) {
        console.log('[InformacionPrincipalCard] Actualizando formulario con datos del proveedor');
        setFormData(prev => ({
          ...prev,
          proveedor_id: selectedProveedor.id,
          codigo_proveedor: String(selectedProveedor.codigo || ''),
          empresa: selectedProveedor.empresa || '',
          razon_social: selectedProveedor.razon_social || '',
          cif: selectedProveedor.cif || '',
          email: selectedProveedor.email || '',
          telefono: selectedProveedor.telefono || ''
        }));
      }
    } else {
      console.log('[InformacionPrincipalCard] Limpiando campos del formulario');
      // Limpiar campos si no hay proveedor seleccionado
      setFormData(prev => ({
        ...prev,
        proveedor_id: null,
        codigo_proveedor: '',
        empresa: '',
        razon_social: '',
        cif: '',
        email: '',
        telefono: ''
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Renderizado para modo de solo lectura
  if (readOnly) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Información Principal</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Fecha</p>
            <p className="mt-1">{formData.fecha ? new Date(formData.fecha).toLocaleDateString() : 'N/A'}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Cliente</p>
            <p className="mt-1">{formData.cliente || 'N/A'}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Código Proveedor</p>
            <p className="mt-1">{formData.codigo_proveedor || 'N/A'}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Empresa</p>
            <p className="mt-1">{formData.empresa || 'N/A'}</p>
          </div>
          
          {formData.razon_social && (
            <div>
              <p className="text-sm font-medium text-gray-500">Razón Social</p>
              <p className="mt-1">{formData.razon_social}</p>
            </div>
          )}
          
          {formData.cif && (
            <div>
              <p className="text-sm font-medium text-gray-500">CIF</p>
              <p className="mt-1">{formData.cif}</p>
            </div>
          )}
          
          {formData.email && (
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1">{formData.email}</p>
            </div>
          )}
          
          {formData.telefono && (
            <div>
              <p className="text-sm font-medium text-gray-500">Teléfono</p>
              <p className="mt-1">{formData.telefono}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Renderizado para modo de edición
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Información Principal</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Selector de proveedor para Administradores */}
      {isAdminOrSuperAdmin && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Seleccionar Proveedor</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="proveedor-search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Proveedor
              </label>
              <input
                id="proveedor-search"
                type="text"
                value={proveedorSearch}
                onChange={e => setProveedorSearch(e.target.value)}
                placeholder="Escribe para buscar por razón social, código o empresa..."
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              />
            </div>
            <div>
              <label htmlFor="proveedor-select" className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Proveedor
              </label>
              <select
                id="proveedor-select"
                name="proveedor-select"
                value={selectedProveedorId}
                onChange={handleProveedorChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              >
                <option value="">-- Elige un proveedor --</option>
                {filteredProveedores.map(prov => (
                  <option key={prov.id} value={prov.id}>
                    {prov.razon_social} {prov.codigo ? `(${String(prov.codigo)})` : ''}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                {filteredProveedores.length} proveedores disponibles
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha
          </label>
          <input
            type="date"
            id="fecha"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-1">
            Cliente
          </label>
          <input
            type="text"
            id="cliente"
            name="cliente"
            value={formData.cliente || 'Demo'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="codigo_proveedor" className="block text-sm font-medium text-gray-700 mb-1">
            Código Proveedor
          </label>
          <div className="relative">
            <input
              type="text"
              id="codigo_proveedor"
              name="codigo_proveedor"
              value={formData.codigo_proveedor}
              onChange={handleChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                isAdminOrSuperAdmin && selectedProveedorId ? 'bg-gray-100 text-gray-600' : ''
              }`}
              required
              readOnly={isAdminOrSuperAdmin && selectedProveedorId}
            />
            {loading && !isAdminOrSuperAdmin && (
              <div className="absolute right-3 top-2">
                <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 mb-1">
            Empresa
          </label>
          <input
            type="text"
            id="empresa"
            name="empresa"
            value={formData.empresa}
            onChange={handleChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              isAdminOrSuperAdmin && selectedProveedorId ? 'bg-gray-100 text-gray-600' : ''
            }`}
            readOnly={isAdminOrSuperAdmin && selectedProveedorId}
          />
        </div>
        
        <div>
          <label htmlFor="razon_social" className="block text-sm font-medium text-gray-700 mb-1">
            Razón Social
          </label>
          <input
            type="text"
            id="razon_social"
            name="razon_social"
            value={formData.razon_social || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              isAdminOrSuperAdmin && selectedProveedorId ? 'bg-gray-100 text-gray-600' : ''
            }`}
            readOnly={isAdminOrSuperAdmin && selectedProveedorId}
          />
        </div>
        
        <div>
          <label htmlFor="cif" className="block text-sm font-medium text-gray-700 mb-1">
            CIF
          </label>
          <input
            type="text"
            id="cif"
            name="cif"
            value={formData.cif}
            onChange={handleChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              isAdminOrSuperAdmin && selectedProveedorId ? 'bg-gray-100 text-gray-600' : ''
            }`}
            readOnly={isAdminOrSuperAdmin && selectedProveedorId}
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              isAdminOrSuperAdmin && selectedProveedorId ? 'bg-gray-100 text-gray-600' : ''
            }`}
            readOnly={isAdminOrSuperAdmin && selectedProveedorId}
          />
        </div>
        
        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              isAdminOrSuperAdmin && selectedProveedorId ? 'bg-gray-100 text-gray-600' : ''
            }`}
            readOnly={isAdminOrSuperAdmin && selectedProveedorId}
          />
        </div>
      </div>
    </div>
  );
};

export default InformacionPrincipalCard;
