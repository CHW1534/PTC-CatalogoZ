import { useState, useMemo, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSucursal } from '../context';
import { productosService } from '../services';
import type { FilterProducto, ProductoSucursal, Disponibilidad } from '../types';
import { TipoProducto } from '../types';

// Tipo para producto agrupado
interface ProductoAgrupado {
  key: string;
  nombre: string;
  marca: string | null;
  color: string;
  tipo: string;
  variantes: {
    talla: string;
    precio: number;
    stock: number;
    productoSucursalId: string;
    productoId: string;
  }[];
}

export function ProductosTable() {
  const queryClient = useQueryClient();
  const { selectedSucursal } = useSucursal();
  const [filters, setFilters] = useState<FilterProducto>({
    page: 1,
    limit: 50, // Aumentar límite para agrupar mejor
  });
  const [disponibilidadModal, setDisponibilidadModal] = useState<{
    open: boolean;
    productoId: string | null;
    productoNombre: string;
  }>({ open: false, productoId: null, productoNombre: '' });
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Query de productos
  const { data, isLoading, error } = useQuery({
    queryKey: ['productos', selectedSucursal?.id, filters],
    queryFn: () =>
      selectedSucursal
        ? productosService.getBySucursal(selectedSucursal.id, filters)
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 50 }),
    enabled: !!selectedSucursal,
  });

  // Query colores únicos
  const { data: colores = [] } = useQuery({
    queryKey: ['colores', selectedSucursal?.id],
    queryFn: () => productosService.getColores(selectedSucursal?.id),
    enabled: !!selectedSucursal,
  });

  // Query tallas únicas
  const { data: tallas = [] } = useQuery({
    queryKey: ['tallas', selectedSucursal?.id],
    queryFn: () => productosService.getTallas(selectedSucursal?.id),
    enabled: !!selectedSucursal,
  });

  // Query disponibilidad
  const { data: disponibilidad = [], isLoading: loadingDisp } = useQuery({
    queryKey: ['disponibilidad', disponibilidadModal.productoId],
    queryFn: () =>
      disponibilidadModal.productoId
        ? productosService.getDisponibilidad(disponibilidadModal.productoId)
        : Promise.resolve([]),
    enabled: !!disponibilidadModal.productoId && disponibilidadModal.open,
  });

  // Mutation eliminar
  const deleteMutation = useMutation({
    mutationFn: (productoId: string) =>
      productosService.removeFromSucursal(selectedSucursal!.id, productoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });

  // Agrupar productos por grupoId (si existe) o mostrar individual
  const productosAgrupados = useMemo(() => {
    if (!data?.data) return [];
    
    const grupos = new Map<string, ProductoAgrupado>();
    
    data.data.forEach((ps: ProductoSucursal) => {
      // Si tiene grupoId, agrupar por él. Si no, usar el productoId como key único
      const key = ps.producto.grupoId || `solo_${ps.producto.id}`;
      
      if (!grupos.has(key)) {
        grupos.set(key, {
          key,
          nombre: ps.producto.nombre,
          marca: ps.producto.marca || null,
          color: ps.producto.color,
          tipo: ps.producto.tipo,
          variantes: [],
        });
      }
      
      grupos.get(key)!.variantes.push({
        talla: ps.producto.talla,
        precio: Number(ps.precio),
        stock: ps.inventario?.cantidad ?? 0,
        productoSucursalId: ps.id,
        productoId: ps.productoId,
      });
    });
    
    // Ordenar variantes por talla
    grupos.forEach((grupo) => {
      grupo.variantes.sort((a, b) => {
        const numA = parseFloat(a.talla);
        const numB = parseFloat(b.talla);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.talla.localeCompare(b.talla);
      });
    });
    
    return Array.from(grupos.values());
  }, [data?.data]);

  const handleFilterChange = (key: keyof FilterProducto, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      search: e.target.value || undefined,
      page: 1,
    }));
  };

  const openDisponibilidadModal = (productoId: string, nombre: string) => {
    setDisponibilidadModal({
      open: true,
      productoId,
      productoNombre: nombre,
    });
  };

  const closeModal = () => {
    setDisponibilidadModal({ open: false, productoId: null, productoNombre: '' });
  };

  const toggleExpanded = (key: string) => {
    setExpandedGroup(expandedGroup === key ? null : key);
  };

  if (!selectedSucursal) {
    return <div className="no-sucursal">Selecciona una sucursal para ver productos</div>;
  }

  // Calcular estadísticas
  const totalProductos = data?.total || 0;
  const zapatos = data?.data?.filter((p: ProductoSucursal) => p.producto.tipo === TipoProducto.ZAPATO).length || 0;
  const bolsas = data?.data?.filter((p: ProductoSucursal) => p.producto.tipo === TipoProducto.BOLSA).length || 0;

  // Calcular stock total de un grupo
  const getStockTotal = (variantes: ProductoAgrupado['variantes']) => {
    return variantes.reduce((sum, v) => sum + v.stock, 0);
  };

  // Obtener rango de precios
  const getPrecioRango = (variantes: ProductoAgrupado['variantes']) => {
    const precios = variantes.map(v => v.precio);
    const min = Math.min(...precios);
    const max = Math.max(...precios);
    if (min === max) return `$${min.toFixed(2)}`;
    return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
  };

  return (
    <div className="productos-container">
      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon total"></div>
          <div className="stat-info">
            <div className="stat-label">Total Productos</div>
            <div className="stat-value">{totalProductos}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon zapatos"></div>
          <div className="stat-info">
            <div className="stat-label">Zapatos</div>
            <div className="stat-value">{zapatos}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bolsas"></div>
          <div className="stat-info">
            <div className="stat-label">Bolsas</div>
            <div className="stat-value">{bolsas}</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters">
        <div className="filter-group">
          <label>Buscar:</label>
          <input
            type="text"
            placeholder="Nombre o marca..."
            value={filters.search || ''}
            onChange={handleSearch}
          />
        </div>

        <div className="filter-group">
          <label>Tipo:</label>
          <select
            value={filters.tipo || ''}
            onChange={(e) => handleFilterChange('tipo', e.target.value)}
          >
            <option value="">Todos</option>
            <option value={TipoProducto.ZAPATO}>Zapato</option>
            <option value={TipoProducto.BOLSA}>Bolsa</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Color:</label>
          <select
            value={filters.color || ''}
            onChange={(e) => handleFilterChange('color', e.target.value)}
          >
            <option value="">Todos</option>
            {colores.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Talla:</label>
          <select
            value={filters.talla || ''}
            onChange={(e) => handleFilterChange('talla', e.target.value)}
          >
            <option value="">Todas</option>
            {tallas.map((talla) => (
              <option key={talla} value={talla}>
                {talla}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="loading">Cargando productos...</div>
      ) : error ? (
        <div className="error">Error al cargar productos</div>
      ) : (
        <>
          <table className="productos-table">
            <thead>
              <tr>
                <th></th>
                <th>Nombre</th>
                <th>Marca</th>
                <th>Color</th>
                <th>Tallas</th>
                <th>Tipo</th>
                <th>Precio</th>
                <th>Stock Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosAgrupados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty">
                    No hay productos
                  </td>
                </tr>
              ) : (
                productosAgrupados.map((grupo) => {
                  const tieneVariantes = grupo.variantes.length > 1;
                  
                  return (
                  <Fragment key={grupo.key}>
                    <tr className="grupo-row">
                      <td className="expand-cell">
                        {tieneVariantes ? (
                          <button 
                            className="btn-expand"
                            onClick={() => toggleExpanded(grupo.key)}
                          >
                            {expandedGroup === grupo.key ? '−' : '+'}
                          </button>
                        ) : null}
                      </td>
                      <td className="nombre-cell">{grupo.nombre}</td>
                      <td>{grupo.marca || '-'}</td>
                      <td>{grupo.color}</td>
                      <td className="tallas-cell">
                        {tieneVariantes ? (
                          <div className="tallas-badges">
                            {grupo.variantes.map((v) => (
                              <span 
                                key={v.talla} 
                                className={`talla-badge ${v.stock === 0 ? 'out' : v.stock < 5 ? 'low' : ''}`}
                                title={`Stock: ${v.stock}`}
                              >
                                {v.talla}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span>{grupo.variantes[0].talla}</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${grupo.tipo.toLowerCase()}`}>
                          {grupo.tipo}
                        </span>
                      </td>
                      <td>{tieneVariantes ? getPrecioRango(grupo.variantes) : `$${grupo.variantes[0].precio.toFixed(2)}`}</td>
                      <td>
                        <span className={`stock ${getStockTotal(grupo.variantes) === 0 ? 'out' : ''}`}>
                          {getStockTotal(grupo.variantes)}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="btn-icon"
                          onClick={() => openDisponibilidadModal(grupo.variantes[0].productoId, grupo.nombre)}
                          title="Ver en otras sucursales"
                        >
                          Ver
                        </button>
                        {!tieneVariantes && (
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => {
                              if (confirm('¿Eliminar este producto de la sucursal?')) {
                                deleteMutation.mutate(grupo.variantes[0].productoId);
                              }
                            }}
                            title="Eliminar"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                    {tieneVariantes && expandedGroup === grupo.key && (
                      <tr key={`${grupo.key}-detail`} className="detail-row">
                        <td colSpan={9}>
                          <div className="variantes-detail">
                            <table className="variantes-table">
                              <thead>
                                <tr>
                                  <th>Talla</th>
                                  <th>Precio</th>
                                  <th>Stock</th>
                                  <th>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {grupo.variantes.map((v) => (
                                  <tr key={v.productoSucursalId}>
                                    <td><strong>{v.talla}</strong></td>
                                    <td>${v.precio.toFixed(2)}</td>
                                    <td>
                                      <span className={`stock ${v.stock === 0 ? 'out' : ''}`}>
                                        {v.stock}
                                      </span>
                                    </td>
                                    <td>
                                      <button
                                        className="btn-small btn-danger"
                                        onClick={() => {
                                          if (confirm(`¿Eliminar talla ${v.talla} de la sucursal?`)) {
                                            deleteMutation.mutate(v.productoId);
                                          }
                                        }}
                                      >
                                        Eliminar
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </>
      )}

      {/* Modal de disponibilidad */}
      {disponibilidadModal.open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Disponibilidad: {disponibilidadModal.productoNombre}</h3>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {loadingDisp ? (
                <p>Cargando...</p>
              ) : disponibilidad.length === 0 ? (
                <p>No disponible en ninguna sucursal</p>
              ) : (
                <table className="disponibilidad-table">
                  <thead>
                    <tr>
                      <th>Sucursal</th>
                      <th>Precio</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disponibilidad.map((d: Disponibilidad) => (
                      <tr
                        key={d.sucursal.id}
                        className={d.sucursal.id === selectedSucursal?.id ? 'current' : ''}
                      >
                        <td>
                          {d.sucursal.nombre}
                          {d.sucursal.id === selectedSucursal?.id && ' (actual)'}
                        </td>
                        <td>${d.precio.toFixed(2)}</td>
                        <td>
                          <span className={`stock ${d.stock === 0 ? 'out' : ''}`}>
                            {d.stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
