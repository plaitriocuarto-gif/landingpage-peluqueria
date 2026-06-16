import React, { useState, useEffect, useRef, FormEvent } from 'react';
import axios from 'axios';

const COUNTRY_CODES = [
  { code: '+54', flag: '🇦🇷', name: 'Argentina' },
  { code: '+55', flag: '🇧🇷', name: 'Brasil' },
  { code: '+56', flag: '🇨🇱', name: 'Chile' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+51', flag: '🇵🇪', name: 'Perú' },
  { code: '+57', flag: '🇨🇴', name: 'Colombia' },
  { code: '+52', flag: '🇲🇽', name: 'México' },
  { code: '+34', flag: '🇪🇸', name: 'España' },
];

const BRAND = '#0D215B';

function toSlugPreview(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface FieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  suffix?: React.ReactNode;
}

function Field({ label, type = 'text', value, onChange, placeholder, required, error, hint, suffix }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className={`w-full bg-gray-700 border rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500
            focus:outline-none focus:ring-2 focus:border-transparent transition-colors
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-violet-500'}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export function Registro() {
  const [nombre, setNombre]               = useState('');
  const [apellido, setApellido]           = useState('');
  const [phoneCode, setPhoneCode]         = useState('+54');
  const [telefono, setTelefono]           = useState('');
  const [gmail, setGmail]                 = useState('');
  const [nombreNegocio, setNombreNegocio] = useState('');

  const [slugPreview, setSlugPreview]     = useState('');
  const [slugStatus, setSlugStatus]       = useState<SlugStatus>('idle');

  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Genera preview del slug y verifica disponibilidad con debounce
  useEffect(() => {
    const slug = toSlugPreview(nombreNegocio);
    setSlugPreview(slug);

    if (!slug) {
      setSlugStatus('idle');
      return;
    }

    setSlugStatus('checking');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await axios.get<{ available: boolean }>(`/api/registro/check-slug?slug=${encodeURIComponent(slug)}`);
        setSlugStatus(data.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('error');
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nombreNegocio]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) newErrors.nombre = 'Campo obligatorio';
    if (!apellido.trim()) newErrors.apellido = 'Campo obligatorio';
    if (!telefono.trim()) newErrors.telefono = 'Campo obligatorio';
    else if (!/^\d+$/.test(telefono)) newErrors.telefono = 'Solo números, sin espacios ni guiones';
    if (!gmail.trim()) newErrors.gmail = 'Campo obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmail)) newErrors.gmail = 'Ingresá un Gmail válido';
    if (!nombreNegocio.trim()) newErrors.nombreNegocio = 'Campo obligatorio';
    if (slugStatus === 'taken') newErrors.nombreNegocio = 'Ese nombre ya está en uso. Probá con una variación.';
    if (slugStatus === 'checking') newErrors.nombreNegocio = 'Esperá mientras verificamos disponibilidad...';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await axios.post<{ registroId: string; checkoutUrl: string }>('/api/registro', {
        nombre,
        apellido,
        telefono: `${phoneCode}${telefono}`,
        gmail,
        nombre_negocio: nombreNegocio,
      });

      // Redirigir al checkout de Tienda Nube
      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setServerError(msg ?? 'Ocurrió un error. Por favor intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const slugSuffix = (
    <span className="text-xs">
      {slugStatus === 'checking' && <span className="text-gray-400">...</span>}
      {slugStatus === 'available' && <span className="text-green-400">✓</span>}
      {slugStatus === 'taken' && <span className="text-red-400">✗</span>}
    </span>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2.5 mb-5"
            style={{ color: 'white' }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: BRAND }}
            >
              <span className="font-black text-sm tracking-tighter">PL</span>
            </div>
            <span className="text-white/70 text-sm font-semibold tracking-widest uppercase">PLaiT</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Crear mi turnero</h1>
          <p className="text-gray-400 mt-2 text-sm leading-relaxed">
            Completá tus datos. Después del pago, tu sistema queda activo al instante.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5" noValidate>

            {/* Nombre y Apellido en fila */}
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Nombre"
                value={nombre}
                onChange={setNombre}
                placeholder="Juan"
                required
                error={errors.nombre}
              />
              <Field
                label="Apellido"
                value={apellido}
                onChange={setApellido}
                placeholder="García"
                required
                error={errors.apellido}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Teléfono</label>
              <div className="flex gap-2">
                <select
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                    text-sm shrink-0"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                  placeholder="3585006177"
                  required
                  className={`flex-1 bg-gray-700 border rounded-lg px-4 py-2.5 text-gray-100
                    placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors
                    ${errors.telefono ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-violet-500'}`}
                />
              </div>
              {errors.telefono && <p className="mt-1 text-xs text-red-400">{errors.telefono}</p>}
              {!errors.telefono && <p className="mt-1 text-xs text-gray-500">Sin el 0 inicial ni el 15</p>}
            </div>

            <Field
              label="Gmail"
              type="email"
              value={gmail}
              onChange={setGmail}
              placeholder="tu@gmail.com"
              required
              error={errors.gmail}
              hint="Este será tu usuario para acceder al panel admin"
            />

            {/* Nombre del negocio + preview de slug */}
            <div>
              <Field
                label="Nombre del negocio"
                value={nombreNegocio}
                onChange={setNombreNegocio}
                placeholder='Ej: "La Barbería" o "Estudio Meli"'
                required
                error={errors.nombreNegocio}
                suffix={slugSuffix}
              />
              {slugPreview && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <span>Tu URL:</span>
                  <span className="font-mono text-gray-400">
                    turnosonlineplait.com/<span
                      className={
                        slugStatus === 'available' ? 'text-green-400' :
                        slugStatus === 'taken' ? 'text-red-400' : 'text-gray-300'
                      }
                    >{slugPreview}</span>
                  </span>
                </div>
              )}
            </div>

            {serverError && (
              <div className="rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || slugStatus === 'checking' || slugStatus === 'taken'}
              className="w-full mt-2 py-3 rounded-xl font-bold text-base transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:opacity-90 active:scale-[0.98]"
              style={{ background: BRAND, color: 'white' }}
            >
              {loading ? 'Procesando...' : 'Continuar al pago →'}
            </button>

            <p className="text-center text-xs text-gray-500">
              Al continuar serás redirigido a Tienda Nube para completar el pago de forma segura.
            </p>
          </form>
        </div>

        {/* Steps indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold">1</span>
            Datos
          </span>
          <span className="flex-1 max-w-[40px] h-px bg-gray-700" />
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-gray-700 text-gray-500 flex items-center justify-center text-xs font-bold">2</span>
            Pago
          </span>
          <span className="flex-1 max-w-[40px] h-px bg-gray-700" />
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-gray-700 text-gray-500 flex items-center justify-center text-xs font-bold">3</span>
            ¡Listo!
          </span>
        </div>
      </div>
    </div>
  );
}
