import React, { useState, useEffect } from 'react';
import * as trabajosService from '../../services/trabajosService';
import * as preciosProveedorService from '../../services/preciosProveedorService';

const TrabajosList = ({ onSelectTrabajo, codigoProveedor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const buscarTrabajos = async () => {
      if (searchTerm.length < 2) {
        setTrabajos([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Obtener trabajos que coinciden con la búsqueda desde lista_de_precios
        const data = await trabajosService.searchTrabajos(searchTerm);
        
        // Si hay un código de proveedor, buscar precios personalizados
        if (codigoProveedor && data && data.length > 0) {
          try {
            // Obtener todos los precios personalizados para este proveedor
            const preciosPersonalizados = await preciosProveedorService.getPreciosProveedorByCodigo(codigoProveedor);
            
            // Marcar los trabajos que tienen precios personalizados
            const trabajosConPreciosPersonalizados = data.map(trabajo => {
              const precioPersonalizado = preciosPersonalizados.find(p => p.trabajo_id === trabajo.id);
              
              if (precioPersonalizado) {
                return {
                  ...trabajo,
                  tienePrecioPersonalizado: true,
                  precioPersonalizado: precioPersonalizado.precio,
                  precioOriginal: trabajo.precio_venta
                };
              }
              
              return trabajo;
            });
            
            setTrabajos(trabajosConPreciosPersonalizados || []);
          } catch (err) {
            console.error('Error al obtener precios personalizados:', err);
            setTrabajos(data || []);
          }
        } else {
          setTrabajos(data || []);
        }
      } catch (err) {
        console.error('Error al buscar trabajos:', err);
        setError('Error al buscar trabajos. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      buscarTrabajos();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, codigoProveedor]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectTrabajo = (trabajo) => {
    onSelectTrabajo(trabajo);
    setSearchTerm('');
    setTrabajos([]);
  };

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Buscar trabajo en Lista de Precios..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          aria-label="Buscar trabajo en Lista de Precios"
        />
        {loading && (
          <div className="absolute right-3 top-2">
            <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {trabajos.length > 0 && (
        <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
          <ul className="divide-y divide-gray-200">
            {trabajos.map((trabajo) => (
              <li 
                key={trabajo.id} 
                className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${trabajo.tienePrecioPersonalizado ? 'bg-blue-50' : ''}`}
                onClick={() => handleSelectTrabajo(trabajo)}
                tabIndex="0"
                onKeyDown={(e) => e.key === 'Enter' && handleSelectTrabajo(trabajo)}
                aria-label={`Seleccionar trabajo: ${trabajo.descripcion}`}
              >
                <div className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium">{trabajo.descripcion}</span>
                    {trabajo.tienePrecioPersonalizado && (
                      <span className="text-xs text-blue-600 font-medium">
                        Precio personalizado disponible
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    {trabajo.tienePrecioPersonalizado ? (
                      <>
                        <span className="text-blue-600 font-medium">{trabajo.precioPersonalizado}€</span>
                        <span className="text-xs text-gray-500 line-through">{trabajo.precioOriginal}€</span>
                      </>
                    ) : (
                      <span className="text-gray-600">{trabajo.precio_venta ? `${trabajo.precio_venta}€` : 'Precio no disponible'}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {searchTerm.length >= 2 && trabajos.length === 0 && !loading && (
        <div className="mt-2 text-sm text-gray-500">
          No se encontraron trabajos en la Lista de Precios. Intenta con otra búsqueda.
        </div>
      )}
    </div>
  );
};

export default TrabajosList;
