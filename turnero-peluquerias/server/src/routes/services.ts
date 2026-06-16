import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth, requireRole } from '../middleware/auth';
import { hybridAuth } from '../middleware/clerkAuth';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { negocioId } = req.query as { negocioId?: string };
  const base = supabaseAdmin.from('services').select('*').eq('activo', 1);
  const { data } = await (negocioId ? base.eq('negocio_id', negocioId) : base).order('nombre');
  res.json(data ?? []);
});

router.get('/all', hybridAuth, requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const negocioId = req.user?.negocio_id;
  const base = supabaseAdmin.from('services').select('*');
  const { data } = await (negocioId ? base.eq('negocio_id', negocioId) : base).order('nombre');
  res.json(data ?? []);
});

router.post('/', hybridAuth, requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const { nombre, duracion_minutos, precio } = req.body as { nombre: string; duracion_minutos: number; precio: number };
  if (!nombre || !duracion_minutos || precio === undefined) {
    res.status(400).json({ error: 'nombre, duracion_minutos y precio son requeridos' });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('services')
    .insert({ nombre, duracion_minutos, precio, activo: 1, negocio_id: req.user?.negocio_id ?? null })
    .select()
    .single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

router.put('/:id', hybridAuth, requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const { nombre, duracion_minutos, precio, activo } = req.body as {
    nombre?: string; duracion_minutos?: number; precio?: number; activo?: number;
  };
  const id = Number(req.params.id);
  const negocioId = req.user?.negocio_id;

  const existsBase = supabaseAdmin.from('services').select('id').eq('id', id);
  const { data: existing } = await (negocioId ? existsBase.eq('negocio_id', negocioId) : existsBase).maybeSingle();
  if (!existing) { res.status(404).json({ error: 'Servicio no encontrado' }); return; }

  const update: Record<string, unknown> = {};
  if (nombre !== undefined) update.nombre = nombre;
  if (duracion_minutos !== undefined) update.duracion_minutos = duracion_minutos;
  if (precio !== undefined) update.precio = precio;
  if (activo !== undefined) update.activo = activo;

  const { data, error } = await supabaseAdmin.from('services').update(update).eq('id', id).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.delete('/:id', hybridAuth, requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const negocioId = req.user?.negocio_id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabaseAdmin.from('services').update({ activo: 0 }).eq('id', id);
  if (negocioId) query = query.eq('negocio_id', negocioId);
  const { data, error } = await query.select().maybeSingle();
  if (error || !data) { res.status(404).json({ error: 'Servicio no encontrado' }); return; }
  res.json({ message: 'Servicio desactivado' });
});

export default router;
