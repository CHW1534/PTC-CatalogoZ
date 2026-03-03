import { useSucursal } from '../context';

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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">StoreManager</span>
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
