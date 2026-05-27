import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  getOAuthUrl,
  exchangeCodeForToken,
  createOrder,
  getOrder,
  verifyWebhookSignature,
} from '../lib/tiendanube';
import { getMPPayment } from '../lib/mercadopago';
import { createBusinessAccount } from './registro';
import db from '../db';

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// OAUTH FLOW
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Inicia el flujo OAuth de Tienda Nube.
 * El admin es redirigido a la pantalla de autorización de la tienda.
 */
router.get('/connect', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const redirectUri = `${req.protocol}://${req.get('host')}/api/payments/callback`;
  const url = getOAuthUrl(redirectUri);
  console.log('[Payments] Iniciando OAuth TiendaNube, redirect:', redirectUri);
  res.redirect(url);
});

/**
 * Callback OAuth. Tienda Nube redirige aquí con el código de autorización.
 * Intercambia el código por tokens y los guarda en la configuración.
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { code } = req.query as { code?: string };

  if (!code) {
    res.status(400).json({ error: 'Código de autorización no recibido' });
    return;
  }

  try {
    const tokens = await exchangeCodeForToken(code);

    // Persiste los tokens en shop_config
    db.prepare('INSERT OR REPLACE INTO shop_config (key, value) VALUES (?, ?)').run(
      'tn_access_token', tokens.access_token
    );
    db.prepare('INSERT OR REPLACE INTO shop_config (key, value) VALUES (?, ?)').run(
      'tn_store_id', String(tokens.user_id)
    );

    console.log('[Payments] Tienda Nube conectada. storeId:', tokens.user_id);
    res.redirect('/?tn_connected=1');
  } catch (err) {
    console.error('[Payments] Error en OAuth callback:', err);
    res.status(500).json({ error: 'Error al conectar con Tienda Nube' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// CREAR ORDEN DE PAGO
// ──────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/payments/create-order
 * Genera una orden de pago en Tienda Nube para un turno.
 * Body: { appointmentId }
 */
router.post('/create-order', requireAuth, async (req: Request, res: Response) => {
  const { appointmentId } = req.body as { appointmentId: number };

  if (!appointmentId) {
    res.status(400).json({ error: 'appointmentId requerido' });
    return;
  }

  try {
    const appointment = db
      .prepare(`
        SELECT a.*,
               u.nombre AS client_nombre, u.email AS client_email,
               sv.nombre AS service_nombre, sv.precio AS service_precio,
               s.nombre AS staff_nombre
        FROM appointments a
        JOIN users u ON a.client_id = u.id
        JOIN services sv ON a.service_id = sv.id
        JOIN staff s ON a.staff_id = s.id
        WHERE a.id = ?
      `)
      .get(appointmentId) as {
        client_nombre: string;
        client_email: string;
        service_nombre: string;
        service_precio: number;
        staff_nombre: string;
        fecha: string;
        hora_inicio: string;
      } | undefined;

    if (!appointment) {
      res.status(404).json({ error: 'Turno no encontrado' });
      return;
    }

    const tnToken = db
      .prepare("SELECT value FROM shop_config WHERE key = 'tn_access_token'")
      .get() as { value: string } | undefined;

    const tnStoreId = db
      .prepare("SELECT value FROM shop_config WHERE key = 'tn_store_id'")
      .get() as { value: string } | undefined;

    if (!tnToken || !tnStoreId) {
      res.status(400).json({ error: 'Tienda Nube no está conectada. Ir a /api/payments/connect' });
      return;
    }

    const shopName = (db
      .prepare("SELECT value FROM shop_config WHERE key = 'nombre'")
      .get() as { value: string } | undefined)?.value ?? 'Peluquería';

    const order = await createOrder(Number(tnStoreId.value), tnToken.value, {
      productos: [
        {
          nombre: `${appointment.service_nombre} — ${appointment.fecha} ${appointment.hora_inicio}hs (${appointment.staff_nombre})`,
          cantidad: 1,
          precio: appointment.service_precio,
        },
      ],
      cliente: {
        nombre: appointment.client_nombre,
        email: appointment.client_email,
      },
      nota: `Turno en ${shopName} — ID #${appointmentId}`,
    });

    console.log('[Payments] Orden creada:', order.id, '| checkout:', order.checkout_url);

    res.json({
      orderId: order.id,
      checkoutUrl: order.checkout_url,
      total: order.total,
      currency: order.currency,
    });
  } catch (err) {
    console.error('[Payments] Error al crear orden:', err);
    res.status(500).json({ error: 'Error al generar la orden de pago' });
  }
});

/**
 * GET /api/payments/order/:id
 * Consulta el estado de una orden.
 */
router.get('/order/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const tnToken = db
      .prepare("SELECT value FROM shop_config WHERE key = 'tn_access_token'")
      .get() as { value: string } | undefined;

    const tnStoreId = db
      .prepare("SELECT value FROM shop_config WHERE key = 'tn_store_id'")
      .get() as { value: string } | undefined;

    if (!tnToken || !tnStoreId) {
      res.status(400).json({ error: 'Tienda Nube no conectada' });
      return;
    }

    const order = await getOrder(
      Number(tnStoreId.value),
      tnToken.value,
      Number(req.params.id)
    );

    res.json(order);
  } catch (err) {
    console.error('[Payments] Error al consultar orden:', err);
    res.status(500).json({ error: 'Error al consultar la orden' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// WEBHOOK
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/payments/webhook
 * Tienda Nube verifica el endpoint con un GET antes de activarlo.
 */
router.get('/webhook', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'PLaiT' });
});

/**
 * POST /api/payments/webhook
 * Recibe notificaciones de Tienda Nube.
 * Payload: { store_id, event, resource, id }
 *
 * Para suscripciones PLaiT (order/paid con registro_id en la nota):
 *   → crea la cuenta del negocio automáticamente.
 */
router.post('/webhook', (req: Request, res: Response) => {
  const signature = req.headers['x-tiendanube-hmac-sha256'] as string | undefined;
  const rawBody = JSON.stringify(req.body);

  if (signature && !verifyWebhookSignature(rawBody, signature)) {
    console.warn('[Payments] Webhook rechazado: firma inválida');
    res.status(401).json({ error: 'Firma inválida' });
    return;
  }

  const event = req.body as {
    store_id: number;
    event: string;
    resource: string;
    id: string;
  };

  console.log(`[Payments] Webhook recibido: ${event.event} | resource: ${event.resource} | id: ${event.id}`);

  // Responder 200 de inmediato para que Tienda Nube no reintente
  res.status(200).json({ received: true });

  // ── Pago completado ────────────────────────────────────────────────────────
  if (event.event === 'order/paid') {
    void (async () => {
      try {
        const tnToken   = (db.prepare("SELECT value FROM shop_config WHERE key = 'tn_access_token'").get() as { value: string } | undefined)?.value;
        const tnStoreId = (db.prepare("SELECT value FROM shop_config WHERE key = 'tn_store_id'").get() as { value: string } | undefined)?.value;

        if (!tnToken || !tnStoreId) {
          console.error('[Payments] Credenciales TiendaNube no configuradas — no se puede verificar la orden');
          return;
        }

        // Obtener detalles de la orden para leer la nota con el registro_id
        const order = await getOrder(Number(tnStoreId), tnToken, Number(event.id));

        // La nota tiene formato "registro_id:<uuid>"
        const match = (order as unknown as { note?: string }).note?.match(/registro_id:([a-f0-9-]{36})/i);
        if (!match) {
          // No es una venta de PLaiT — puede ser una orden de turno existente
          console.log(`[Payments] Orden ${event.id} pagada (no es suscripción PLaiT)`);
          return;
        }

        const registroId = match[1];
        console.log(`[Payments] Pago confirmado para registro PLaiT ${registroId}. Creando cuenta...`);

        await createBusinessAccount(registroId);
      } catch (err) {
        console.error(`[Payments] Error procesando order/paid para orden ${event.id}:`, err);
      }
    })();
  }

  // ── Pago cancelado ─────────────────────────────────────────────────────────
  if (event.event === 'order/cancelled') {
    console.log(`[Payments] Orden cancelada: ${event.id}`);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// WEBHOOK MERCADO PAGO
// ──────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/payments/webhook-mp
 * Recibe notificaciones de Mercado Pago (IPN / Webhooks).
 *
 * MP puede enviar dos formatos:
 *   - Webhooks (nuevo): { type: "payment", action: "payment.updated", data: { id: "123" } }
 *   - IPN (viejo):      GET/POST con query params ?topic=payment&id=123
 *
 * En ambos casos obtenemos el payment_id, consultamos la API de MP para
 * verificar el estado real (no confiamos solo en el payload del webhook),
 * y si está aprobado creamos la cuenta del negocio.
 */
router.post('/webhook-mp', (req: Request, res: Response) => {
  // Responder 200 inmediatamente — MP reintenta si no recibe respuesta rápida
  res.status(200).json({ received: true });

  const body = req.body as {
    type?:   string;
    action?: string;
    data?:   { id?: string | number };
    id?:     string | number;
  };

  // Soporte para ambos formatos
  const topic     = body.type ?? (req.query['topic'] as string | undefined);
  const paymentId = body.data?.id ?? body.id ?? (req.query['id'] as string | undefined);

  console.log(`[MP Webhook] topic=${topic} paymentId=${String(paymentId)}`);

  if (topic !== 'payment' || !paymentId) {
    console.log('[MP Webhook] Evento no es un pago o no tiene ID. Ignorando.');
    return;
  }

  void (async () => {
    try {
      // Consultar el pago directamente a la API de MP para verificar su estado real
      const payment = await getMPPayment(String(paymentId));

      console.log(`[MP Webhook] Pago ${paymentId}: status=${payment.status} ref=${payment.external_reference}`);

      if (payment.status !== 'approved') {
        console.log(`[MP Webhook] Pago no aprobado (${payment.status}). Sin acción.`);
        return;
      }

      const registroId = payment.external_reference;
      if (!registroId) {
        console.warn('[MP Webhook] Pago sin external_reference — no es suscripción PLaiT. Ignorando.');
        return;
      }

      await createBusinessAccount(registroId);
      console.log(`[MP Webhook] ✅ Cuenta activada para registro ${registroId}`);
    } catch (err) {
      console.error(`[MP Webhook] ❌ Error procesando pago ${String(paymentId)}:`, err);
    }
  })();
});

export default router;
