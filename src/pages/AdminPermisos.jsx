import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const AdminPermisos = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Mostrar mensaje informativo
          toast('Esta página ha sido migrada a la sección de Usuarios');
    
    // Redirigir a la página de Usuarios
    navigate('/usuarios');
  }, [navigate]);

  return null;
}

export default AdminPermisos;
