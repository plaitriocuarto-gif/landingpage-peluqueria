import { Router, Request, Response } from 'express';
import db from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const services = db
    .prepare('SELECT * FROM services WHERE activo = 1 ORDER BY nombre')
    .all();
  res.json(services);
});

router.get('/all', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const services = db.prepare('SELECT * FROM services ORDER BY nombre').all();
  res.json(services);
});

router.post('/', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const { nombre, duracion_minutos, precio } = req.body as {
    nombre: string;
    duracion_minutos: number;
    precio: number;
  };

  if (!nombre || !duracion_minutos || precio === undefined) {
    res.status(400).json({ error: 'nombre, duracion_minutos y precio son requeridos' });
    return;
  }

  const result = db
    .prepare('INSERT INTO services (nombre, duracion_minutos, precio, activo) VALUES (?, ?, ?, 1)')
    .run(nombre, duracion_minutos, precio);

  const service = db
    .prepare('SELECT * FROM services WHERE id = ?')
    .get(Number(result.lastInsertRowid));

  res.status(201).json(service);
});

router.put('/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const { nombre, duracion_minutos, precio, activo } = req.body as {
    nombre?: string;
    duracion_minutos?: number;
    precio?: number;
    activo?: number;
  };

  const existing = db.prepare('SELECT id FROM services WHERE id = ?').get(Number(req.params.id));
  if (!existing) {
    res.status(404).json({ error: 'Servicio no encontrado' });
    return;
  }

  db.prepare(`
    UPDATE services SET
      nombre = COALESCE(?, nombre),
      duracion_minutos = COALESCE(?, duracion_minutos),
      precio = COALESCE(?, precio),
      activo = COALESCE(?, activo)
    WHERE id = ?
  `).run(
    nombre ?? null,
    duracion_minutos ?? null,
    precio ?? null,
    activo ?? null,
    Number(req.params.id)
  );

  const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(Number(req.params.id));
  res.json(updated);
});

router.delete('/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const result = db
    .prepare('UPDATE services SET activo = 0 WHERE id = ?')
    .run(Number(req.params.id));

  if (result.changes === 0) {
    res.status(404).json({ error: 'Servicio no encontrado' });
    return;
  }

  res.json({ message: 'Servicio desactivado' });
});

export default router;
