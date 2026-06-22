import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/react';
import { LoginForm, PLBranding } from '../components/auth/shared';

export function AdminLogin() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useClerkAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) navigate('/admin', { replace: true });
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <PLBranding />
          <h1 className="text-xl font-bold text-[#111]" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
            Panel de administración
          </h1>
          <p className="text-[#888] text-xs mt-1">Ingresá con tu cuenta PLaiT</p>
        </div>
        <div className="bg-white border border-[#EAEAEA] rounded-2xl p-8">
          <LoginForm onSuccess={() => navigate('/admin', { replace: true })} />
        </div>
      </div>
    </div>
  );
}
