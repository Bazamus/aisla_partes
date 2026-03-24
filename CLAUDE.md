# CLAUDE.md
A partir de ahora nos comunicaremos en idioma Español de España, recuérdalo siempre que interactúes conmigo.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aisla Partes** is a responsive work order management web application built with React, Vite, and Supabase. The system manages work orders (partes) for two distinct user types: employees (empleados) and suppliers/contractors (proveedores), each with different workflows and data structures.

## Commands

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start development server (default port: Vite's default)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Environment Setup
Create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_KEY=your_supabase_service_key  # Optional, for admin operations
```

## Architecture

### Authentication System

**CRITICAL**: This application uses a **custom authentication system** instead of Supabase Auth.

- Login is handled via `custom_login` RPC function in [src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx)
- Session data is stored in localStorage: `supabase.auth.token` and `custom_auth_user`
- User helper: `getCurrentUser()` from [src/lib/supabase.js](src/lib/supabase.js) retrieves the custom user from localStorage
- **Never use** `supabase.auth.signUp()` or standard Supabase Auth methods - they will fail
- All services use `getCurrentUser()` to identify the authenticated user

**Admin Client Pattern**:
- `supabaseAdmin` client (from `src/lib/supabase.js`) uses service role key to bypass RLS policies
- Used for admin operations like accessing all partes regardless of user
- Example usage: `const { supabaseAdmin } = await import('../lib/supabase')`

### Role-Based Access Control (RBAC)

The system implements a sophisticated permission system with:
- **Roles**: superadmin, administrador, supervisor, empleado, proveedor
- **Permissions**: Granular permissions like `partes:leer`, `partes:crear`, `empleados:editar`, etc.
- **Tables**: `roles`, `permisos`, `usuarios_roles`, `roles_permisos`

**Key points**:
- Permissions are fetched via `fetchUserPermissions()` in AuthContext (uses 3-step query: usuarios_roles → roles_permisos → permisos)
- `hasPermission(permissionCode)` checks if user has specific permission
- `hasRole(roleName)` checks if user has specific role
- SuperAdmin (`admin@vimar.com`) has hardcoded special privileges in several places
- Emergency mode (`EMERGENCY_MODE` flag in AuthContext) can bypass permission checks for debugging

### Dual Work Order System

The app manages two distinct types of work orders with separate data models:

#### 1. Employee Work Orders (Partes Empleados)
- **Table**: `partes_empleados` (also referenced as `partes` in some legacy queries)
- **Key Components**:
  - [src/pages/PartesEmpleadosListPage.jsx](src/pages/PartesEmpleadosListPage.jsx) - List view
  - [src/pages/NuevoParte.jsx](src/pages/NuevoParte.jsx) - Create/Edit
  - [src/components/partes-empleados/](src/components/partes-empleados/) - Component library
- **Services**: [src/services/parteEmpleadoService.js](src/services/parteEmpleadoService.js)
- **Work System**: Uses hierarchical catalog (Grupos → Subgrupos → Trabajos)
- **Features**: Images, signatures, time tracking, articles catalog

#### 2. Supplier Work Orders (Partes Proveedores)
- **Table**: `partes_proveedores`
- **Key Components**:
  - [src/pages/PartesProveedoresListPage.jsx](src/pages/PartesProveedoresListPage.jsx) - List view
  - [src/pages/ParteProveedorPage.jsx](src/pages/ParteProveedorPage.jsx) - Create/Edit
  - [src/components/partes-proveedores/](src/components/partes-proveedores/) - Component library
- **Services**: [src/services/parteProveedorService.js](src/services/parteProveedorService.js)
- **Work System**: Custom pricing per supplier, work descriptions
- **Features**: Custom pricing, signature, obra (project) assignment

### Service Layer Pattern

All database operations are abstracted into service modules in [src/services/](src/services/):

- **parteEmpleadoService.js** - Employee work orders CRUD
- **parteProveedorService.js** - Supplier work orders CRUD
- **articulosService.js** - Articles/items catalog
- **gruposService.js** / **subgruposService.js** / **trabajosService.js** - Work catalog hierarchy
- **preciosProveedorService.js** - Supplier-specific pricing
- **exportService.js** - PDF/Excel export functionality
- **authService.js** - Authentication helpers
- **reportesService.js** - Analytics and reporting data
- **exportacionReportesService.js** - Report exports
- **importExportService.js** - Import/export for bulk operations

**Pattern**: Services use centralized error handling (`handleSupabaseError`) and RPC wrappers (`callRpc`).

### Image Management

- **Storage Bucket**: `images` in Supabase Storage
- **Upload Pattern**:
  - Images converted from Data URLs to Blobs (`dataURLtoBlob` helper)
  - Uploaded to storage bucket with unique filenames
  - Public URLs stored in database as JSON arrays
  - Supports temporary IDs (`tempParteId`) for pre-save uploads
- **Components**:
  - [src/components/partes-empleados/ImagenesCardNuevo.jsx](src/components/partes-empleados/ImagenesCardNuevo.jsx)
  - [src/components/ImageUploader.jsx](src/components/ImageUploader.jsx)

### State Management

- **AuthContext** ([src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx)): User session, permissions, roles, audit logging
- **StatsContext** ([src/contexts/StatsContext.jsx](src/contexts/StatsContext.jsx)): Dashboard statistics (global stats computed here)
- **ModalContext** ([src/contexts/ModalContext.jsx](src/contexts/ModalContext.jsx)): Global modal management
- Component-level state with React hooks

### Routing & Protection

**Router Setup** ([src/App.jsx](src/App.jsx)):
- `<UserRoute>` - Requires any authenticated user
- `<AdminRoute>` - Requires admin or superadmin role
- `<ProtectedRoute requiredPermission="...">` - Requires specific permission
- All route components in [src/components/auth/routes/](src/components/auth/routes/)

**Route Protection Examples**:
```jsx
// Any authenticated user
<UserRoute><Dashboard /></UserRoute>

// Admin only
<AdminRoute><Usuarios /></AdminRoute>

// Specific permission
<ProtectedRoute requiredPermission="partes:crear">
  <NuevoParte />
</ProtectedRoute>
```

### Mobile Responsiveness

- **Critical**: The app is designed to be heavily used on mobile devices
- Mobile-specific components: [src/components/common/MobileModal.jsx](src/components/common/MobileModal.jsx)
- Use TailwindCSS responsive classes (`sm:`, `md:`, `lg:`)
- Mobile filter toggles: `showMobileFilters` state pattern in list pages
- Image upload specially tested for mobile (ImagenesCardNuevo with tempParteId support)

### PDF Generation

- Libraries: jsPDF + jspdf-autotable
- Export logic in [src/services/exportService.js](src/services/exportService.js)
- Separate functions: `generateProveedorPDF()` and `generateEmpleadoPDF()`
- QR codes generated with qrcode.react library
- Images handled via `addImageToPDF` helper (supports base64 and URLs)
- Email sending via EmailJS integration

### PWA Support

The application is configured as a Progressive Web App:
- PWA configuration in [vite.config.js](vite.config.js)
- Manifest includes: name, icons, theme colors, orientation settings
- Service worker with Workbox for caching strategies:
  - NetworkFirst for API calls
  - CacheFirst for images (30 day expiration)
  - Maximum file size: 4MB (increased to support Recharts reports)
- PWA Components:
  - [src/components/pwa/ReloadPrompt.jsx](src/components/pwa/ReloadPrompt.jsx) - Update notifications
  - [src/components/pwa/InstallPWA.jsx](src/components/pwa/InstallPWA.jsx) - Install prompt
  - [src/components/pwa/OfflineBanner.jsx](src/components/pwa/OfflineBanner.jsx) - Offline indicator

## Database Schema Key Points

### Main Tables
- `partes` / `partes_empleados` - Employee work orders (both table names may appear)
- `partes_proveedores` - Supplier work orders
- `empleados` - Employee profiles (linked to users via `user_id`)
- `proveedores` - Supplier profiles (linked to users via `user_id`)
- `obras` - Projects/construction sites
- `trabajos` - Work catalog items
- `grupos` / `subgrupos` - Work categorization hierarchy
- `articulos` - Items/materials catalog
- `lista_precios_articulos` - Article pricing
- `auditoria` - Audit log for all actions

### Important Relations
- Users → Roles: `usuarios_roles` (many-to-many)
- Roles → Permissions: `roles_permisos` (many-to-many)
- Proveedores → Custom Prices: `precios_proveedor` table
- Obras → Assignments: Can be assigned to employees or suppliers
- Empleados/Proveedores → Users: Both have `user_id` foreign key

### User Type Detection Pattern
To determine if a user is an employee or supplier:
```javascript
// Check empleados table
const { data: empleado } = await supabase
  .from('empleados')
  .select('*')
  .eq('user_id', user.id)
  .single();

// Check proveedores table
const { data: proveedor } = await supabase
  .from('proveedores')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

## Development Practices

### Code Style
Follow guidelines from [.windsurfrules](.windsurfrules):
- Use early returns for readability
- Use TailwindCSS for all styling (no inline CSS)
- Descriptive variable names; event handlers prefixed with `handle`
- Consts over functions: `const handleClick = () => {...}`
- Implement accessibility features (aria-labels, tabindex, keyboard handlers)

### Console Logging
- Recent commits show cleanup of debug logging
- Avoid excessive `console.log` in production code unless for critical debugging
- Service layer has structured logging: `console.log('Servicio: ...')` prefix

### Component Organization
- Page components in [src/pages/](src/pages/)
- Reusable components organized by feature:
  - [src/components/partes-empleados/](src/components/partes-empleados/)
  - [src/components/partes-proveedores/](src/components/partes-proveedores/)
  - [src/components/auth/](src/components/auth/)
  - [src/components/dashboard/](src/components/dashboard/)
- Modals in dedicated `modals/` subdirectories within feature folders

### Error Handling
- Use `react-hot-toast` for user-facing notifications
- Centralized error handlers in service layer (`handleSupabaseError`)
- Supabase errors logged and re-thrown with context
- Fallback patterns: many queries have try/catch with fallback approaches (see AuthContext role fetching)

### Audit Logging
All significant user actions should call `logAction()` from AuthContext:
```javascript
const { logAction } = useAuth()
await logAction('crear_parte', 'Parte de trabajo creado', 'partes_empleados', parteId)
```

Parameters:
- `accion`: Action type (string)
- `detalles`: Description (string)
- `tabla`: Table name (string)
- `registro_id`: Record ID (optional, defaults to user.id)

## Common Gotchas

1. **Custom Auth**: Don't use Supabase Auth methods - use custom RPC functions and `getCurrentUser()`
2. **Service Role Key**: Some admin operations require `VITE_SUPABASE_SERVICE_KEY` env var
3. **Mobile CSS**: Global styles may hide elements on mobile - use specific overrides with `!important` if needed
4. **User Type Detection**: Always check if user is empleado or proveedor by querying respective tables with `user_id`
5. **Emergency Mode**: Check `EMERGENCY_MODE` flag in AuthContext before modifying permission logic
6. **Dual Table Names**: `partes` and `partes_empleados` may refer to same data (legacy naming)
7. **RLS Policies**: Row Level Security active - use `supabaseAdmin` to bypass when needed
8. **Temporary IDs**: Image uploads support `tempParteId` for pre-save scenarios
9. **Role Fallback**: AuthContext has dual methods for fetching roles (Method 1 with join, Method 2 with separate queries)

## Dashboard Variants

The application has different dashboards for different user types:
- **DashboardPersonalizado** - Main admin/supervisor dashboard with stats
- **DashboardProveedor** - Supplier-specific dashboard
- **DashboardEmpleado** - Employee-specific dashboard
- **DashboardStats** - Global statistics component

Dashboard selection is role-based in [src/pages/Dashboard.jsx](src/pages/Dashboard.jsx).

## Special Files

- **[.windsurfrules](.windsurfrules)**: AI coding assistant rules (treat as development standards)
- **Multiple versions of files**: Some components have `_old`, `_new`, `_final` suffixes indicating evolution
- **Test pages**: TestPage and TestPdfPage available for debugging

## Testing
No formal test framework is currently configured. Manual testing recommended for:
- Permission flows (test with different role users)
- Mobile responsiveness (especially image uploads)
- PDF generation with different data sets
- Offline behavior (PWA mode)
- Different user types (empleado vs proveedor workflows)
