import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Hardcoded corsHeaders to avoid relative path import issues during deployment
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

console.log('Delete User Edge Function Initializing');

async function checkAdminPermissions(supabaseAdmin: SupabaseClient, callerUserId: string): Promise<boolean> {
  const { data: userRoles, error: rolesError } = await supabaseAdmin
    .from('usuarios_roles')
    .select('roles!inner(nombre)') // Asegúrate que 'roles' es el nombre de tu tabla de roles y 'nombre' la columna del nombre del rol
    .eq('user_id', callerUserId); // Asumiendo que user_id en usuarios_roles es el auth.users.id

  if (rolesError) {
    console.error('Error fetching user roles for permission check:', rolesError);
    // Considera esto como falta de permisos en lugar de lanzar un error general
    // si la consulta falla por no encontrar roles, etc.
    return false;
  }

  if (!userRoles || userRoles.length === 0) {
    console.log(`No roles found for user ${callerUserId}`);
    return false;
  }

  // Asegúrate que la estructura de userRoles y r.roles.nombre es correcta
  // Ejemplo: userRoles = [{ roles: { nombre: 'SuperAdmin' } }]
  const isAdmin = userRoles.some(
    (r: any) => r.roles && (r.roles.nombre === 'SuperAdmin' || r.roles.nombre === 'administrador')
  );
  console.log(`User ${callerUserId} isAdmin: ${isAdmin}`);
  return isAdmin;
}

serve(async (req: Request) => {
  console.log('Delete User Edge Function Invoked');
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      console.warn('Authorization header missing');
      return new Response(JSON.stringify({ error: 'Authorization header is missing.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authorization.replace('Bearer ', '');
    const { data: { user: callerUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !callerUser) {
      console.error('Error getting caller user or invalid token:', userError);
      return new Response(JSON.stringify({ error: 'Authentication failed or invalid token.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    console.log(`Caller user ID: ${callerUser.id}`);

    const hasPermission = await checkAdminPermissions(supabaseAdmin, callerUser.id);
    if (!hasPermission) {
      console.warn(`User ${callerUser.id} attempted delete without sufficient permissions.`);
      return new Response(JSON.stringify({ error: 'Permission denied. Admin role required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const body = await req.json();
    const { userIdToDelete } = body;

    if (!userIdToDelete) {
      console.warn('userIdToDelete is missing from request body');
      return new Response(JSON.stringify({ error: 'userIdToDelete is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    console.log(`Attempting to delete user ID: ${userIdToDelete}`);

    // Paso 1: Eliminar de usuarios_roles
    // Esto asume que 'user_id' en 'usuarios_roles' es el auth.users.id
    console.log(`Deleting from usuarios_roles for user: ${userIdToDelete}`);
    const { error: deleteUsuariosRolesError } = await supabaseAdmin
      .from('usuarios_roles')
      .delete()
      .eq('user_id', userIdToDelete);
    if (deleteUsuariosRolesError) {
      console.error('Error deleting from usuarios_roles:', deleteUsuariosRolesError.message);
      // No necesariamente un error fatal, podría no tener roles o la tabla podría estar vacía para ese usuario.
    }

    // Paso 2: Eliminar de la tabla public.usuarios
    // Esto asume que 'user_id' en 'usuarios' es el auth.users.id
    console.log(`Deleting from usuarios for user: ${userIdToDelete}`);
    const { error: deleteUsuariosError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('user_id', userIdToDelete);
    if (deleteUsuariosError) {
      console.error('Error deleting from usuarios:', deleteUsuariosError.message);
      // Podría ser un error si se espera que cada auth.user tenga una entrada aquí.
    }

    // Step 3: Delete from 'empleados' table if a link exists.
    console.log(`Attempting to delete link for user ${userIdToDelete} from 'empleados' table.`);
    const { error: empleadoError } = await supabaseAdmin
      .from('empleados')
      .delete()
      .eq('user_id', userIdToDelete);

    if (empleadoError) {
      // Log the error but don't stop the process. The FK violation is what we're trying to prevent.
      console.warn(`Warning when deleting from 'empleados':`, empleadoError.message);
    }

    // Step 4: Delete from 'proveedores' table if a link exists.
    console.log(`Attempting to delete link for user ${userIdToDelete} from 'proveedores' table.`);
    const { error: proveedorError } = await supabaseAdmin
      .from('proveedores')
      .delete()
      .eq('user_id', userIdToDelete);

    if (proveedorError) {
      console.warn(`Warning when deleting from 'proveedores':`, proveedorError.message);
    }

    // Final Step: Delete the user from auth
    console.log(`Attempting to delete user ${userIdToDelete} from auth.users.`);
    const { data: deleteAuthUserResponse, error: deleteAuthUserError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (deleteAuthUserError) {
      console.error('Error deleting user from auth.users:', deleteAuthUserError.message);
      return new Response(JSON.stringify({ error: `Failed to delete user from auth: ${deleteAuthUserError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`User ${userIdToDelete} deleted successfully.`);
    return new Response(JSON.stringify({ message: 'User deleted successfully.', user: deleteAuthUserResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('General error in delete-user function:', error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
