import { Router, Request, Response } from 'express';
import { createClerkClient } from '@clerk/express';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../lib/supabase';
import { createOrder } from '../lib/tiendanube';
import { sendBienvenida } from '../lib/email';
import db from '../db';

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

function toSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar tildes/diacríticos
    .replace(/[^a-z0-9\s-]/g, '')   // solo letras, números, guiones y espacios
    .trim()
    .replace(/\s+/g, '-')           // espacios → guiones
    .replace(/-+/g, '-');           // colapsar guiones dobles
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

  for (let i = 0; i < 6; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }

  // Mezclar para que los obligatorios no queden siempre al principio
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/registro/check-slug?slug=la-barberia
// Verifica si el slug está disponible (no tomado en negocios ni en pendientes)
// ──────────────────────────────────────────────────────────────────────────────

router.get('/check-slug', async (req: Request, res: Response) => {
  const { slug } = req.query as { slug?: string };

  if (!slug) {
    res.status(400).json({ error: 'slug requerido' });
    return;
  }

  const cleanSlug = toSlug(slug);

  if (!cleanSlug) {
    res.json({ available: false, slug: cleanSlug });
    return;
  }

  try {
    const [{ data: negocio }, { data: pendiente }] = await Promise.all([
      supabaseAdmin.from('negocios').select('id').eq('slug', cleanSlug).maybeSingle(),
      supabaseAdmin
        .from('registros_pendientes')
        .select('id')
        .eq('slug', cleanSlug)
        .eq('estado', 'pendiente_pago')
        .maybeSingle(),
    ]);

    res.json({ available: !negocio && !pendiente, slug: cleanSlug });
  } catch (err) {
    console.error('[Registro] Error verificando slug:', err);
    res.status(500).json({ error: 'Error verificando disponibilidad' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/registro
// Guarda el formulario pre-pago y redirige al checkout de Tienda Nube
// ──────────────────────────────────────────────────────────────────────────────

router.post('/', async (req: Request, res: Response) => {
  const { nombre, apellido, telefono, gmail, nombre_negocio } = req.body as {
    nombre: string;
    apellido: string;
    telefono: string;
    gmail: string;
    nombre_negocio: string;
  };

  // Validaciones básicas
  if (!nombre?.trim() || !apellido?.trim() || !telefono?.trim() || !gmail?.trim() || !nombre_negocio?.trim()) {
    res.status(400).json({ error: 'Todos los campos son obligatorios' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmail)) {
    res.status(400).json({ error: 'El Gmail no tiene formato válido' });
    return;
  }

  if (!/^\d+$/.test(telefono)) {
    res.status(400).json({ error: 'El teléfono solo debe contener números' });
    return;
  }

  const slug = toSlug(nombre_negocio);
  if (!slug) {
    res.status(400).json({ error: 'Nombre de negocio inválido' });
    return;
  }

  try {
    // Verificar que el slug no esté tomado
    const [{ data: negocio }, { data: pendiente }] = await Promise.all([
      supabaseAdmin.from('negocios').select('id').eq('slug', slug).maybeSingle(),
      supabaseAdmin
        .from('registros_pendientes')
        .select('id')
        .eq('slug', slug)
        .eq('estado', 'pendiente_pago')
        .maybeSingle(),
    ]);

    if (negocio || pendiente) {
      res.status(409).json({
        error: 'Ese nombre de negocio ya está en uso. Probá con una variación.',
        slug,
      });
      return;
    }

    // Guardar en registros_pendientes
    const { data: registro, error: insertErr } = await supabaseAdmin
      .from('registros_pendientes')
      .insert({ nombre, apellido, telefono, gmail, nombre_negocio, slug, estado: 'pendiente_pago' })
      .select('id')
      .single();

    if (insertErr || !registro) throw insertErr ?? new Error('No se pudo crear el registro');

    console.log(`[Registro] Nuevo registro pendiente. id=${registro.id} slug=${slug}`);

    // Obtener credenciales de Tienda Nube (tienda de PLaiT)
    const tnToken   = (db.prepare("SELECT value FROM shop_config WHERE key = 'tn_access_token'").get() as { value: string } | undefined)?.value;
    const tnStoreId = (db.prepare("SELECT value FROM shop_config WHERE key = 'tn_store_id'").get() as { value: string } | undefined)?.value;

    let checkoutUrl: string;

    if (tnToken && tnStoreId) {
      const price = Number(process.env.PLAIT_PRICE ?? 0);

      const order = await createOrder(Number(tnStoreId), tnToken, {
        productos: [{ nombre: 'PLaiT — Sistema de turnos para peluquerías', cantidad: 1, precio: price }],
        cliente: { nombre: `${nombre} ${apellido}`, email: gmail },
        nota: `registro_id:${registro.id}`,
      });

      // Guardar el ID de la orden TN en el registro
      await supabaseAdmin
        .from('registros_pendientes')
        .update({ tiendanube_order_id: String(order.id) })
        .eq('id', registro.id);

      checkoutUrl = order.checkout_url;
      console.log(`[Registro] Orden TN creada. order_id=${order.id} checkout=${checkoutUrl}`);
    } else {
      // Fallback: usar URL de checkout fija del .env con el registro_id como parámetro
      const base = process.env.TIENDANUBE_CHECKOUT_URL;
      if (!base) {
        res.status(500).json({ error: 'Sistema de pagos no configurado. Contactá a soporte.' });
        return;
      }
      checkoutUrl = `${base}?registro_id=${registro.id}`;
      console.log(`[Registro] Usando checkout URL fija: ${checkoutUrl}`);
    }

    res.json({ registroId: registro.id, checkoutUrl });
  } catch (err) {
    console.error('[Registro] Error al procesar:', err);
    res.status(500).json({ error: 'Error interno al procesar el registro' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/registro/forgot-password
// Inicia el flujo de reset de contraseña de Clerk
// ──────────────────────────────────────────────────────────────────────────────

router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };

  if (!email) {
    res.status(400).json({ error: 'Email requerido' });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const list = await clerk.users.getUserList({ emailAddress: [email] });

    if (!list.data.length) {
      res.status(404).json({ error: 'No encontramos una cuenta con ese Gmail' });
      return;
    }

    // Clerk gestiona el envío del email de reset mediante su flujo nativo.
    // Creamos un reset token via API de Clerk Backend.
    const userId = list.data[0].id;

    await fetch(`https://api.clerk.com/v1/users/${userId}/reset_password`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[ForgotPassword] Reset de contraseña iniciado para userId=${userId}`);
    res.json({ sent: true });
  } catch (err) {
    console.error('[ForgotPassword] Error:', err);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// createBusinessAccount — llamado por el webhook cuando el pago se confirma
// ──────────────────────────────────────────────────────────────────────────────

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

  const baseUrl = process.env.BASE_URL ?? 'https://turnosonlineplait.com';
  const urlCliente = `${baseUrl}/${slug}`;
  const urlAdmin   = `${baseUrl}/${slug}/admin`;
  const password   = generatePassword();

  // a) Crear usuario en Clerk
  let clerkUserId: string | undefined;
  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const clerkUser = await clerk.users.createUser({
      emailAddress: [gmail],
      password,
      firstName: nombre,
      lastName: apellido,
    });
    clerkUserId = clerkUser.id;
    console.log(`[Cuenta] Usuario Clerk creado. clerkId=${clerkUserId}`);
  } catch (clerkErr: unknown) {
    // Si el email ya existe en Clerk, continuamos y buscamos el id
    const errObj = clerkErr as { errors?: Array<{ code?: string }> };
    if (errObj?.errors?.[0]?.code === 'form_identifier_exists') {
      console.warn('[Cuenta] Email ya existe en Clerk, se vinculará el usuario existente.');
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      const list = await clerk.users.getUserList({ emailAddress: [gmail] });
      clerkUserId = list.data[0]?.id;
    } else {
      console.error('[Cuenta] Error creando usuario en Clerk:', clerkErr);
      throw clerkErr;
    }
  }

  // b.2) Crear usuario en SQLite para login JWT (sistema actual)
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(gmail);
  if (!existingUser) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (email, password_hash, nombre, rol) VALUES (?, ?, ?, ?)').run(
      gmail,
      hash,
      `${nombre} ${apellido}`,
      'admin'
    );
    console.log(`[Cuenta] Usuario admin creado en SQLite para ${gmail}`);
  }

  // c) Crear registro en la tabla negocios
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

  // c) Marcar el registro pendiente como pagado
  await supabaseAdmin
    .from('registros_pendientes')
    .update({ estado: 'pagado' })
    .eq('id', registroId);

  // d) Enviar email de bienvenida con credenciales
  await sendBienvenida({
    gmail,
    nombre,
    nombre_negocio,
    url_cliente: urlCliente,
    url_admin: urlAdmin,
    password,
  });

  console.log(`[Cuenta] ✅ Cuenta creada exitosamente para ${gmail} → ${slug}`);
}

export default router;
