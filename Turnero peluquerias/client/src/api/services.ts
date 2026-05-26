import apiClient from './client';
import { Service } from '../types';

export const servicesApi = {
  list: () => apiClient.get<Service[]>('/services').then((r) => r.data),
  listAll: () => apiClient.get<Service[]>('/services/all').then((r) => r.data),

  create: (data: { nombre: string; duracion_minutos: number; precio: number }) =>
    apiClient.post<Service>('/services', data).then((r) => r.data),

  update: (id: number, data: Partial<Service>) =>
    apiClient.put<Service>(`/services/${id}`, data).then((r) => r.data),

  deactivate: (id: number) =>
    apiClient.delete(`/services/${id}`).then((r) => r.data),
};
