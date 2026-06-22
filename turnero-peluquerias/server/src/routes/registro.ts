import { Router, Request, Response } from 'express';
import { createClerkClient } from '@clerk/express';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../lib/supabase';
import { createMPPreference } from '../lib/mercadopago';
import { sendBienvenida } from '../lib/email';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function generatePassword(): string {
  const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower   = 'abcdefghjkmnpqrstuvwxyz';
  const digits  = '23456789';
  const special = '!@#$%&*';
  const all     = upper + lower + digits + special;

  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  for (let i = 0; i < 6; i++) pwd += all[Math.floor(Math.random() * all.length)];

  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

async function isSlugTaken(slug: string): Promise<boolean> {
  const [{ data: negocio }, { data: pendiente }] = await Promise.all([
    supabaseAdmin.from('negocios').select('id').eq('slug', slug).maybeSingle(),
    supabaseAdmin.from('registros_pendientes').select('id').eq('slug', slug).eq('estado', 'pendiente_pago').maybeSingle(),
  ]);
  return !!(negocio || pendiente);
}

// ── GET /api/registro/check-slug?slug=la-barberia ────────────────────────────

router.get('/check-slug', async (req: Request, res: Response) => {
  const { slug } = req.query as { slug?: string };
  if (!slug) { res.status(400).json({ error: 'slug requerido' }); return; }

  const cleanSlug = toSlug(slug);
  if (!cleanSlug) { res.json({ available: false, slug: cleanSlug }); return; }

  try {
    res.json({ available: !(await isSlugTaken(cleanSlug)), slug: cleanSlug });
  } catch (err) {
    console.error('[Registro] Error verificando slug:', err);
    res.status(500).json({ error: 'Error verificando disponibilidad' });
  }
});

// ── POST /api/registro ───────────────────────────────────────────────────────

router.post('/', async (req: Request, res: Response) => {
  const { nombre, apellido, telefono, gmail, nombre_negocio } = req.body as {
    nombre: string;
    apellido: string;
    telefono: string;
    gmail: string;
    nombre_negocio: string;
  };

  if (!nombre?.trim() || !apellido?.trim() || !telefono?.trim() || !gmail?.trim() || !nombre_negocio?.trim()) {
    res.status(400).json({ error: 'Todos los campos son obligatorios' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmail)) {
    res.status(400).json({ error: 'El Gmail no tiene formato válido' });
    return;
  }
  if (!/^\+?\d+$/.test(telefono)) {
    res.status(400).json({ error: 'El teléfono tiene un formato inválido' });
    return;
  }

  const slug = toSlug(nombre_negocio);
  if (!slug) { res.status(400).json({ error: 'Nombre de negocio inválido' }); return; }

  try {
    if (await isSlugTaken(slug)) {
      res.status(409).json({ error: 'Ese nombre de negocio ya está en uso. Probá con una variación.', slug });
      return;
    }

    const { data: registro, error: insertErr } = await supabaseAdmin
      .from('registros_pendientes')
      .insert({ nombre, apellido, telefono, gmail, nombre_negocio, slug, estado: 'pendiente_pago' })
      .select('id')
      .single();

    if (insertErr || !registro) throw insertErr ?? new Error('No se pudo crear el registro');

    console.log(`[Registro] Nuevo registro pendiente. id=${registro.id} slug=${slug}`);

    if (!process.env.MP_ACCESS_TOKEN) {
      console.error('[Registro] MP_ACCESS_TOKEN no configurado');
      res.status(500).json({ error: 'Sistema de pagos no configurado. Contactá a soporte.' });
      return;
    }

    const { initPoint } = await createMPPreference({
      registroId: registro.id,
      nombre:     `${nombre} ${apellido}`,
      gmail,
      nombreNegocio: nombre_negocio,
    });

    console.log(`[Registro] Preferencia MP creada → ${initPoint}`);
    res.json({ registroId: registro.id, checkoutUrl: initPoint });
  } catch (err) {
    console.error('[Registro] Error al procesar:', err);
    res.status(500).json({ error: 'Error interno al procesar el registro' });
  }
});

// ── createBusinessAccount — llamado por el webhook cuando el pago se confirma ─

export async function createBusinessAccount(registroId: string): Promise<void> {
  console.log(`[Cuenta] Iniciando creación de cuenta para registro ${registroId}`);

  const { data: reg, error: regErr } = await supabaseAdmin
    .from('registros_pendientes')
    .select('*')
    .eq('id', registroId)
    .single();

  if (regErr || !reg) {
    console.error('[Cuenta] Registro no encontrado:', registroId);
    throw new Error(`Registro pendiente no encontrado: ${registroId}`);
  }

  if (reg.estado === 'pagado') {
    console.log(`[Cuenta] Registro ${registroId} ya fue procesado. Ignorando.`);
    return;
  }

  const { nombre, apellido, gmail, slug, nombre_negocio } = reg as {
    nombre: string;
    apellido: string;
    gmail: string;
    slug: string;
    nombre_negocio: string;
  };

  const baseUrl    = process.env.BASE_URL ?? 'https://turnosonlineplait.com';
  const urlCliente = `${baseUrl}/${slug}`;
  const urlAdmin   = `${baseUrl}/${slug}/admin`;
  const password   = generatePassword();
  const clerk      = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  // a) Crear usuario en Clerk
  let clerkUserId: string | undefined;
  try {
    const clerkUser = await clerk.users.createUser({
      emailAddress: [gmail],
      password,
      firstName: nombre,
      lastName: apellido,
    });
    clerkUserId = clerkUser.id;
    console.log(`[Cuenta] Usuario Clerk creado. clerkId=${clerkUserId}`);
  } catch (clerkErr: unknown) {
    const errObj = clerkErr as { errors?: Array<{ code?: string }> };
    if (errObj?.errors?.[0]?.code === 'form_identifier_exists') {
      console.warn('[Cuenta] Email ya existe en Clerk, se vinculará el usuario existente.');
      const list = await clerk.users.getUserList({ emailAddress: [gmail] });
      clerkUserId = list.data[0]?.id;
    } else {
      console.error('[Cuenta] Error creando usuario en Clerk:', clerkErr);
      throw clerkErr;
    }
  }

  // b) Crear usuario en Supabase para login JWT
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', gmail)
    .maybeSingle();

  if (!existingUser) {
    const hash = bcrypt.hashSync(password, 10);
    await supabaseAdmin
      .from('users')
      .insert({ email: gmail, password_hash: hash, nombre: `${nombre} ${apellido}`, rol: 'admin' });
    console.log(`[Cuenta] Usuario admin creado en Supabase para ${gmail}`);
  }

  // c) Crear negocio en Supabase
  const { error: negErr } = await supabaseAdmin.from('negocios').insert({
    nombre,
    apellido,
    telefono: reg.telefono,
    gmail,
    nombre_negocio,
    slug,
    clerk_user_id: clerkUserId ?? null,
    url_cliente: urlCliente,
    url_admin: urlAdmin,
    estado: 'activo',
  });

  if (negErr) {
    console.error('[Cuenta] Error creando negocio en Supabase:', negErr);
    throw negErr;
  }

  console.log(`[Cuenta] Negocio creado en Supabase. slug=${slug}`);

  // d) Marcar registro pendiente como pagado
  await supabaseAdmin
    .from('registros_pendientes')
    .update({ estado: 'pagado' })
    .eq('id', registroId);

  // e) Enviar email de bienvenida con credenciales
  await sendBienvenida({ gmail, nombre, nombre_negocio, url_cliente: urlCliente, url_admin: urlAdmin, password });

  console.log(`[Cuenta] Cuenta creada exitosamente para ${gmail} → ${slug}`);
}

export default router;
