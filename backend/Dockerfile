# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (con legacy-peer-deps para resolver conflictos)
RUN npm ci --legacy-peer-deps

# Copiar codigo fuente
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copiar dependencias de produccion
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

# Copiar build
COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/main"]
