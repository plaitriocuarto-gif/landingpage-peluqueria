import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
const BRAND_COLOR = '#0D215B';

function svg(paths: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

const ICON = {
  calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
  clock:    svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  scissors: svg('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>'),
  user:     svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  dollar:   svg('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>'),
};

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
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; border-collapse: separate;">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};border-radius:12px 12px 0 0;padding:28px 32px 22px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="text-align:center;padding-bottom:10px;">
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        <td style="vertical-align:top;padding-right:1px;">
                          <span style="color:#ffffff;font-size:64px;font-weight:100;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1;">L</span>
                        </td>
                        <td style="vertical-align:top;padding-top:18px;">
                          <span style="color:#ffffff;font-size:64px;font-weight:100;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1;">T</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 12px;text-align:center;">
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        <td width="88" style="border-top:3px solid rgba(255,255,255,0.95);font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;">
                    <span style="color:#ffffff;font-size:18px;font-weight:300;letter-spacing:5px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">PLaiT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 32px;border-bottom:1px solid ${BRAND_COLOR};border-left:1px solid ${BRAND_COLOR};border-right:1px solid ${BRAND_COLOR};border-radius:0 0 12px 12px;">
              ${content}
              <hr style="border:none;border-top:1px solid #eef0f5;margin:28px 0;">
              <p style="color:#575f70;font-size:13px;text-align:center;margin:0;font-weight:500;">
                PLaiT Agency &bull; Sistema de turnos<br>
                <a href="https://plait.agency" style="color:${BRAND_COLOR};text-decoration:underline;font-weight:600;display:inline-block;margin-top:6px;">plait.agency</a>
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

function turnoRow(icon: string, label: string, value: string, last = false, priceRow = false): string {
  const val = priceRow
    ? `<strong style="color:#111827;font-size:15px;font-weight:700;">${value}</strong>`
    : `<span style="color:#111827;font-size:14px;font-weight:500;">${value}</span>`;
  return `
    <tr>
      <td style="padding:10px 0;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle;padding-right:8px;">${icon}</td>
          <td style="color:#4b5563;font-size:14px;vertical-align:middle;">${label}</td>
        </tr></table>
      </td>
      <td style="padding:10px 0;text-align:right;vertical-align:middle;">${val}</td>
    </tr>`;
}

function turnoInfo(turno: TurnoEmail): string {
  const hasPrice = !!turno.precio;
  return `
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8f9fc;border-radius:12px;border:1px solid #eef2f6;box-shadow:0 8px 30px rgba(0,0,0,0.04);margin:22px 0;">
      <tr><td style="padding:10px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${turnoRow(ICON.calendar, 'Fecha',      turno.fecha)}
          ${turnoRow(ICON.clock,    'Horario',     `${turno.hora_inicio} hs`)}
          ${turnoRow(ICON.scissors, 'Servicio',    turno.servicio)}
          ${turnoRow(ICON.user,     'Profesional', turno.profesional, !hasPrice)}
          ${hasPrice ? turnoRow(ICON.dollar, 'Precio', `$${turno.precio!.toLocaleString('es-AR')}`, true, true) : ''}
        </table>
      </td></tr>
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
    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      <tr>
        <td style="vertical-align:middle;">
          <span style="color:#111827;font-size:26px;font-weight:700;font-family:Georgia,Cambria,'Times New Roman',Times,serif;line-height:1.2;">¡Turno confirmado!</span>
        </td>
        <td style="vertical-align:middle;padding-left:12px;">
          <span style="display:inline-block;background:#58a36c;color:#ffffff;font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;line-height:1.3;white-space:nowrap;">&#10003; confirmed</span>
        </td>
      </tr>
    </table>
    <p style="color:#374151;font-size:15px;margin:0 0 4px;line-height:1.5;">
      Hola <strong>${turno.clienteNombre}</strong>, tu turno en
      <strong><em>${turno.peluqueria}</em></strong> quedó reservado.
    </p>
    ${turnoInfo(turno)}
    <p style="color:#6b7280;font-size:13.5px;text-align:center;margin:0;line-height:1.5;">
      En caso de no poder asistir, por favor cancelá tu turno desde la app con al menos 2 horas de anticipación.
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
    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      <tr>
        <td style="vertical-align:middle;">
          <span style="color:#111827;font-size:26px;font-weight:700;font-family:Georgia,Cambria,'Times New Roman',Times,serif;line-height:1.2;">Recordatorio de turno</span>
        </td>
        <td style="vertical-align:middle;padding-left:12px;">
          <span style="display:inline-block;background:#58a36c;color:#ffffff;font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;line-height:1.3;white-space:nowrap;">&#10003; confirmed</span>
        </td>
      </tr>
    </table>
    <p style="color:#374151;font-size:15px;margin:0 0 4px;line-height:1.5;">
      Hola <strong>${turno.clienteNombre}</strong>, te recordamos que mañana tenés turno
      en <strong><em>${turno.peluqueria}</em></strong>.
    </p>
    ${turnoInfo(turno)}
    <p style="color:#6b7280;font-size:13.5px;text-align:center;margin:0;line-height:1.5;">
      En caso de no poder asistir, por favor cancelá tu turno desde la app con al menos 2 horas de anticipación.
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
    <h2 style="color:#111827;font-size:22px;font-weight:700;font-family:Georgia,Cambria,'Times New Roman',Times,serif;margin:0 0 8px;">¡Tu turnero PLaiT está listo! 🎉</h2>
    <p style="color:#6b7280;font-size:15px;margin:0 0 20px;line-height:1.5;">
      Hola <strong style="color:#111827;">${data.nombre}</strong>, configuramos todo para
      <strong style="color:${BRAND_COLOR};">${data.nombre_negocio}</strong>.
      Ya podés ingresar a tu panel de administración.
    </p>

    <!-- Datos del turnero -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8f9fc;border-radius:12px;border:1px solid #eef2f6;padding:18px 20px;margin:0 0 20px;">
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
    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      <tr>
        <td style="vertical-align:middle;">
          <span style="color:#111827;font-size:26px;font-weight:700;font-family:Georgia,Cambria,'Times New Roman',Times,serif;line-height:1.2;">Turno cancelado</span>
        </td>
        <td style="vertical-align:middle;padding-left:12px;">
          <span style="display:inline-block;background:#ef4444;color:#ffffff;font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;line-height:1.3;white-space:nowrap;">&#10007; cancelled</span>
        </td>
      </tr>
    </table>
    <p style="color:#374151;font-size:15px;margin:0 0 4px;line-height:1.5;">
      Hola <strong>${turno.clienteNombre}</strong>, tu turno en
      <strong><em>${turno.peluqueria}</em></strong> fue cancelado.
    </p>
    ${turnoInfo(turno)}
    <p style="color:#6b7280;font-size:13.5px;text-align:center;margin:0;line-height:1.5;">
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
