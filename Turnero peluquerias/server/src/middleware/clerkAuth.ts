import { clerkMiddleware, requireAuth as clerkRequireAuth, getAuth } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';

/**
 * Inicializa Clerk en cada request.
 * Agrega req.auth con userId, sessionId, etc. si hay sesión activa.
 * No bloquea requests sin sesión (usar clerkAuth para eso).
 */
export const clerkInit = clerkMiddleware();

/**
 * Protege una ruta exigiendo sesión Clerk activa.
 * Devuelve 401 si el token es inválido o está ausente.
 * Usar en lugar de (o junto a) el JWT propio de la app.
 */
export const clerkAuth = clerkRequireAuth();

/**
 * Helper para obtener el userId de Clerk desde un handler.
 * Retorna null si no hay sesión activa.
 */
export function getClerkUserId(req: Request): string | null {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

/**
 * Middleware combinado: acepta tokens Clerk O el JWT propio de la app.
 * Primero intenta Clerk, si falla busca el header Authorization Bearer.
 * Útil durante la migración gradual desde JWT a Clerk.
 */
export function hybridAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);

  if (auth?.userId) {
    console.log(`[Clerk] Request autenticada por Clerk. userId=${auth.userId}`);
    next();
    return;
  }

  // Si no hay sesión Clerk, continúa hacia el middleware JWT existente
  next();
}
