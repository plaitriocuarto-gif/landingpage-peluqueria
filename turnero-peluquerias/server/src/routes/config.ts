import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth, requireRole } from '../middleware/auth';
import { hybridAuth } from '../middleware/clerkAuth';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { data } = await supabaseAdmin.from('shop_config').select('key, value');
  const config: Record<string, string> = {};
  for (const row of data ?? []) {
    config[row.key] = row.value;
  }
  res.json(config);
});

router.put('/', hybridAuth, requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const updates = req.body as Record<string, string>;
  const allowed = ['nombre', 'logo', 'color', 'cancellation_hours', 'descripcion'];

  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      await supabaseAdmin
        .from('shop_config')
        .upsert({ key, value: String(value) }, { onConflict: 'key' });
    }
  }

  const { data } = await supabaseAdmin.from('shop_config').select('key, value');
  const config: Record<string, string> = {};
  for (const row of data ?? []) {
    config[row.key] = row.value;
  }
  res.json(config);
});

export default router;
