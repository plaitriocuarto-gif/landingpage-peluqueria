import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfig } from '../contexts/ConfigContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const { config } = useConfig();
  const navigate = useNavigate();

  if (user) {
    if (user.rol === 'admin') navigate('/admin', { replace: true });
    else if (user.rol === 'staff') navigate('/staff', { replace: true });
    else navigate('/', { replace: true });
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showToast('Bienvenido/a', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      showToast(msg ?? 'Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D215B] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* PLaiT logo */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="text-white font-black text-sm tracking-tighter">PL</span>
            </div>
            <span className="text-white/50 text-sm font-semibold tracking-widest uppercase">
              PLaiT
            </span>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="text-4xl mb-3">{config.logo ?? '✂️'}</div>
          <h1 className="text-xl font-bold text-white">{config.nombre ?? 'Peluquería'}</h1>
          <p className="text-white/40 text-sm mt-1">Panel de administración</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@peluqueria.com"
                className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5
                  text-white placeholder-white/20 focus:outline-none focus:ring-2
                  focus:ring-white/30 focus:border-white/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••"
                className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5
                  text-white placeholder-white/20 focus:outline-none focus:ring-2
                  focus:ring-white/30 focus:border-white/30 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 bg-white text-[#0D215B] font-bold rounded-xl
                hover:bg-white/90 active:scale-[0.98] transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              Ingresar
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-8">
          Sistema de turnos · PLaiT Agency
        </p>
      </div>
    </div>
  );
}
