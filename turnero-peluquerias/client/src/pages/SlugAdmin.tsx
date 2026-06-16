import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSignIn } from '@clerk/react';
import { supabase } from '../lib/supabase';

interface Negocio {
  id: string;
  nombre_negocio: string;
  slug: string;
  gmail: string;
  url_cliente: string;
  url_admin: string;
}

// ── Login de recuperación de contraseña ──────────────────────────────────────

function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [email, setEmail]       = useState('');
  const [status, setStatus]     = useState<'idle' | 'sent' | 'not-found' | 'error'>('idle');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/registro/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { sent?: boolean; error?: string };
      if (res.ok && data.sent) setStatus('sent');
      else if (res.status === 404) setStatus('not-found');
      else setStatus('error');
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-[#888] hover:text-[#555] flex items-center gap-1">
        ← Volver al login
      </button>
      <h2 className="text-lg font-bold text-[#111]" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
        Recuperar contraseña
      </h2>

      {status === 'sent' ? (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Te enviamos un email para restablecer tu contraseña. Revisá tu casilla.
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#555] mb-1.5">Gmail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@gmail.com"
              className="w-full bg-white border border-[#EAEAEA] rounded-lg px-4 py-2.5 text-[#111]
                placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#111]/20 focus:border-[#111]/30 transition-colors"
            />
          </div>

          {status === 'not-found' && (
            <p className="text-sm text-red-600">No encontramos una cuenta con ese Gmail.</p>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-600">Ocurrió un error. Intentá de nuevo.</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#111] hover:bg-[#222] disabled:opacity-50 text-white
              font-bold rounded-xl transition-all duration-200 text-sm active:scale-[0.98]"
          >
            {loading ? 'Enviando...' : 'Enviar email de recuperación'}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Panel admin del slug ─────────────────────────────────────────────────────

export function SlugAdmin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [negocio, setNegocio]   = useState<Negocio | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [view, setView]         = useState<'login' | 'forgot'>('login');

  const { signIn } = useSignIn();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;

    supabase
      .from('negocios')
      .select('id, nombre_negocio, slug, gmail, url_cliente, url_admin')
      .eq('slug', slug)
      .eq('estado', 'activo')
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setNegocio(data as Negocio);
        setLoading(false);
      });
  }, [slug]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    console.log('[handleLogin] Clic en Ingresar. signIn exists:', !!signIn);
    if (!signIn) {
      setAuthError('Error: El sistema de autenticación (Clerk) no ha cargado correctamente.');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        navigate('/admin');
      } else {
        setAuthError('No se pudo completar el inicio de sesión. Intentá de nuevo.');
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ message?: string; code?: string }> };
      const msg = clerkErr?.errors?.[0]?.message;
      if (clerkErr?.errors?.[0]?.code === 'form_password_incorrect') {
        setAuthError('Contraseña incorrecta.');
      } else if (clerkErr?.errors?.[0]?.code === 'form_identifier_not_found') {
        setAuthError('No encontramos una cuenta con ese Gmail.');
      } else {
        setAuthError(msg ?? 'Error al iniciar sesión. Intentá de nuevo.');
      }
    } finally {
      setAuthLoading(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-[#111] mb-2" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
          Panel no encontrado
        </h1>
        <p className="text-[#888] text-sm mb-6">No existe un negocio registrado con esa URL.</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2 bg-white border border-[#EAEAEA] hover:bg-[#F7F6F3] text-[#111] rounded-xl text-sm transition-colors"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  // ── Login form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#111]/5 border border-[#111]/10 flex items-center justify-center">
              <span className="text-[#111] font-black text-sm tracking-tighter">PL</span>
            </div>
            <span className="text-[#111]/60 text-sm font-semibold tracking-widest uppercase">PLaiT Admin</span>
          </div>
          <h1 className="text-xl font-bold text-[#111]" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
            {negocio?.nombre_negocio}
          </h1>
          <p className="text-[#888] text-xs mt-1">Panel de administración</p>
        </div>

        <div className="bg-white border border-[#EAEAEA] rounded-2xl p-8">
          {view === 'forgot' ? (
            <ForgotPassword onBack={() => setView('login')} />
          ) : (
            <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#555] mb-1.5">Gmail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@gmail.com"
                  className="w-full bg-white border border-[#EAEAEA] rounded-lg px-4 py-2.5 text-[#111]
                    placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#111]/20 focus:border-[#111]/30 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#555] mb-1.5">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Tu contraseña"
                  className="w-full bg-white border border-[#EAEAEA] rounded-lg px-4 py-2.5 text-[#111]
                    placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#111]/20 focus:border-[#111]/30 transition-colors"
                />
              </div>

              {authError && (
                <p className="text-sm text-red-600">{authError}</p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#111] hover:bg-[#222] disabled:opacity-50 text-white
                  font-bold rounded-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                {authLoading && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {authLoading ? 'Ingresando...' : 'Ingresar'}
              </button>

              {/* Separador */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-[#EAEAEA]" />
                <span className="text-xs text-[#BDBDBD]">o</span>
                <div className="flex-1 h-px bg-[#EAEAEA]" />
              </div>

              {/* Botón Google */}
              <button
                type="button"
                onClick={() => {
                  if (!signIn) return;
                  void signIn.authenticateWithRedirect({
                    strategy: 'oauth_google',
                    redirectUrl: '/sso-callback',
                    redirectUrlComplete: '/admin',
                  });
                }}
                className="w-full py-3 bg-white border border-[#EAEAEA] hover:bg-[#F7F6F3]
                  text-[#111] font-medium rounded-xl transition-all duration-200 active:scale-[0.98]
                  flex items-center justify-center gap-2.5 text-sm"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
                  <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
                </svg>
                Continuar con Google
              </button>

              <button
                type="button"
                onClick={() => setView('forgot')}
                className="w-full text-center text-xs text-[#888] hover:text-[#555] transition-colors pt-1"
              >
                Olvidé mi contraseña
              </button>
            </form>
          )}
        </div>

        {/* Link a vista pública */}
        <p className="text-center mt-8 text-xs text-[#888]">
          <Link to={`/${slug}`} className="hover:text-[#555] transition-colors">
            ← Ver turnero de {negocio?.nombre_negocio}
          </Link>
        </p>
      </div>
    </div>
  );
}
