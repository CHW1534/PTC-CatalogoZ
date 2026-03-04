import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sucursalesService } from '../services';
import { SucursalForm } from './SucursalForm';
import type { Sucursal } from '../types';
import StoreIcon from '@mui/icons-material/Store';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export function SucursalesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);

  const { data: sucursales = [], isLoading } = useQuery({
    queryKey: ['sucursales', 'all'],
    queryFn: sucursalesService.getAllIncludingInactive,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activa }: { id: string; activa: boolean }) =>
      sucursalesService.update(id, { activa } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sucursales'] });
    },
  });

  const handleEdit = (sucursal: Sucursal) => {
    setEditingSucursal(sucursal);
    setShowForm(true);
  };

  const handleToggleActiva = (sucursal: Sucursal) => {
    toggleMutation.mutate({ id: sucursal.id, activa: !sucursal.activa });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSucursal(null);
  };

  const sucursalesActivas = sucursales.filter((s) => s.activa).length;
  const sucursalesInactivas = sucursales.filter((s) => !s.activa).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sucursales</h2>
          <p className="text-gray-500 text-sm mt-1">Administra tus puntos de venta</p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          onClick={() => setShowForm(true)}
        >
          + Nueva Sucursal
        </button>
      </div>

      {/* Tarjetas de estadisticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-800">{sucursales.length}</div>
          <div className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-wider">Total Sucursales</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-blue-600">{sucursalesActivas}</div>
          <div className="text-sm font-medium text-blue-500 mt-1 uppercase tracking-wider">Activas</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-red-600">{sucursalesInactivas}</div>
          <div className="text-sm font-medium text-red-500 mt-1 uppercase tracking-wider">Inactivas</div>
        </div>
      </div>

      {/* Grid de sucursales */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48 text-gray-500">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Cargando sucursales...
        </div>
      ) : sucursales.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No hay sucursales registradas</p>
          <button
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            onClick={() => setShowForm(true)}
          >
            Crear primera sucursal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sucursales.map((sucursal) => (
            <div
              key={sucursal.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${!sucursal.activa ? 'border-gray-200 opacity-75' : 'border-gray-200'}`}
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
                <div className={`p-2 rounded-lg ${sucursal.activa ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  <StoreIcon fontSize="small" />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sucursal.activa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {sucursal.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-semibold text-lg text-gray-900">{sucursal.nombre}</h3>

                <div className="space-y-2 text-sm text-gray-600">
                  {sucursal.direccion && (
                    <p className="flex items-start gap-2">
                      <LocationOnIcon fontSize="small" className="text-gray-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{sucursal.direccion}</span>
                    </p>
                  )}
                  {sucursal.telefono && (
                    <p className="flex items-center gap-2">
                      <PhoneIcon fontSize="small" className="text-gray-400 shrink-0" />
                      <span>{sucursal.telefono}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex divide-x divide-gray-100 border-t border-gray-100 bg-gray-50">
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  onClick={() => handleEdit(sucursal)}
                >
                  <EditIcon fontSize="small" />
                  Editar
                </button>
                <button
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${sucursal.activa ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                  onClick={() => handleToggleActiva(sucursal)}
                  disabled={toggleMutation.isPending}
                >
                  {sucursal.activa ? (
                    <>
                      <BlockIcon fontSize="small" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon fontSize="small" />
                      Activar
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SucursalForm
          onClose={handleCloseForm}
          sucursal={editingSucursal}
        />
      )}
    </div>
  );
}
