import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Variables de entorno (asegúrate de que estén configuradas en Supabase)
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Función para verificar si el usuario es Administrador o SuperAdmin
async function isAdminOrSuperAdmin(supabaseClient: any, userId: string): Promise<boolean> {
  if (!userId) return false;

  const { data: userRoles, error: rolesError } = await supabaseClient
    .from('usuarios_roles')
    .select('roles(nombre)') // Asegúrate que la relación se llame 'roles' y la tabla referenciada tenga 'nombre'
    .eq('user_id', userId);

  if (rolesError) {
    console.error('Error fetching user roles:', rolesError);
    return false;
  }

  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  const roles = userRoles.map((ur: any) => ur.roles?.nombre?.toLowerCase()).filter(Boolean);
  return roles.includes('superadmin') || roles.includes('administrador');
}

serve(async (req: Request) => {
  // Headers CORS para todas las respuestas
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };

  // Manejo de CORS para solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase URL or Service Role Key not configured.');
    }

    // Crear cliente de Supabase con la service_role_key para operaciones de admin
    const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Obtener el token de autorización del header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });
    }
    const token = authHeader.replace('Bearer ', '');

    // Obtener el usuario que realiza la solicitud a partir del token
    // Es importante usar la anon key aquí para obtener el usuario autenticado, no el service role
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!anonKey) {
        throw new Error('Supabase Anon Key not configured.');
    }
    const supabaseUserClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user: requestingUser }, error: userError } = await supabaseUserClient.auth.getUser();

    if (userError || !requestingUser) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });
    }

    // Verificar si el usuario que realiza la solicitud es admin o superadmin
    // Usamos supabaseAdminClient para esta consulta ya que necesitamos acceso a la tabla usuarios_roles
    const canResetPassword = await isAdminOrSuperAdmin(supabaseAdminClient, requestingUser.id);
    if (!canResetPassword) {
      return new Response(JSON.stringify({ error: 'Permission denied. User is not authorized to reset passwords.' }), {
        status: 403,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });
    }

    // Parsear el cuerpo de la solicitud
    const { userIdToReset, newPassword } = await req.json();

    if (!userIdToReset || !newPassword) {
      return new Response(JSON.stringify({ error: 'Missing userIdToReset or newPassword in request body' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters long' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });
    }

    // Restablecer la contraseña del usuario objetivo usando el cliente admin
    const { data: updatedUser, error: updateError } = await supabaseAdminClient.auth.admin.updateUserById(
      userIdToReset,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error resetting password:', updateError);
      return new Response(JSON.stringify({ error: updateError.message || 'Failed to reset password' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });
    }

    return new Response(JSON.stringify({ message: 'Password reset successfully', user: updatedUser }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json', 
        ...corsHeaders
      },
    });

  } catch (error) {
    console.error('Main error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json', 
        ...corsHeaders
      },
    });
  }
});
