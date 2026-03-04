import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transaccionesService } from '../services';
import { useSucursal } from '../context';
import { TipoTransaccion } from '../types';
import type { Transaccion } from '../types';

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
      <div className="transacciones-container">
        <div className="empty-state">Selecciona una sucursal para ver las transacciones</div>
      </div>
    );
  }

  return (
    <div className="transacciones-container">
      {/* Título y descripción */}
      <div className="transacciones-header">
        <h2>Transacciones - {selectedSucursal.nombre}</h2>
        <p className="transacciones-subtitle">Historial de entradas y salidas de inventario</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-container stats-4">
        <div className="stat-card">
          <div className="stat-icon stat-movements"></div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Movimientos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-entries"></div>
          <div className="stat-info">
            <div className="stat-value stat-green">{stats.entradas}</div>
            <div className="stat-label">Entradas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-exits"></div>
          <div className="stat-info">
            <div className="stat-value stat-red">{stats.salidas}</div>
            <div className="stat-label">Salidas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-value-icon"></div>
          <div className="stat-info">
            <div className="stat-value stat-orange">{formatCurrency(stats.valorSalidas)}</div>
            <div className="stat-label">Valor Total Salidas</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="transacciones-filters">
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="filter-select"
        >
          <option value="">Todos los tipos</option>
          <option value={TipoTransaccion.ENTRADA}>Entradas</option>
          <option value={TipoTransaccion.SALIDA}>Salidas</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="transacciones-table-container">
        <div className="table-header-meta">
          <h3>Historial ({transacciones.length} registros)</h3>
        </div>

        {isLoading ? (
          <div className="loading">Cargando transacciones...</div>
        ) : transacciones.length === 0 ? (
          <div className="empty-state">No hay transacciones registradas</div>
        ) : (
          <table className="transacciones-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Sucursal</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {transacciones.map((t: Transaccion) => (
                <tr key={t.id}>
                  <td data-label="Fecha" className="date-cell">{formatDate(t.createdAt)}</td>
                  <td data-label="Producto" className="product-cell">
                    {t.productoSucursal?.producto?.nombre || '—'}
                    {t.productoSucursal?.producto?.talla && (
                      <span className="talla-badge">T{t.productoSucursal.producto.talla}</span>
                    )}
                  </td>
                  <td data-label="Sucursal">{t.productoSucursal?.sucursal?.nombre || '—'}</td>
                  <td data-label="Tipo">
                    <span className={`tipo-badge ${t.tipoTransaccion === TipoTransaccion.ENTRADA ? 'entrada' : 'salida'}`}>
                      {t.tipoTransaccion === TipoTransaccion.ENTRADA ? 'ENTRADA' : 'SALIDA'}
                    </span>
                  </td>
                  <td data-label="Cantidad" className="cantidad-cell">{t.cantidad}</td>
                  <td data-label="Precio Unit." className="precio-cell">{formatCurrency(Number(t.precioUnitario))}</td>
                  <td data-label="Total" className={`total-cell ${t.tipoTransaccion === TipoTransaccion.SALIDA ? 'salida' : 'entrada'}`}>
                    {formatCurrency(Number(t.total))}
                  </td>
                  <td data-label="Observaciones" className="obs-cell">{t.observaciones || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
