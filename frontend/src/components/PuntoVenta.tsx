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

// Agrupación de productos por nombre+color+marca para selección de tallas
interface ProductoAgrupado {
  key: string;
  nombre: string;
  color: string;
  marca: string;
  tipo: string;
  variantes: ProductoSucursal[]; // Diferentes tallas del mismo producto
}

export function PuntoVenta() {
  const queryClient = useQueryClient();
  const { selectedSucursal } = useSucursal();
  const [carrito, setCarrito] = useState<VentaItem[]>([]);
  const [ventaRealizada, setVentaRealizada] = useState<VentaRealizada | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState<Record<string, string>>({});
  const ticketRef = useRef<HTMLDivElement>(null);

  // Query productos de la sucursal
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

  // Agrupar productos por nombre+color+marca para mostrar selector de tallas
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

    // Ordenar variantes por talla
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

  // Obtener la variante seleccionada para un grupo
  const getVarianteSeleccionada = (grupo: ProductoAgrupado): ProductoSucursal | null => {
    const tallaSeleccionada = tallasSeleccionadas[grupo.key];
    if (tallaSeleccionada) {
      return grupo.variantes.find(v => v.producto.talla === tallaSeleccionada) || null;
    }
    // Por defecto, seleccionar la primera con stock
    return grupo.variantes.find(v => (v.inventario?.cantidad ?? 0) > 0) || grupo.variantes[0] || null;
  };

  // Seleccionar talla para un grupo
  const seleccionarTalla = (grupoKey: string, talla: string) => {
    setTallasSeleccionadas(prev => ({ ...prev, [grupoKey]: talla }));
  };

  // Mutation para registrar salida
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
          alert('No hay más stock disponible');
          return prev;
        }
        return prev.map((item) =>
          item.productoSucursal.id === ps.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      if (stockDisponible === 0) {
        alert('Producto sin stock');
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
            alert(`Solo hay ${stockDisponible} unidades disponibles`);
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

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const confirmar = confirm(
      `¿Confirmar venta por $${calcularTotal().toFixed(2)}?`
    );
    if (!confirmar) return;

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
    } catch (error) {
      alert('Error al procesar la venta. Verifica el stock disponible.');
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
    return <div className="no-sucursal">Selecciona una sucursal para vender</div>;
  }

  // Mostrar ticket después de venta
  if (ventaRealizada) {
    return (
      <div className="venta-completada">
        <div className="ticket-container" ref={ticketRef}>
          <Ticket venta={ventaRealizada} sucursal={selectedSucursal} />
        </div>
        <div className="ticket-actions">
          <button className="btn-primary" onClick={imprimirTicket}>
            Imprimir Ticket
          </button>
          <button className="btn-secondary" onClick={nuevaVenta}>
            Nueva Venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="punto-venta">
      <div className="pv-productos">
        <div className="pv-busqueda">
          <input
            type="text"
            placeholder="Buscar producto por nombre o marca..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="pv-grid">
          {productosAgrupados.length === 0 ? (
            <p className="empty">No hay productos disponibles</p>
          ) : (
            productosAgrupados.map((grupo) => {
              const varianteActual = getVarianteSeleccionada(grupo);
              const stockActual = varianteActual?.inventario?.cantidad ?? 0;
              const precioActual = varianteActual ? Number(varianteActual.precio) : 0;
              
              return (
                <div
                  key={grupo.key}
                  className={`pv-producto ${stockActual === 0 ? 'sin-stock' : ''}`}
                >
                  <div className="pv-producto-nombre">{grupo.nombre}</div>
                  <div className="pv-producto-info">
                    {grupo.color} {grupo.marca && `- ${grupo.marca}`}
                  </div>
                  <div className="pv-producto-tipo">
                    <span className={`badge ${grupo.tipo.toLowerCase()}`}>
                      {grupo.tipo}
                    </span>
                  </div>
                  
                  {/* Selector de tallas con stock visible */}
                  <div className="pv-tallas">
                    <label>Selecciona talla:</label>
                    <div className="tallas-grid">
                      {grupo.variantes.map((variante) => {
                        const stock = variante.inventario?.cantidad ?? 0;
                        const isSelected = varianteActual?.id === variante.id;
                        return (
                          <button
                            key={variante.id}
                            className={`talla-btn ${isSelected ? 'selected' : ''} ${stock === 0 ? 'agotado' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              seleccionarTalla(grupo.key, variante.producto.talla);
                            }}
                            disabled={stock === 0}
                          >
                            <span className="talla-numero">{variante.producto.talla}</span>
                            <span className={`talla-stock ${stock === 0 ? 'out' : stock <= 2 ? 'low' : ''}`}>
                              {stock === 0 ? '✕' : stock}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pv-producto-precio">${precioActual.toFixed(2)}</div>
                  <div className={`pv-producto-stock ${stockActual === 0 ? 'out' : ''}`}>
                    Stock: {stockActual}
                  </div>
                  
                  <button
                    className="btn-agregar"
                    onClick={() => varianteActual && agregarAlCarrito(varianteActual)}
                    disabled={stockActual === 0}
                  >
                    {stockActual === 0 ? 'Sin Stock' : '+ Agregar'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pv-carrito">
        <h3>Carrito de Venta</h3>
        {carrito.length === 0 ? (
          <p className="carrito-vacio">Selecciona productos para agregar</p>
        ) : (
          <>
            <div className="carrito-items">
              {carrito.map((item) => (
                <div key={item.productoSucursal.id} className="carrito-item">
                  <div className="carrito-item-info">
                    <strong>{item.productoSucursal.producto.nombre}</strong>
                    <span>
                      {item.productoSucursal.producto.color} - T.{item.productoSucursal.producto.talla}
                    </span>
                  </div>
                  <div className="carrito-item-cantidad">
                    <button
                      onClick={() =>
                        actualizarCantidad(item.productoSucursal.id, item.cantidad - 1)
                      }
                    >
                      -
                    </button>
                    <span>{item.cantidad}</span>
                    <button
                      onClick={() =>
                        actualizarCantidad(item.productoSucursal.id, item.cantidad + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                  <div className="carrito-item-precio">
                    ${(Number(item.productoSucursal.precio) * item.cantidad).toFixed(2)}
                  </div>
                  <button
                    className="btn-remove"
                    onClick={() => quitarDelCarrito(item.productoSucursal.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="carrito-total">
              <span>Total:</span>
              <strong>${calcularTotal().toFixed(2)}</strong>
            </div>
            <button
              className="btn-vender"
              onClick={procesarVenta}
              disabled={ventaMutation.isPending}
            >
              {ventaMutation.isPending ? 'Procesando...' : 'Procesar Venta'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
