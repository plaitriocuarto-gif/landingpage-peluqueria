import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/**
 * Cliente del frontend con ANON_KEY.
 * Respeta Row Level Security.
 * Usar para queries del lado del cliente.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
