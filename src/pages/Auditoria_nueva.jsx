import { useAuth } from '../contexts/AuthContext';
import { AdminRoute } from '../components/auth/RoleRoutes';
import AuditoriaDetallada from '../components/auditoria/AuditoriaDetallada';

export default function Auditoria() {
  return (
    <AdminRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Registro de Auditoría</h1>
        <AuditoriaDetallada />
      </div>
    </AdminRoute>
  );
}
