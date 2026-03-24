/**
 * Formatea un número como valor monetario en euros
 * @param {number} value - Valor a formatear
 * @param {string} [locale='es-ES'] - Configuración regional para el formato
 * @returns {string} - Valor formateado como moneda
 */
export const formatCurrency = (value, locale = 'es-ES') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Formatea una fecha en formato legible
 * @param {string|Date} date - Fecha a formatear
 * @param {string} [locale='es-ES'] - Configuración regional para el formato
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date, locale = 'es-ES') => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formatea un número con separadores de miles y decimales
 * @param {number} value - Valor a formatear
 * @param {number} [decimals=2] - Número de decimales
 * @param {string} [locale='es-ES'] - Configuración regional para el formato
 * @returns {string} - Número formateado
 */
export const formatNumber = (value, decimals = 2, locale = 'es-ES') => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};
