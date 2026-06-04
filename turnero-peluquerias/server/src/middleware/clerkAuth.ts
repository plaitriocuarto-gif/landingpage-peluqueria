import { clerkMiddleware, requireAuth as clerkRequireAuth, getAuth } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export const clerkInit = process.env.CLERK_SECRET_KEY
  ? clerkMiddleware()
  : (_req: Request, _res: Response, next: NextFunction) => next();

export const clerkAuth = clerkRequireAuth();

export function getClerkUserId(req: Request): string | null {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

/**
 * Acepta tokens Clerk (admins) o JWT propio (staff/clientes).
 * Si el request viene con sesión Clerk válida, busca el usuario admin
 * en Supabase y setea req.user para que requireRole() funcione igual.
 * Si no hay sesión Clerk, pasa al siguiente middleware (que debe ser requireAuth).
 */
export async function hybridAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);

  if (!auth?.userId) {
    next();
    return;
  }

  try {
    // Buscar el negocio por clerk_user_id para obtener el gmail del admin
    const { data: negocio } = await supabaseAdmin
      .from('negocios')
      .select('gmail')
      .eq('clerk_user_id', auth.userId)
      .maybeSingle();

    if (!negocio?.gmail) {
      res.status(401).json({ error: 'Sesión Clerk válida pero negocio no encontrado' });
      return;
    }

    // Buscar el usuario en la tabla users para obtener el id interno
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, nombre, rol')
      .eq('email', negocio.gmail)
      .maybeSingle();

    if (!user) {
      res.status(401).json({ error: 'Usuario admin no encontrado en el sistema' });
      return;
    }

    req.user = { id: user.id as number, email: user.email as string, rol: user.rol as string };
    next();
  } catch (err) {
    console.error('[hybridAuth] Error buscando usuario por Clerk ID:', err);
    res.status(500).json({ error: 'Error interno de autenticación' });
  }
}
