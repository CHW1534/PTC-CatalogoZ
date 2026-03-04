export const TipoProducto = {
  ZAPATO: 'ZAPATO',
  BOLSA: 'BOLSA',
} as const;

export type TipoProducto = (typeof TipoProducto)[keyof typeof TipoProducto];

// Colores predefinidos para productos con valores hex
export const COLORES_PREDEFINIDOS = [
  'Negro',
  'Blanco',
  'Café',
  'Marrón',
  'Beige',
  'Gris',
  'Azul',
  'Rojo',
  'Rosa',
  'Verde',
  'Amarillo',
  'Naranja',
  'Morado',
  'Dorado',
  'Plateado',
  'Multicolor',
] as const;

// Mapa de colores a valores hex para UI
export const COLOR_HEX_MAP: Record<string, string> = {
  'Negro': '#1a1a1a',
  'Blanco': '#ffffff',
  'Café': '#6f4e37',
  'Marrón': '#8b4513',
  'Beige': '#f5f5dc',
  'Gris': '#808080',
  'Azul': '#2563eb',
  'Rojo': '#dc2626',
  'Rosa': '#ec4899',
  'Verde': '#16a34a',
  'Amarillo': '#eab308',
  'Naranja': '#f97316',
  'Morado': '#9333ea',
  'Dorado': '#d4af37',
  'Plateado': '#c0c0c0',
  'Multicolor': 'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff)',
};

// Tallas predefinidas para zapatos (sistema MX)
export const TALLAS_ZAPATO = [
  '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'
] as const;

// Tallas para bolsas
export const TALLAS_BOLSA = [
  'UNICA', 'CH', 'M', 'G', 'XG'
] as const;

export const TipoTransaccion = {
  ENTRADA: 'ENTRADA',
  SALIDA: 'SALIDA',
} as const;

export type TipoTransaccion = (typeof TipoTransaccion)[keyof typeof TipoTransaccion];

export interface Sucursal {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Producto {
  id: string;
  grupoId?: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  color: string;
  talla: string;
  tipo: TipoProducto;
  descripcion?: string;
  imagenUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductoSucursal {
  id: string;
  productoId: string;
  sucursalId: string;
  precio: number;
  activo: boolean;
  producto: Producto;
  sucursal?: Sucursal;
  inventario?: Inventario;
  createdAt: string;
  updatedAt: string;
}

export interface Inventario {
  id: string;
  productoSucursalId: string;
  cantidad: number;
  updatedAt: string;
}

export interface Transaccion {
  id: string;
  productoSucursalId: string;
  tipoTransaccion: TipoTransaccion;
  cantidad: number;
  precioUnitario: number;
  total: number;
  observaciones?: string;
  createdAt: string;
  productoSucursal?: ProductoSucursal;
}

export interface Disponibilidad {
  sucursal: {
    id: string;
    nombre: string;
  };
  precio: number;
  stock: number;
}

export interface FilterProducto {
  tipo?: TipoProducto;
  color?: string;
  talla?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// DTOs para crear/actualizar
export interface CreateProductoDto {
  nombre: string;
  marca?: string;
  modelo?: string;
  color: string;
  talla: string;
  tipo: TipoProducto;
  descripcion?: string;
  imagenUrl?: string;
}

export interface CreateProductoRangoDto {
  nombre: string;
  marca?: string;
  modelo?: string;
  color: string;
  tallaInicio: string;
  tallaFin: string;
  incluirMedias?: boolean;
  tipo: TipoProducto;
  descripcion?: string;
}

export interface TallaConCantidad {
  talla: string;
  cantidad?: number;
}

export interface CreateProductoMultiTallaDto {
  nombre: string;
  marca?: string;
  modelo?: string;
  color: string;
  tallas: TallaConCantidad[];
  tipo: TipoProducto;
  descripcion?: string;
  imagenUrl?: string;
}

export interface CreateSucursalDto {
  nombre: string;
  direccion?: string;
  telefono?: string;
}

export interface AsignarProductoSucursalDto {
  productoId: string;
  precio: number;
  activo?: boolean;
  cantidadInicial?: number;
}

export interface CreateTransaccionDto {
  productoSucursalId: string;
  cantidad: number;
  observaciones?: string;
}
