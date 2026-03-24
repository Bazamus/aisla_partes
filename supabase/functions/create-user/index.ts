import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0'

// --- DEBUG: Agregamos logs detallados ---
console.log('Function create-user starting up...');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function isCallerAdmin(supabaseClient: SupabaseClient): Promise<boolean> {
  console.log('DEBUG: Running isCallerAdmin check...');
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

  if (userError) {
    console.error('DEBUG: Error getting user from token:', userError.message);
    return false;
  }
  if (!user) {
    console.error('DEBUG: No user found for the provided token.');
    return false;
  }
  console.log(`DEBUG: User ID from token is ${user.id}`);

  const { data, error } = await supabaseClient
    .from('usuarios_roles')
    .select('roles(nombre)')
    .eq('user_id', user.id);

  if (error) {
    console.error('DEBUG: Error fetching roles for user:', error.message);
    console.error(`DEBUG: Hint: Check RLS policies on 'usuarios_roles' and 'roles' tables.`);
    return false;
  }

  if (!data) {
    console.error('DEBUG: Role query returned no data.');
    return false;
  }
  console.log('DEBUG: Raw roles data from DB:', JSON.stringify(data));

  const userRoles = data.map((r) => r.roles?.nombre).filter(Boolean);
  console.log('DEBUG: Parsed user roles:', userRoles);

  const isAdmin = userRoles.includes('Administrador') || userRoles.includes('SuperAdmin');
  console.log(`DEBUG: Is user admin? ${isAdmin}`);

  return isAdmin;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    console.log('DEBUG: Handling OPTIONS preflight request.');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('DEBUG: Entered main try block.');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header.');
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    console.log('DEBUG: Supabase clients created.');

    const isAdmin = await isCallerAdmin(supabaseUser);
    if (!isAdmin) {
      throw new Error('Not authorized: Caller is not an admin according to isCallerAdmin function.');
    }
    console.log('DEBUG: Admin check passed.');

    const body = await req.json();
    console.log('DEBUG: Request body:', JSON.stringify(body));
    const { email, password, roleIds, linkTo, userType } = body;

    if (!email || !password || !roleIds || roleIds.length === 0) {
        throw new Error('Missing required fields: email, password, and at least one roleId.');
    }

    console.log('DEBUG: Creating user in auth.users...');
    const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: false,
    });

    if (createError) {
      // Log the detailed error from Supabase before throwing
      console.error('DEBUG: Raw error from supabase.auth.admin.createUser:', createError);
      throw createError;
    }
    const newUserId = newAuthUser.user.id;
    console.log(`DEBUG: User created successfully with ID: ${newUserId}`);

    console.log('DEBUG: Explicitly setting email_confirmed_at...');
    const { error: updateConfirmEmailError } = await supabaseAdmin.auth.admin.updateUserById(
      newUserId,
      { email_confirmed_at: new Date().toISOString() }
    );

    if (updateConfirmEmailError) {
      console.error('DEBUG: Raw error from supabase.auth.admin.updateUserById (email_confirmed_at):', updateConfirmEmailError);
      // Aunque esto falle, el usuario ya está creado. Podríamos decidir continuar o lanzar error.
      // Por ahora, lanzaremos un error para ser conscientes de ello.
      throw updateConfirmEmailError;
    }
    console.log('DEBUG: email_confirmed_at set successfully.');

    console.log('DEBUG: Assigning roles...');
    const rolesToInsert = roleIds.map((roleId) => ({ user_id: newUserId, rol_id: roleId }));
    const { error: rolesError } = await supabaseAdmin.from('usuarios_roles').insert(rolesToInsert);
    if (rolesError) {
      console.error('DEBUG: Raw error from supabase.from(usuarios_roles).insert:', rolesError);
      throw rolesError;
    }
    console.log('DEBUG: Roles assigned successfully.');

    if (linkTo && (userType === 'empleado' || userType === 'proveedor')) {
      const tableToUpdate = userType === 'empleado' ? 'empleados' : 'proveedores';
      console.log(`DEBUG: Linking user to ${tableToUpdate} with ID ${linkTo.id}`);
      const { error: linkError } = await supabaseAdmin
        .from(tableToUpdate)
        .update({ user_id: newUserId })
        .eq('id', linkTo.id);

      if (linkError) {
        console.error(`DEBUG: Raw error from linking to ${tableToUpdate}:`, linkError);
        throw linkError;
      }
      console.log('DEBUG: Link successful.');
    }

    console.log('DEBUG: Process completed successfully!');
    return new Response(JSON.stringify({ user: newAuthUser.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('--- DEBUG: CATCH BLOCK TRIGGERED ---');
    // Log the full error object for maximum detail
    console.error('DEBUG: Full error object caught:', error);
    console.error('------------------------------------');
    return new Response(JSON.stringify({ 
      error: "Edge function execution failed.",
      message: error.message,
      details: error.details || null,
      hint: error.hint || null,
      code: error.code || null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, 
    });
  }
});
