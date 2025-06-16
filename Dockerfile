# 1. Сборка React‑приложения
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# 2. Сборка финального образа с nginx
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
# Не копируем SSL сертификаты, работаем через Cloudflare Flexible
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]