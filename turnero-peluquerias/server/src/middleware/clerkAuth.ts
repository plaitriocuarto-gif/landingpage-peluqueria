import { clerkMiddleware, requireAuth as clerkRequireAuth, getAuth, createClerkClient } from '@clerk/express';
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

// Busca el negocio primero por clerk_user_id (rápido), luego por email via Clerk API
// (fallback para cuentas creadas antes de integrar Clerk). Si lo encuentra por email,
// actualiza clerk_user_id en Supabase para que los próximos requests sean directos.
async function resolveNegocioByClerk(userId: string): Promise<{ id: string; gmail: string } | null> {
  const { data: byId } = await supabaseAdmin
    .from('negocios')
    .select('id, gmail')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (byId) return byId;

  if (!process.env.CLERK_SECRET_KEY) return null;

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const clerkUser = await clerk.users.getUser(userId);
  const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;

  if (!email) return null;

  const { data: byEmail } = await supabaseAdmin
    .from('negocios')
    .select('id, gmail')
    .eq('gmail', email)
    .eq('estado', 'activo')
    .maybeSingle();

  if (byEmail) {
    // Reparar el vínculo para evitar este lookup en el futuro
    void supabaseAdmin.from('negocios').update({ clerk_user_id: userId }).eq('id', byEmail.id);
    console.log(`[hybridAuth] clerk_user_id vinculado para negocio ${byEmail.id}`);
  }

  return byEmail ?? null;
}

export async function hybridAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);

  if (!auth?.userId) {
    next();
    return;
  }

  try {
    const negocio = await resolveNegocioByClerk(auth.userId);

    if (!negocio) {
      console.warn(`[hybridAuth] userId=${auth.userId} no tiene negocio vinculado en Supabase`);
      res.status(403).json({ error: 'Sesión Clerk válida pero negocio no encontrado' });
      return;
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, nombre, rol')
      .eq('email', negocio.gmail)
      .maybeSingle();

    req.user = {
      id: (user?.id as number) ?? 0,
      email: (user?.email as string) ?? negocio.gmail,
      rol: (user?.rol as string) ?? 'admin',
      negocio_id: negocio.id as string,
    };
    next();
  } catch (err) {
    console.error('[hybridAuth] Error:', err);
    res.status(500).json({ error: 'Error interno de autenticación' });
  }
}
