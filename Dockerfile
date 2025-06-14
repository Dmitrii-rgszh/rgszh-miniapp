# 1) Стадия сборки
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Копируем package-файлы и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Копируем весь проект и собираем production-билд
COPY . .
RUN npm run build

# 2) Стадия запуска на Nginx
FROM nginx:stable-alpine

# Очищаем дефолтный контент
RUN rm -rf /usr/share/nginx/html/*

# Копируем собранный билд
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# Копируем свой конфиг вместо дефолтного
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# Запуск Nginx в форграунд-режиме
CMD ["nginx", "-g", "daemon off;"]