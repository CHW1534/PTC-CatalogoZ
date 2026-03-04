# PTC Retail - Catalogo de Zapateria y Bolsas

Sistema de gestion de productos para tiendas de zapateria y bolsas con soporte multi-sucursal.

**Repositorio:** https://github.com/CHW1534/PTC-CatalogoZ

## Stack Tecnológico

- **Backend**: NestJS + TypeORM + PostgreSQL
- **Frontend**: React + Vite + TanStack Query
- **Lenguaje**: TypeScript

## Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn
- Docker y Docker Compose (opcional, para demo rapido)

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

### Opcion 3: Docker (Demo Completo)

La forma mas rapida de probar el sistema completo con datos de demostracion:

```bash
# Levantar todo el stack (PostgreSQL + Backend + Frontend)
docker-compose up --build
```

Esto iniciara:
- **PostgreSQL** en puerto 5432
- **Backend** en http://localhost:3000
- **Frontend** en http://localhost:80

**Datos de demostracion incluidos:**
- 3 sucursales (Centro Historico, Plaza Norte, Galerias Sur)
- 46 productos variados (zapatos y bolsas)
- Inventario inicial aleatorio (3-17 unidades por producto)
- Precios diferenciados por sucursal

Para detener:
```bash
docker-compose down
```

Para reiniciar con datos limpios:
```bash
docker-compose down -v  # Elimina volumenes
docker-compose up --build
```

## Uso de la Aplicacion

### Navegacion Principal
La aplicacion cuenta con un header de navegacion con las siguientes secciones:
- **Punto de Venta**: Vista principal del catalogo y ventas
- **Inventario**: Gestion de entradas y salidas de stock
- **Sucursales**: Administracion de puntos de venta

### Punto de Venta
1. **Crear un producto**: Click en "+ Nuevo Producto" para crear un producto base
2. **Asignar producto a sucursal**: Click en "+ Asignar a Sucursal" para agregar el producto al catalogo de la sucursal actual con su precio
3. **Filtrar productos**: Usar los filtros por tipo, color, talla o el buscador
4. **Ver disponibilidad**: Click en el icono de tienda para ver el stock en otras sucursales
5. **Realizar venta**: Agregar productos al carrito y procesar venta con generacion de ticket

### Inventario
1. **Ver stock**: Consultar el inventario actual de todos los productos en la sucursal
2. **Registrar entrada**: Agregar stock a productos existentes
3. **Registrar salida**: Reducir stock (ajustes, mermas, etc.)
4. **Historial**: Ver todas las transacciones de inventario

### Sucursales
1. **Crear sucursal**: Click en "+ Nueva Sucursal"
2. **Editar sucursal**: Modificar nombre, direccion o telefono
3. **Activar/Desactivar**: Controlar estado de cada sucursal
4. **Estadisticas**: Ver resumen de sucursales activas e inactivas

## Estructura del Proyecto

```
PTCRETAIL/
├── docker-compose.yml        # Orquestacion de contenedores
├── backend/                  # API NestJS
│   ├── Dockerfile           # Imagen Docker del backend
│   ├── src/
│   │   ├── common/          # Enums y utilidades
│   │   ├── config/          # Configuracion TypeORM
│   │   ├── seed/            # Datos de demostracion
│   │   └── modules/         # Modulos por dominio
│   │       ├── sucursal/
│   │       ├── producto/
│   │       ├── inventario/
│   │       └── transaccion/
│   └── .env                 # Variables de entorno
│
├── frontend/                 # React + Vite
│   ├── Dockerfile           # Imagen Docker del frontend
│   ├── nginx.conf           # Configuracion Nginx
│   └── src/
│       ├── components/      # Componentes UI
│       │   ├── Header.tsx         # Navegacion principal
│       │   ├── PuntoVenta.tsx     # Catalogo y ventas
│       │   ├── InventarioPage.tsx # Gestion de stock
│       │   ├── SucursalesPage.tsx # Admin sucursales
│       │   └── ...                # Otros componentes
│       ├── context/         # Estado global (sucursal activa)
│       ├── services/        # Llamadas API
│       └── types/           # Interfaces TypeScript
│
├── DESIGN.md                # Documentacion tecnica
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

### Funcionalidades y Beneficios Clave

- **Punto de Venta Dinámico**: Sistema de cobro donde puedes buscar productos, elegir tallas, agregar al carrito y procesar ventas con un ticket de compra.
- **Catálogo de Productos**: Módulo de administración de inventarios base con distintos atributos como colores y tallas.
- **Monitor de Ventas**: Módulo analítico por sucursal para consultar entradas, total de ventas y los productos de mayor movimiento en tienda.
- **Control Multi-Sucursal**: Gestión de distintas sucursales desde el mismo panel, manejando inventarios separados y precios por tienda.
- **Inventario Detallado**: Seguimiento de entradas y salidas de mercancía para auditar faltantes o stock.
- **Historial de Transacciones**: Consulta detallada de cada movimiento de stock y venta cobrada.

### Aspectos Técnicos
- **Diseño Moderno**: Interfaz construida mediante **Tailwind CSS** y **Material UI Icons** bajo estándares de experiencia de usuario limpia.
- **Eficiencia**: Integración de TanStack Query para el manejo de caché en las consultas y evitar demoras de carga entre secciones.
- **Backend Confiable**: Base de datos PostgreSQL interactuando mediante framework NestJS garantizando la integridad relacional de la información.

## Notas de Desarrollo

- `synchronize: true` está habilitado en TypeORM para desarrollo. En producción, usar migraciones.
- El frontend usa Vite con HMR para desarrollo rápido.
- Las transacciones (entrada/salida) actualizan automáticamente el inventario.

## Licencia

MIT

# Guía Rápida de Uso y Deploy (Docker)

## 1. Requisitos
- Docker y Docker Compose instalados
- (Opcional) Node.js y npm para desarrollo local

## 2. Levantar la app desde cero (producción)

### 2.1. Clona el repositorio
```bash
git clone https://github.com/CHW1534/PTC-CatalogoZ.git
cd PTC-CatalogoZ
```

### 2.2. Configura los archivos de entorno (opcional)
- Por defecto funciona sin cambios, pero puedes copiar y editar:
  - `.env.example` → `.env`
  - `backend/.env.example` → `backend/.env`
  - `frontend/.env.example` → `frontend/.env`

### 2.3. Levanta todos los servicios
```bash
docker-compose up --build -d
```
- Esto crea y levanta:
  - PostgreSQL (puerto 5432)
  - Backend NestJS (puerto 3001, expuesto como 3000 dentro del contenedor)
  - Frontend React (Nginx, puerto 80)

### 2.4. Accede a la app
- Navega a: [http://localhost](http://localhost)
- El backend expone la API en: [http://localhost:3001/api](http://localhost:3001/api)

## 3. Uso de la App

### 3.1. Navegación
- No requiere login (por defecto)
- Usa el menú superior para navegar entre:
  - Catálogo de productos
  - Sucursales
  - Inventario
  - Punto de venta
  - Historial de transacciones

### 3.2. Funcionalidades principales
- **Catálogo de productos:** Alta, edición y consulta de productos. Permite multi-talla.
- **Sucursales:** Alta y edición de sucursales.
- **Inventario:** Consulta y asignación de productos a sucursales.
- **Punto de venta:** Venta rápida, selección de talla, carrito, impresión de ticket.
- **Transacciones:** Historial de movimientos (ventas, asignaciones, etc).

### 3.3. Responsive
- La app es responsive: funciona en PC, tablet y móvil.

## 4. Comandos útiles
- Parar todos los servicios:
  ```bash
  docker-compose down -v
  ```
- Ver logs:
  ```bash
  docker-compose logs -f
  ```
- Reconstruir frontend:
  ```bash
  docker-compose build --no-cache frontend; docker-compose up -d frontend
  ```

---
