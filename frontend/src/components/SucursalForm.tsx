import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sucursalesService } from '../services';
import type { CreateSucursalDto, Sucursal } from '../types';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
  sucursal?: Sucursal | null;
}

const emptyForm: CreateSucursalDto = {
  nombre: '',
  direccion: '',
  telefono: '',
};

export function SucursalForm({ onClose, onSuccess, sucursal }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!sucursal;
  
  const [formData, setFormData] = useState<CreateSucursalDto>(emptyForm);

  useEffect(() => {
    if (sucursal) {
      setFormData({
        nombre: sucursal.nombre || '',
        direccion: sucursal.direccion || '',
        telefono: sucursal.telefono || '',
      });
    } else {
      setFormData(emptyForm);
    }
  }, [sucursal]);

  const createMutation = useMutation({
    mutationFn: sucursalesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sucursales'] });
      onSuccess?.();
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateSucursalDto }) => 
      sucursalesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sucursales'] });
      onSuccess?.();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && sucursal) {
      updateMutation.mutate({ id: sucursal.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? 'Editar Sucursal' : 'Nueva Sucursal'}</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombre">Nombre *</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Sucursal Centro"
            />
          </div>

          <div className="form-group">
            <label htmlFor="direccion">Direccion</label>
            <input
              id="direccion"
              name="direccion"
              type="text"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Calle y numero"
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Telefono</label>
            <input
              id="telefono"
              name="telefono"
              type="text"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="55 1234 5678"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isPending || !formData.nombre}
            >
              {isPending ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear'}
            </button>
          </div>

          {(createMutation.isError || updateMutation.isError) && (
            <div className="error-message">
              Error al {isEditing ? 'actualizar' : 'crear'} sucursal
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
