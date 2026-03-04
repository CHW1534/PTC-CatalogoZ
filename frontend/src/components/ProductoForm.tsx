import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productosService } from '../services';
import type { CreateProductoDto, CreateProductoMultiTallaDto, TallaConCantidad } from '../types';
import { TipoProducto, COLORES_PREDEFINIDOS, COLOR_HEX_MAP, TALLAS_ZAPATO, TALLAS_BOLSA } from '../types';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export function ProductoForm({ onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [modoMultiple, setModoMultiple] = useState(false);
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState<Record<string, number>>({});

  const [formData, setFormData] = useState({
    nombre: '',
    marca: '',
    modelo: '',
    color: '',
    talla: '',
    tipo: TipoProducto.ZAPATO as typeof TipoProducto.ZAPATO | typeof TipoProducto.BOLSA,
    descripcion: '',
    imagenUrl: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductoDto) => productosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      onSuccess?.();
      onClose();
    },
  });

  const createMultiMutation = useMutation({
    mutationFn: (data: CreateProductoMultiTallaDto) => productosService.createConMultiTallas(data),
    onSuccess: (productos) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      alert(`Se crearon ${productos.length} productos con tallas: ${productos.map(p => p.talla).join(', ')}`);
      onSuccess?.();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (modoMultiple) {
      const tallas: TallaConCantidad[] = Object.entries(tallasSeleccionadas)
        .filter(([, cantidad]) => cantidad > 0)
        .map(([talla, cantidad]) => ({ talla, cantidad }));

      if (tallas.length === 0) {
        alert('Selecciona al menos una talla');
        return;
      }

      const multiDto: CreateProductoMultiTallaDto = {
        nombre: formData.nombre,
        marca: formData.marca || undefined,
        modelo: formData.modelo || undefined,
        color: formData.color,
        tallas,
        tipo: formData.tipo,
        descripcion: formData.descripcion || undefined,
        imagenUrl: formData.imagenUrl || undefined,
      };
      createMultiMutation.mutate(multiDto);
    } else {
      const dto: CreateProductoDto = {
        nombre: formData.nombre,
        marca: formData.marca || undefined,
        modelo: formData.modelo || undefined,
        color: formData.color,
        talla: formData.talla,
        tipo: formData.tipo,
        descripcion: formData.descripcion || undefined,
        imagenUrl: formData.imagenUrl || undefined,
      };
      createMutation.mutate(dto);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setTipo = (tipo: typeof TipoProducto.ZAPATO | typeof TipoProducto.BOLSA) => {
    setFormData((prev) => ({
      ...prev,
      tipo,
      talla: '',
    }));
    setTallasSeleccionadas({});
  };

  const toggleTalla = (talla: string) => {
    setTallasSeleccionadas(prev => {
      const newState = { ...prev };
      if (newState[talla] !== undefined) {
        delete newState[talla];
      } else {
        newState[talla] = 1;
      }
      return newState;
    });
  };

  const updateCantidad = (talla: string, cantidad: number) => {
    if (cantidad < 0) return;
    setTallasSeleccionadas(prev => ({
      ...prev,
      [talla]: cantidad
    }));
  };

  const tallasDisponibles = formData.tipo === TipoProducto.ZAPATO ? TALLAS_ZAPATO : TALLAS_BOLSA;
  const isPending = createMutation.isPending || createMultiMutation.isPending;
  const tallasCount = Object.keys(tallasSeleccionadas).length;
  const totalPiezas = Object.values(tallasSeleccionadas).reduce((sum, c) => sum + c, 0);

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900">Nuevo Producto</h3>
          <button
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-1">
                Nombre del producto
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Zapatilla Deportiva Air Max"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm"
              />
            </div>

            {/* Tipo de producto - Toggle visual */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de producto
              </label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${formData.tipo === TipoProducto.ZAPATO
                      ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  onClick={() => setTipo(TipoProducto.ZAPATO)}
                >
                  Zapato
                </button>
                <button
                  type="button"
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${formData.tipo === TipoProducto.BOLSA
                      ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  onClick={() => setTipo(TipoProducto.BOLSA)}
                >
                  Bolsa
                </button>
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORES_PREDEFINIDOS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${formData.color === color
                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    title={color}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full shadow-inner ${color === 'Blanco' ? 'border border-gray-200' : ''}`}
                      style={{ background: COLOR_HEX_MAP[color] }}
                    />
                    <span>{color}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modo de creación */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={modoMultiple}
                    onChange={(e) => setModoMultiple(e.target.checked)}
                  />
                  <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  Crear con múltiples tallas
                </span>
              </label>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              {!modoMultiple ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Seleccionar Talla
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tallasDisponibles.map((talla) => (
                      <button
                        key={talla}
                        type="button"
                        className={`min-w-[3rem] h-10 px-3 rounded-lg border text-sm font-mono font-medium transition-all ${formData.talla === talla
                            ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        onClick={() => setFormData(prev => ({ ...prev, talla }))}
                      >
                        {talla}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Selecciona tallas y cantidad de cada una
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {tallasDisponibles.map((talla) => {
                      const isSelected = tallasSeleccionadas[talla] !== undefined;
                      const cantidad = tallasSeleccionadas[talla] ?? 0;
                      return (
                        <div
                          key={talla}
                          className={`flex flex-col gap-2 p-3 rounded-xl border transition-all ${isSelected
                              ? 'border-blue-200 bg-blue-50/50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                        >
                          <button
                            type="button"
                            className={`w-full py-1.5 rounded-lg text-sm font-mono font-bold transition-colors ${isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                              }`}
                            onClick={() => toggleTalla(talla)}
                          >
                            Talla {talla}
                          </button>

                          {isSelected && (
                            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-1">
                              <button
                                type="button"
                                className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                onClick={() => updateCantidad(talla, cantidad - 1)}
                              >
                                −
                              </button>
                              <input
                                type="text"
                                inputMode="numeric"
                                className="w-10 text-center text-sm font-semibold text-gray-900 border-none p-0 focus:ring-0"
                                value={cantidad}
                                onChange={(e) => updateCantidad(talla, parseInt(e.target.value) || 0)}
                              />
                              <button
                                type="button"
                                className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors"
                                onClick={() => updateCantidad(talla, cantidad + 1)}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {tallasCount > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 font-medium">
                      <span>{tallasCount} talla{tallasCount !== 1 ? 's' : ''} seleccionada{tallasCount !== 1 ? 's' : ''}</span>
                      <span className="font-bold bg-blue-100 px-2.5 py-1 rounded-full">{totalPiezas} piezas en total</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Marca y Modelo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="marca" className="block text-sm font-semibold text-gray-700 mb-1">
                  Marca
                </label>
                <input
                  id="marca"
                  name="marca"
                  type="text"
                  value={formData.marca}
                  onChange={handleChange}
                  placeholder="Ej: Nike"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="modelo" className="block text-sm font-semibold text-gray-700 mb-1">
                  Modelo
                </label>
                <input
                  id="modelo"
                  name="modelo"
                  type="text"
                  value={formData.modelo}
                  onChange={handleChange}
                  placeholder="Ej: Air Max 90"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm"
                />
              </div>
            </div>

            {/* URL de imagen */}
            <div>
              <label htmlFor="imagenUrl" className="block text-sm font-semibold text-gray-700 mb-1">
                URL de imagen <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                id="imagenUrl"
                name="imagenUrl"
                type="url"
                value={formData.imagenUrl}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm mb-3"
              />
              {formData.imagenUrl && (
                <div className="h-40 w-full rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img
                    src={formData.imagenUrl}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {(createMutation.isError || createMultiMutation.isError) && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ocurrió un error al crear el producto. Por favor intenta de nuevo.
              </div>
            )}
          </form>
        </div>

        {/* Acciones */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex justify-end gap-3 mt-auto">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isPending}
          >
            {isPending && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isPending ? 'Creando...' : modoMultiple ? 'Crear Productos' : 'Crear Producto'}
          </button>
        </div>
      </div>
    </div>
  );
}
