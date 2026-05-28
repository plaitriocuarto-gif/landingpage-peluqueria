import React, { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConfig } from '../contexts/ConfigContext';
import { ToastContainer } from '../components/ui/Toast';

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
    </svg>
  );
}

function IconScissors() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="7.2" y1="6.8" x2="16.5" y2="16.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="7.2" y1="13.2" x2="16.5" y2="3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

const serifStyle: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  letterSpacing: '-0.03em',
};

export function Landing() {
  const { config } = useConfig();
  const navigate = useNavigate();

  const features = [
    {
      icon: <IconCalendar />,
      title: 'Reserva online',
      desc: 'Elegí tu turno en segundos, a cualquier hora.',
    },
    {
      icon: <IconScissors />,
      title: 'Profesionales',
      desc: 'Atención personalizada con años de experiencia.',
    },
    {
      icon: <IconClock />,
      title: 'Sin esperas',
      desc: 'Llegá a la hora exacta de tu turno.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6F3] text-[#111111]">
      {/* Header */}
      <header className="bg-white border-b border-[#EAEAEA] sticky top-0 z-40 h-14 flex items-center">
        <div className="max-w-4xl mx-auto px-4 w-full flex items-center">
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-70 transition-opacity duration-150"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="5" cy="5" r="2.5" stroke="#111111" strokeWidth="1.3" />
              <circle cx="5" cy="15" r="2.5" stroke="#111111" strokeWidth="1.3" />
              <line x1="7.2" y1="6.8" x2="16.5" y2="16.5" stroke="#111111" strokeWidth="1.3" strokeLinecap="round" />
              <line x1="7.2" y1="13.2" x2="16.5" y2="3.5" stroke="#111111" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span
              style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}
              className="text-lg text-[#111111]"
            >
              {config.nombre ?? 'Peluquería'}
            </span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20 step-entry">
        <p className="text-xs tracking-widest uppercase text-[#999999] mb-6 font-medium">
          Reservá tu turno online
        </p>

        <h1 style={serifStyle} className="text-5xl sm:text-7xl text-[#111111] leading-none mb-6 max-w-xl">
          {config.nombre ?? 'Peluquería'}
        </h1>

        {config.descripcion && (
          <p className="text-[#666666] text-base sm:text-lg max-w-sm mx-auto mb-10 leading-relaxed">
            {config.descripcion}
          </p>
        )}

        <button
          onClick={() => navigate('/book')}
          className="mt-2 px-10 py-3.5 bg-[#111111] text-white text-sm font-semibold
            rounded-md hover:bg-[#222222] active:scale-[0.98]
            transition-all duration-150 tracking-wide"
        >
          Reservar turno
        </button>
      </main>

      {/* Feature cards */}
      <section className="max-w-3xl mx-auto w-full px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {features.map((item, i) => (
            <div
              key={item.title}
              className="stagger-item bg-white border border-[#EAEAEA] rounded-lg p-6"
              style={{ '--index': i } as React.CSSProperties}
            >
              <div className="text-[#666666] mb-3">{item.icon}</div>
              <h3 className="font-semibold text-[#111111] text-sm mb-1">{item.title}</h3>
              <p className="text-[#999999] text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-7 px-6 border-t border-[#EAEAEA] flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
        <a
          href="https://instagram.com/plait.agency"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[#BBBBBB] hover:text-[#555555] transition-colors text-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
          @plait.agency
        </a>

        <span className="hidden sm:block text-[#DDDDDD]">|</span>

        <a
          href="mailto:plaitriocuarto@gmail.com"
          className="flex items-center gap-2 text-[#BBBBBB] hover:text-[#555555] transition-colors text-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          plaitriocuarto@gmail.com
        </a>
      </footer>

      <ToastContainer />
    </div>
  );
}
