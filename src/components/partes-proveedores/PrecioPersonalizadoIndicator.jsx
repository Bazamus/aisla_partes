import React from 'react';

/**
 * Componente que muestra un indicador cuando se está utilizando un precio personalizado
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isPrecioPersonalizado - Indica si el precio es personalizado
 * @param {number} props.precioGeneral - Precio general del trabajo
 * @param {number} props.precioPersonalizado - Precio personalizado aplicado
 * @returns {JSX.Element} - Componente de indicador de precio personalizado
 */
const PrecioPersonalizadoIndicator = ({ isPrecioPersonalizado, precioGeneral, precioPersonalizado }) => {
  if (!isPrecioPersonalizado) return null;
  
  const diferencia = precioPersonalizado - precioGeneral;
  const porcentaje = (diferencia / precioGeneral) * 100;
  const esMasCaro = diferencia > 0;
  
  return (
    <div className="mt-1 flex items-center">
      <span 
        className={`text-xs font-medium px-2 py-1 rounded-full ${
          esMasCaro ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}
      >
        Precio personalizado {esMasCaro ? '+' : ''}{porcentaje.toFixed(2)}%
        <span className="ml-1 text-xs">
          ({precioGeneral.toFixed(2)}€ → {precioPersonalizado.toFixed(2)}€)
        </span>
      </span>
    </div>
  );
};

export default PrecioPersonalizadoIndicator;
