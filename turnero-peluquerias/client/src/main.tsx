import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { setClerkTokenProvider } from './api/client';
import App from './App';
import './index.css';

// Mantiene el proveedor de tokens de Clerk sincronizado con el interceptor de axios.
// Cuando el admin está logueado con Clerk, cada request usa su token fresco.
// Cuando no hay sesión Clerk (staff/clientes con JWT), _getClerkToken queda en null
// y el interceptor cae al token de localStorage.
function ClerkTokenSync() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      setClerkTokenProvider(() => getToken());
    } else {
      setClerkTokenProvider(null);
    }
  }, [isSignedIn, getToken]);

  return null;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}>
      <BrowserRouter>
        <ClerkTokenSync />
        <AuthProvider>
          <ConfigProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </ConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
