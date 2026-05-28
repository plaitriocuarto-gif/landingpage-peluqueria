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
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

async function getConfigValue(key: string): Promise<string | undefined> {
  const { data } = await supabaseAdmin.from('shop_config').select('value').eq('key', key).maybeSingle();
  return data?.value;
}

async function setConfigValue(key: string, value: string): Promise<void> {
  await supabaseAdmin.from('shop_config').upsert({ key, value }, { onConflict: 'key' });
}

router.get('/connect', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const redirectUri = `${req.protocol}://${req.get('host')}/api/payments/callback`;
  res.redirect(getOAuthUrl(redirectUri));
});

router.get('/callback', async (req: Request, res: Response) => {
  const { code } = req.query as { code?: string };
  if (!code) { res.status(400).json({ error: 'Código de autorización no recibido' }); return; }

  try {
    const tokens = await exchangeCodeForToken(code);
    await Promise.all([
      setConfigValue('tn_access_token', tokens.access_token),
      setConfigValue('tn_store_id', String(tokens.user_id)),
    ]);
    console.log('[Payments] Tienda Nube conectada. storeId:', tokens.user_id);
    res.redirect('/?tn_connected=1');
  } catch (err) {
    console.error('[Payments] Error en OAuth callback:', err);
    res.status(500).json({ error: 'Error al conectar con Tienda Nube' });
  }
});

router.post('/create-order', requireAuth, async (req: Request, res: Response) => {
  const { appointmentId } = req.body as { appointmentId: number };
  if (!appointmentId) { res.status(400).json({ error: 'appointmentId requerido' }); return; }

  try {
    const { data: apptRaw } = await supabaseAdmin
      .from('appointments')
      .select(`*, users:client_id(nombre, email), services:service_id(nombre, precio), staff:staff_id(nombre)`)
      .eq('id', appointmentId)
      .maybeSingle();

    if (!apptRaw) { res.status(404).json({ error: 'Turno no encontrado' }); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appt = apptRaw as any;

    const [tnToken, tnStoreId, shopName] = await Promise.all([
      getConfigValue('tn_access_token'),
      getConfigValue('tn_store_id'),
      getConfigValue('nombre'),
    ]);

    if (!tnToken || !tnStoreId) {
      res.status(400).json({ error: 'Tienda Nube no está conectada. Ir a /api/payments/connect' });
      return;
    }

    const order = await createOrder(Number(tnStoreId), tnToken, {
      productos: [{
        nombre: `${appt.services?.nombre} — ${appt.fecha} ${appt.hora_inicio}hs (${appt.staff?.nombre})`,
        cantidad: 1,
        precio: appt.services?.precio,
      }],
      cliente: { nombre: appt.users?.nombre, email: appt.users?.email },
      nota: `Turno en ${shopName ?? 'Peluquería'} — ID #${appointmentId}`,
    });

    res.json({ orderId: order.id, checkoutUrl: order.checkout_url, total: order.total, currency: order.currency });
  } catch (err) {
    console.error('[Payments] Error al crear orden:', err);
    res.status(500).json({ error: 'Error al generar la orden de pago' });
  }
});

router.get('/order/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const [tnToken, tnStoreId] = await Promise.all([
      getConfigValue('tn_access_token'),
      getConfigValue('tn_store_id'),
    ]);
    if (!tnToken || !tnStoreId) { res.status(400).json({ error: 'Tienda Nube no conectada' }); return; }
    const order = await getOrder(Number(tnStoreId), tnToken, Number(req.params.id));
    res.json(order);
  } catch (err) {
    console.error('[Payments] Error al consultar orden:', err);
    res.status(500).json({ error: 'Error al consultar la orden' });
  }
});

router.get('/webhook', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'PLaiT' });
});

router.post('/webhook', (req: Request, res: Response) => {
  const signature = req.headers['x-tiendanube-hmac-sha256'] as string | undefined;
  if (signature && !verifyWebhookSignature(JSON.stringify(req.body), signature)) {
    res.status(401).json({ error: 'Firma inválida' });
    return;
  }

  const event = req.body as { store_id: number; event: string; resource: string; id: string };
  console.log(`[Payments] Webhook recibido: ${event.event} | id: ${event.id}`);
  res.status(200).json({ received: true });

  if (event.event === 'order/paid') {
    void (async () => {
      try {
        const [tnToken, tnStoreId] = await Promise.all([
          getConfigValue('tn_access_token'),
          getConfigValue('tn_store_id'),
        ]);
        if (!tnToken || !tnStoreId) return;
        const order = await getOrder(Number(tnStoreId), tnToken, Number(event.id));
        const match = (order as unknown as { note?: string }).note?.match(/registro_id:([a-f0-9-]{36})/i);
        if (!match) return;
        await createBusinessAccount(match[1]);
      } catch (err) {
        console.error(`[Payments] Error procesando order/paid:`, err);
      }
    })();
  }
});

router.post('/webhook-mp', (req: Request, res: Response) => {
  res.status(200).json({ received: true });

  const body = req.body as { type?: string; action?: string; data?: { id?: string | number }; id?: string | number };
  const topic = body.type ?? (req.query['topic'] as string | undefined);
  const paymentId = body.data?.id ?? body.id ?? (req.query['id'] as string | undefined);

  if (topic !== 'payment' || !paymentId) return;

  void (async () => {
    try {
      const payment = await getMPPayment(String(paymentId));
      if (payment.status !== 'approved' || !payment.external_reference) return;
      await createBusinessAccount(payment.external_reference);
    } catch (err) {
      console.error(`[MP Webhook] Error procesando pago ${String(paymentId)}:`, err);
    }
  })();
});

export default router;
