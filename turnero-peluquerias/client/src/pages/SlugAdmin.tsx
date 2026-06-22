import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/react';
import { supabase } from '../lib/supabase';
import { LoginForm, PLBranding } from '../components/auth/shared';

interface Negocio {
  id: string;
  nombre_negocio: string;
  slug: string;
  gmail: string;
  url_cliente: string;
  url_admin: string;
}

export function SlugAdmin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useClerkAuth();

  const [negocio, setNegocio]   = useState<Negocio | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) navigate('/admin');
  }, [isLoaded, isSignedIn, navigate]);

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

  if (loading) return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-4xl mb-4">🔍</div>
      <h1 className="text-xl font-bold text-[#111] mb-2" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
        Panel no encontrado
      </h1>
      <p className="text-[#888] text-sm mb-6">No existe un negocio registrado con esa URL.</p>
      <button onClick={() => navigate('/')} className="px-5 py-2 bg-white border border-[#EAEAEA] hover:bg-[#F7F6F3] text-[#111] rounded-xl text-sm transition-colors">
        Ir al inicio
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <PLBranding />
          <h1 className="text-xl font-bold text-[#111]" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
            {negocio?.nombre_negocio}
          </h1>
          <p className="text-[#888] text-xs mt-1">Panel de administración</p>
        </div>
        <div className="bg-white border border-[#EAEAEA] rounded-2xl p-8">
          <LoginForm onSuccess={() => navigate('/admin')} />
        </div>
        <p className="text-center mt-8 text-xs text-[#888]">
          <Link to={`/${slug}`} className="hover:text-[#555] transition-colors">
            ← Ver turnero de {negocio?.nombre_negocio}
          </Link>
        </p>
      </div>
    </div>
  );
}
