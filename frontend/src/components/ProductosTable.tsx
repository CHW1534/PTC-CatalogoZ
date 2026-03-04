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
    <div className="w-full space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Productos</div>
            <div className="text-3xl font-black text-gray-900">{totalProductos}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Zapatos</div>
            <div className="text-3xl font-black text-gray-900">{zapatos}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Bolsas</div>
            <div className="text-3xl font-black text-gray-900">{bolsas}</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Buscar</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input
                type="text"
                placeholder="Nombre o marca..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                value={filters.search || ''}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</label>
            <div className="relative">
              <select
                className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none outline-none"
                value={filters.tipo || ''}
                onChange={(e) => handleFilterChange('tipo', e.target.value)}
              >
                <option value="">Todos</option>
                <option value={TipoProducto.ZAPATO}>Zapato</option>
                <option value={TipoProducto.BOLSA}>Bolsa</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Color</label>
            <div className="relative">
              <select
                className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none outline-none"
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Talla</label>
            <div className="relative">
              <select
                className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none outline-none"
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <svg className="animate-spin mb-4 h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-500 font-medium">Cargando productos...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center font-medium">
          Error al cargar los productos. Por favor intenta de nuevo.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap text-sm">
              <thead className="bg-gray-50/80 uppercase text-xs font-bold text-gray-500 tracking-wider">
                <tr>
                  <th className="px-4 py-4 border-b border-gray-100 w-10"></th>
                  <th className="px-4 py-4 border-b border-gray-100">Nombre</th>
                  <th className="px-4 py-4 border-b border-gray-100">Marca</th>
                  <th className="px-4 py-4 border-b border-gray-100">Color</th>
                  <th className="px-4 py-4 border-b border-gray-100">Tallas</th>
                  <th className="px-4 py-4 border-b border-gray-100">Tipo</th>
                  <th className="px-4 py-4 border-b border-gray-100">Precio</th>
                  <th className="px-4 py-4 border-b border-gray-100">Stock Total</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productosAgrupados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                        <p className="text-lg font-medium">No hay productos que coincidan</p>
                        <p className="text-sm text-gray-400 mt-1">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  productosAgrupados.map((grupo) => {
                    const tieneVariantes = grupo.variantes.length > 1;
                    const stockTotal = getStockTotal(grupo.variantes);

                    return (
                      <Fragment key={grupo.key}>
                        <tr className={`hover:bg-gray-50/50 transition-colors ${expandedGroup === grupo.key ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-4 py-3 text-center">
                            {tieneVariantes && (
                              <button
                                className={`w-6 h-6 rounded-full inline-flex items-center justify-center transition-colors ${expandedGroup === grupo.key
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                onClick={() => toggleExpanded(grupo.key)}
                              >
                                <svg className={`w-4 h-4 transition-transform duration-200 ${expandedGroup === grupo.key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">{grupo.nombre}</td>
                          <td className="px-4 py-3 text-gray-500">{grupo.marca || '-'}</td>
                          <td className="px-4 py-3 text-gray-700">{grupo.color}</td>
                          <td className="px-4 py-3">
                            {tieneVariantes ? (
                              <div className="flex flex-wrap gap-1 items-center">
                                {grupo.variantes.slice(0, 3).map((v) => (
                                  <span
                                    key={v.talla}
                                    className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-mono font-bold rounded ${v.stock === 0 ? 'bg-red-50 text-red-600 line-through opacity-70' :
                                        v.stock < 3 ? 'bg-orange-50 text-orange-600' :
                                          'bg-gray-100 text-gray-700'
                                      }`}
                                    title={`Stock: ${v.stock}`}
                                  >
                                    {v.talla}
                                  </span>
                                ))}
                                {grupo.variantes.length > 3 && (
                                  <span className="text-xs text-gray-400 font-medium ml-1">+{grupo.variantes.length - 3}</span>
                                )}
                              </div>
                            ) : (
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700 font-semibold">{grupo.variantes[0].talla}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${grupo.tipo === TipoProducto.ZAPATO ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                              {grupo.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{tieneVariantes ? getPrecioRango(grupo.variantes) : `$${grupo.variantes[0].precio.toFixed(2)}`}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${stockTotal === 0
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : stockTotal <= 5
                                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                              {stockTotal}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right space-x-2">
                            <button
                              className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500/20"
                              onClick={() => openDisponibilidadModal(grupo.variantes[0].productoId, grupo.nombre)}
                              title="Ver en otras sucursales"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            </button>
                            {!tieneVariantes && (
                              <button
                                className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:ring-2 focus:ring-red-500/20"
                                onClick={() => {
                                  if (confirm('¿Eliminar este producto de la sucursal?')) {
                                    deleteMutation.mutate(grupo.variantes[0].productoId);
                                  }
                                }}
                                title="Eliminar de sucursal"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            )}
                          </td>
                        </tr>
                        {tieneVariantes && expandedGroup === grupo.key && (
                          <tr key={`${grupo.key}-detail`} className="bg-gray-50/50">
                            <td colSpan={9} className="p-0">
                              <div className="px-12 py-4 border-b border-gray-100">
                                <table className="w-full max-w-2xl text-left bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                  <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                                    <tr>
                                      <th className="px-4 py-2">Talla</th>
                                      <th className="px-4 py-2">Precio</th>
                                      <th className="px-4 py-2">Stock</th>
                                      <th className="px-4 py-2 text-right">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {grupo.variantes.map((v) => (
                                      <tr key={v.productoSucursalId} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-2 font-mono font-bold text-gray-700">{v.talla}</td>
                                        <td className="px-4 py-2 text-gray-900">${v.precio.toFixed(2)}</td>
                                        <td className="px-4 py-2">
                                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${v.stock === 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                            {v.stock}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                          <button
                                            className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors font-medium border border-transparent hover:border-red-100"
                                            onClick={() => {
                                              if (confirm(`¿Eliminar talla ${v.talla} de la sucursal?`)) {
                                                deleteMutation.mutate(v.productoId);
                                              }
                                            }}
                                          >
                                            Quitar
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
          </div>
        </div>
      )}

      {/* Modal de disponibilidad inline */}
      {disponibilidadModal.open && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900 truncate pr-4">
                Disponibilidad: <span className="font-medium text-gray-600">{disponibilidadModal.productoNombre}</span>
              </h3>
              <button className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors shrink-0" onClick={closeModal}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="p-0 max-h-[60vh] overflow-y-auto">
              {loadingDisp ? (
                <div className="flex flex-col items-center justify-center p-10">
                  <svg className="animate-spin mb-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <p className="text-sm font-medium text-gray-500">Buscando en sucursales...</p>
                </div>
              ) : disponibilidad.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-10 text-center">
                  <div className="bg-gray-100 p-3 rounded-full mb-3 text-gray-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <p className="text-gray-900 font-medium">No disponible</p>
                  <p className="text-sm text-gray-500">Este producto no se encuentra en otras sucursales.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-gray-600">Sucursal</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Precio</th>
                      <th className="px-5 py-3 font-semibold text-gray-600 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {disponibilidad.map((d: Disponibilidad) => (
                      <tr
                        key={d.sucursal.id}
                        className={`hover:bg-gray-50/50 transition-colors ${d.sucursal.id === selectedSucursal?.id ? 'bg-blue-50/20' : ''}`}
                      >
                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {d.sucursal.nombre}
                            {d.sucursal.id === selectedSucursal?.id && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Actual</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600">${d.precio.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${d.stock === 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                            {d.stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                type="button"
                className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200"
                onClick={closeModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
