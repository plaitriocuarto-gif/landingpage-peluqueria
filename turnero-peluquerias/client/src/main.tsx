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

// Sincroniza Clerk con el interceptor de axios: admin usa token Clerk, staff/clientes caen a localStorage JWT.
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
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string} signInUrl="/admin-login" signUpUrl="/registro">
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
