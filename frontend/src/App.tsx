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
  MonitorVentas,
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

type Vista = 'productos' | 'sucursales' | 'inventario' | 'transacciones' | 'ventas' | 'monitor';

function MainApp() {
  const [vista, setVista] = useState<Vista>('productos');
  const [showProductoForm, setShowProductoForm] = useState(false);
  const [showAsignarForm, setShowAsignarForm] = useState(false);
  const [showSucursalForm, setShowSucursalForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <Header vista={vista} onVistaChange={(v) => setVista(v as Vista)} />

      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
        {vista === 'productos' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">Catálogo de Productos</h2>
                <p className="text-gray-500 text-sm mt-1">Gestiona el inventario global de la empresa</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  onClick={() => setShowAsignarForm(true)}
                >
                  Asignar a Sucursal
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  onClick={() => setShowProductoForm(true)}
                >
                  + Nuevo Producto
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <ProductosTable />
            </div>
          </div>
        ) : vista === 'sucursales' ? (
          <SucursalesPage />
        ) : vista === 'inventario' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">Inventario por Sucursal</h2>
                <p className="text-gray-500 text-sm mt-1">Controla el stock de cada tienda</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  onClick={() => setShowAsignarForm(true)}
                >
                  + Asignar Producto
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <InventarioPage />
            </div>
          </div>
        ) : vista === 'ventas' ? (
          <div className="w-full space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">Punto de Venta</h2>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <PuntoVenta />
            </div>
          </div>
        ) : vista === 'transacciones' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">Historial de Transacciones</h2>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <TransaccionesTable />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">Monitor de Ventas</h2>
                <p className="text-gray-500 text-sm mt-1">Resumen de movimientos e ingresos de la sucursal</p>
              </div>
            </div>
            <MonitorVentas />
          </div>
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
