import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Clerk llama a esta función para inyectar getToken() en el interceptor.
// Se setea desde ClerkTokenSync en main.tsx una vez que Clerk está listo.
let _getClerkToken: (() => Promise<string | null>) | null = null;

export function setClerkTokenProvider(fn: (() => Promise<string | null>) | null) {
  _getClerkToken = fn;
}

apiClient.interceptors.request.use(async (config) => {
  // Prioridad: token de Clerk (admins) → JWT en localStorage (staff/clientes)
  const token = _getClerkToken
    ? await _getClerkToken()
    : localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !_getClerkToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
