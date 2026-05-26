import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../contexts/ConfigContext';
import { ToastContainer } from '../components/ui/Toast';

export function Landing() {
  const { config } = useConfig();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#0D215B]">
      {/* Header */}
      <header className="px-6 sm:px-10 py-5 flex items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
            <span className="text-white font-black text-sm tracking-tighter">PL</span>
          </div>
          <span className="text-white/50 text-sm font-semibold tracking-widest uppercase">
            PLaiT
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-16">
        <div
          className="text-6xl sm:text-7xl mb-8 select-none"
          role="img"
          aria-label="logo"
        >
          {config.logo ?? '✂️'}
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight tracking-tight mb-4 max-w-xl">
          {config.nombre ?? 'Peluquería'}
        </h1>

        {config.descripcion && (
          <p className="text-white/55 text-base sm:text-lg max-w-md mx-auto mb-10 leading-relaxed">
            {config.descripcion}
          </p>
        )}

        <button
          onClick={() => navigate('/book')}
          className="mt-2 px-12 py-4 bg-white text-[#0D215B] font-bold text-base sm:text-lg
            rounded-xl shadow-xl hover:bg-white/92 active:scale-[0.97]
            transition-all duration-200 tracking-wide"
        >
          Reservar turno
        </button>

        {/* Feature cards */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
          {[
            {
              icon: '📅',
              title: 'Reserva online',
              desc: 'Elegí tu turno en segundos, a cualquier hora.',
            },
            {
              icon: '✂️',
              title: 'Profesionales',
              desc: 'Nuestros peluqueros con años de experiencia.',
            },
            {
              icon: '⏰',
              title: 'Sin esperas',
              desc: 'Llegá a la hora exacta de tu turno.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-white text-base mb-1">{item.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-7 px-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
        <a
          href="https://instagram.com/plait.agency"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
          @plait.agency
        </a>

        <span className="hidden sm:block text-white/15">|</span>

        <a
          href="mailto:plaitriocuarto@gmail.com"
          className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
