import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'PLaiT <noreply@plait.agency>';
const BRAND_COLOR = '#0D215B';

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PLaiT</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
                  <span style="color:#fff;font-weight:900;font-size:13px;letter-spacing:-0.5px;">PL</span>
                </div>
                <span style="color:rgba(255,255,255,0.55);font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">PLaiT</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 32px;border-radius:0 0 12px 12px;">
              ${content}
              <hr style="border:none;border-top:1px solid #eef0f5;margin:28px 0;">
              <p style="color:#aab0c0;font-size:12px;text-align:center;margin:0;">
                PLaiT Agency · Sistema de turnos<br>
                <a href="https://instagram.com/plait.agency" style="color:#aab0c0;">@plait.agency</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function turnoInfo(turno: TurnoEmail): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8f9fc;border-radius:8px;border:1px solid #eef0f5;padding:18px 20px;margin:20px 0;">
      <tr>
        <td style="color:#6b7280;font-size:13px;padding:4px 0;">📅 Fecha</td>
        <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;">${turno.fecha}</td>
      </tr>
      <tr>
        <td style="color:#6b7280;font-size:13px;padding:4px 0;">⏰ Horario</td>
        <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;">${turno.hora_inicio} hs</td>
      </tr>
      <tr>
        <td style="color:#6b7280;font-size:13px;padding:4px 0;">✂️ Servicio</td>
        <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;">${turno.servicio}</td>
      </tr>
      <tr>
        <td style="color:#6b7280;font-size:13px;padding:4px 0;">💇 Profesional</td>
        <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;">${turno.profesional}</td>
      </tr>
      ${turno.precio ? `
      <tr>
        <td style="color:#6b7280;font-size:13px;padding:4px 0;">💰 Precio</td>
        <td style="color:${BRAND_COLOR};font-size:13px;font-weight:700;text-align:right;">$${turno.precio.toLocaleString('es-AR')}</td>
      </tr>` : ''}
    </table>
  `;
}

export interface TurnoEmail {
  clienteEmail: string;
  clienteNombre: string;
  fecha: string;
  hora_inicio: string;
  servicio: string;
  profesional: string;
  peluqueria: string;
  precio?: number;
}

export async function sendConfirmacion(turno: TurnoEmail) {
  console.log(`[Resend] Enviando confirmación a ${turno.clienteEmail}`);

  const content = `
    <h2 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 8px;">¡Turno confirmado! ✅</h2>
    <p style="color:#6b7280;font-size:15px;margin:0 0 4px;">
      Hola <strong style="color:#111827;">${turno.clienteNombre}</strong>, tu turno en
      <strong style="color:${BRAND_COLOR};">${turno.peluqueria}</strong> quedó reservado.
    </p>
    ${turnoInfo(turno)}
    <p style="color:#6b7280;font-size:13px;margin:0;">
      Si necesitás cancelar tu turno, podés hacerlo desde la app con al menos 2 horas de anticipación.
    </p>
  `;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: turno.clienteEmail,
    subject: `Turno confirmado — ${turno.peluqueria}`,
    html: baseTemplate(content),
  });

  if (error) {
    console.error('[Resend] Error enviando confirmación:', error);
    throw error;
  }

  console.log('[Resend] Confirmación enviada. id:', data?.id);
  return data;
}

export async function sendRecordatorio(turno: TurnoEmail) {
  console.log(`[Resend] Enviando recordatorio a ${turno.clienteEmail}`);

  const content = `
    <h2 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 8px;">Recordatorio de turno 🔔</h2>
    <p style="color:#6b7280;font-size:15px;margin:0 0 4px;">
      Hola <strong style="color:#111827;">${turno.clienteNombre}</strong>, te recordamos que mañana tenés turno
      en <strong style="color:${BRAND_COLOR};">${turno.peluqueria}</strong>.
    </p>
    ${turnoInfo(turno)}
    <p style="color:#6b7280;font-size:13px;margin:0;">
      ¡Te esperamos! Si no podés asistir, cancelá con anticipación.
    </p>
  `;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: turno.clienteEmail,
    subject: `Recordatorio: turno mañana — ${turno.peluqueria}`,
    html: baseTemplate(content),
  });

  if (error) {
    console.error('[Resend] Error enviando recordatorio:', error);
    throw error;
  }

  console.log('[Resend] Recordatorio enviado. id:', data?.id);
  return data;
}

// ──────────────────────────────────────────────────────────────────────────────
// BIENVENIDA — se envía cuando el pago se confirma y la cuenta queda creada
// ──────────────────────────────────────────────────────────────────────────────

export interface BienvenidaEmail {
  gmail: string;
  nombre: string;
  nombre_negocio: string;
  url_cliente: string;
  url_admin: string;
  password: string;
}

export async function sendBienvenida(data: BienvenidaEmail) {
  console.log(`[Resend] Enviando bienvenida a ${data.gmail}`);

  const content = `
    <h2 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 8px;">¡Tu turnero PLaiT está listo! 🎉</h2>
    <p style="color:#6b7280;font-size:15px;margin:0 0 20px;">
      Hola <strong style="color:#111827;">${data.nombre}</strong>, configuramos todo para
      <strong style="color:${BRAND_COLOR};">${data.nombre_negocio}</strong>.
      Ya podés ingresar a tu panel de administración.
    </p>

    <!-- Datos del turnero -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8f9fc;border-radius:8px;border:1px solid #eef0f5;padding:18px 20px;margin:0 0 20px;">
      <tr>
        <td style="color:#6b7280;font-size:13px;padding:5px 0;">🌐 URL de tus clientes</td>
        <td style="text-align:right;">
          <a href="${data.url_cliente}" style="color:${BRAND_COLOR};font-size:13px;font-weight:600;">${data.url_cliente}</a>
        </td>
      </tr>
      <tr>
        <td style="color:#6b7280;font-size:13px;padding:5px 0;">⚙️ Panel de administración</td>
        <td style="text-align:right;">
          <a href="${data.url_admin}" style="color:${BRAND_COLOR};font-size:13px;font-weight:600;">${data.url_admin}</a>
        </td>
      </tr>
      <tr>
        <td style="color:#6b7280;font-size:13px;padding:5px 0;">📧 Usuario (Gmail)</td>
        <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;">${data.gmail}</td>
      </tr>
      <tr>
        <td style="color:#6b7280;font-size:13px;padding:5px 0;">🔑 Contraseña</td>
        <td style="color:#111827;font-size:13px;font-weight:700;text-align:right;font-family:monospace;letter-spacing:1px;">${data.password}</td>
      </tr>
    </table>

    <!-- Botón CTA -->
    <div style="text-align:center;margin:24px 0;">
      <a href="${data.url_admin}"
        style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;font-size:15px;font-weight:700;
               padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
        Entrar al admin →
      </a>
    </div>

    <p style="color:#6b7280;font-size:13px;margin:0;text-align:center;">
      Por seguridad, te recomendamos cambiar la contraseña la primera vez que ingreses.
    </p>
  `;

  const { data: result, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.gmail,
    subject: '¡Tu turnero PLaiT está listo! 🎉',
    html: baseTemplate(content),
  });

  if (error) {
    console.error('[Resend] Error enviando bienvenida:', error);
    throw error;
  }

  console.log('[Resend] Bienvenida enviada. id:', result?.id);
  return result;
}

export async function sendCancelacion(turno: TurnoEmail) {
  console.log(`[Resend] Enviando cancelación a ${turno.clienteEmail}`);

  const content = `
    <h2 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 8px;">Turno cancelado ❌</h2>
    <p style="color:#6b7280;font-size:15px;margin:0 0 4px;">
      Hola <strong style="color:#111827;">${turno.clienteNombre}</strong>, tu turno en
      <strong style="color:${BRAND_COLOR};">${turno.peluqueria}</strong> fue cancelado.
    </p>
    ${turnoInfo(turno)}
    <p style="color:#6b7280;font-size:13px;margin:0;">
      Podés reservar un nuevo turno cuando quieras desde nuestra app.
    </p>
  `;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: turno.clienteEmail,
    subject: `Turno cancelado — ${turno.peluqueria}`,
    html: baseTemplate(content),
  });

  if (error) {
    console.error('[Resend] Error enviando cancelación:', error);
    throw error;
  }

  console.log('[Resend] Cancelación enviada. id:', data?.id);
  return data;
}
