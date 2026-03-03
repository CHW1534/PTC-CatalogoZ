import { useSucursal } from '../context';

export function Header() {
  const { sucursales, selectedSucursal, setSelectedSucursal, isLoading } = useSucursal();

  return (
    <header className="header">
      <div className="header-content">
        <h1>PTC Retail</h1>
        <p className="subtitle">Catálogo de Zapatería y Bolsas</p>
      </div>
      <div className="sucursal-selector">
        <label htmlFor="sucursal">Sucursal:</label>
        {isLoading ? (
          <span>Cargando...</span>
        ) : (
          <select
            id="sucursal"
            value={selectedSucursal?.id || ''}
            onChange={(e) => {
              const sucursal = sucursales.find((s) => s.id === e.target.value);
              setSelectedSucursal(sucursal || null);
            }}
          >
            {sucursales.length === 0 && (
              <option value="">No hay sucursales</option>
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
