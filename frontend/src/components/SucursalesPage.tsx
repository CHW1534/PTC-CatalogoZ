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
                  <StoreIcon />
                </div>
                <span className={`status-badge ${sucursal.activa ? 'active' : 'inactive'}`}>
                  {sucursal.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="sucursal-card-body">
                <h3 className="sucursal-name">{sucursal.nombre}</h3>
                {sucursal.direccion && (
                  <p className="sucursal-info">
                    <LocationOnIcon sx={{ fontSize: 16 }} />
                    {sucursal.direccion}
                  </p>
                )}
                {sucursal.telefono && (
                  <p className="sucursal-info">
                    <PhoneIcon sx={{ fontSize: 16 }} />
                    {sucursal.telefono}
                  </p>
                )}
              </div>
              <div className="sucursal-card-actions">
                <button
                  className="btn-action btn-edit"
                  onClick={() => handleEdit(sucursal)}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                  Editar
                </button>
                <button
                  className={`btn-action ${sucursal.activa ? 'btn-salida' : 'btn-entrada'}`}
                  onClick={() => handleToggleActiva(sucursal)}
                  disabled={toggleMutation.isPending}
                >
                  {sucursal.activa ? (
                    <>
                      <BlockIcon sx={{ fontSize: 16 }} />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon sx={{ fontSize: 16 }} />
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
