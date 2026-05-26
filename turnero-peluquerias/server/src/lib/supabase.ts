import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.warn('[Supabase] Variables de entorno no configuradas. Las funciones de Supabase no estarán disponibles.');
}

/**
 * Cliente del servidor con SERVICE_ROLE_KEY.
 * Bypasea Row Level Security — usar solo en el backend.
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('[Supabase] Cliente admin inicializado:', SUPABASE_URL);
