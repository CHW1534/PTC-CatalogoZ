import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productosService } from '../services';
import type { CreateProductoDto, CreateProductoRangoDto } from '../types';
import { TipoProducto, COLORES_PREDEFINIDOS, TALLAS_ZAPATO, TALLAS_BOLSA } from '../types';

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export function ProductoForm({ onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [modoRango, setModoRango] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    marca: '',
    modelo: '',
    color: '',
    talla: '',
    tallaInicio: '',
    tallaFin: '',
    incluirMedias: true,
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

  const createRangoMutation = useMutation({
    mutationFn: (data: CreateProductoRangoDto) => productosService.createConRango(data),
    onSuccess: (productos) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      alert(`Se crearon ${productos.length} productos con tallas: ${productos.map(p => p.talla).join(', ')}`);
      onSuccess?.();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (modoRango) {
      const rangoDto: CreateProductoRangoDto = {
        nombre: formData.nombre,
        marca: formData.marca || undefined,
        modelo: formData.modelo || undefined,
        color: formData.color,
        tallaInicio: formData.tallaInicio,
        tallaFin: formData.tallaFin,
        incluirMedias: formData.incluirMedias,
        tipo: formData.tipo,
        descripcion: formData.descripcion || undefined,
      };
      createRangoMutation.mutate(rangoDto);
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
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const setTipo = (tipo: typeof TipoProducto.ZAPATO | typeof TipoProducto.BOLSA) => {
    setFormData((prev) => ({ 
      ...prev, 
      tipo,
      talla: '', // Reset talla al cambiar tipo
    }));
  };

  const tallasDisponibles = formData.tipo === TipoProducto.ZAPATO ? TALLAS_ZAPATO : TALLAS_BOLSA;
  const isPending = createMutation.isPending || createRangoMutation.isPending;

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
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="color">Color</label>
              <select
                id="color"
                name="color"
                required
                value={formData.color}
                onChange={handleChange}
              >
                <option value="">Seleccionar</option>
                {COLORES_PREDEFINIDOS.map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
            
            {!modoRango && (
              <div className="form-group">
                <label htmlFor="talla">Talla</label>
                <select
                  id="talla"
                  name="talla"
                  required={!modoRango}
                  value={formData.talla}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar</option>
                  {tallasDisponibles.map((talla) => (
                    <option key={talla} value={talla}>{talla}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Modo rango de tallas */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={modoRango}
                onChange={(e) => setModoRango(e.target.checked)}
              />
              <span>Crear con rango de tallas</span>
            </label>
          </div>

          {modoRango && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tallaInicio">Talla Inicio</label>
                  <select
                    id="tallaInicio"
                    name="tallaInicio"
                    required={modoRango}
                    value={formData.tallaInicio}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar</option>
                    {tallasDisponibles.map((talla) => (
                      <option key={talla} value={talla}>{talla}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="tallaFin">Talla Fin</label>
                  <select
                    id="tallaFin"
                    name="tallaFin"
                    required={modoRango}
                    value={formData.tallaFin}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar</option>
                    {tallasDisponibles.map((talla) => (
                      <option key={talla} value={talla}>{talla}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="incluirMedias"
                    checked={formData.incluirMedias}
                    onChange={handleChange}
                  />
                  <span>Incluir medias tallas (35.5, 36.5...)</span>
                </label>
              </div>
              <div className="tallas-preview">
                <small>
                  Se crearán tallas: {previsualizarTallas(formData.tallaInicio, formData.tallaFin, formData.incluirMedias)}
                </small>
              </div>
            </>
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
              {isPending ? 'Creando...' : modoRango ? 'Crear Productos' : 'Crear Producto'}
            </button>
          </div>

          {(createMutation.isError || createRangoMutation.isError) && (
            <div className="error-message">Error al crear producto</div>
          )}
        </form>
      </div>
    </div>
  );
}

// Función para previsualizar las tallas que se crearán
function previsualizarTallas(inicio: string, fin: string, incluirMedias: boolean): string {
  const tallaInicio = parseFloat(inicio);
  const tallaFin = parseFloat(fin);
  
  if (isNaN(tallaInicio) || isNaN(tallaFin) || tallaInicio > tallaFin) {
    return inicio || '...';
  }

  const tallas: string[] = [];
  const incremento = incluirMedias ? 0.5 : 1;
  const maxMostrar = 8;

  for (let t = tallaInicio; t <= tallaFin; t += incremento) {
    const tallaStr = Number.isInteger(t) ? t.toString() : t.toFixed(1);
    tallas.push(tallaStr);
    if (tallas.length >= maxMostrar) {
      tallas.push('...');
      break;
    }
  }

  return tallas.join(', ') || '...';
}
