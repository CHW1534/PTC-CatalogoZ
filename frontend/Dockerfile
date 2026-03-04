# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Argumento para la URL del API
ARG VITE_API_URL=http://localhost:3000/api

# Variable de entorno para el build
ENV VITE_API_URL=$VITE_API_URL

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar codigo fuente
COPY . .

# Build
RUN npm run build

# Production stage con Nginx
FROM nginx:alpine AS production

# Copiar configuracion de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
