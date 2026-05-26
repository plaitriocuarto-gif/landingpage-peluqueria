import apiClient from './client';
import { Staff, StaffSchedule, StaffException } from '../types';

export const staffApi = {
  list: () => apiClient.get<Staff[]>('/staff').then((r) => r.data),
  listAll: () => apiClient.get<Staff[]>('/staff/all').then((r) => r.data),

  create: (data: { nombre: string; avatar: string }) =>
    apiClient.post<Staff>('/staff', data).then((r) => r.data),

  update: (id: number, data: Partial<Staff>) =>
    apiClient.put<Staff>(`/staff/${id}`, data).then((r) => r.data),

  deactivate: (id: number) =>
    apiClient.delete(`/staff/${id}`).then((r) => r.data),

  getSchedule: (id: number) =>
    apiClient
      .get<{ schedules: StaffSchedule[]; exceptions: StaffException[] }>(`/staff/${id}/schedule`)
      .then((r) => r.data),

  updateSchedule: (id: number, schedules: Partial<StaffSchedule>[]) =>
    apiClient.put<StaffSchedule[]>(`/staff/${id}/schedule`, { schedules }).then((r) => r.data),

  addException: (
    id: number,
    data: { fecha: string; tipo: string; hora_inicio?: string; hora_fin?: string; motivo?: string }
  ) => apiClient.post<StaffException>(`/staff/${id}/exceptions`, data).then((r) => r.data),

  deleteException: (staffId: number, exId: number) =>
    apiClient.delete(`/staff/${staffId}/exceptions/${exId}`).then((r) => r.data),
};
