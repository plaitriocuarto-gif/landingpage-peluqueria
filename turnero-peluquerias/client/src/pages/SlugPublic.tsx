import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Negocio {
  id: string;
  nombre_negocio: string;
  slug: string;
  url_admin: string;
}

export function SlugPublic() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    supabase
      .from('negocios')
      .select('id, nombre_negocio, slug, url_admin')
      .eq('slug', slug)
      .eq('estado', 'activo')
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setNegocio(data as Negocio);
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">✂️</div>
        <h1 className="text-2xl font-bold text-[#111] mb-2" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
          Negocio no encontrado
        </h1>
        <p className="text-[#787774] mb-6">No existe un turnero con esa dirección.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-white border border-[#EAEAEA] hover:bg-[#F7F6F3] text-[#111] rounded-xl text-sm font-medium transition-colors"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  // Vista pública del negocio — el sistema de reservas se carga aquí.
  // Esta página actúa como punto de entrada para los clientes del negocio.
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6F3]">

      {/* Header */}
      <header className="px-6 sm:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#111]/5 border border-[#111]/10 flex items-center justify-center">
            <span className="text-[#111] font-black text-sm tracking-tighter">PL</span>
          </div>
          <span className="text-[#111]/60 text-sm font-semibold tracking-widest uppercase">
            PLaiT
          </span>
        </div>
        <a
          href={`/${slug}/admin`}
          className="text-[#111]/30 hover:text-[#111]/60 text-xs transition-colors"
        >
          Admin
        </a>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-16">
        <div className="text-6xl mb-6">✂️</div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111] leading-tight tracking-tight mb-4" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
          {negocio?.nombre_negocio}
        </h1>

        <p className="text-[#787774] text-base mb-10">
          Reservá tu turno en segundos, sin llamadas.
        </p>

        <button
          onClick={() => navigate(`/${slug}/book`)}
          className="px-12 py-4 bg-[#111] text-white font-bold text-base sm:text-lg
            rounded-xl shadow-md hover:bg-[#333] active:scale-[0.97]
            transition-all duration-200 tracking-wide"
        >
          Reservar turno
        </button>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          {[
            { icon: '📅', title: 'Reserva online', desc: 'Elegí tu turno en segundos.' },
            { icon: '✂️', title: 'Profesionales', desc: 'Expertos en su oficio.' },
            { icon: '⏰', title: 'Sin esperas', desc: 'Llegá a tu hora exacta.' },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white border border-[#EAEAEA] rounded-2xl p-5 text-center"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3 className="font-semibold text-[#111] text-sm mb-1">{item.title}</h3>
              <p className="text-[#787774] text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 px-6 border-t border-[#EAEAEA] text-center">
        <p className="text-[#888] text-xs">
          Powered by{' '}
          <a
            href="https://instagram.com/plait.agency"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#555] transition-colors"
          >
            PLaiT
          </a>
        </p>
      </footer>
    </div>
  );
}
