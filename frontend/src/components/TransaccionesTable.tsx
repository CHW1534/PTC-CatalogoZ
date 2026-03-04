import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transaccionesService } from '../services';
import { useSucursal } from '../context';
import { TipoTransaccion } from '../types';
import type { Transaccion } from '../types';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

export function TransaccionesTable() {
  const { selectedSucursal } = useSucursal();
  const [filtroTipo, setFiltroTipo] = useState<string>('');

  // Query de transacciones - filtrado por sucursal seleccionada
  const { data: transacciones = [], isLoading } = useQuery({
    queryKey: ['transacciones', filtroTipo, selectedSucursal?.id],
    queryFn: () => transaccionesService.getAll({
      tipo: filtroTipo as typeof TipoTransaccion.ENTRADA | typeof TipoTransaccion.SALIDA | undefined,
      sucursalId: selectedSucursal?.id,
    }),
    enabled: !!selectedSucursal,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Calcular estadísticas
  const stats = useMemo(() => {
    const entradas = transacciones.filter(t => t.tipoTransaccion === TipoTransaccion.ENTRADA);
    const salidas = transacciones.filter(t => t.tipoTransaccion === TipoTransaccion.SALIDA);
    const valorSalidas = salidas.reduce((sum, t) => sum + Number(t.total), 0);

    return {
      total: transacciones.length,
      entradas: entradas.length,
      salidas: salidas.length,
      valorSalidas,
    };
  }, [transacciones]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!selectedSucursal) {
    return (
      <div className="flex items-center justify-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <div className="text-gray-500 font-medium">Selecciona una sucursal para ver las transacciones</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título y descripción */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">Transacciones - <span className="text-blue-600">{selectedSucursal.nombre}</span></h2>
        <p className="text-gray-500 text-sm mt-1">Historial de entradas y salidas de inventario</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="bg-gray-100 p-3 rounded-lg text-gray-600">
            <ReceiptLongIcon />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Movimientos</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg text-green-600">
            <ArrowCircleDownIcon />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.entradas}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entradas</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-lg text-red-600">
            <ArrowCircleUpIcon />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{stats.salidas}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Salidas</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
            <AttachMoneyIcon />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.valorSalidas)}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor Salidas</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2 cursor-pointer"
        >
          <option value="">Todos los tipos</option>
          <option value={TipoTransaccion.ENTRADA}>Entradas</option>
          <option value={TipoTransaccion.SALIDA}>Salidas</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Historial de Registros <span className="text-gray-500 font-normal ml-2">({transacciones.length})</span></h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48 text-gray-500">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando transacciones...
          </div>
        ) : transacciones.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No hay transacciones registradas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Fecha</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Producto</th>
                  <th scope="col" className="px-5 py-3 font-semibold hidden md:table-cell">Sucursal</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Tipo</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-right">Cantidad</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-right">Precio Unit.</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-right">Total</th>
                  <th scope="col" className="px-5 py-3 font-semibold hidden lg:table-cell">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transacciones.map((t: Transaccion) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {t.productoSucursal?.producto?.nombre || '—'}
                      {t.productoSucursal?.producto?.talla && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          T{t.productoSucursal.producto.talla}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-gray-500">{t.productoSucursal?.sucursal?.nombre || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.tipoTransaccion === TipoTransaccion.ENTRADA ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {t.tipoTransaccion === TipoTransaccion.ENTRADA ? 'ENTRADA' : 'SALIDA'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-medium">{t.cantidad}</td>
                    <td className="px-5 py-4 text-right">{formatCurrency(Number(t.precioUnitario))}</td>
                    <td className={`px-5 py-4 text-right font-medium ${t.tipoTransaccion === TipoTransaccion.SALIDA ? 'text-red-600' : 'text-green-600'}`}>
                      {t.tipoTransaccion === TipoTransaccion.SALIDA ? '-' : '+'}{formatCurrency(Number(t.total))}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-gray-500 truncate max-w-[200px]" title={t.observaciones}>{t.observaciones || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
