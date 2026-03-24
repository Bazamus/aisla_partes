// supabase/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // O tu dominio específico en producción
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE', // Asegúrate de incluir todos los métodos que usas
};
