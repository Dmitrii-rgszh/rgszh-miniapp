# === stage 1: билдим React-приложение ===
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build


# === stage 2: nginx отдаёт статик по HTTP (порт 80) ===
FROM nginx:stable-alpine

# Удаляем дефолтный статик и все конфиги (чтобы не было старых SSL‑файлов)
RUN rm -rf /usr/share/nginx/html/* \
    && rm -f /etc/nginx/conf.d/*.conf

# Копируем только что собранный билд
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# Копируем наш nginx.conf (ниже) вместо дефолта
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Экспоним HTTP-порт
EXPOSE 80

# Запускаем nginx в foreground
CMD ["nginx", "-g", "daemon off;"]
