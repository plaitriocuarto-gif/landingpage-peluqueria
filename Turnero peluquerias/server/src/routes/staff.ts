import { Router, Request, Response } from 'express';
import db from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const staff = db.prepare('SELECT * FROM staff WHERE activo = 1 ORDER BY nombre').all();
  res.json(staff);
});

router.get('/all', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const staff = db.prepare('SELECT * FROM staff ORDER BY nombre').all();
  res.json(staff);
});

router.post('/', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const { nombre, avatar } = req.body as { nombre: string; avatar: string };

  if (!nombre) {
    res.status(400).json({ error: 'El nombre es requerido' });
    return;
  }

  const result = db
    .prepare('INSERT INTO staff (nombre, avatar, activo) VALUES (?, ?, 1)')
    .run(nombre, avatar ?? '✂️');

  const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json(staff);
});

router.put('/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const { nombre, avatar, activo } = req.body as {
    nombre?: string;
    avatar?: string;
    activo?: number;
  };

  const existing = db.prepare('SELECT id FROM staff WHERE id = ?').get(Number(req.params.id));
  if (!existing) {
    res.status(404).json({ error: 'Empleado no encontrado' });
    return;
  }

  db.prepare('UPDATE staff SET nombre = COALESCE(?, nombre), avatar = COALESCE(?, avatar), activo = COALESCE(?, activo) WHERE id = ?').run(
    nombre ?? null,
    avatar ?? null,
    activo ?? null,
    Number(req.params.id)
  );

  const updated = db.prepare('SELECT * FROM staff WHERE id = ?').get(Number(req.params.id));
  res.json(updated);
});

router.delete('/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const result = db
    .prepare('UPDATE staff SET activo = 0 WHERE id = ?')
    .run(Number(req.params.id));

  if (result.changes === 0) {
    res.status(404).json({ error: 'Empleado no encontrado' });
    return;
  }

  res.json({ message: 'Empleado desactivado' });
});

router.get('/:id/schedule', (req: Request, res: Response) => {
  const schedules = db
    .prepare('SELECT * FROM staff_schedules WHERE staff_id = ? ORDER BY dia_semana')
    .all(Number(req.params.id));

  const exceptions = db
    .prepare('SELECT * FROM staff_exceptions WHERE staff_id = ? ORDER BY fecha')
    .all(Number(req.params.id));

  res.json({ schedules, exceptions });
});

router.put('/:id/schedule', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const staffId = Number(req.params.id);
  const { schedules } = req.body as {
    schedules: Array<{
      dia_semana: number;
      hora_inicio: string;
      hora_fin: string;
      slot_minutos: number;
    }>;
  };

  if (!Array.isArray(schedules)) {
    res.status(400).json({ error: 'schedules debe ser un array' });
    return;
  }

  const upsert = db.prepare(`
    INSERT INTO staff_schedules (staff_id, dia_semana, hora_inicio, hora_fin, slot_minutos)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(staff_id, dia_semana) DO UPDATE SET
      hora_inicio = excluded.hora_inicio,
      hora_fin = excluded.hora_fin,
      slot_minutos = excluded.slot_minutos
  `);

  const deleteDay = db.prepare(
    'DELETE FROM staff_schedules WHERE staff_id = ? AND dia_semana = ?'
  );

  db.exec('BEGIN');
  try {
    for (const s of schedules) {
      if (s.hora_inicio && s.hora_fin) {
        upsert.run(staffId, s.dia_semana, s.hora_inicio, s.hora_fin, s.slot_minutos ?? 30);
      } else {
        deleteDay.run(staffId, s.dia_semana);
      }
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const updated = db.prepare('SELECT * FROM staff_schedules WHERE staff_id = ?').all(staffId);
  res.json(updated);
});

router.post('/:id/exceptions', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const staffId = Number(req.params.id);
  const { fecha, tipo, hora_inicio, hora_fin, motivo } = req.body as {
    fecha: string;
    tipo: 'libre' | 'horario_especial';
    hora_inicio?: string;
    hora_fin?: string;
    motivo?: string;
  };

  if (!fecha || !tipo) {
    res.status(400).json({ error: 'fecha y tipo son requeridos' });
    return;
  }

  const result = db
    .prepare('INSERT INTO staff_exceptions (staff_id, fecha, tipo, hora_inicio, hora_fin, motivo) VALUES (?, ?, ?, ?, ?, ?)')
    .run(staffId, fecha, tipo, hora_inicio ?? null, hora_fin ?? null, motivo ?? null);

  const exception = db
    .prepare('SELECT * FROM staff_exceptions WHERE id = ?')
    .get(Number(result.lastInsertRowid));

  res.status(201).json(exception);
});

router.delete('/:id/exceptions/:exId', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const result = db
    .prepare('DELETE FROM staff_exceptions WHERE id = ? AND staff_id = ?')
    .run(Number(req.params.exId), Number(req.params.id));

  if (result.changes === 0) {
    res.status(404).json({ error: 'Excepción no encontrada' });
    return;
  }

  res.json({ message: 'Excepción eliminada' });
});

export default router;
