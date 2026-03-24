# Technology Stack

## Frontend Framework
- **React 18** with JSX
- **Vite** as build tool and dev server
- **React Router DOM** for client-side routing
- **TailwindCSS** for styling with PostCSS

## Backend & Database
- **Supabase** for backend-as-a-service
  - PostgreSQL database
  - Authentication & authorization
  - Row Level Security (RLS)
  - Real-time subscriptions

## Key Libraries
- **@supabase/supabase-js** - Database client
- **@headlessui/react** + **@heroicons/react** - UI components
- **react-hot-toast** - Notifications
- **jspdf** + **jspdf-autotable** - PDF generation
- **xlsx** - Excel export/import
- **date-fns** - Date manipulation
- **qrcode.react** - QR code generation
- **@emailjs/browser** - Email integration

## Development Tools
- **ESLint** for code linting
- **Supabase CLI** for database management

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Database Management
```bash
supabase start       # Start local Supabase
supabase db reset    # Reset local database
supabase db push     # Push migrations to remote
supabase gen types typescript --local  # Generate TypeScript types
```

## Environment Variables
Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key