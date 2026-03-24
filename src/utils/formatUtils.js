export const formatParteNumber = (parte) => {
  if (!parte || parte.numero_parte === null || parte.numero_parte === undefined) {
    return 'Nuevo';
  }

  const numeroParteStr = String(parte.numero_parte);

  // Si el número ya viene formateado desde la BD (contiene '/'), lo devolvemos tal cual.
  if (numeroParteStr.includes('/')) {
    return numeroParteStr;
  }

  // Fallback para datos antiguos: si no está formateado, se formatea aquí.
  const year = parte.fecha ? new Date(parte.fecha).getFullYear().toString().slice(-2) : 'XX';
  const number = numeroParteStr.padStart(4, '0');
  
  // Asumimos prefijo 'E' para empleados. Para proveedores, esto podría necesitar un ajuste
  // si esta función se usa para ambos y no se puede determinar el tipo.
  const prefijo = 'E';

  return `${prefijo}${number}/${year}`;
};
