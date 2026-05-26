import apiClient from './client';
import { User } from '../types';

interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  register: (data: { email: string; password: string; nombre: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  registerAdmin: (data: {
    email: string;
    password: string;
    nombre: string;
    setupSecret: string;
  }) => apiClient.post<AuthResponse>('/auth/register-admin', data).then((r) => r.data),

  me: () => apiClient.get<User>('/auth/me').then((r) => r.data),
};
