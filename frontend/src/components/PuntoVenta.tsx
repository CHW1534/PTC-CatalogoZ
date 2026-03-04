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
      <div className="pos-empty-state">
        <div className="pos-empty-icon">
          <StoreIcon sx={{ fontSize: 48 }} />
        </div>
        <h3>Selecciona una sucursal</h3>
        <p>Elige una sucursal en el menu superior para comenzar a vender</p>
      </div>
    );
  }

  if (ventaRealizada) {
    return (
      <div className="pos-venta-completada">
        <div className="pos-success-icon">
          <CheckCircleOutlineIcon sx={{ fontSize: 64 }} />
        </div>
        <h2>Venta Completada</h2>
        <p className="pos-folio">Folio: {ventaRealizada.folio}</p>
        <div className="pos-ticket-preview" ref={ticketRef}>
          <Ticket venta={ventaRealizada} sucursal={selectedSucursal} />
        </div>
        <div className="pos-complete-actions">
          <button className="btn-primary btn-lg" onClick={imprimirTicket}>
            <PrintIcon sx={{ fontSize: 20 }} />
            Imprimir Ticket
          </button>
          <button className="btn-success btn-lg" onClick={nuevaVenta}>
            <AddIcon sx={{ fontSize: 20 }} />
            Nueva Venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-container">
      {/* Panel de Productos */}
      <div className="pos-productos">
        <div className="pos-search-bar">
          <div className="pos-search-input">
            <SearchIcon sx={{ fontSize: 20 }} />
            <input
              type="text"
              placeholder="Buscar por nombre, marca o color..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button className="pos-search-clear" onClick={() => setBusqueda('')}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </button>
            )}
          </div>
        </div>

        <div className="pos-productos-grid">
          {isLoading ? (
            <div className="pos-loading">
              <div className="pos-spinner"></div>
              <p>Cargando productos...</p>
            </div>
          ) : productosAgrupados.length === 0 ? (
            <div className="pos-no-productos">
              <SearchIcon sx={{ fontSize: 48 }} />
              <p>No se encontraron productos</p>
            </div>
          ) : (
            productosAgrupados.map((grupo) => {
              const varianteActual = getVarianteSeleccionada(grupo);
              const stockActual = varianteActual?.inventario?.cantidad ?? 0;
              const precioActual = varianteActual ? Number(varianteActual.precio) : 0;
              
              return (
                <div key={grupo.key} className={`pos-card ${stockActual === 0 ? 'sin-stock' : ''}`}>
                  <div className="pos-card-header">
                    <span className={`pos-tipo-badge ${grupo.tipo.toLowerCase()}`}>
                      {grupo.tipo === 'ZAPATO' ? 'Zapato' : 'Bolsa'}
                    </span>
                    <span className={`pos-stock-indicator ${stockActual === 0 ? 'out' : stockActual <= 3 ? 'low' : ''}`}>
                      {stockActual} en stock
                    </span>
                  </div>
                  
                  <div className="pos-card-body">
                    <h4 className="pos-card-title">{grupo.nombre}</h4>
                    <p className="pos-card-subtitle">
                      {grupo.color}
                      {grupo.marca && <span> - {grupo.marca}</span>}
                    </p>
                  </div>

                  <div className="pos-tallas-section">
                    <span className="pos-tallas-label">Talla:</span>
                    <div className="pos-tallas-list">
                      {grupo.variantes.map((variante) => {
                        const stock = variante.inventario?.cantidad ?? 0;
                        const isSelected = varianteActual?.id === variante.id;
                        return (
                          <button
                            key={variante.id}
                            className={`pos-talla-chip ${isSelected ? 'selected' : ''} ${stock === 0 ? 'disabled' : ''}`}
                            onClick={() => seleccionarTalla(grupo.key, variante.producto.talla)}
                            disabled={stock === 0}
                            title={`Stock: ${stock}`}
                          >
                            {variante.producto.talla}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pos-card-footer">
                    <div className="pos-precio">
                      <span className="pos-precio-label">Precio</span>
                      <span className="pos-precio-value">${precioActual.toFixed(2)}</span>
                    </div>
                    <button
                      className="pos-btn-agregar"
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
            })
          )}
        </div>
      </div>

      {/* Panel de Carrito */}
      <div className={`pos-carrito${carritoVisible ? ' pos-carrito-visible' : ''}`}>
        <div className="pos-carrito-header">
          <div className="pos-carrito-title">
            <ShoppingCartIcon sx={{ fontSize: 22 }} />
            <span>Carrito</span>
          </div>
          {carrito.length > 0 && (
            <span className="pos-carrito-badge">{totalItems}</span>
          )}
          <button
            className="pos-carrito-close"
            onClick={() => setCarritoVisible(false)}
            aria-label="Cerrar carrito"
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <div className="pos-carrito-body">
          {carrito.length === 0 ? (
            <div className="pos-carrito-empty">
              <ShoppingCartIcon sx={{ fontSize: 48 }} />
              <p>El carrito esta vacio</p>
              <span>Selecciona productos para agregar</span>
            </div>
          ) : (
            <div className="pos-carrito-items">
              {carrito.map((item) => (
                <div key={item.productoSucursal.id} className="pos-carrito-item">
                  <div className="pos-item-info">
                    <h5>{item.productoSucursal.producto.nombre}</h5>
                    <p>
                      {item.productoSucursal.producto.color} - Talla {item.productoSucursal.producto.talla}
                    </p>
                    <span className="pos-item-unit-price">
                      ${Number(item.productoSucursal.precio).toFixed(2)} c/u
                    </span>
                  </div>
                  <div className="pos-item-controls">
                    <div className="pos-qty-control">
                      <button
                        onClick={() => actualizarCantidad(item.productoSucursal.id, item.cantidad - 1)}
                        disabled={item.cantidad <= 1}
                      >
                        -
                      </button>
                      <span>{item.cantidad}</span>
                      <button
                        onClick={() => actualizarCantidad(item.productoSucursal.id, item.cantidad + 1)}
                        disabled={item.cantidad >= (item.productoSucursal.inventario?.cantidad ?? 0)}
                      >
                        +
                      </button>
                    </div>
                    <span className="pos-item-subtotal">
                      ${(Number(item.productoSucursal.precio) * item.cantidad).toFixed(2)}
                    </span>
                    <button
                      className="pos-btn-remove"
                      onClick={() => quitarDelCarrito(item.productoSucursal.id)}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {carrito.length > 0 && (
          <div className="pos-carrito-footer">
            <div className="pos-total-row">
              <span>Subtotal ({totalItems} items)</span>
              <span>${calcularTotal().toFixed(2)}</span>
            </div>
            <div className="pos-total-row total">
              <span>Total a Pagar</span>
              <span>${calcularTotal().toFixed(2)}</span>
            </div>
            <button
              className="pos-btn-checkout"
              onClick={procesarVenta}
              disabled={ventaMutation.isPending}
            >
              {ventaMutation.isPending ? (
                <>
                  <span className="pos-spinner"></span>
                  Procesando...
                </>
              ) : (
                <>
                  <PaymentIcon sx={{ fontSize: 22 }} />
                  Cobrar ${calcularTotal().toFixed(2)}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Floating cart toggle - only visible on mobile */}
      <button
        className="pos-carrito-fab"
        onClick={() => setCarritoVisible(!carritoVisible)}
        aria-label="Ver carrito"
      >
        <ShoppingCartIcon sx={{ fontSize: 22 }} />
        {totalItems > 0 && <span className="pos-fab-badge">{totalItems}</span>}
      </button>
    </div>
  );
}
