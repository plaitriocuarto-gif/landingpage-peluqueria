import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth as useClerkAuth, HandleSSOCallback } from '@clerk/react';
import { useAuth } from './contexts/AuthContext';
import { FullPageLoader } from './components/ui/LoadingSpinner';
import { Landing } from './pages/Landing';
import { Register } from './pages/Register';
import { Registro } from './pages/Registro';
import { PagoExitoso } from './pages/PagoExitoso';
import { Booking } from './pages/Booking';
import { MyAppointments } from './pages/MyAppointments';
import { SlugPublic } from './pages/SlugPublic';
import { SlugAdmin } from './pages/SlugAdmin';
import { AdminLogin } from './pages/AdminLogin';
import { Dashboard } from './pages/admin/Dashboard';
import { StaffManagement } from './pages/admin/StaffManagement';
import { Schedules } from './pages/admin/Schedules';
import { Services } from './pages/admin/Services';
import { Appointments } from './pages/admin/Appointments';
import { Config } from './pages/admin/Config';
import { MySchedule } from './pages/staff/MySchedule';
import { AdminLayout } from './components/layout/Layout';

// HandleSSOCallback en lugar de AuthenticateWithRedirectCallback: la API signIn.sso/finalize
// no completa correctamente con el componente legacy.
function SsoCallback() {
  const navigate = useNavigate();
  return (
    <HandleSSOCallback
      navigateToApp={({ decorateUrl }) => {
        const destination = decorateUrl('/admin');
        if (destination.startsWith('http')) {
          window.location.href = destination;
        } else {
          navigate(destination);
        }
      }}
      navigateToSignIn={() => navigate('/admin-login')}
      navigateToSignUp={() => navigate('/admin')}
    />
  );
}

function RequireClerkAuth({ children }: { children: React.ReactElement }) {
  const { isSignedIn, isLoaded } = useClerkAuth();
  if (!isLoaded) return <FullPageLoader />;
  if (!isSignedIn) return <Navigate to="/admin-login" replace />;
  return children;
}

function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactElement;
  roles?: string[];
}) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/" replace />;
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

      <Route path="/registro" element={<Registro />} />
      <Route path="/pago-exitoso" element={<PagoExitoso />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/admin-login" element={<AdminLogin />} />
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

      <Route path="/sso-callback" element={<SsoCallback />} />

      {/* Rutas por slug — deben ir después de las rutas específicas */}
      <Route path="/:slug/admin" element={<SlugAdmin />} />
      <Route path="/:slug/book" element={<Booking />} />
      <Route path="/:slug" element={<SlugPublic />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
