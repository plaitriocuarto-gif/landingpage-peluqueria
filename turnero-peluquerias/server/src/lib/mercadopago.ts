import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// ──────────────────────────────────────────────────────────────────────────────
// Cliente de Mercado Pago
// ──────────────────────────────────────────────────────────────────────────────

if (!process.env.MP_ACCESS_TOKEN) {
  console.warn('[MP] ⚠️  MP_ACCESS_TOKEN no está configurado. El checkout no funcionará.');
}

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? 'no-token',
  options: { timeout: 5000 },
});

/**
 * URL base de la app (para back_urls y notification_url).
 * En Vercel, VERCEL_URL puede venir sin "https://" (env de sistema),
 * mientras que el usuario normalmente lo configura con "https://".
 * Esta función normaliza ambos casos.
 */
function getAppUrl(): string {
  const raw = process.env.VERCEL_URL ?? 'plait-turnero.vercel.app';
  return raw.startsWith('http') ? raw : `https://${raw}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Crear preferencia (Checkout Pro)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Crea una preferencia de Checkout Pro en Mercado Pago.
 * Devuelve las URLs para redirigir al usuario al checkout.
 *
 * @param params.registroId  UUID del registro en `registros_pendientes`
 * @param params.nombre      Nombre completo del dueño del negocio
 * @param params.gmail       Email del dueño (también es el payer)
 * @param params.nombreNegocio  Nombre del salón/barbería
 */
export async function createMPPreference(params: {
  registroId: string;
  nombre: string;
  gmail: string;
  nombreNegocio: string;
}): Promise<{
  initPoint: string;
  sandboxInitPoint: string;
  preferenceId: string;
}> {
  const amount = Number(process.env.PLAIT_PRICE ?? 15000);
  const appUrl = getAppUrl();

  const preference = new Preference(mpClient);

  const result = await preference.create({
    body: {
      items: [
        {
          id: 'plait-plan-mensual',
          title: 'PLaiT — Sistema de Turnos para Peluquerías',
          description: 'Agenda digital automatizada. Plan Todo Incluido.',
          quantity: 1,
          unit_price: amount,
          currency_id: 'ARS',
        },
      ],
      payer: {
        name: params.nombre,
        email: params.gmail,
      },
      back_urls: {
        success: `${appUrl}/pago-exitoso`,
        failure: `${appUrl}/registro?error=pago_fallido`,
        pending: `${appUrl}/pago-exitoso?pending=1`,
      },
      // Redirige automáticamente solo si el pago es aprobado
      auto_return: 'approved',
      // Referencia externa = nuestro registro_id para identificar el pago en el webhook
      external_reference: params.registroId,
      // URL donde MP enviará notificaciones IPN/webhook
      notification_url: `${appUrl}/api/payments/webhook-mp`,
      // Descriptor en el resumen del banco
      statement_descriptor: 'PLAIT TURNEROS',
      metadata: {
        registro_id: params.registroId,
        negocio: params.nombreNegocio,
      },
    },
  });

  if (!result.init_point) {
    throw new Error('[MP] La preferencia no retornó init_point');
  }

  console.log(`[MP] Preferencia creada. id=${result.id} registro=${params.registroId}`);

  return {
    initPoint: result.init_point,
    sandboxInitPoint: result.sandbox_init_point ?? result.init_point,
    preferenceId: result.id!,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Consultar pago
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene los detalles de un pago por su ID.
 * Usado en el webhook para verificar el estado real del pago.
 */
export async function getMPPayment(paymentId: string | number) {
  const payment = new Payment(mpClient);
  return payment.get({ id: String(paymentId) });
}
