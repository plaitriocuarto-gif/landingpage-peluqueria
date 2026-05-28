import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { data } = await supabaseAdmin.from('staff').select('*').eq('activo', 1).order('nombre');
  res.json(data ?? []);
});

router.get('/all', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const { data } = await supabaseAdmin.from('staff').select('*').order('nombre');
  res.json(data ?? []);
});

router.post('/', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const { nombre, avatar } = req.body as { nombre: string; avatar: string };
  if (!nombre) {
    res.status(400).json({ error: 'El nombre es requerido' });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('staff')
    .insert({ nombre, avatar: avatar ?? '', activo: 1 })
    .select()
    .single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

router.put('/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const { nombre, avatar, activo } = req.body as { nombre?: string; avatar?: string; activo?: number };
  const id = Number(req.params.id);

  const { data: existing } = await supabaseAdmin.from('staff').select('id').eq('id', id).maybeSingle();
  if (!existing) { res.status(404).json({ error: 'Empleado no encontrado' }); return; }

  const update: Record<string, unknown> = {};
  if (nombre !== undefined) update.nombre = nombre;
  if (avatar !== undefined) update.avatar = avatar;
  if (activo !== undefined) update.activo = activo;

  const { data, error } = await supabaseAdmin.from('staff').update(update).eq('id', id).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('staff')
    .update({ activo: 0 })
    .eq('id', Number(req.params.id))
    .select()
    .maybeSingle();
  if (error || !data) { res.status(404).json({ error: 'Empleado no encontrado' }); return; }
  res.json({ message: 'Empleado desactivado' });
});

router.get('/:id/schedule', async (req: Request, res: Response) => {
  const staffId = Number(req.params.id);
  const [{ data: schedules }, { data: exceptions }] = await Promise.all([
    supabaseAdmin.from('staff_schedules').select('*').eq('staff_id', staffId).order('dia_semana'),
    supabaseAdmin.from('staff_exceptions').select('*').eq('staff_id', staffId).order('fecha'),
  ]);
  res.json({ schedules: schedules ?? [], exceptions: exceptions ?? [] });
});

router.put('/:id/schedule', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const staffId = Number(req.params.id);
  const { schedules } = req.body as {
    schedules: Array<{ dia_semana: number; hora_inicio: string; hora_fin: string; slot_minutos: number }>;
  };
  if (!Array.isArray(schedules)) {
    res.status(400).json({ error: 'schedules debe ser un array' });
    return;
  }

  for (const s of schedules) {
    if (s.hora_inicio && s.hora_fin) {
      await supabaseAdmin.from('staff_schedules').upsert(
        { staff_id: staffId, dia_semana: s.dia_semana, hora_inicio: s.hora_inicio, hora_fin: s.hora_fin, slot_minutos: s.slot_minutos ?? 30 },
        { onConflict: 'staff_id,dia_semana' }
      );
    } else {
      await supabaseAdmin.from('staff_schedules').delete().eq('staff_id', staffId).eq('dia_semana', s.dia_semana);
    }
  }

  const { data } = await supabaseAdmin.from('staff_schedules').select('*').eq('staff_id', staffId);
  res.json(data ?? []);
});

router.post('/:id/exceptions', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const staffId = Number(req.params.id);
  const { fecha, tipo, hora_inicio, hora_fin, motivo } = req.body as {
    fecha: string; tipo: 'libre' | 'horario_especial'; hora_inicio?: string; hora_fin?: string; motivo?: string;
  };
  if (!fecha || !tipo) {
    res.status(400).json({ error: 'fecha y tipo son requeridos' });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('staff_exceptions')
    .insert({ staff_id: staffId, fecha, tipo, hora_inicio: hora_inicio ?? null, hora_fin: hora_fin ?? null, motivo: motivo ?? null })
    .select()
    .single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

router.delete('/:id/exceptions/:exId', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('staff_exceptions')
    .delete()
    .eq('id', Number(req.params.exId))
    .eq('staff_id', Number(req.params.id))
    .select()
    .maybeSingle();
  if (error || !data) { res.status(404).json({ error: 'Excepción no encontrada' }); return; }
  res.json({ message: 'Excepción eliminada' });
});

export default router;
