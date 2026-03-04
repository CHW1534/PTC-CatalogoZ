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
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Editar Sucursal' : 'Nueva Sucursal'}</h3>
          <button className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700">Nombre *</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Sucursal Centro"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="direccion" className="block text-sm font-semibold text-gray-700">Dirección</label>
            <input
              id="direccion"
              name="direccion"
              type="text"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Calle y número"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="telefono" className="block text-sm font-semibold text-gray-700">Teléfono</label>
            <input
              id="telefono"
              name="telefono"
              type="text"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="55 1234 5678"
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-gray-100">
            <button type="button" className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              disabled={isPending || !formData.nombre}
            >
              {isPending ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isPending ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear'}
            </button>
          </div>

          {(createMutation.isError || updateMutation.isError) && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium mt-4">
              Error al {isEditing ? 'actualizar' : 'crear'} sucursal
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
