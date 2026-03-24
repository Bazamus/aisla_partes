import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const VerificacionTablas = () => {
  const [estado, setEstado] = useState({
    verificando: true,
    tablas: {
      partes_proveedores: false,
      proveedores: false,
      trabajos: false
    },
    error: null
  });

  useEffect(() => {
    const verificarTablas = async () => {
      try {
        console.log('Verificando tablas necesarias para partes de proveedores...');
        
        // Verificar tabla partes_proveedores
        const { data: datosPartes, error: errorPartes } = await supabase
          .from('partes_proveedores')
          .select('id')
          .limit(1);
        
        console.log('Verificación partes_proveedores:', { 
          error: errorPartes ? true : false, 
          mensaje: errorPartes ? errorPartes.message : 'Tabla existe' 
        });
        
        // Verificar tabla proveedores
        const { data: datosProveedores, error: errorProveedores } = await supabase
          .from('proveedores')
          .select('id')
          .limit(1);
        
        console.log('Verificación proveedores:', { 
          error: errorProveedores ? true : false, 
          mensaje: errorProveedores ? errorProveedores.message : 'Tabla existe'
        });
        
        // Verificar tabla trabajos
        const { data: datosTrabajos, error: errorTrabajos } = await supabase
          .from('trabajos')
          .select('id')
          .limit(1);
        
        console.log('Verificación trabajos:', { 
          error: errorTrabajos ? true : false, 
          mensaje: errorTrabajos ? errorTrabajos.message : 'Tabla existe'
        });
        
        setEstado({
          verificando: false,
          tablas: {
            partes_proveedores: !errorPartes,
            proveedores: !errorProveedores,
            trabajos: !errorTrabajos
          },
          error: null
        });
      } catch (err) {
        console.error('Error al verificar tablas:', err);
        setEstado({
          verificando: false,
          tablas: {
            partes_proveedores: false,
            proveedores: false,
            trabajos: false
          },
          error: 'Error al verificar las tablas en la base de datos'
        });
      }
    };
    
    verificarTablas();
  }, []);

  if (estado.verificando) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md mb-4">
        <p>Verificando configuración de tablas...</p>
      </div>
    );
  }

  if (estado.error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
        <p>Error: {estado.error}</p>
      </div>
    );
  }

  if (!estado.tablas.partes_proveedores || !estado.tablas.proveedores || !estado.tablas.trabajos) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md mb-4">
        <p>Faltan tablas necesarias en la base de datos.</p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-4">
      <p>Configuración correcta.</p>
    </div>
  );
};

export default VerificacionTablas;
