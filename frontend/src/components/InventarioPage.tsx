import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productosService, sucursalesService, transaccionesService } from '../services';
import { useSucursal } from '../context';
import type { ProductoSucursal, CreateTransaccionDto } from '../types';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

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
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900">
            {tipo === 'ENTRADA' ? 'Registrar Entrada' : 'Registrar Salida'}
          </h3>
          <button className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Producto</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-600 text-sm rounded-xl cursor-not-allowed outline-none"
              value={productoSucursal.producto.nombre}
              disabled
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Color</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-600 text-sm rounded-xl cursor-not-allowed outline-none"
                value={productoSucursal.producto.color}
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Talla</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-600 text-sm rounded-xl cursor-not-allowed outline-none"
                value={productoSucursal.producto.talla}
                disabled
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Stock Actual</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-600 text-sm rounded-xl cursor-not-allowed outline-none font-bold"
                value={productoSucursal.inventario?.cantidad || 0}
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Cantidad *</label>
              <input
                type="number"
                min={1}
                max={tipo === 'SALIDA' ? maxSalida : undefined}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                required
              />
              {tipo === 'SALIDA' && maxSalida > 0 && (
                <span className="block text-xs text-orange-600 font-medium mt-1">Máximo disponible: {maxSalida}</span>
              )}
            </div>
          </div>
          <div className="space-y-1.5 pt-1">
            <label className="block text-sm font-semibold text-gray-700">Observaciones</label>
            <textarea
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Opcional"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-gray-100">
            <button type="button" className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px] ${tipo === 'ENTRADA'
                  ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/20'
                  : 'bg-red-600 hover:bg-red-700 focus:ring-red-500/20'
                }`}
              disabled={mutation.isPending || (tipo === 'SALIDA' && cantidad > maxSalida)}
            >
              {mutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                `Confirmar ${tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}`
              )}
            </button>
          </div>

          {mutation.isError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium mt-4">
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
  const [showStockBajo, setShowStockBajo] = useState(false);

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
    const productosStockBajo = productos.filter(
      (ps) => (ps.inventario?.cantidad || 0) <= 3
    );

    return {
      sucursales: sucursales.length,
      asignaciones: productos.length,
      unidadesTotales: totalUnidades,
      stockBajo: productosStockBajo.length,
      productosStockBajo,
    };
  }, [productosData, sucursales]);

  const productos = productosData?.data || [];

  const formatTipo = (tipo: string) => {
    const tipos: Record<string, { label: string; bg: string; text: string }> = {
      ZAPATO: { label: 'Zapato', bg: 'bg-indigo-100', text: 'text-indigo-700' },
      BOLSA: { label: 'Bolsa', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    };
    return tipos[tipo] || { label: tipo, bg: 'bg-gray-100', text: 'text-gray-700' };
  };

  return (
    <div className="w-full">
      {/* Tarjetas de estadisticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center transition-shadow hover:shadow-md">
          <div className="text-3xl font-black text-blue-600 mb-1">{stats.sucursales}</div>
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sucursales</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center transition-shadow hover:shadow-md">
          <div className="text-3xl font-black text-emerald-600 mb-1">{stats.asignaciones}</div>
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Asignaciones</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center transition-shadow hover:shadow-md">
          <div className="text-3xl font-black text-amber-500 mb-1">{stats.unidadesTotales}</div>
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Unidades Totales</div>
        </div>
        <div
          className={`bg-white rounded-2xl p-6 border shadow-sm flex flex-col justify-center transition-all ${stats.stockBajo > 0
              ? 'border-red-200 hover:border-red-300 hover:shadow-md cursor-pointer group reltive'
              : 'border-gray-100'
            }`}
          onClick={() => stats.stockBajo > 0 && setShowStockBajo(true)}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-3xl font-black ${stats.stockBajo > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {stats.stockBajo}
            </span>
            {stats.stockBajo > 0 && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Stock Bajo (≤3)</div>
          {stats.stockBajo > 0 && (
            <small className="text-xs text-red-500 font-medium mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Click para ver detalles</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </small>
          )}
        </div>
      </div>

      {/* Tabla de inventario */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-4">
            <InventoryIcon />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Inventario — <span className="text-gray-500 font-medium">{selectedSucursal ? selectedSucursal.nombre : 'Seleccione una sucursal'}</span>
          </h2>
        </div>

        {!selectedSucursal ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <InventoryIcon sx={{ fontSize: 40, color: '#9ca3af' }} />
            </div>
            <p className="text-gray-500 font-medium">Seleccione una sucursal en el encabezado para ver el inventario</p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="animate-spin mb-4 h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-500 font-medium">Cargando inventario...</span>
          </div>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <InventoryIcon sx={{ fontSize: 40, color: '#9ca3af' }} />
            </div>
            <p className="text-gray-500 font-medium text-lg">No hay productos asignados a esta sucursal</p>
            <p className="text-sm text-gray-400 mt-1">Asigna productos desde el catálogo para gestionar el inventario.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-gray-50/80 uppercase text-xs font-bold text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-100">Producto</th>
                  <th className="px-6 py-4 border-b border-gray-100">Tipo</th>
                  <th className="px-6 py-4 border-b border-gray-100">Color / Talla</th>
                  <th className="px-6 py-4 border-b border-gray-100">Precio</th>
                  <th className="px-6 py-4 border-b border-gray-100">Stock</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productos.map((ps) => {
                  const tipoInfo = formatTipo(ps.producto.tipo);
                  const stock = ps.inventario?.cantidad || 0;
                  return (
                    <tr key={ps.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{ps.producto.nombre}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${tipoInfo.bg} ${tipoInfo.text}`}>
                          {tipoInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-medium">{ps.producto.color}</span>
                          <span className="text-gray-300">•</span>
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 text-sm">{ps.producto.talla}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">${Number(ps.precio).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${stock === 0
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : stock <= 3
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                          {stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg text-sm font-semibold transition-colors focus:ring-2 focus:ring-emerald-500/20"
                          onClick={() => setMovimiento({ tipo: 'ENTRADA', productoSucursal: ps })}
                        >
                          <TrendingUpIcon sx={{ fontSize: 16 }} />
                          Entrada
                        </button>
                        <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 rounded-lg text-sm font-semibold transition-colors focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => setMovimiento({ tipo: 'SALIDA', productoSucursal: ps })}
                          disabled={stock === 0}
                          title={stock === 0 ? "Sin stock para dar salida" : "Registrar salida"}
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
          </div>
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

      {/* Modal de Stock Bajo */}
      {showStockBajo && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" onClick={() => setShowStockBajo(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-red-100 bg-red-50/50">
              <h3 className="text-xl font-bold text-red-900 flex items-center gap-2">
                <WarningAmberIcon sx={{ color: '#dc2626' }} />
                Productos con Stock Bajo
              </h3>
              <button className="p-2 -mr-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" onClick={() => setShowStockBajo(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="p-0 overflow-y-auto max-h-[60vh]">
              {stats.productosStockBajo.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-medium">No hay productos con stock bajo</div>
              ) : (
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-red-50/30 uppercase text-xs font-bold text-red-500 tracking-wider sticky top-0 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-3 border-b border-red-100">Producto</th>
                      <th className="px-6 py-3 border-b border-red-100">Color</th>
                      <th className="px-6 py-3 border-b border-red-100">Talla</th>
                      <th className="px-6 py-3 border-b border-red-100">Stock</th>
                      <th className="px-6 py-3 border-b border-red-100">Sucursal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.productosStockBajo.map((ps) => (
                      <tr key={ps.id} className="hover:bg-red-50/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{ps.producto.nombre}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-700">
                            {ps.producto.color}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded text-sm w-fit">{ps.producto.talla}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${ps.inventario?.cantidad === 0
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-orange-100 text-orange-700 border-orange-200'
                            }`}>
                            {ps.inventario?.cantidad || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{selectedSucursal?.nombre || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button type="button" className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200" onClick={() => setShowStockBajo(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
