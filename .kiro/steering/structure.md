# Project Structure

## Root Directory
- **src/** - Main application source code
- **supabase/** - Database migrations, functions, and config
- **public/** - Static assets (logos, templates)
- **docs/** - Project documentation
- **sql/** - Database scripts and queries (root level)
- **dist/** - Production build output

## Source Code Organization (`src/`)

### Core Application
- **App.jsx** - Main app component with routing
- **main.jsx** - Application entry point
- **supabaseClient.js** - Supabase client configuration

### Feature-Based Structure
- **pages/** - Route components (Dashboard, Login, etc.)
- **components/** - Reusable UI components
  - **auth/** - Authentication components
  - **common/** - Shared components
  - **partes-empleados/** - Employee work order components
  - **partes-proveedores/** - Supplier work order components
  - **admin/** - Admin-specific components
- **contexts/** - React contexts (AuthContext)
- **services/** - API service layers
- **hooks/** - Custom React hooks
- **utils/** - Utility functions and helpers

### Supporting Directories
- **styles/** - CSS files and styling
- **assets/** - Images, icons, and static resources
- **templates/** - Document templates for exports
- **tests/** - Test files and utilities
- **lib/** - Third-party library configurations

## Database Structure (`supabase/`)
- **migrations/** - Database schema changes
- **functions/** - Edge functions
- **config.toml** - Supabase configuration

## Naming Conventions
- **Components**: PascalCase (e.g., `DashboardStats.jsx`)
- **Pages**: PascalCase (e.g., `NuevoParte.jsx`)
- **Services**: camelCase (e.g., `parteService.js`)
- **Utils**: camelCase (e.g., `dateUtils.js`)
- **SQL files**: snake_case (e.g., `crear_usuario_completo.sql`)

## Key Architectural Patterns
- **Protected Routes**: Role-based access control
- **Service Layer**: Separation of API logic from components
- **Context Pattern**: Global state management (Auth)
- **Component Composition**: Reusable UI building blocks