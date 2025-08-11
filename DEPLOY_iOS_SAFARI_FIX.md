# 🛠️ Развертывание исправлений для iOS Safari (устранение белых полос)

## Версия образа
- **Тег Docker Hub**: `zerotlt/rgszh-miniapp-client:20250808-230912`
- **Локальная версия**: `miniapp-client:latest`

## ✅ Примененные исправления

### 1. Агрессивное позиционирование фона (MainApp.js)
```jsx
<div
  style={{
    position: 'fixed',
    top: 'calc(-20px - env(safe-area-inset-top, 0))',
    left: 'calc(-20px - env(safe-area-inset-left, 0))',
    right: 'calc(-20px - env(safe-area-inset-right, 0))',
    bottom: 'calc(-50px - env(safe-area-inset-bottom, 0))',
    transform: 'scale(1.2)',
    transformOrigin: 'center',
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    zIndex: -10,
    width: '100vw',
    height: '100dvh',
    overflow: 'hidden'
  }}
/>
```

### 2. Дополнительная защита в HTML (public/index.html)
```css
/* Дополнительная защита для нижней части экрана */
body::after {
  content: '';
  position: fixed;
  bottom: calc(-100px - env(safe-area-inset-bottom, 0));
  left: -50px;
  right: -50px;
  height: 100px;
  background: linear-gradient(135deg, rgb(180, 0, 55) 0%, rgb(0, 40, 130) 100%);
  z-index: -50;
  pointer-events: none;
}
```

### 3. Viewport настройки
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

## 🚀 Команды для развертывания на сервере

### Вариант 1: Через Docker Hub
```bash
ssh root@176.108.243.189
cd /root/miniapp
docker-compose down
docker pull zerotlt/rgszh-miniapp-client:20250808-230912
docker tag zerotlt/rgszh-miniapp-client:20250808-230912 miniapp-client:latest
docker-compose up -d
```

### Вариант 2: Через загрузку архива
```bash
# Локально
docker save miniapp-client:latest -o miniapp-client-ios-fix.tar

# На сервере
scp miniapp-client-ios-fix.tar root@176.108.243.189:/root/miniapp/
ssh root@176.108.243.189
cd /root/miniapp
docker-compose down
docker load -i miniapp-client-ios-fix.tar
docker-compose up -d
```

## 🎯 Что исправлено

1. **Белые полосы сверху**: Устранены через negative margin и env(safe-area-inset-top)
2. **Белые полосы по бокам**: Устранены через negative margin и safe area insets
3. **Белая полоса снизу**: Агрессивный bottom: calc(-50px - env(safe-area-inset-bottom, 0))
4. **Фоновое изображение**: Восстановлено и покрывает весь экран с масштабированием 1.2
5. **Дополнительная защита**: CSS ::after элемент для экстренного покрытия нижней области

## 📱 Тестирование

После развертывания проверьте на реальном iPhone Safari:
- Фоновое изображение должно покрывать весь экран
- Никаких белых полос сверху, снизу и по бокам
- Изображение background2.jpg должно корректно отображаться

## 🔗 URL для тестирования
`https://176.108.243.189/`

## 📋 Логи и отладка
```bash
# Проверка статуса контейнеров
docker-compose ps

# Логи frontend
docker-compose logs miniapp-client

# Логи nginx
docker-compose logs nginx
```
