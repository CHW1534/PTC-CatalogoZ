import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSucursal } from '../context';
import { productosService } from '../services';
import type { AsignarProductoSucursalDto } from '../types';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AsignarProductoForm({ onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const { selectedSucursal } = useSucursal();
  const [formData, setFormData] = useState<AsignarProductoSucursalDto>({
    productoId: '',
    precio: 0,
    cantidadInicial: 0,
  });

  // Query todos los productos base
  const { data: productos = [] } = useQuery({
    queryKey: ['productos-base'],
    queryFn: productosService.getAll,
  });

  const asignarMutation = useMutation({
    mutationFn: (data: AsignarProductoSucursalDto) =>
      productosService.asignarASucursal(selectedSucursal!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
      onSuccess?.();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSucursal) return;
    asignarMutation.mutate(formData);
  };

  if (!selectedSucursal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900">Asignar Producto a {selectedSucursal.nombre}</h3>
          <button className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="productoId" className="block text-sm font-semibold text-gray-700">Producto *</label>
            <div className="relative">
              <select
                id="productoId"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all appearance-none outline-none pr-10"
                value={formData.productoId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, productoId: e.target.value }))
                }
              >
                <option value="">Seleccionar producto</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} - {p.color} - Talla {p.talla} ({p.tipo})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="precio" className="block text-sm font-semibold text-gray-700">Precio *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  $
                </div>
                <input
                  id="precio"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  value={formData.precio}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      precio: parseFloat(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cantidadInicial" className="block text-sm font-semibold text-gray-700">Stock Inicial</label>
              <input
                id="cantidadInicial"
                type="number"
                min="0"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
                value={formData.cantidadInicial}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cantidadInicial: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-gray-100">
            <button type="button" className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
              disabled={asignarMutation.isPending}
            >
              {asignarMutation.isPending ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {asignarMutation.isPending ? 'Asignando...' : 'Asignar a Sucursal'}
            </button>
          </div>

          {asignarMutation.isError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium mt-4">
              Error al asignar. Es posible que el producto ya esté asignado.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
