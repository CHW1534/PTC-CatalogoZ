import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productosService } from '../services';
import type { CreateProductoDto, CreateProductoMultiTallaDto, TallaConCantidad } from '../types';
import { TipoProducto, COLORES_PREDEFINIDOS, COLOR_HEX_MAP, TALLAS_ZAPATO, TALLAS_BOLSA } from '../types';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Nuevo Producto</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Nombre */}
          <div className="form-group">
            <label htmlFor="nombre">Nombre del producto</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Zapatilla Deportiva Air Max"
            />
          </div>

          {/* Tipo de producto - Toggle visual */}
          <div className="form-group">
            <label>Tipo de producto</label>
            <div className="tipo-toggle">
              <button
                type="button"
                className={`tipo-btn ${formData.tipo === TipoProducto.ZAPATO ? 'active' : ''}`}
                onClick={() => setTipo(TipoProducto.ZAPATO)}
              >
                Zapato
              </button>
              <button
                type="button"
                className={`tipo-btn ${formData.tipo === TipoProducto.BOLSA ? 'active' : ''}`}
                onClick={() => setTipo(TipoProducto.BOLSA)}
              >
                Bolsa
              </button>
            </div>
          </div>

          {/* Color y Talla */}
          <div className="form-group">
            <label>Color</label>
            <div className="color-selector">
              {COLORES_PREDEFINIDOS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${formData.color === color ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  title={color}
                >
                  <span 
                    className="color-swatch"
                    style={{ 
                      background: COLOR_HEX_MAP[color],
                      border: color === 'Blanco' ? '1px solid #ddd' : 'none'
                    }}
                  />
                  <span className="color-name">{color}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Modo de creación */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={modoMultiple}
                onChange={(e) => setModoMultiple(e.target.checked)}
              />
              <span>Crear con múltiples tallas</span>
            </label>
          </div>

          {!modoMultiple ? (
            <div className="form-group">
              <label>Talla</label>
              <div className="talla-selector">
                {tallasDisponibles.map((talla) => (
                  <button
                    key={talla}
                    type="button"
                    className={`talla-chip ${formData.talla === talla ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, talla }))}
                  >
                    {talla}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label>Selecciona tallas y cantidad de cada una</label>
              <div className="multi-talla-grid">
                {tallasDisponibles.map((talla) => {
                  const isSelected = tallasSeleccionadas[talla] !== undefined;
                  const cantidad = tallasSeleccionadas[talla] ?? 0;
                  return (
                    <div 
                      key={talla} 
                      className={`multi-talla-item ${isSelected ? 'selected' : ''}`}
                    >
                      <button
                        type="button"
                        className={`talla-chip-multi ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleTalla(talla)}
                      >
                        {talla}
                      </button>
                      {isSelected && (
                        <div className="cantidad-input">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => updateCantidad(talla, cantidad - 1)}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={cantidad}
                            onChange={(e) => updateCantidad(talla, parseInt(e.target.value) || 0)}
                          />
                          <button
                            type="button"
                            className="qty-btn"
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
                <div className="tallas-preview">
                  <small>
                    {tallasCount} talla{tallasCount > 1 ? 's' : ''} seleccionada{tallasCount > 1 ? 's' : ''} • {totalPiezas} pieza{totalPiezas !== 1 ? 's' : ''} total
                  </small>
                </div>
              )}
            </div>
          )}

          {/* Marca y Modelo */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="marca">Marca</label>
              <input
                id="marca"
                name="marca"
                type="text"
                value={formData.marca}
                onChange={handleChange}
                placeholder="Ej: Nike"
              />
            </div>
            <div className="form-group">
              <label htmlFor="modelo">Modelo</label>
              <input
                id="modelo"
                name="modelo"
                type="text"
                value={formData.modelo}
                onChange={handleChange}
                placeholder="Ej: Air Max 90"
              />
            </div>
          </div>

          {/* URL de imagen */}
          <div className="form-group">
            <label htmlFor="imagenUrl">URL de imagen (opcional)</label>
            <input
              id="imagenUrl"
              name="imagenUrl"
              type="url"
              value={formData.imagenUrl}
              onChange={handleChange}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            {formData.imagenUrl && (
              <div className="imagen-preview">
                <img 
                  src={formData.imagenUrl} 
                  alt="Preview" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isPending}
            >
              {isPending ? 'Creando...' : modoMultiple ? 'Crear Productos' : 'Crear Producto'}
            </button>
          </div>

          {(createMutation.isError || createMultiMutation.isError) && (
            <div className="error-message">Error al crear producto</div>
          )}
        </form>
      </div>
    </div>
  );
}
