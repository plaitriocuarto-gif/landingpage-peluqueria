import { Router, Request, Response } from 'express';
import db from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT key, value FROM shop_config').all() as Array<{
    key: string;
    value: string;
  }>;

  const config: Record<string, string> = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }

  res.json(config);
});

router.put('/', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const updates = req.body as Record<string, string>;

  const allowed = ['nombre', 'logo', 'color', 'cancellation_hours', 'descripcion'];

  const upsert = db.prepare(
    'INSERT OR REPLACE INTO shop_config (key, value) VALUES (?, ?)'
  );

  db.exec('BEGIN');
  try {
    for (const [key, value] of Object.entries(updates)) {
      if (allowed.includes(key)) {
        upsert.run(key, String(value));
      }
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const rows = db.prepare('SELECT key, value FROM shop_config').all() as Array<{
    key: string;
    value: string;
  }>;

  const config: Record<string, string> = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }

  res.json(config);
});

export default router;
