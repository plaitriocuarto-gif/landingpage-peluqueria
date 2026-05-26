import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
      <button onClick={onBack} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
        ← Volver al login
      </button>
      <h2 className="text-lg font-bold text-gray-100">Recuperar contraseña</h2>

      {status === 'sent' ? (
        <div className="rounded-lg bg-green-900/40 border border-green-700 px-4 py-3 text-sm text-green-300">
          Te enviamos un email para restablecer tu contraseña. Revisá tu casilla.
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Gmail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@gmail.com"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100
                placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {status === 'not-found' && (
            <p className="text-sm text-red-400">No encontramos una cuenta con ese Gmail.</p>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-400">Ocurrió un error. Intentá de nuevo.</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#0D215B] hover:opacity-90 disabled:opacity-50 text-white
              font-bold rounded-lg transition-opacity text-sm"
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

  // Autenticación local (se delegará a Clerk en el flujo real)
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
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
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { token?: string; user?: { rol: string }; error?: string };

      if (!res.ok || !data.token) {
        setAuthError(data.error ?? 'Credenciales incorrectas');
        return;
      }

      // Guardar el token JWT y redirigir al panel admin
      localStorage.setItem('token', data.token);
      navigate('/admin');
    } catch {
      setAuthError('Error de conexión. Intentá de nuevo.');
    } finally {
      setAuthLoading(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-gray-100 mb-2">Panel no encontrado</h1>
        <p className="text-gray-500 text-sm mb-6">No existe un negocio registrado con esa URL.</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  // ── Login form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#0D215B] border border-white/10 flex items-center justify-center">
              <span className="text-white font-black text-xs">PL</span>
            </div>
            <span className="text-gray-500 text-xs font-semibold tracking-widest uppercase">PLaiT Admin</span>
          </div>
          <h1 className="text-xl font-bold text-gray-100">{negocio?.nombre_negocio}</h1>
          <p className="text-gray-500 text-xs mt-1">Panel de administración</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-7">
          {view === 'forgot' ? (
            <ForgotPassword onBack={() => setView('login')} />
          ) : (
            <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Gmail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@gmail.com"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100
                    placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Tu contraseña"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100
                    placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              {authError && (
                <p className="text-sm text-red-400">{authError}</p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#0D215B] hover:opacity-90 disabled:opacity-50 text-white
                  font-bold rounded-xl transition-opacity"
              >
                {authLoading ? 'Ingresando...' : 'Ingresar'}
              </button>

              <button
                type="button"
                onClick={() => setView('forgot')}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors pt-1"
              >
                Olvidé mi contraseña
              </button>
            </form>
          )}
        </div>

        {/* Link a vista pública */}
        <p className="text-center mt-4 text-xs text-gray-600">
          <Link to={`/${slug}`} className="hover:text-gray-400 transition-colors">
            ← Ver turnero de {negocio?.nombre_negocio}
          </Link>
        </p>
      </div>
    </div>
  );
}
