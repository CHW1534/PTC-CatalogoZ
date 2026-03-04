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
  InventarioPage,
  SucursalesPage,
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

type Vista = 'productos' | 'sucursales' | 'inventario' | 'transacciones' | 'ventas';

function MainApp() {
  const [vista, setVista] = useState<Vista>('productos');
  const [showProductoForm, setShowProductoForm] = useState(false);
  const [showAsignarForm, setShowAsignarForm] = useState(false);
  const [showSucursalForm, setShowSucursalForm] = useState(false);

  return (
    <div className="app">
      <Header vista={vista} onVistaChange={(v) => setVista(v as Vista)} />

      <main className="main-content">
        {vista === 'productos' ? (
          <>
            <div className="dashboard-header">
              <h2>Catalogo de Productos</h2>
              <div className="action-buttons">
                <button
                  className="btn-secondary"
                  onClick={() => setShowAsignarForm(true)}
                >
                  Asignar a Sucursal
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setShowProductoForm(true)}
                >
                  + Nuevo Producto
                </button>
              </div>
            </div>
            <ProductosTable />
          </>
        ) : vista === 'sucursales' ? (
          <SucursalesPage />
        ) : vista === 'inventario' ? (
          <>
            <div className="dashboard-header">
              <h2>Inventario</h2>
              <div className="action-buttons">
                <button
                  className="btn-primary"
                  onClick={() => setShowAsignarForm(true)}
                >
                  + Asignar Producto
                </button>
              </div>
            </div>
            <InventarioPage />
          </>
        ) : vista === 'ventas' ? (
          <div className="pos-fullwidth">
            <div className="dashboard-header">
              <h2>Punto de Venta</h2>
            </div>
            <PuntoVenta />
          </div>
        ) : (
          <>
            <div className="dashboard-header">
              <h2>Historial de Transacciones</h2>
            </div>
            <TransaccionesTable />
          </>
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
