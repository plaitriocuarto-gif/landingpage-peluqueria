import axios from 'axios';

const APP_ID = process.env.TIENDANUBE_APP_ID!;
const CLIENT_SECRET = process.env.TIENDANUBE_CLIENT_SECRET!;

const BASE_URL = 'https://api.tiendanube.com/v1';
const OAUTH_URL = `https://www.tiendanube.com/apps/${APP_ID}/authorize`;

export interface TiendanubeTokens {
  access_token: string;
  token_type: string;
  scope: string;
  user_id: number;
}

export interface TiendanubeOrder {
  id: number;
  token: string;
  status: string;
  checkout_url: string;
  total: string;
  currency: string;
}

/**
 * Construye la URL de autorización OAuth para que una tienda autorice la app.
 * Redirigir al propietario de la tienda a esta URL.
 */
export function getOAuthUrl(redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: APP_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    ...(state ? { state } : {}),
  });

  const url = `https://www.tiendanube.com/apps/authorize?${params.toString()}`;
  console.log('[TiendaNube] URL OAuth generada:', url);
  return url;
}

/**
 * Intercambia el código de autorización por un access_token.
 * Llamar desde el callback OAuth después de que el usuario autorice la app.
 */
export async function exchangeCodeForToken(code: string): Promise<TiendanubeTokens> {
  console.log('[TiendaNube] Intercambiando código por token...');

  const response = await axios.post<TiendanubeTokens>(
    OAUTH_URL,
    {
      client_id: APP_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
    },
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  console.log('[TiendaNube] Token obtenido para storeId:', response.data.user_id);
  return response.data;
}

/**
 * Crea una orden de pago en la tienda del usuario.
 * Devuelve la orden con checkout_url para redirigir al cliente.
 */
export async function createOrder(
  storeId: number,
  accessToken: string,
  orderData: {
    productos: Array<{ nombre: string; cantidad: number; precio: number }>;
    cliente: { nombre: string; email: string };
    nota?: string;
  }
): Promise<TiendanubeOrder> {
  console.log('[TiendaNube] Creando orden en tienda', storeId);

  const lineItems = orderData.productos.map((p) => ({
    name: p.nombre,
    quantity: p.cantidad,
    price: String(p.precio),
  }));

  const response = await axios.post<TiendanubeOrder>(
    `${BASE_URL}/${storeId}/orders`,
    {
      products: lineItems,
      customer: {
        name: orderData.cliente.nombre,
        email: orderData.cliente.email,
      },
      note: orderData.nota,
      shipping_option: 'pick_up',
    },
    {
      headers: {
        'Authentication': `bearer ${accessToken}`,
        'User-Agent': `PLaiT App (${process.env.RESEND_API_KEY ? 'plaitriocuarto@gmail.com' : 'contact@plait.agency'})`,
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('[TiendaNube] Orden creada. id:', response.data.id);
  return response.data;
}

/**
 * Obtiene el detalle de una orden existente.
 */
export async function getOrder(
  storeId: number,
  accessToken: string,
  orderId: number
): Promise<TiendanubeOrder> {
  const response = await axios.get<TiendanubeOrder>(
    `${BASE_URL}/${storeId}/orders/${orderId}`,
    {
      headers: {
        'Authentication': `bearer ${accessToken}`,
        'User-Agent': 'PLaiT App (plaitriocuarto@gmail.com)',
      },
    }
  );
  return response.data;
}

/**
 * Verifica la firma HMAC de un webhook de Tienda Nube.
 * Usar en el endpoint webhook antes de procesar el evento.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const crypto = require('crypto') as typeof import('crypto');
  const expected = crypto
    .createHmac('sha256', CLIENT_SECRET)
    .update(payload)
    .digest('hex');

  const isValid = expected === signature;
  if (!isValid) {
    console.warn('[TiendaNube] Firma de webhook inválida');
  }
  return isValid;
}
