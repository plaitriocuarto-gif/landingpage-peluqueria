import React, { useRef, useState } from 'react';
import { useSignIn, useClerk } from '@clerk/react';

export const inputCls = 'w-full bg-white border border-[#EAEAEA] rounded-lg px-4 py-2.5 text-[#111] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#111]/20 focus:border-[#111]/30 transition-colors';
export const btnCls   = 'w-full py-3 bg-[#111] hover:bg-[#222] disabled:opacity-50 text-white font-bold rounded-xl transition-all duration-200 text-sm active:scale-[0.98]';

export function BtnSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function GoogleSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" />
    </svg>
  );
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-[#EAEAEA]" />
      <span className="text-xs text-[#BDBDBD]">o</span>
      <div className="flex-1 h-px bg-[#EAEAEA]" />
    </div>
  );
}

export function PLBranding() {
  return (
    <div className="flex items-center justify-center gap-2 mb-3">
      <div className="w-9 h-9 rounded-lg bg-[#111]/5 border border-[#111]/10 flex items-center justify-center">
        <span className="text-[#111] font-black text-sm tracking-tighter">PL</span>
      </div>
      <span className="text-[#111]/60 text-sm font-semibold tracking-widest uppercase">PLaiT Admin</span>
    </div>
  );
}

export function clerkError(err: unknown): string {
  const e = err as { errors?: Array<{ code?: string; message?: string }> };
  const code = e?.errors?.[0]?.code ?? '';
  const map: Record<string, string> = {
    form_password_incorrect:        'Contraseña incorrecta.',
    form_identifier_not_found:      'No encontramos una cuenta con ese Gmail.',
    form_code_incorrect:            'Código incorrecto. Revisá tu email.',
    form_code_expired:              'El código expiró. Pedí uno nuevo.',
    form_password_pwned:            'Esa contraseña es muy común. Elegí una más segura.',
    form_password_length_too_short: 'La contraseña debe tener al menos 8 caracteres.',
    form_password_no_uppercase:     'La contraseña debe incluir al menos una mayúscula.',
    form_password_no_lowercase:     'La contraseña debe incluir al menos una minúscula.',
    form_password_no_numbers:       'La contraseña debe incluir al menos un número.',
    too_many_requests:              'Demasiados intentos. Esperá unos minutos.',
    network_error:                  'Error de conexión. Revisá tu internet.',
    session_exists:                 'Ya tenés una sesión activa.',
  };
  return map[code] ?? e?.errors?.[0]?.message ?? (err instanceof Error ? err.message : 'Ocurrió un error. Intentá de nuevo.');
}

function ForgotPassword({ onBack }: { onBack: () => void }) {
  const clerk = useClerk();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signInRef = useRef<any>(null);
  const [step, setStep]               = useState<'email' | 'code' | 'done'>('email');
  const [email, setEmail]             = useState('');
  const [code, setCode]               = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const si = clerk.client?.signIn;
      if (!si) throw new Error('Clerk no disponible');
      signInRef.current = si;
      await si.create({ strategy: 'reset_password_email_code', identifier: email });
      setStep('code');
    } catch (err) { setError(clerkError(err)); }
    finally { setLoading(false); }
  }

  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPwd) { setError('Las contraseñas no coinciden.'); return; }
    setError(''); setLoading(true);
    try {
      const si = signInRef.current ?? clerk.client?.signIn;
      if (!si) throw new Error('Clerk no disponible');
      await si.attemptFirstFactor({ strategy: 'reset_password_email_code', code });
      await si.resetPassword({ password: newPassword, signOutOfOtherSessions: false });
      setStep('done');
    } catch (err) { setError(clerkError(err)); }
    finally { setLoading(false); }
  }

  const eyeBtn = (
    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#555]">
      <EyeIcon open={showPwd} />
    </button>
  );

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-[#888] hover:text-[#555] flex items-center gap-1">← Volver al login</button>
      <h2 className="text-lg font-bold text-[#111]" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>Recuperar contraseña</h2>
      {step === 'done' ? (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Contraseña actualizada. <button onClick={onBack} className="font-medium underline">Volver al login</button>
        </div>
      ) : step === 'email' ? (
        <form onSubmit={(e) => void handleEmail(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#555] mb-1.5">Gmail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@gmail.com" className={inputCls} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className={btnCls}>{loading ? 'Enviando...' : 'Enviar código'}</button>
        </form>
      ) : (
        <form onSubmit={(e) => void handleCode(e)} className="space-y-4">
          <p className="text-sm text-[#555]">Código enviado a <strong>{email}</strong>.</p>
          <div>
            <label className="block text-sm font-medium text-[#555] mb-1.5">Código</label>
            <input type="text" inputMode="numeric" value={code} onChange={e => setCode(e.target.value)} required placeholder="123456" maxLength={6} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#555] mb-1.5">Nueva contraseña</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} placeholder="Mínimo 8 caracteres" className={inputCls + ' pr-10'} />
              {eyeBtn}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#555] mb-1.5">Repetir contraseña</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required minLength={8} placeholder="Repetí la contraseña" className={inputCls + ' pr-10'} />
              {eyeBtn}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className={btnCls}>{loading ? 'Verificando...' : 'Cambiar contraseña'}</button>
        </form>
      )}
    </div>
  );
}

// Formulario de login completo con sub-flujo de recuperación de contraseña.
// onSuccess se llama cuando el login se completa — el padre decide a dónde navegar.
export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { signIn } = useSignIn();
  const clerk = useClerk();
  const [view, setView]               = useState<'login' | 'forgot'>('login');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { error: createError } = await signIn.create({ identifier: email, password });
      if (createError) {
        if (createError.code === 'identifier_already_signed_in' || createError.message?.toLowerCase().includes('already signed in')) {
          onSuccess(); return;
        }
        setError(clerkError({ errors: [createError] })); return;
      }
      if (signIn.status === 'complete') {
        await clerk.setActive({ session: signIn.createdSessionId });
        onSuccess();
      } else {
        setError('No se pudo completar el inicio de sesión. Intentá de nuevo.');
      }
    } catch (err) { setError(clerkError(err)); }
    finally { setLoading(false); }
  }

  async function handleGoogle() {
    setError(''); setGoogleLoading(true);
    try {
      await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback`,
      });
    } catch (err) { setError(clerkError(err)); setGoogleLoading(false); }
  }

  if (view === 'forgot') return <ForgotPassword onBack={() => setView('login')} />;

  return (
    <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#555] mb-1.5">Gmail</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@gmail.com" className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#555] mb-1.5">Contraseña</label>
        <div className="relative">
          <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Tu contraseña" className={inputCls + ' pr-10'} />
          <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#555]">
            <EyeIcon open={showPwd} />
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className={`${btnCls} flex items-center justify-center gap-2`}>
        {loading && <BtnSpinner />}
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
      <Divider />
      <button
        type="button"
        onClick={() => void handleGoogle()}
        disabled={googleLoading}
        className="w-full py-3 bg-white border border-[#EAEAEA] hover:bg-[#F7F6F3] disabled:opacity-50 text-[#111] font-medium rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5 text-sm"
      >
        {googleLoading ? <BtnSpinner /> : <GoogleSvg />}
        {googleLoading ? 'Conectando...' : 'Continuar con Google'}
      </button>
      <button type="button" onClick={() => setView('forgot')} className="w-full text-center text-xs text-[#888] hover:text-[#555] transition-colors pt-1">
        Olvidé mi contraseña
      </button>
    </form>
  );
}
