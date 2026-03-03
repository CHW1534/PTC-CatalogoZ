import type { Sucursal } from '../types';

interface VentaItem {
  productoSucursal: {
    id: string;
    precio: number;
    producto: {
      nombre: string;
      color: string;
      talla: string;
      tipo: string;
      marca?: string;
    };
  };
  cantidad: number;
}

interface VentaRealizada {
  items: VentaItem[];
  fecha: Date;
  total: number;
  folio: string;
}

interface TicketProps {
  venta: VentaRealizada;
  sucursal: Sucursal;
}

export function Ticket({ venta, sucursal }: TicketProps) {
  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="ticket">
      <div className="header">
        <h2>PTC RETAIL</h2>
        <p><strong>{sucursal.nombre}</strong></p>
        {sucursal.direccion && <p>{sucursal.direccion}</p>}
        {sucursal.telefono && <p>Tel: {sucursal.telefono}</p>}
        <p>================================</p>
        <p><strong>TICKET DE VENTA</strong></p>
        <p>Folio: {venta.folio}</p>
        <p>Fecha: {formatearFecha(venta.fecha)}</p>
        <p>================================</p>
      </div>

      <div className="items">
        {venta.items.map((item, index) => (
          <div key={index} className="item">
            <div className="item-desc">
              <div>{item.productoSucursal.producto.nombre}</div>
              <div style={{ fontSize: '10px', color: '#666' }}>
                {item.productoSucursal.producto.color} | T.{item.productoSucursal.producto.talla} | {item.productoSucursal.producto.tipo}
              </div>
            </div>
            <div className="item-qty">{item.cantidad} x ${Number(item.productoSucursal.precio).toFixed(2)}</div>
            <div className="item-total">${(item.cantidad * Number(item.productoSucursal.precio)).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="total">
        <p>================================</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
          <span>TOTAL:</span>
          <strong>${venta.total.toFixed(2)}</strong>
        </div>
        <p>================================</p>
      </div>

      <div className="footer">
        <p>¡Gracias por su compra!</p>
        <p>Vuelva pronto</p>
        <p style={{ marginTop: '10px', fontSize: '10px' }}>
          Este ticket no es un comprobante fiscal
        </p>
      </div>
    </div>
  );
}
