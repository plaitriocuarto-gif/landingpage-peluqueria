import apiClient from './client';
import { ShopConfig } from '../types';

export const configApi = {
  get: () => apiClient.get<ShopConfig>('/config').then((r) => r.data),
  update: (data: Partial<ShopConfig>) =>
    apiClient.put<ShopConfig>('/config', data).then((r) => r.data),
};
