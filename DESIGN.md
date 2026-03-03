# DESIGN.md - Catálogo de Productos (Zapatería y Bolsas)

## Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Backend** | NestJS | Framework robusto con arquitectura modular y TypeScript nativo. Facilita implementación de clean architecture |
| **ORM** | TypeORM | Integración nativa con NestJS, decoradores para entidades, soporte soft-delete |
| **Base de Datos** | PostgreSQL | ACID compliance, soporte nativo de ENUM, robustez para datos transaccionales |
| **Frontend** | React + Vite | Requisito del enunciado. Vite ofrece build rápido y HMR eficiente |
| **State Management** | TanStack Query | Cache automático, refetch inteligente, manejo de loading/error |

---

## Modelo de Datos

### Decisiones de Diseño

#### 1. Multi-Sucursal con Catálogo Independiente
- **Decisión**: Cada sucursal tiene su propio catálogo de productos con precios independientes
- **Razón**: Permite flexibilidad comercial por ubicación geográfica y estrategias de pricing diferenciadas
- **Implementación**: Tabla intermedia `productos_sucursal` con relación N:N entre productos y sucursales

#### 2. UUID vs Auto-increment
- **Decisión**: UUID como identificadores primarios
- **Razón**: 
  - No expone secuencias (seguridad)
  - Facilita merge de datos entre ambientes
  - Compatible con sistemas distribuidos

#### 3. Soft Delete
- **Decisión**: Implementado con `deletedAt` (TypeORM `@DeleteDateColumn`)
- **Razón**:
  - Preserva histórico de transacciones
  - Permite restauración de datos
  - Mantiene integridad referencial

#### 4. Separación Producto/Inventario
- **Decisión**: Inventario en tabla separada vinculada a `producto_sucursal`
- **Razón**: 
  - Stock específico por sucursal
  - Preparado para escalabilidad (múltiples almacenes por sucursal)
  - Auditoría de cambios de stock

#### 5. Tabla Transacciones
- **Decisión**: Registro de todas las entradas/salidas de inventario
- **Razón**:
  - Trazabilidad completa de movimientos
  - Histórico de precios al momento de la transacción
  - Base para reportes y analytics

---

### Diagrama de Entidades

```
┌─────────────┐       ┌───────────────────┐       ┌─────────────┐
│  sucursal   │──1:N──│  producto_sucursal │──N:1──│  producto   │
│             │       │  (precio, activo)  │       │             │
└─────────────┘       └───────────────────┘       └─────────────┘
                              │
                              │ 1:1
                              ▼
                      ┌─────────────┐
                      │  inventario │
                      │  (cantidad) │
                      └─────────────┘
                              │
                              │ 1:N
                              ▼
                      ┌─────────────┐
                      │ transaccion │
                      │  (ENTRADA/  │
                      │   SALIDA)   │
                      └─────────────┘
```

---

### Entidades

#### Sucursal
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| nombre | VARCHAR(100) | Nombre de la sucursal |
| direccion | VARCHAR(255) | Ubicación física |
| telefono | VARCHAR(20) | Contacto |
| activa | BOOLEAN | Estado (soft-delete pattern) |
| createdAt | TIMESTAMP | Fecha de creación |
| updatedAt | TIMESTAMP | Última modificación |

#### Producto
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| nombre | VARCHAR(100) | **Requerido** - Nombre del producto |
| marca | VARCHAR(50) | Marca comercial |
| modelo | VARCHAR(50) | Referencia interna |
| color | VARCHAR(30) | **Requerido** - Color del producto |
| talla | VARCHAR(10) | **Requerido** - Talla/medida |
| tipo | ENUM | **Requerido** - ZAPATO o BOLSA |
| descripcion | TEXT | Detalle adicional |
| createdAt | TIMESTAMP | Fecha de creación |
| updatedAt | TIMESTAMP | Última modificación |
| deletedAt | TIMESTAMP | Soft delete marker |

#### ProductoSucursal
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| productoId | UUID | FK → Producto |
| sucursalId | UUID | FK → Sucursal |
| precio | DECIMAL(10,2) | Precio en esta sucursal |
| activo | BOOLEAN | Disponible para venta |
| createdAt | TIMESTAMP | Fecha de asignación |
| updatedAt | TIMESTAMP | Última modificación |

**Constraint**: UNIQUE(productoId, sucursalId)

#### Inventario
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| productoSucursalId | UUID | FK → ProductoSucursal (1:1) |
| cantidad | INT | Stock actual (≥ 0) |
| updatedAt | TIMESTAMP | Última actualización |

#### Transaccion
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| productoSucursalId | UUID | FK → ProductoSucursal |
| tipoTransaccion | ENUM | ENTRADA o SALIDA |
| cantidad | INT | Unidades movidas (> 0) |
| precioUnitario | DECIMAL(10,2) | Precio al momento |
| total | DECIMAL(10,2) | cantidad × precio |
| observaciones | TEXT | Notas opcionales |
| createdAt | TIMESTAMP | Fecha de transacción |

---

### Enums

```typescript
enum TipoProducto {
  ZAPATO = 'ZAPATO',
  BOLSA = 'BOLSA'
}

enum TipoTransaccion {
  ENTRADA = 'ENTRADA',   // Ingreso de mercancía
  SALIDA = 'SALIDA'      // Venta o retiro
}
```

---

## API Endpoints

### Sucursales
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/sucursales` | Listar sucursales activas |
| GET | `/api/sucursales/:id` | Obtener una sucursal |
| POST | `/api/sucursales` | Crear sucursal |
| PATCH | `/api/sucursales/:id` | Actualizar sucursal |
| DELETE | `/api/sucursales/:id` | Desactivar sucursal |

### Productos Base
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/productos` | Listar todos los productos |
| GET | `/api/productos/:id` | Obtener producto con sus sucursales |
| GET | `/api/productos/:id/disponibilidad` | Stock en todas las sucursales |
| GET | `/api/productos/colores` | Colores únicos (para filtros) |
| GET | `/api/productos/tallas` | Tallas únicas (para filtros) |
| POST | `/api/productos` | Crear producto base |
| PATCH | `/api/productos/:id` | Actualizar producto |
| DELETE | `/api/productos/:id` | Soft delete |

### Productos por Sucursal
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/sucursales/:sucId/productos` | Catálogo de sucursal con filtros |
| POST | `/api/sucursales/:sucId/productos` | Asignar producto a sucursal |
| PATCH | `/api/sucursales/:sucId/productos/:prodId` | Actualizar precio/estado |
| DELETE | `/api/sucursales/:sucId/productos/:prodId` | Desactivar en sucursal |

**Query Params para filtros:**
- `tipo` - ZAPATO o BOLSA
- `color` - Color exacto
- `talla` - Talla exacta
- `search` - Búsqueda en nombre/marca
- `page` - Número de página (default: 1)
- `limit` - Items por página (default: 10)

### Inventario
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/inventario` | Todo el inventario |
| GET | `/api/inventario/sucursal/:sucId` | Stock de una sucursal |
| GET | `/api/inventario/:prodSucId` | Stock específico |
| PATCH | `/api/inventario/:prodSucId` | Ajustar cantidad |

### Transacciones
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/transacciones` | Historial con filtros |
| GET | `/api/transacciones/:id` | Detalle de transacción |
| POST | `/api/transacciones/entrada` | Registrar entrada |
| POST | `/api/transacciones/salida` | Registrar salida |

---

## Arquitectura del Código

### Backend (NestJS)

```
backend/src/
├── common/
│   └── enums/           # TipoProducto, TipoTransaccion
├── config/
│   └── database.config  # Configuración TypeORM
├── modules/
│   ├── sucursal/        # CRUD sucursales
│   ├── producto/        # Productos + ProductoSucursal
│   ├── inventario/      # Gestión de stock
│   └── transaccion/     # Movimientos de inventario
└── main.ts              # Bootstrap + ValidationPipe + CORS
```

**Patrones aplicados:**
- Módulos por dominio (separation of concerns)
- DTOs con class-validator para validación
- Services para lógica de negocio
- Controllers delgados (thin controllers)

### Frontend (React)

```
frontend/src/
├── components/          # Componentes reutilizables
├── context/             # SucursalContext (estado global)
├── services/            # Llamadas API con axios
├── types/               # Interfaces TypeScript
└── App.tsx              # Composición principal
```

**Patrones aplicados:**
- Context API para estado global (sucursal seleccionada)
- TanStack Query para cache y estado servidor
- Componentes funcionales con hooks
- Separación de servicios API

---

## Validaciones

### Backend (class-validator)
- Precio > 0
- Cantidad >= 0 (inventario), > 0 (transacciones)
- Tipo debe ser valor válido del enum
- Campos requeridos marcados con decoradores
- UUID válido para parámetros de ruta

### Frontend
- Validación HTML5 nativa (required, min, step)
- Feedback visual de errores
- Deshabilitación de botones durante envío

---

## Cumplimiento de Requerimientos

| Requerimiento | Estado | Implementación |
|--------------|--------|----------------|
| CRUD productos | OK | Módulo producto con endpoints completos |
| Filtro por tipo | OK | Query param `tipo` en GET productos |
| Buscador | OK | Query param `search` busca en nombre/marca |
| Dashboard con listado | OK | Componente ProductosTable |
| Persistencia en BD | OK | PostgreSQL con TypeORM |
| Backend Express/NestJS | OK | NestJS |
| Frontend React | OK | React + Vite |

### Funcionalidades Extra
- Multi-sucursal con catálogos independientes
- Precios diferenciados por sucursal
- Consulta de disponibilidad cross-sucursal
- Gestión de inventario con transacciones
- Soft delete para preservar histórico
- Paginación en listados
