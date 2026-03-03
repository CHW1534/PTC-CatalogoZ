import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SucursalProvider } from './context';
import {
  Header,
  ProductosTable,
  ProductoForm,
  AsignarProductoForm,
  SucursalForm,
  PuntoVenta,
  TransaccionesTable,
} from './components';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minuto
      refetchOnWindowFocus: false,
    },
  },
});

type Vista = 'dashboard' | 'ventas' | 'transacciones';

function MainApp() {
  const [vista, setVista] = useState<Vista>('dashboard');
  const [showProductoForm, setShowProductoForm] = useState(false);
  const [showAsignarForm, setShowAsignarForm] = useState(false);
  const [showSucursalForm, setShowSucursalForm] = useState(false);

  return (
    <div className="app">
      <Header />

      {/* Navegación */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab ${vista === 'dashboard' ? 'active' : ''}`}
          onClick={() => setVista('dashboard')}
        >
          Inventario
        </button>
        <button
          className={`nav-tab ${vista === 'ventas' ? 'active' : ''}`}
          onClick={() => setVista('ventas')}
        >
          Punto de Venta
        </button>
        <button
          className={`nav-tab ${vista === 'transacciones' ? 'active' : ''}`}
          onClick={() => setVista('transacciones')}
        >
          Transacciones
        </button>
      </nav>

      <main className="main-content">
        {vista === 'dashboard' ? (
          <>
            <div className="dashboard-header">
              <h2>Dashboard de Productos</h2>
              <div className="action-buttons">
                <button
                  className="btn-secondary"
                  onClick={() => setShowSucursalForm(true)}
                >
                  + Nueva Sucursal
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setShowProductoForm(true)}
                >
                  + Nuevo Producto
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setShowAsignarForm(true)}
                >
                  + Asignar a Sucursal
                </button>
              </div>
            </div>
            <ProductosTable />
          </>
        ) : vista === 'ventas' ? (
          <>
            <div className="dashboard-header">
              <h2>Punto de Venta</h2>
            </div>
            <PuntoVenta />
          </>
        ) : (
          <TransaccionesTable />
        )}
      </main>

      {showProductoForm && (
        <ProductoForm onClose={() => setShowProductoForm(false)} />
      )}

      {showAsignarForm && (
        <AsignarProductoForm onClose={() => setShowAsignarForm(false)} />
      )}

      {showSucursalForm && (
        <SucursalForm onClose={() => setShowSucursalForm(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SucursalProvider>
        <MainApp />
      </SucursalProvider>
    </QueryClientProvider>
  );
}

export default App;
