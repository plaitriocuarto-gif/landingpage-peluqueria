import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth as useClerkAuth, AuthenticateWithRedirectCallback } from '@clerk/react';
import { useAuth } from './contexts/AuthContext';
import { FullPageLoader } from './components/ui/LoadingSpinner';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Registro } from './pages/Registro';
import { PagoExitoso } from './pages/PagoExitoso';
import { Booking } from './pages/Booking';
import { MyAppointments } from './pages/MyAppointments';
import { SlugPublic } from './pages/SlugPublic';
import { SlugAdmin } from './pages/SlugAdmin';
import { Dashboard } from './pages/admin/Dashboard';
import { StaffManagement } from './pages/admin/StaffManagement';
import { Schedules } from './pages/admin/Schedules';
import { Services } from './pages/admin/Services';
import { Appointments } from './pages/admin/Appointments';
import { Config } from './pages/admin/Config';
import { MySchedule } from './pages/staff/MySchedule';
import { AdminLayout } from './components/layout/Layout';

// Protege rutas de admin usando la sesión de Clerk
function RequireClerkAuth({ children }: { children: React.ReactElement }) {
  const { isSignedIn, isLoaded } = useClerkAuth();
  if (!isLoaded) return <FullPageLoader />;
  if (!isSignedIn) return <Navigate to="/acceso-admin" replace />;
  return children;
}

// Protege rutas de staff/cliente usando el JWT propio
function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactElement;
  roles?: string[];
}) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/acceso-admin" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />;

  return children;
}

function AdminRoutes() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="schedules" element={<Schedules />} />
        <Route path="services" element={<Services />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="config" element={<Config />} />
      </Routes>
    </AdminLayout>
  );
}

export default function App() {
  const { loading } = useAuth();

  if (loading) return <FullPageLoader />;

  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      {/* Formulario de registro pre-pago (landing → checkout) */}
      <Route path="/registro" element={<Registro />} />

      {/* Página de éxito/pendiente después del pago en Mercado Pago */}
      <Route path="/pago-exitoso" element={<PagoExitoso />} />

      {/* Ruta de login oculta para administradores internos */}
      <Route path="/acceso-admin" element={<Login />} />

      {/* Mantenemos /login como alias por compatibilidad interna */}
      <Route path="/login" element={<Navigate to="/acceso-admin" replace />} />

      <Route path="/register" element={<Register />} />

      {/* Reservas: accesible sin autenticación */}
      <Route path="/book" element={<Booking />} />

      <Route
        path="/my-appointments"
        element={
          <RequireAuth roles={['cliente']}>
            <MyAppointments />
          </RequireAuth>
        }
      />

      <Route
        path="/admin/*"
        element={
          <RequireClerkAuth>
            <AdminRoutes />
          </RequireClerkAuth>
        }
      />

      <Route
        path="/staff"
        element={
          <RequireAuth roles={['staff', 'admin']}>
            <MySchedule />
          </RequireAuth>
        }
      />

      {/* Callback de OAuth (Google, etc.) — Clerk redirige acá después de autenticar */}
      <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />

      {/* Rutas dinámicas por slug — DEBEN ir después de las rutas específicas */}
      <Route path="/:slug/admin" element={<SlugAdmin />} />
      <Route path="/:slug/book" element={<Booking />} />
      <Route path="/:slug" element={<SlugPublic />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
