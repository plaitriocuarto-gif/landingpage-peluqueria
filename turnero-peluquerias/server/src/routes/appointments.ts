import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth, requireRole } from '../middleware/auth';
import { hybridAuth } from '../middleware/clerkAuth';
import { sendConfirmacion } from '../lib/email';

const router = Router();

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenAppointment(row: any) {
  const { users, staff, services, ...base } = row;
  return {
    ...base,
    client_nombre: base.guest_nombre ?? users?.nombre ?? null,
    client_email: users?.email ?? null,
    staff_nombre: staff?.nombre ?? null,
    staff_avatar: staff?.avatar ?? null,
    service_nombre: services?.nombre ?? null,
    service_precio: services?.precio ?? null,
    duracion_minutos: services?.duracion_minutos ?? null,
  };
}

async function fetchService(serviceId: number) {
  const { data } = await supabaseAdmin
    .from('services')
    .select('duracion_minutos, nombre, precio')
    .eq('id', serviceId)
    .eq('activo', 1)
    .maybeSingle();
  return data as { duracion_minutos: number; nombre: string; precio: number } | null;
}

async function hasConflict(staffId: number, fecha: string, horaInicio: string, horaFin: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('staff_id', staffId)
    .eq('fecha', fecha)
    .neq('estado', 'cancelado')
    .lt('hora_inicio', horaFin)
    .gt('hora_fin', horaInicio)
    .maybeSingle();
  return !!data;
}

async function getShopName(negocioId?: string): Promise<string> {
  if (negocioId) {
    const { data } = await supabaseAdmin
      .from('negocios')
      .select('nombre_negocio')
      .eq('id', negocioId)
      .maybeSingle();
    if (data?.nombre_negocio) return data.nombre_negocio as string;
  }
  const { data: configRows } = await supabaseAdmin.from('shop_config').select('key, value').is('negocio_id', null);
  return configRows?.find((r: { key: string; value: string }) => r.key === 'nombre')?.value ?? 'Peluquería';
}

router.get('/available', async (req: Request, res: Response) => {
  const { staffId, date, serviceId, negocioId } = req.query as {
    staffId: string; date: string; serviceId: string; negocioId?: string;
  };

  if (!staffId || !date || !serviceId) {
    res.status(400).json({ error: 'staffId, date y serviceId son requeridos' });
    return;
  }

  if (negocioId) {
    const { data: staffRow } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('id', Number(staffId))
      .eq('negocio_id', negocioId)
      .maybeSingle();
    if (!staffRow) { res.json({ slots: [] }); return; }
  }

  const service = await fetchService(Number(serviceId));
  if (!service) { res.status(404).json({ error: 'Servicio no encontrado' }); return; }

  const dateObj = new Date(`${date}T12:00:00`);
  const dayOfWeek = dateObj.getDay();

  const { data: exception } = await supabaseAdmin
    .from('staff_exceptions')
    .select('tipo, hora_inicio, hora_fin')
    .eq('staff_id', Number(staffId))
    .eq('fecha', date)
    .maybeSingle();

  if (exception?.tipo === 'libre') { res.json({ slots: [] }); return; }

  let horaInicio: string;
  let horaFin: string;
  let slotMinutos: number;

  if (exception?.tipo === 'horario_especial') {
    horaInicio = exception.hora_inicio;
    horaFin = exception.hora_fin;
    const { data: sched } = await supabaseAdmin
      .from('staff_schedules')
      .select('slot_minutos')
      .eq('staff_id', Number(staffId))
      .eq('dia_semana', dayOfWeek)
      .maybeSingle();
    slotMinutos = sched?.slot_minutos ?? 30;
  } else {
    const { data: schedule } = await supabaseAdmin
      .from('staff_schedules')
      .select('hora_inicio, hora_fin, slot_minutos')
      .eq('staff_id', Number(staffId))
      .eq('dia_semana', dayOfWeek)
      .maybeSingle();
    if (!schedule) { res.json({ slots: [] }); return; }
    horaInicio = schedule.hora_inicio;
    horaFin = schedule.hora_fin;
    slotMinutos = schedule.slot_minutos;
  }

  const { data: booked } = await supabaseAdmin
    .from('appointments')
    .select('hora_inicio, hora_fin')
    .eq('staff_id', Number(staffId))
    .eq('fecha', date)
    .neq('estado', 'cancelado');

  const startMin = timeToMinutes(horaInicio);
  const endMin = timeToMinutes(horaFin);
  const duration = service.duracion_minutos;

  const bookedRanges = (booked ?? []).map((a) => ({
    start: timeToMinutes(a.hora_inicio),
    end: timeToMinutes(a.hora_fin),
  }));

  const slots: string[] = [];
  for (let slot = startMin; slot + duration <= endMin; slot += slotMinutos) {
    const slotEnd = slot + duration;
    const conflict = bookedRanges.some((r) => slot < r.end && slotEnd > r.start);
    if (!conflict) slots.push(minutesToTime(slot));
  }

  res.json({ slots });
});

router.post('/guest', async (req: Request, res: Response) => {
  const { nombre, apellido, email, staffId, serviceId, fecha, horaInicio, negocioId } = req.body as {
    nombre: string; apellido: string; email: string;
    staffId: number; serviceId: number; fecha: string; horaInicio: string;
    negocioId?: string;
  };

  if (!nombre?.trim() || !apellido?.trim() || !email?.trim() || !staffId || !serviceId || !fecha || !horaInicio) {
    res.status(400).json({ error: 'nombre, apellido, email, staffId, serviceId, fecha y horaInicio son requeridos' });
    return;
  }

  if (!email.includes('@') || !email.includes('.')) {
    res.status(400).json({ error: 'El email no es válido' });
    return;
  }

  const service = await fetchService(Number(serviceId));
  if (!service) { res.status(404).json({ error: 'Servicio no encontrado' }); return; }

  const horaFin = minutesToTime(timeToMinutes(horaInicio) + service.duracion_minutos);

  if (await hasConflict(Number(staffId), fecha, horaInicio, horaFin)) {
    res.status(409).json({ error: 'El horario ya está reservado' });
    return;
  }

  const { data: newAppt, error } = await supabaseAdmin
    .from('appointments')
    .insert({
      client_id: null,
      guest_nombre: `${nombre.trim()} ${apellido.trim()}`,
      guest_email: email.trim(),
      staff_id: Number(staffId),
      service_id: Number(serviceId),
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      estado: 'pendiente',
      negocio_id: negocioId ?? null,
    })
    .select(`*, staff:staff_id(nombre, avatar), services:service_id(nombre, precio, duracion_minutos)`)
    .single();

  if (error || !newAppt) { res.status(500).json({ error: 'Error al crear el turno' }); return; }

  const appt = flattenAppointment(newAppt);
  console.log(`[Appointments] Reserva invitado: ${nombre} ${apellido} | ${fecha} ${horaInicio} | ${appt.service_nombre}`);

  try {
    const shopName = await getShopName(negocioId);
    await sendConfirmacion({
      clienteEmail: email.trim(),
      clienteNombre: `${nombre.trim()} ${apellido.trim()}`,
      fecha,
      hora_inicio: horaInicio,
      servicio: appt.service_nombre ?? service.nombre,
      profesional: appt.staff_nombre ?? '',
      peluqueria: shopName,
      precio: appt.service_precio ?? service.precio,
    });
  } catch (err) {
    console.warn('[Appointments] No se pudo enviar email de confirmación:', err);
  }

  res.status(201).json(appt);
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { staffId, serviceId, fecha, horaInicio, nombre, apellido, email, negocioId } = req.body as {
    staffId: number; serviceId: number; fecha: string; horaInicio: string;
    nombre?: string; apellido?: string; email?: string; negocioId?: string;
  };

  if (!staffId || !serviceId || !fecha || !horaInicio) {
    res.status(400).json({ error: 'Datos incompletos' });
    return;
  }

  const service = await fetchService(Number(serviceId));
  if (!service) { res.status(404).json({ error: 'Servicio no encontrado' }); return; }

  const horaFin = minutesToTime(timeToMinutes(horaInicio) + service.duracion_minutos);

  if (await hasConflict(Number(staffId), fecha, horaInicio, horaFin)) {
    res.status(409).json({ error: 'El horario ya está reservado' });
    return;
  }

  const { data: newAppt, error } = await supabaseAdmin
    .from('appointments')
    .insert({
      client_id: req.user!.id,
      staff_id: Number(staffId),
      service_id: Number(serviceId),
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      estado: 'pendiente',
      negocio_id: negocioId ?? null,
    })
    .select(`*, staff:staff_id(nombre), services:service_id(nombre, precio)`)
    .single();

  if (error || !newAppt) { res.status(500).json({ error: 'Error al crear el turno' }); return; }

  const appt = flattenAppointment(newAppt);

  if (email?.includes('@')) {
    try {
      const shopName = await getShopName(negocioId);
      await sendConfirmacion({
        clienteEmail: email,
        clienteNombre: nombre ? `${nombre} ${apellido ?? ''}`.trim() : 'Cliente',
        fecha,
        hora_inicio: horaInicio,
        servicio: appt.service_nombre ?? service.nombre,
        profesional: appt.staff_nombre ?? '',
        peluqueria: shopName,
        precio: appt.service_precio ?? service.precio,
      });
    } catch (err) {
      console.warn('[Appointments] No se pudo enviar email de confirmación:', err);
    }
  }

  res.status(201).json(appt);
});

router.get('/my', requireAuth, async (req: Request, res: Response) => {
  const { data } = await supabaseAdmin
    .from('appointments')
    .select(`*, staff:staff_id(nombre, avatar), services:service_id(nombre, precio, duracion_minutos)`)
    .eq('client_id', req.user!.id)
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: false });

  res.json((data ?? []).map(flattenAppointment));
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const { data: appointment } = await supabaseAdmin
    .from('appointments')
    .select('fecha, hora_inicio, estado, negocio_id')
    .eq('id', Number(req.params.id))
    .eq('client_id', req.user!.id)
    .maybeSingle();

  if (!appointment) { res.status(404).json({ error: 'Turno no encontrado' }); return; }
  if (appointment.estado === 'cancelado') { res.status(400).json({ error: 'El turno ya está cancelado' }); return; }

  const negocioId = appointment.negocio_id as string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let configQuery: any = supabaseAdmin.from('shop_config').select('value').eq('key', 'cancellation_hours');
  if (negocioId) {
    configQuery = configQuery.eq('negocio_id', negocioId);
  } else {
    configQuery = configQuery.is('negocio_id', null);
  }
  const { data: configRow } = await configQuery.maybeSingle();

  const cancelHours = Number(configRow?.value ?? 2);
  const appointmentDateTime = new Date(`${appointment.fecha}T${appointment.hora_inicio}:00`);
  const limitDateTime = new Date(appointmentDateTime.getTime() - cancelHours * 60 * 60 * 1000);

  if (new Date() > limitDateTime) {
    res.status(400).json({ error: `No se puede cancelar con menos de ${cancelHours} hora(s) de anticipación` });
    return;
  }

  await supabaseAdmin.from('appointments').update({ estado: 'cancelado' }).eq('id', Number(req.params.id));
  res.json({ message: 'Turno cancelado exitosamente' });
});

router.get('/', hybridAuth, requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const { fecha, fechaInicio, fechaFin, staffId, estado } = req.query as {
    fecha?: string; fechaInicio?: string; fechaFin?: string; staffId?: string; estado?: string;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabaseAdmin
    .from('appointments')
    .select(`*, users:client_id(nombre, email), staff:staff_id(nombre, avatar), services:service_id(nombre, precio)`);

  const negocioId = req.user?.negocio_id;
  if (negocioId) query = query.eq('negocio_id', negocioId);
  if (fecha) query = query.eq('fecha', fecha);
  if (fechaInicio) query = query.gte('fecha', fechaInicio);
  if (fechaFin) query = query.lte('fecha', fechaFin);
  if (staffId) query = query.eq('staff_id', Number(staffId));
  if (estado) query = query.eq('estado', estado);

  query = query.order('fecha', { ascending: false }).order('hora_inicio', { ascending: true });

  const { data } = await query;
  res.json((data ?? []).map(flattenAppointment));
});

router.put('/:id/status', hybridAuth, requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const { estado } = req.body as { estado: string };
  const validStates = ['pendiente', 'confirmado', 'cancelado', 'completado'];
  if (!validStates.includes(estado)) { res.status(400).json({ error: 'Estado inválido' }); return; }

  const negocioId = req.user?.negocio_id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabaseAdmin
    .from('appointments')
    .update({ estado })
    .eq('id', Number(req.params.id));
  if (negocioId) query = query.eq('negocio_id', negocioId);

  const { data, error } = await query
    .select(`*, users:client_id(nombre), staff:staff_id(nombre), services:service_id(nombre)`)
    .maybeSingle();

  if (error || !data) { res.status(404).json({ error: 'Turno no encontrado' }); return; }
  res.json(flattenAppointment(data));
});

router.get('/staff', requireAuth, requireRole('staff', 'admin'), async (req: Request, res: Response) => {
  const { semana } = req.query as { semana?: string };

  let staffId: number;

  if (req.user!.rol === 'staff') {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('nombre')
      .eq('id', req.user!.id)
      .single();

    const { data: staffRecord } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('nombre', userData?.nombre ?? '')
      .maybeSingle();

    if (!staffRecord) { res.status(404).json({ error: 'No se encontró perfil de empleado' }); return; }
    staffId = staffRecord.id;
  } else {
    staffId = Number(req.query.staffId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabaseAdmin
    .from('appointments')
    .select(`*, users:client_id(nombre, email), services:service_id(nombre, duracion_minutos)`)
    .eq('staff_id', staffId)
    .neq('estado', 'cancelado');

  if (semana) {
    const start = new Date(semana);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    query = query
      .gte('fecha', start.toISOString().split('T')[0])
      .lte('fecha', end.toISOString().split('T')[0]);
  } else {
    query = query.eq('fecha', new Date().toISOString().split('T')[0]);
  }

  query = query.order('fecha', { ascending: true }).order('hora_inicio', { ascending: true });

  const { data } = await query;
  res.json((data ?? []).map(flattenAppointment));
});

export default router;
