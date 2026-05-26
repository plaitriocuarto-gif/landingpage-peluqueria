import apiClient from './client';
import { Appointment } from '../types';

export const appointmentsApi = {
  getAvailable: (staffId: number, date: string, serviceId: number) =>
    apiClient
      .get<{ slots: string[] }>('/appointments/available', {
        params: { staffId, date, serviceId },
      })
      .then((r) => r.data),

  getMyAppointments: () =>
    apiClient.get<Appointment[]>('/appointments/my').then((r) => r.data),

  book: (data: { staffId: number; serviceId: number; fecha: string; horaInicio: string }) =>
    apiClient.post<Appointment>('/appointments', data).then((r) => r.data),

  guestBook: (data: {
    nombre: string;
    telefono: string;
    staffId: number;
    serviceId: number;
    fecha: string;
    horaInicio: string;
  }) => apiClient.post<Appointment>('/appointments/guest', data).then((r) => r.data),

  cancel: (id: number) =>
    apiClient.delete(`/appointments/${id}`).then((r) => r.data),

  getAll: (filters?: { fecha?: string; staffId?: number; estado?: string }) =>
    apiClient.get<Appointment[]>('/appointments', { params: filters }).then((r) => r.data),

  updateStatus: (id: number, estado: string) =>
    apiClient.put<Appointment>(`/appointments/${id}/status`, { estado }).then((r) => r.data),

  getStaffAppointments: (params?: { semana?: string; staffId?: number }) =>
    apiClient.get<Appointment[]>('/appointments/staff', { params }).then((r) => r.data),
};
