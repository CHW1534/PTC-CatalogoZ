import api from './api';
import type { Sucursal, CreateSucursalDto } from '../types';

export const sucursalesService = {
  getAll: async (): Promise<Sucursal[]> => {
    const { data } = await api.get<Sucursal[]>('/sucursales');
    return data;
  },

  getAllIncludingInactive: async (): Promise<Sucursal[]> => {
    const { data } = await api.get<Sucursal[]>('/sucursales/admin/all');
    return data;
  },

  getById: async (id: string): Promise<Sucursal> => {
    const { data } = await api.get<Sucursal>(`/sucursales/${id}`);
    return data;
  },

  create: async (dto: CreateSucursalDto): Promise<Sucursal> => {
    const { data } = await api.post<Sucursal>('/sucursales', dto);
    return data;
  },

  update: async (id: string, dto: Partial<CreateSucursalDto>): Promise<Sucursal> => {
    const { data } = await api.patch<Sucursal>(`/sucursales/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/sucursales/${id}`);
  },
};
