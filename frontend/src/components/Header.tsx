import { useSucursal } from '../context';
import StorefrontIcon from '@mui/icons-material/Storefront';

interface HeaderProps {
  vista: string;
  onVistaChange: (vista: string) => void;
}

export function Header({ vista, onVistaChange }: HeaderProps) {
  const { sucursales, selectedSucursal, setSelectedSucursal, isLoading } = useSucursal();

  const navItems = [
    { id: 'productos', label: 'Productos' },
    { id: 'sucursales', label: 'Sucursales' },
    { id: 'inventario', label: 'Inventario' },
    { id: 'transacciones', label: 'Transacciones' },
    { id: 'ventas', label: 'Punto de Venta' },
  ];

  return (
    <header className="header-new">
      <div className="header-left">
        <div className="header-brand">
          <div className="brand-icon">
            <StorefrontIcon sx={{ fontSize: 28 }} />
          </div>
          <div className="brand-text">
            <span className="brand-name">PTC Retail</span>
            <span className="brand-subtitle">Zapateria y Bolsas</span>
          </div>
        </div>
      </div>

      <nav className="header-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`header-nav-item ${vista === item.id ? 'active' : ''}`}
            onClick={() => onVistaChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="header-right">
        {isLoading ? (
          <span className="header-loading">Cargando...</span>
        ) : (
          <select
            className="header-select"
            value={selectedSucursal?.id || ''}
            onChange={(e) => {
              const sucursal = sucursales.find((s) => s.id === e.target.value);
              setSelectedSucursal(sucursal || null);
            }}
          >
            {sucursales.length === 0 && (
              <option value="">Sin sucursales</option>
            )}
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        )}
      </div>
    </header>
  );
}
