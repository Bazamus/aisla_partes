import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import OfflineBanner from './components/pwa/OfflineBanner'
import ReloadPrompt from './components/pwa/ReloadPrompt'
import InstallPrompt from './components/pwa/InstallPrompt'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NuevoParte from './pages/NuevoParte'
import EditarParte from './pages/EditarParte'
import Empleados from './pages/Empleados'
import Obras from './pages/Obras'
import Precios from './pages/Precios'
import Proveedores from './pages/Proveedores'
import PartesProveedoresListPage from './pages/PartesProveedoresListPage'
import ParteProveedorPage from './pages/ParteProveedorPage'
import VerParteProveedorPage from './pages/VerParteProveedorPage'
import VerDetallePartePage from './pages/VerDetallePartePage' // Añadida importación
import PartesEmpleadosListPage from './pages/PartesEmpleadosListPage'
import Login from './pages/Login'
import AccesoDenegado from './pages/AccesoDenegado'
import GestionRoles from './pages/GestionRoles'
import Auditoria from './pages/Auditoria_nueva'
import Perfil from './pages/Perfil'
import Usuarios from './pages/Usuarios'
import ObrasAsignadas from './pages/ObrasAsignadas'
import ObrasAsignadasEmpleado from './pages/ObrasAsignadasEmpleado'
import TestPage from './pages/TestPage'
import TestPdfPage from './pages/TestPdfPage'
import ImportarPartesTrabajo from './components/importacion/ImportarPartesTrabajo'
import Reportes from './pages/Reportes'
import { AuthProvider, ProtectedRoute } from './contexts/AuthContext'
import { AdminRoute, UserRoute } from './components/auth'
import { StatsProvider } from './contexts/StatsContext'

function App() {
  return (
    <Router>
      <AuthProvider>
        <StatsProvider>
          <OfflineBanner />
          <Toaster position="top-right" />
        <Routes>
          {/* Ruta pública - Login */}
          <Route path="/login" element={<Login />} />

          {/* Ruta de prueba de conexión */}
          <Route path="/test" element={<TestPage />} />

          {/* Ruta de prueba de PDF */}
          <Route path="/test-pdf" element={<TestPdfPage />} />

          {/* Ruta de acceso denegado */}
          <Route path="/acceso-denegado" element={<AccesoDenegado />} />

          {/* Rutas protegidas - Requieren autenticación */}
          <Route path="/" element={
            <UserRoute>
              <Layout />
            </UserRoute>
          }>
            {/* Inicio - Accesible para todos los usuarios autenticados */}
            <Route index element={<Dashboard />} />

            {/* Partes de Empleados - Requiere permisos específicos */}
            <Route path="partes-empleados" element={
              <ProtectedRoute requiredPermission="partes:leer">
                <PartesEmpleadosListPage />
              </ProtectedRoute>
            } />

            <Route path="parte-empleado" element={
              <ProtectedRoute requiredPermission="partes:crear">
                <NuevoParte />
              </ProtectedRoute>
            } />

            <Route path="nuevo-parte" element={
              <ProtectedRoute requiredPermission="partes:crear">
                <NuevoParte />
              </ProtectedRoute>
            } />

            <Route path="editar-parte/:id" element={
              <ProtectedRoute requiredPermission="partes:editar">
                <EditarParte />
              </ProtectedRoute>
            } />

            {/* Nueva ruta para ver detalle de parte de empleado */}
            <Route path="ver-detalle/empleado/:id" element={
              <ProtectedRoute requiredPermission="partes:leer">
                <VerDetallePartePage />
              </ProtectedRoute>
            } />

            {/* Gestión de Empleados */}
            <Route path="empleados" element={
              <ProtectedRoute requiredPermission="empleados:leer">
                <Empleados />
              </ProtectedRoute>
            } />

            {/* Gestión de Obras */}
            <Route path="obras" element={
              <ProtectedRoute requiredPermission="obras:leer">
                <Obras />
              </ProtectedRoute>
            } />

            {/* Gestión de Precios */}
            <Route path="precios" element={
              <ProtectedRoute>
                <Precios />
              </ProtectedRoute>
            } />


            {/* Gestión de Proveedores */}
            <Route path="proveedores" element={
              <ProtectedRoute requiredPermission="proveedores:leer">
                <Proveedores />
              </ProtectedRoute>
            } />

            {/* Partes de Proveedores */}
            <Route path="partes-proveedores" element={
              <UserRoute>
                <PartesProveedoresListPage />
              </UserRoute>
            } />

            <Route path="parte-proveedor/nuevo" element={
              <UserRoute>
                <ParteProveedorPage />
              </UserRoute>
            } />

            <Route path="parte-proveedor/editar/:id" element={
              <UserRoute>
                <ParteProveedorPage />
              </UserRoute>
            } />

            <Route path="parte-proveedor/ver/:id" element={
              <UserRoute>
                <VerParteProveedorPage />
              </UserRoute>
            } />

            {/* Gestión de Roles y Permisos */}
            <Route path="gestion-roles" element={
              <ProtectedRoute requiredPermission="roles:gestionar">
                <GestionRoles />
              </ProtectedRoute>
            } />

            {/* Registro de Auditoría */}
            <Route path="auditoria" element={
              <ProtectedRoute requiredPermission="auditoria:ver">
                <Auditoria />
              </ProtectedRoute>
            } />

            {/* Reportes Analíticos */}
            <Route path="reportes" element={
              <ProtectedRoute requiredPermission="reportes:ver">
                <Reportes />
              </ProtectedRoute>
            } />

            {/* Usuarios Pendientes - Redirigir a la nueva página unificada */}
            <Route path="usuarios-pendientes" element={
              <ProtectedRoute requiredPermission="usuarios:gestionar">
                <Usuarios initialTab="pendientes" />
              </ProtectedRoute>
            } />
            
            {/* Gestión Unificada de Usuarios */}
            <Route path="usuarios" element={
              <AdminRoute>
                <Usuarios />
              </AdminRoute>
            } />

            {/* Obras Asignadas - Para proveedores */}
            <Route path="obras-asignadas" element={
              <UserRoute>
                <ObrasAsignadas />
              </UserRoute>
            } />

            {/* Obras Asignadas - Para empleados */}
            <Route path="empleado/obras-asignadas" element={
              <ProtectedRoute requiredPermission="obras:leer">
                <ObrasAsignadasEmpleado />
              </ProtectedRoute>
            } />

            {/* Perfil de usuario - Accesible para todos los usuarios autenticados */}
            <Route path="perfil" element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            } />

            {/* Importar Partes de Trabajo - Solo para SuperAdmin */}
            <Route path="importar-partes-trabajo" element={
              <ProtectedRoute requiredPermission="partes:importar">
                <ImportarPartesTrabajo />
              </ProtectedRoute>
            } />
          </Route>
          </Routes>
          
          {/* PWA Components */}
          <ReloadPrompt />
          <InstallPrompt />
          <OfflineBanner />
        </StatsProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
