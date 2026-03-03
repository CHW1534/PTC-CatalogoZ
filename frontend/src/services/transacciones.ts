import api from './api';
import type { Transaccion, CreateTransaccionDto, TipoTransaccion } from '../types';

interface FilterTransaccion {
  sucursalId?: string;
  productoId?: string;
  tipo?: TipoTransaccion;
  desde?: string;
  hasta?: string;
}

export const transaccionesService = {
  getAll: async (filters: FilterTransaccion = {}): Promise<Transaccion[]> => {
    // Limpiar parámetros vacíos para evitar 400 Bad Request
    const cleanParams: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });
    const { data } = await api.get<Transaccion[]>('/transacciones', { params: cleanParams });
    return data;
  },

  getById: async (id: string): Promise<Transaccion> => {
    const { data } = await api.get<Transaccion>(`/transacciones/${id}`);
    return data;
  },

  registrarEntrada: async (dto: CreateTransaccionDto): Promise<Transaccion> => {
    const { data } = await api.post<Transaccion>('/transacciones/entrada', dto);
    return data;
  },

  registrarSalida: async (dto: CreateTransaccionDto): Promise<Transaccion> => {
    const { data } = await api.post<Transaccion>('/transacciones/salida', dto);
    return data;
  },
};
