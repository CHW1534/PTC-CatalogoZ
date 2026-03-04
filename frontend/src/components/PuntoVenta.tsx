import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSucursal } from '../context';
import { productosService, transaccionesService } from '../services';
import type { ProductoSucursal } from '../types';
import { Ticket } from './Ticket';
import StoreIcon from '@mui/icons-material/Store';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PaymentIcon from '@mui/icons-material/Payment';

interface VentaItem {
  productoSucursal: ProductoSucursal;
  cantidad: number;
}

interface VentaRealizada {
  items: VentaItem[];
  fecha: Date;
  total: number;
  folio: string;
}

interface ProductoAgrupado {
  key: string;
  nombre: string;
  color: string;
  marca: string;
  tipo: string;
  variantes: ProductoSucursal[];
}

export function PuntoVenta() {
  const queryClient = useQueryClient();
  const { selectedSucursal } = useSucursal();
  const [carrito, setCarrito] = useState<VentaItem[]>([]);
  const [ventaRealizada, setVentaRealizada] = useState<VentaRealizada | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState<Record<string, string>>({});
  const [carritoVisible, setCarritoVisible] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  // Usar trim para comparación consistente en queryKey
  const searchTerm = busqueda.trim();

  const { data: productosData, isLoading } = useQuery({
    queryKey: ['productos-venta', selectedSucursal?.id, searchTerm],
    queryFn: () =>
      selectedSucursal
        ? productosService.getBySucursal(selectedSucursal.id, {
          search: searchTerm || undefined,
          limit: 100,
        })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 100 }),
    enabled: !!selectedSucursal,
    staleTime: 30000, // 30 segundos
  });

  const productos = productosData?.data || [];

  const productosAgrupados = useMemo((): ProductoAgrupado[] => {
    const grupos: Record<string, ProductoAgrupado> = {};

    productos.forEach((ps) => {
      const key = `${ps.producto.nombre}-${ps.producto.color}-${ps.producto.marca || ''}`.toLowerCase();

      if (!grupos[key]) {
        grupos[key] = {
          key,
          nombre: ps.producto.nombre,
          color: ps.producto.color,
          marca: ps.producto.marca || '',
          tipo: ps.producto.tipo,
          variantes: [],
        };
      }
      grupos[key].variantes.push(ps);
    });

    Object.values(grupos).forEach((grupo) => {
      grupo.variantes.sort((a, b) => {
        const tallaA = parseFloat(a.producto.talla) || a.producto.talla;
        const tallaB = parseFloat(b.producto.talla) || b.producto.talla;
        if (typeof tallaA === 'number' && typeof tallaB === 'number') {
          return tallaA - tallaB;
        }
        return String(tallaA).localeCompare(String(tallaB));
      });
    });

    return Object.values(grupos);
  }, [productos]);

  const getVarianteSeleccionada = (grupo: ProductoAgrupado): ProductoSucursal | null => {
    const tallaSeleccionada = tallasSeleccionadas[grupo.key];
    if (tallaSeleccionada) {
      return grupo.variantes.find(v => v.producto.talla === tallaSeleccionada) || null;
    }
    return grupo.variantes.find(v => (v.inventario?.cantidad ?? 0) > 0) || grupo.variantes[0] || null;
  };

  const seleccionarTalla = (grupoKey: string, talla: string) => {
    setTallasSeleccionadas(prev => ({ ...prev, [grupoKey]: talla }));
  };

  const ventaMutation = useMutation({
    mutationFn: async (items: VentaItem[]) => {
      const resultados = [];
      for (const item of items) {
        const resultado = await transaccionesService.registrarSalida({
          productoSucursalId: item.productoSucursal.id,
          cantidad: item.cantidad,
          observaciones: `Venta POS - Folio: ${generarFolio()}`,
        });
        resultados.push(resultado);
      }
      return resultados;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos-venta'] });
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
    },
  });

  const generarFolio = () => {
    const fecha = new Date();
    return `V${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${String(fecha.getHours()).padStart(2, '0')}${String(fecha.getMinutes()).padStart(2, '0')}${String(fecha.getSeconds()).padStart(2, '0')}`;
  };

  const agregarAlCarrito = (ps: ProductoSucursal) => {
    const stockDisponible = ps.inventario?.cantidad ?? 0;

    setCarrito((prev) => {
      const existente = prev.find((item) => item.productoSucursal.id === ps.id);
      if (existente) {
        if (existente.cantidad >= stockDisponible) {
          return prev;
        }
        return prev.map((item) =>
          item.productoSucursal.id === ps.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      if (stockDisponible === 0) {
        return prev;
      }
      return [...prev, { productoSucursal: ps, cantidad: 1 }];
    });
  };

  const quitarDelCarrito = (productoSucursalId: string) => {
    setCarrito((prev) => prev.filter((item) => item.productoSucursal.id !== productoSucursalId));
  };

  const actualizarCantidad = (productoSucursalId: string, cantidad: number) => {
    if (cantidad < 1) return;

    setCarrito((prev) =>
      prev.map((item) => {
        if (item.productoSucursal.id === productoSucursalId) {
          const stockDisponible = item.productoSucursal.inventario?.cantidad ?? 0;
          if (cantidad > stockDisponible) {
            return item;
          }
          return { ...item, cantidad };
        }
        return item;
      })
    );
  };

  const calcularTotal = () => {
    return carrito.reduce(
      (sum, item) => sum + Number(item.productoSucursal.precio) * item.cantidad,
      0
    );
  };

  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  const procesarVenta = async () => {
    if (carrito.length === 0) return;

    try {
      await ventaMutation.mutateAsync(carrito);

      const venta: VentaRealizada = {
        items: [...carrito],
        fecha: new Date(),
        total: calcularTotal(),
        folio: generarFolio(),
      };

      setVentaRealizada(venta);
      setCarrito([]);
    } catch {
      // Error handled silently
    }
  };

  const imprimirTicket = () => {
    if (ticketRef.current) {
      const contenido = ticketRef.current.innerHTML;
      const ventana = window.open('', '_blank', 'width=400,height=600');
      if (ventana) {
        ventana.document.write(`
          <html>
            <head>
              <title>Ticket de Venta</title>
              <style>
                body { font-family: 'Courier New', monospace; padding: 10px; }
                .ticket { max-width: 300px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                .items { margin: 10px 0; }
                .item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
                .total { border-top: 1px dashed #000; padding-top: 10px; font-weight: bold; text-align: right; }
                .footer { text-align: center; margin-top: 20px; font-size: 11px; border-top: 1px dashed #000; padding-top: 10px; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              ${contenido}
              <script>window.print(); window.close();</script>
            </body>
          </html>
        `);
        ventana.document.close();
      }
    }
  };

  const nuevaVenta = () => {
    setVentaRealizada(null);
    setCarrito([]);
    setBusqueda('');
  };

  if (!selectedSucursal) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="w-24 h-24 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-6">
          <StoreIcon sx={{ fontSize: 48 }} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Selecciona una sucursal</h3>
        <p className="text-gray-500 text-center max-w-sm">Elige una sucursal en el menú superior para comenzar a vender desde este punto de venta.</p>
      </div>
    );
  }

  if (ventaRealizada) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full min-h-[60vh] bg-white rounded-2xl border border-gray-100 shadow-sm max-w-2xl mx-auto my-8">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircleOutlineIcon sx={{ fontSize: 48 }} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">¡Venta Completada!</h2>
        <p className="text-lg font-mono bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg mb-8">Folio: {ventaRealizada.folio}</p>

        <div className="w-full bg-white border border-gray-200 shadow-sm rounded-xl p-6 mb-8" ref={ticketRef}>
          <Ticket venta={ventaRealizada} sucursal={selectedSucursal} />
        </div>

        <div className="flex items-center gap-4 w-full">
          <button
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-sm"
            onClick={imprimirTicket}
          >
            <PrintIcon sx={{ fontSize: 24 }} />
            Imprimir Ticket
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-4 rounded-xl font-bold text-lg transition-colors"
            onClick={nuevaVenta}
          >
            <CloseIcon sx={{ fontSize: 24 }} />
            Cerrar / Nueva
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-gray-50/50">
      {/* Panel de Productos */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300`}>
        <div className="p-4 md:p-6 bg-white border-b border-gray-200 shadow-sm z-10 sticky top-0">
          <div className="relative max-w-2xl w-full mx-auto md:mx-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <SearchIcon sx={{ fontSize: 20 }} />
            </div>
            <input
              type="text"
              className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
              placeholder="Buscar por nombre, marca o color..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setBusqueda('')}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <svg className="animate-spin mb-4 h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm font-medium">Cargando productos...</p>
            </div>
          ) : productosAgrupados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <SearchIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <p className="text-base font-medium text-gray-600">No se encontraron productos</p>
              <p className="text-sm mt-1">Intenta con otra búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-max">
              {productosAgrupados.map((grupo) => {
                const varianteActual = getVarianteSeleccionada(grupo);
                const stockActual = varianteActual?.inventario?.cantidad ?? 0;
                const precioActual = varianteActual ? Number(varianteActual.precio) : 0;

                return (
                  <div key={grupo.key} className={`flex flex-col bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-200 hover:shadow-md ${stockActual === 0 ? 'border-red-100 opacity-75' : 'border-gray-200 hover:border-blue-200'}`}>
                    <div className="flex justify-between items-start p-4 border-b border-gray-50 bg-gray-50/30">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${grupo.tipo === 'ZAPATO'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-emerald-100 text-emerald-700'
                        }`}>
                        {grupo.tipo === 'ZAPATO' ? 'Zapato' : 'Bolsa'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${stockActual === 0
                        ? 'bg-red-100 text-red-700'
                        : stockActual <= 3
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                        }`}>
                        {stockActual === 0 ? 'Sin stock' : `${stockActual} en stock`}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">{grupo.nombre}</h4>
                      <p className="text-sm text-gray-500 font-medium mb-4">
                        {grupo.color}
                        {grupo.marca && <span className="text-gray-400"> • {grupo.marca}</span>}
                      </p>

                      <div className="mt-auto pt-2 border-t border-gray-100">
                        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Seleccionar Talla</span>
                        <div className="flex flex-wrap gap-1.5">
                          {grupo.variantes.map((variante) => {
                            const stock = variante.inventario?.cantidad ?? 0;
                            const isSelected = varianteActual?.id === variante.id;

                            return (
                              <button
                                key={variante.id}
                                className={`min-w-[40px] h-9 px-2 rounded-lg text-sm font-mono font-medium transition-all ${isSelected
                                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20 ring-offset-1'
                                  : stock === 0
                                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200 line-through'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                  }`}
                                onClick={() => seleccionarTalla(grupo.key, variante.producto.talla)}
                                disabled={stock === 0}
                                title={stock === 0 ? 'Agotado' : `Stock: ${stock}`}
                              >
                                {variante.producto.talla}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</span>
                        <span className="text-lg font-bold text-gray-900">${precioActual.toFixed(2)}</span>
                      </div>
                      <button
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${stockActual === 0
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 hover:shadow-md'
                          }`}
                        onClick={() => varianteActual && agregarAlCarrito(varianteActual)}
                        disabled={stockActual === 0}
                      >
                        {stockActual === 0 ? (
                          'Agotado'
                        ) : (
                          <>
                            <AddIcon sx={{ fontSize: 18 }} />
                            Agregar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Panel de Carrito */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-white border-l border-gray-200 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col h-[calc(100vh-60px)] top-[60px] ${carritoVisible ? 'translate-x-0' : 'translate-x-[110%]'
        }`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingCartIcon sx={{ fontSize: 22 }} />
            </div>
            <span className="font-bold text-gray-900 text-lg">Carrito Venta</span>
            {carrito.length > 0 && (
              <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full text-xs">
                {totalItems}
              </span>
            )}
          </div>
          <button
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors flex items-center"
            onClick={() => setCarritoVisible(false)}
            aria-label="Cerrar carrito"
          >
            <span className="text-sm font-bold mr-1">Cerrar</span>
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
              <div className="p-4 bg-gray-100 rounded-full mb-2">
                <ShoppingCartIcon sx={{ fontSize: 40, color: '#9ca3af' }} />
              </div>
              <p className="font-medium text-gray-600">El carrito está vacío</p>
              <span className="text-sm">Selecciona productos para vender</span>
            </div>
          ) : (
            <div className="space-y-3">
              {carrito.map((item) => (
                <div key={item.productoSucursal.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 relative group">
                  <div className="pr-8">
                    <h5 className="font-bold text-gray-900 leading-tight">{item.productoSucursal.producto.nombre}</h5>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {item.productoSucursal.producto.color} <span className="text-gray-300">•</span> Talla <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{item.productoSucursal.producto.talla}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-50">
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shrink-0">
                      <button
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors disabled:opacity-50"
                        onClick={() => actualizarCantidad(item.productoSucursal.id, item.cantidad - 1)}
                        disabled={item.cantidad <= 1}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-900">
                        {item.cantidad}
                      </span>
                      <button
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors disabled:opacity-50"
                        onClick={() => actualizarCantidad(item.productoSucursal.id, item.cantidad + 1)}
                        disabled={item.cantidad >= (item.productoSucursal.inventario?.cantidad ?? 0)}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500">${Number(item.productoSucursal.precio).toFixed(2)} c/u</span>
                      <span className="font-bold text-blue-700">
                        ${(Number(item.productoSucursal.precio) * item.cantidad).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => quitarDelCarrito(item.productoSucursal.id)}
                    title="Eliminar"
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {carrito.length > 0 && (
          <div className="border-t border-gray-200 bg-white p-5 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-medium text-gray-900">${calcularTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-3 border-t border-gray-100">
                <span>Total a Pagar</span>
                <span className="text-blue-700 text-2xl">${calcularTotal().toFixed(2)}</span>
              </div>
            </div>

            <button
              className="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-lg shadow-sm transition-all focus:ring-4 focus:ring-blue-500/20 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
              onClick={procesarVenta}
              disabled={ventaMutation.isPending}
            >
              {ventaMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando Pago...
                </>
              ) : (
                <>
                  <PaymentIcon sx={{ fontSize: 24 }} />
                  Cobrar ${calcularTotal().toFixed(2)}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Floating cart toggle - hidden on wide screens where cart is visible */}
      <button
        className={`fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:bg-blue-700 hover:scale-105 flex items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/30 z-30 ${carritoVisible ? 'scale-0' : 'scale-100'}`}
        onClick={() => setCarritoVisible(true)}
        aria-label="Ver carrito"
      >
        <ShoppingCartIcon sx={{ fontSize: 26 }} />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white">
            {totalItems}
          </span>
        )}
      </button>
    </div>
  );
}
