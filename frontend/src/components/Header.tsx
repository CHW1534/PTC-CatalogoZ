import { useState } from 'react';
import { useSucursal } from '../context';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

interface HeaderProps {
  vista: string;
  onVistaChange: (vista: string) => void;
}

export function Header({ vista, onVistaChange }: HeaderProps) {
  const { sucursales, selectedSucursal, setSelectedSucursal, isLoading } = useSucursal();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { id: 'productos', label: 'Productos' },
    { id: 'sucursales', label: 'Sucursales' },
    { id: 'inventario', label: 'Inventario' },
    { id: 'transacciones', label: 'Transacciones' },
    { id: 'ventas', label: 'Punto de Venta' },
    { id: 'monitor', label: 'Monitor' },
  ];

  const handleNavClick = (id: string) => {
    onVistaChange(id);
    setMenuOpen(false);
  };

  return (
    <header className="bg-white px-6 py-3 flex items-center justify-between shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] sticky top-0 z-50 w-full flex-wrap gap-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md shadow-blue-500/30">
          <StorefrontIcon sx={{ fontSize: 22, color: 'white' }} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 text-lg leading-tight tracking-tight">PTC Retail</span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Zapatería y Bolsas</span>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className={`hidden md:flex items-center gap-2 ${menuOpen ? 'flex' : ''}`}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`px-4 py-2 rounded-lg transition-all text-sm font-semibold relative overflow-hidden group ${vista === item.id
              ? 'text-blue-700 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            onClick={() => handleNavClick(item.id)}
          >
            {item.label}
            {vista === item.id && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
            )}
          </button>
        ))}
      </nav>

      {/* Selector de sucursal y menú hamburguesa */}
      <div className="flex items-center gap-3 ml-auto">
        {isLoading ? (
          <span className="text-gray-400 text-sm font-medium animate-pulse">Cargando...</span>
        ) : (
          <div className="relative">
            <select
              className="appearance-none bg-gray-50 text-gray-700 border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium min-w-[160px] max-w-[220px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer hover:bg-gray-100"
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
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
        {/* Botón hamburguesa solo en móvil */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <CloseIcon sx={{ fontSize: 22 }} /> : <MenuIcon sx={{ fontSize: 22 }} />}
        </button>
      </div>

      {/* Navegación móvil (menú desplegable) */}
      {menuOpen && (
        <nav className="flex flex-col w-full mt-3 md:hidden bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-200/50 p-2 overflow-hidden gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`px-4 py-3 text-left rounded-lg transition-colors text-sm font-semibold ${vista === item.id
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              onClick={() => handleNavClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
