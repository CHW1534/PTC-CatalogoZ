import api from './api';
import type { Inventario } from '../types';

export const inventarioService = {
  getAll: async (): Promise<Inventario[]> => {
    const { data } = await api.get<Inventario[]>('/inventario');
    return data;
  },

  getBySucursal: async (sucursalId: string): Promise<Inventario[]> => {
    const { data } = await api.get<Inventario[]>(`/inventario/sucursal/${sucursalId}`);
    return data;
  },

  getByProductoSucursal: async (productoSucursalId: string): Promise<Inventario> => {
    const { data } = await api.get<Inventario>(`/inventario/${productoSucursalId}`);
    return data;
  },

  update: async (productoSucursalId: string, cantidad: number): Promise<Inventario> => {
    const { data } = await api.patch<Inventario>(`/inventario/${productoSucursalId}`, {
      cantidad,
    });
    return data;
  },
};
