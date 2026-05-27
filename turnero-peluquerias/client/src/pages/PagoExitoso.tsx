import React from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Página mostrada después de que el usuario completa (o cancela) el pago en Mercado Pago.
 *
 * Mercado Pago redirige acá con query params:
 *   - status           : 'approved' | 'pending' | 'rejected'
 *   - collection_status: igual que status
 *   - payment_id       : ID del pago en MP
 *   - external_reference: nuestro registroId
 *
 * También se usa cuando el pago está pendiente (?pending=1) desde back_urls.pending.
 */
export function PagoExitoso() {
  const [params] = useSearchParams();

  const status    = params.get('status') ?? params.get('collection_status');
  const isPending = params.get('pending') === '1' || status === 'pending';
  const isApproved = status === 'approved' || (!isPending && status !== 'rejected');

  const BRAND = '#0D215B';

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">

        {/* Logo */}
        <div className="inline-flex items-center gap-2.5 mb-8">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: BRAND }}
          >
            <span className="font-black text-sm tracking-tighter text-white">PL</span>
          </div>
          <span className="text-white/70 text-sm font-semibold tracking-widest uppercase">PLaiT</span>
        </div>

        {/* ── Pago aprobado ── */}
        {isApproved && (
          <>
            {/* Ícono de éxito */}
            <div className="relative mx-auto mb-6 w-24 h-24">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(16, 185, 129, 0.15)', border: '2px solid rgba(16, 185, 129, 0.4)' }}
              >
                <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">¡Pago exitoso!</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Tu PLaiT está siendo configurado. <br />
              En unos <strong className="text-gray-200">minutos recibirás un email</strong> con tu usuario y contraseña para acceder al panel de administración.
            </p>

            {/* Box informativo */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8 text-left space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📧</span>
                <p className="text-sm text-gray-400 leading-relaxed">
                  <strong className="text-gray-200">Revisá tu correo</strong> (también la carpeta de spam). Te enviamos las credenciales para entrar al panel.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔗</span>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Tu agenda quedará disponible en{' '}
                  <strong className="text-gray-200">turnosonlineplait.com/tu-negocio</strong>{' '}
                  para que tus clientes reserven.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">💬</span>
                <p className="text-sm text-gray-400 leading-relaxed">
                  ¿Necesitás ayuda? Escribinos por{' '}
                  <a
                    href="https://wa.me/5492664000000"
                    className="text-emerald-400 hover:text-emerald-300 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>{' '}
                  y te asistimos al instante.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── Pago pendiente ── */}
        {isPending && !isApproved && (
          <>
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(234, 179, 8, 0.15)', border: '2px solid rgba(234, 179, 8, 0.4)' }}
            >
              <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Pago pendiente</h1>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Tu pago está siendo procesado por Mercado Pago. Una vez confirmado,
              recibirás un email con tus credenciales automáticamente.
            </p>
          </>
        )}

        {/* Pasos siguientes */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-600 mb-8">
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
            Datos
          </span>
          <span className="flex-1 max-w-[40px] h-px bg-gray-700" />
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
            Pago
          </span>
          <span className="flex-1 max-w-[40px] h-px bg-gray-700" />
          <span className="flex items-center gap-1">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: isApproved ? '#0D215B' : undefined }}
            >
              {isApproved ? <span className="text-white">✓</span> : <span className="text-gray-500">3</span>}
            </span>
            <span className={isApproved ? 'text-white' : 'text-gray-600'}>¡Listo!</span>
          </span>
        </div>

        <a
          href="https://plait.app"
          className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          ← Volver al inicio
        </a>
      </div>
    </div>
  );
}
