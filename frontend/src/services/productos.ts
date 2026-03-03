import api from './api';
import type {
  Producto,
  ProductoSucursal,
  CreateProductoDto,
  CreateProductoRangoDto,
  AsignarProductoSucursalDto,
  FilterProducto,
  PaginatedResponse,
  Disponibilidad,
} from '../types';

export const productosService = {
  // Productos base
  getAll: async (): Promise<Producto[]> => {
    const { data } = await api.get<Producto[]>('/productos');
    return data;
  },

  getById: async (id: string): Promise<Producto> => {
    const { data } = await api.get<Producto>(`/productos/${id}`);
    return data;
  },

  create: async (dto: CreateProductoDto): Promise<Producto> => {
    const { data } = await api.post<Producto>('/productos', dto);
    return data;
  },

  createConRango: async (dto: CreateProductoRangoDto): Promise<Producto[]> => {
    const { data } = await api.post<Producto[]>('/productos/rango', dto);
    return data;
  },

  update: async (id: string, dto: Partial<CreateProductoDto>): Promise<Producto> => {
    const { data } = await api.patch<Producto>(`/productos/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/productos/${id}`);
  },

  // Filtros auxiliares
  getColores: async (sucursalId?: string): Promise<string[]> => {
    const params = sucursalId ? { sucursalId } : {};
    const { data } = await api.get<string[]>('/productos/colores', { params });
    return data;
  },

  getTallas: async (sucursalId?: string): Promise<string[]> => {
    const params = sucursalId ? { sucursalId } : {};
    const { data } = await api.get<string[]>('/productos/tallas', { params });
    return data;
  },

  // Disponibilidad cross-sucursal
  getDisponibilidad: async (productoId: string): Promise<Disponibilidad[]> => {
    const { data } = await api.get<Disponibilidad[]>(`/productos/${productoId}/disponibilidad`);
    return data;
  },

  // Productos por sucursal
  getBySucursal: async (
    sucursalId: string,
    filters: FilterProducto = {}
  ): Promise<PaginatedResponse<ProductoSucursal>> => {
    const { data } = await api.get<PaginatedResponse<ProductoSucursal>>(
      `/sucursales/${sucursalId}/productos`,
      { params: filters }
    );
    return data;
  },

  asignarASucursal: async (
    sucursalId: string,
    dto: AsignarProductoSucursalDto
  ): Promise<ProductoSucursal> => {
    const { data } = await api.post<ProductoSucursal>(
      `/sucursales/${sucursalId}/productos`,
      dto
    );
    return data;
  },

  updateEnSucursal: async (
    sucursalId: string,
    productoId: string,
    dto: { precio?: number; activo?: boolean }
  ): Promise<ProductoSucursal> => {
    const { data } = await api.patch<ProductoSucursal>(
      `/sucursales/${sucursalId}/productos/${productoId}`,
      dto
    );
    return data;
  },

  removeFromSucursal: async (sucursalId: string, productoId: string): Promise<void> => {
    await api.delete(`/sucursales/${sucursalId}/productos/${productoId}`);
  },
};
