import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar si una media query coincide
 * @param {string} query - La media query a comprobar
 * @returns {boolean} - Verdadero si la media query coincide
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Crear media query
    const media = window.matchMedia(query);
    
    // Actualizar el estado inicial
    setMatches(media.matches);
    
    // Definir callback para cambios
    const listener = (event) => {
      setMatches(event.matches);
    };
    
    // Añadir listener
    media.addEventListener('change', listener);
    
    // Limpiar listener
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
};

/**
 * Hook para detectar si el dispositivo es móvil
 * @returns {boolean} - Verdadero si es un dispositivo móvil
 */
export const useMobileDetect = () => {
  return useMediaQuery('(max-width: 768px)');
};

export default useMediaQuery;
