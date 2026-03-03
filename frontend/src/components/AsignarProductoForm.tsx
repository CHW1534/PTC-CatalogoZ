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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Asignar Producto a {selectedSucursal.nombre}</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="productoId">Producto *</label>
            <select
              id="productoId"
              required
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="precio">Precio *</label>
              <input
                id="precio"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.precio}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    precio: parseFloat(e.target.value),
                  }))
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="cantidadInicial">Stock Inicial</label>
              <input
                id="cantidadInicial"
                type="number"
                min="0"
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

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={asignarMutation.isPending}
            >
              {asignarMutation.isPending ? 'Asignando...' : 'Asignar a Sucursal'}
            </button>
          </div>

          {asignarMutation.isError && (
            <div className="error-message">
              Error al asignar. Es posible que el producto ya esté asignado.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
