import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth, requireRole } from '../middleware/auth';
import { hybridAuth } from '../middleware/clerkAuth';

const router = Router();

const ALLOWED_KEYS = ['nombre', 'logo', 'color', 'cancellation_hours', 'descripcion'];

async function fetchConfig(negocioId: string | null): Promise<Record<string, string>> {
  const base = supabaseAdmin.from('shop_config').select('key, value');
  const { data } = await (negocioId ? base.eq('negocio_id', negocioId) : base.is('negocio_id', null));
  return Object.fromEntries((data ?? []).map(({ key, value }: { key: string; value: string }) => [key, value]));
}

router.get('/', async (req: Request, res: Response) => {
  const { negocioId } = req.query as { negocioId?: string };
  res.json(await fetchConfig(negocioId ?? null));
});

router.put('/', hybridAuth, requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const updates = req.body as Record<string, string>;
  const negocioId = req.user?.negocio_id ?? null;

  for (const [key, value] of Object.entries(updates)) {
    if (!ALLOWED_KEYS.includes(key)) continue;
    const val = String(value);
    if (negocioId) {
      await supabaseAdmin
        .from('shop_config')
        .upsert({ negocio_id: negocioId, key, value: val }, { onConflict: 'negocio_id,key' });
    } else {
      await supabaseAdmin
        .from('shop_config')
        .upsert({ key, value: val }, { onConflict: 'key' });
    }
  }

  res.json(await fetchConfig(negocioId));
});

export default router;
