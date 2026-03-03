import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sucursalesService } from '../services';
import { SucursalForm } from './SucursalForm';
import type { Sucursal } from '../types';

export function SucursalesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);

  const { data: sucursales = [], isLoading } = useQuery({
    queryKey: ['sucursales'],
    queryFn: sucursalesService.getAll,
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
    <div className="sucursales-page">
      <div className="page-header">
        <div>
          <h2>Sucursales</h2>
          <p className="page-subtitle">Administra tus puntos de venta</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Nueva Sucursal
        </button>
      </div>

      {/* Tarjetas de estadisticas */}
      <div className="stats-grid stats-grid-3">
        <div className="stat-card">
          <div className="stat-value text-primary">{sucursales.length}</div>
          <div className="stat-label">Total Sucursales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-success">{sucursalesActivas}</div>
          <div className="stat-label">Activas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-danger">{sucursalesInactivas}</div>
          <div className="stat-label">Inactivas</div>
        </div>
      </div>

      {/* Grid de sucursales */}
      {isLoading ? (
        <div className="loading-state">Cargando sucursales...</div>
      ) : sucursales.length === 0 ? (
        <div className="empty-state">
          <p>No hay sucursales registradas</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            Crear primera sucursal
          </button>
        </div>
      ) : (
        <div className="sucursales-grid">
          {sucursales.map((sucursal) => (
            <div
              key={sucursal.id}
              className={`sucursal-card ${!sucursal.activa ? 'inactive' : ''}`}
            >
              <div className="sucursal-card-header">
                <div className="sucursal-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <span className={`status-badge ${sucursal.activa ? 'active' : 'inactive'}`}>
                  {sucursal.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="sucursal-card-body">
                <h3 className="sucursal-name">{sucursal.nombre}</h3>
                {sucursal.direccion && (
                  <p className="sucursal-info">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {sucursal.direccion}
                  </p>
                )}
                {sucursal.telefono && (
                  <p className="sucursal-info">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    {sucursal.telefono}
                  </p>
                )}
              </div>
              <div className="sucursal-card-actions">
                <button
                  className="btn-action btn-edit"
                  onClick={() => handleEdit(sucursal)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Editar
                </button>
                <button
                  className={`btn-action ${sucursal.activa ? 'btn-salida' : 'btn-entrada'}`}
                  onClick={() => handleToggleActiva(sucursal)}
                  disabled={toggleMutation.isPending}
                >
                  {sucursal.activa ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                      </svg>
                      Desactivar
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
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
