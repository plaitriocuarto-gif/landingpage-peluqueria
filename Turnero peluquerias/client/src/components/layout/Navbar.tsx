import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { Button } from '../ui/Button';

export function Navbar() {
  const { user, logout } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-[#0D215B] border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
          >
            <span className="text-2xl" role="img" aria-label="logo">
              {config.logo ?? '✂️'}
            </span>
            <span className="font-bold text-lg hidden sm:block">
              {config.nombre ?? 'Peluquería'}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-white/50 hidden sm:block">{user.nombre}</span>

                {user.rol === 'admin' && (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                    Dashboard
                  </Button>
                )}

                {user.rol === 'staff' && (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/staff')}>
                    Mi Agenda
                  </Button>
                )}

                {user.rol === 'cliente' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/book')}>
                      Reservar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/my-appointments')}
                    >
                      Mis Turnos
                    </Button>
                  </>
                )}

                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Salir
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
