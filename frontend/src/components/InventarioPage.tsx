import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productosService, sucursalesService, transaccionesService } from '../services';
import { useSucursal } from '../context';
import type { ProductoSucursal, CreateTransaccionDto } from '../types';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

type TipoMovimiento = 'ENTRADA' | 'SALIDA';

interface MovimientoModalProps {
  tipo: TipoMovimiento;
  productoSucursal: ProductoSucursal;
  onClose: () => void;
}

function MovimientoModal({ tipo, productoSucursal, onClose }: MovimientoModalProps) {
  const [cantidad, setCantidad] = useState(1);
  const [observaciones, setObservaciones] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (dto: CreateTransaccionDto) =>
      tipo === 'ENTRADA'
        ? transaccionesService.registrarEntrada(dto)
        : transaccionesService.registrarSalida(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
      queryClient.invalidateQueries({ queryKey: ['productos-sucursal'] });
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      productoSucursalId: productoSucursal.id,
      cantidad,
      observaciones: observaciones || undefined,
    });
  };

  const maxSalida = productoSucursal.inventario?.cantidad || 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {tipo === 'ENTRADA' ? 'Registrar Entrada' : 'Registrar Salida'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            x
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Producto</label>
            <input
              type="text"
              value={productoSucursal.producto.nombre}
              disabled
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Color</label>
              <input type="text" value={productoSucursal.producto.color} disabled />
            </div>
            <div className="form-group">
              <label>Talla</label>
              <input type="text" value={productoSucursal.producto.talla} disabled />
            </div>
          </div>
          <div className="form-group">
            <label>Stock Actual</label>
            <input
              type="text"
              value={productoSucursal.inventario?.cantidad || 0}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Cantidad *</label>
            <input
              type="number"
              min={1}
              max={tipo === 'SALIDA' ? maxSalida : undefined}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              required
            />
            {tipo === 'SALIDA' && maxSalida > 0 && (
              <small className="text-muted">Maximo disponible: {maxSalida}</small>
            )}
          </div>
          <div className="form-group">
            <label>Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Opcional"
              rows={2}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className={tipo === 'ENTRADA' ? 'btn-success' : 'btn-danger'}
              disabled={mutation.isPending || (tipo === 'SALIDA' && cantidad > maxSalida)}
            >
              {mutation.isPending ? 'Procesando...' : `Confirmar ${tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}`}
            </button>
          </div>
          {mutation.isError && (
            <div className="error-message">
              Error al registrar el movimiento
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export function InventarioPage() {
  const { selectedSucursal } = useSucursal();
  const [movimiento, setMovimiento] = useState<{
    tipo: TipoMovimiento;
    productoSucursal: ProductoSucursal;
  } | null>(null);

  // Obtener sucursales para estadisticas
  const { data: sucursales = [] } = useQuery({
    queryKey: ['sucursales'],
    queryFn: sucursalesService.getAll,
  });

  // Obtener productos de la sucursal seleccionada o todas
  const { data: productosData, isLoading } = useQuery({
    queryKey: ['productos-sucursal', selectedSucursal?.id],
    queryFn: () =>
      selectedSucursal
        ? productosService.getBySucursal(selectedSucursal.id, { limit: 100 })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 100 }),
    enabled: !!selectedSucursal,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Calcular estadisticas
  const stats = useMemo(() => {
    const productos = productosData?.data || [];
    const totalUnidades = productos.reduce(
      (sum, ps) => sum + (ps.inventario?.cantidad || 0),
      0
    );
    const stockBajo = productos.filter(
      (ps) => (ps.inventario?.cantidad || 0) <= 3
    ).length;

    return {
      sucursales: sucursales.length,
      asignaciones: productos.length,
      unidadesTotales: totalUnidades,
      stockBajo,
    };
  }, [productosData, sucursales]);

  const productos = productosData?.data || [];

  const formatTipo = (tipo: string) => {
    const tipos: Record<string, { label: string; className: string }> = {
      ZAPATO: { label: 'Zapato', className: 'badge-purple' },
      BOLSA: { label: 'Bolsa', className: 'badge-blue' },
    };
    return tipos[tipo] || { label: tipo, className: 'badge-gray' };
  };

  return (
    <div className="inventario-page">
      <div className="page-header">
        <div>
          <h2>Inventario</h2>
          <p className="page-subtitle">Stock por sucursal y movimientos</p>
        </div>
      </div>

      {/* Tarjetas de estadisticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value text-primary">{stats.sucursales}</div>
          <div className="stat-label">Sucursales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-secondary">{stats.asignaciones}</div>
          <div className="stat-label">Asignaciones</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-warning">{stats.unidadesTotales}</div>
          <div className="stat-label">Unidades Totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-danger">{stats.stockBajo}</div>
          <div className="stat-label">Stock Bajo (&le;3)</div>
        </div>
      </div>

      {/* Tabla de inventario */}
      <div className="inventario-table-container">
        <div className="table-header">
          <div className="table-icon">
            <InventoryIcon />
          </div>
          <span>Inventario — {selectedSucursal ? selectedSucursal.nombre : 'Seleccione una sucursal'}</span>
        </div>

        {!selectedSucursal ? (
          <div className="empty-state">
            <p>Seleccione una sucursal en el encabezado para ver el inventario</p>
          </div>
        ) : isLoading ? (
          <div className="loading-state">Cargando inventario...</div>
        ) : productos.length === 0 ? (
          <div className="empty-state">
            <p>No hay productos asignados a esta sucursal</p>
          </div>
        ) : (
          <table className="inventario-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Color / Talla</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((ps) => {
                const tipoInfo = formatTipo(ps.producto.tipo);
                const stock = ps.inventario?.cantidad || 0;
                return (
                  <tr key={ps.id}>
                    <td className="producto-nombre">{ps.producto.nombre}</td>
                    <td>
                      <span className={`badge ${tipoInfo.className}`}>
                        <span className="badge-icon">%</span>
                        {tipoInfo.label}
                      </span>
                    </td>
                    <td>{ps.producto.color} / {ps.producto.talla}</td>
                    <td className="precio">${Number(ps.precio).toFixed(2)}</td>
                    <td className={stock <= 3 ? 'stock-bajo' : ''}>{stock}</td>
                    <td className="acciones">
                      <button
                        className="btn-action btn-entrada"
                        onClick={() => setMovimiento({ tipo: 'ENTRADA', productoSucursal: ps })}
                      >
                        <TrendingUpIcon sx={{ fontSize: 16 }} />
                        Entrada
                      </button>
                      <button
                        className="btn-action btn-salida"
                        onClick={() => setMovimiento({ tipo: 'SALIDA', productoSucursal: ps })}
                        disabled={stock === 0}
                      >
                        <TrendingDownIcon sx={{ fontSize: 16 }} />
                        Salida
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de movimiento */}
      {movimiento && (
        <MovimientoModal
          tipo={movimiento.tipo}
          productoSucursal={movimiento.productoSucursal}
          onClose={() => setMovimiento(null)}
        />
      )}
    </div>
  );
}
