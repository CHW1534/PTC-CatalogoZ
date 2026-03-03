https://github.com/CHW1534/PTC-CatalogoZ# PTC Retail - Catálogo de Zapatería y Bolsas

Sistema de gestión de productos para tiendas de zapatería y bolsas con soporte multi-sucursal.

## Stack Tecnológico

- **Backend**: NestJS + TypeORM + PostgreSQL
- **Frontend**: React + Vite + TanStack Query
- **Lenguaje**: TypeScript

## Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

## Configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd PTCRETAIL
```

### 2. Configurar Base de Datos

Crear una base de datos PostgreSQL:

```sql
CREATE DATABASE ptcretail;
```

### 3. Configurar Variables de Entorno

**Backend** (`backend/.env`):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_DATABASE=ptcretail
PORT=3000
NODE_ENV=development
```

### 4. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Ejecutar el Proyecto

### Opción 1: Desarrollo (terminales separadas)

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```
El API estará disponible en `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`

### Opción 2: Producción

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm run preview
```

## Uso de la Aplicación

1. **Crear una sucursal**: Click en "+ Nueva Sucursal" en el dashboard
2. **Crear un producto**: Click en "+ Nuevo Producto" para crear un producto base
3. **Asignar producto a sucursal**: Click en "+ Asignar a Sucursal" para agregar el producto al catálogo de la sucursal actual con su precio
4. **Filtrar productos**: Usar los filtros por tipo, color, talla o el buscador
5. **Ver disponibilidad**: Click en el icono de tienda para ver el stock en otras sucursales

## Estructura del Proyecto

```
PTCRETAIL/
├── backend/                  # API NestJS
│   ├── src/
│   │   ├── common/          # Enums y utilidades
│   │   ├── config/          # Configuración TypeORM
│   │   └── modules/         # Módulos por dominio
│   │       ├── sucursal/
│   │       ├── producto/
│   │       ├── inventario/
│   │       └── transaccion/
│   └── .env                 # Variables de entorno
│
├── frontend/                 # React + Vite
│   └── src/
│       ├── components/      # Componentes UI
│       ├── context/         # Estado global
│       ├── services/        # Llamadas API
│       └── types/           # Interfaces TypeScript
│
├── DESIGN.md                # Documentación técnica
└── README.md                # Este archivo
```

## API Endpoints Principales

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/sucursales` | GET/POST | Listar/Crear sucursales |
| `/api/productos` | GET/POST | Listar/Crear productos base |
| `/api/productos/:id/disponibilidad` | GET | Stock en todas las sucursales |
| `/api/sucursales/:id/productos` | GET/POST | Catálogo de sucursal |
| `/api/transacciones/entrada` | POST | Registrar entrada de stock |
| `/api/transacciones/salida` | POST | Registrar salida de stock |

## Funcionalidades

### Implementadas
- [x] CRUD de productos
- [x] CRUD de sucursales
- [x] Filtros por tipo, color y talla
- [x] Buscador por nombre/marca
- [x] Multi-sucursal con precios independientes
- [x] Consulta de disponibilidad cross-sucursal
- [x] Gestión de inventario
- [x] Registro de transacciones (entradas/salidas)
- [x] Soft delete para productos
- [x] Paginación

### Características Técnicas
- Validación con class-validator
- TypeScript estricto en ambos proyectos
- Arquitectura modular en NestJS
- TanStack Query para cache de datos
- Responsive design

## Notas de Desarrollo

- `synchronize: true` está habilitado en TypeORM para desarrollo. En producción, usar migraciones.
- El frontend usa Vite con HMR para desarrollo rápido.
- Las transacciones (entrada/salida) actualizan automáticamente el inventario.

## Licencia

MIT
