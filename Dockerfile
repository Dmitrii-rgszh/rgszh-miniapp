# Stage 1 — сборка React
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2 — nginx
FROM nginx:stable-alpine
# Удаляем дефолтные статику
RUN rm -rf /usr/share/nginx/html/*
# Копируем сборку
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
# Копируем наш конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf