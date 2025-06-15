# 1) Stage: сборка фронта
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Копируем package-файлы и устанавливаем зависимости,
# игнорируя peerDeps-конфликты
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Копируем весь код и собираем production‑билд
COPY . .
RUN npm run build

# 2) Stage: запуск через Nginx
FROM nginx:stable-alpine

# Чистим дефолтный контент Nginx
RUN rm -rf /usr/share/nginx/html/*

# Копируем собранный билд из предыдущей стадии
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# Подставляем собственный конфиг вместо default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# Запускаем Nginx в foreground
CMD ["nginx", "-g", "daemon off;"]
