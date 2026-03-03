import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSucursal } from '../context';
import { productosService, transaccionesService } from '../services';
import type { ProductoSucursal } from '../types';
import { Ticket } from './Ticket';

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
  const ticketRef = useRef<HTMLDivElement>(null);

  const { data: productosData } = useQuery({
    queryKey: ['productos-venta', selectedSucursal?.id, busqueda],
    queryFn: () =>
      selectedSucursal
        ? productosService.getBySucursal(selectedSucursal.id, {
            search: busqueda || undefined,
            limit: 50,
          })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 50 }),
    enabled: !!selectedSucursal,
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
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
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
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2>Venta Completada</h2>
        <p className="pos-folio">Folio: {ventaRealizada.folio}</p>
        <div className="pos-ticket-preview" ref={ticketRef}>
          <Ticket venta={ventaRealizada} sucursal={selectedSucursal} />
        </div>
        <div className="pos-complete-actions">
          <button className="btn-primary btn-lg" onClick={imprimirTicket}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Imprimir Ticket
          </button>
          <button className="btn-success btn-lg" onClick={nuevaVenta}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, marca o color..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button className="pos-search-clear" onClick={() => setBusqueda('')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="pos-productos-grid">
          {productosAgrupados.length === 0 ? (
            <div className="pos-no-productos">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
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
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
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
      <div className="pos-carrito">
        <div className="pos-carrito-header">
          <div className="pos-carrito-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span>Carrito</span>
          </div>
          {carrito.length > 0 && (
            <span className="pos-carrito-badge">{totalItems}</span>
          )}
        </div>

        <div className="pos-carrito-body">
          {carrito.length === 0 ? (
            <div className="pos-carrito-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                  Cobrar ${calcularTotal().toFixed(2)}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
