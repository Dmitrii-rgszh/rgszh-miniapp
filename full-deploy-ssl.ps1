# full-deploy-ssl.ps1 - Полное развертывание RGSZH MiniApp с SSL

Write-Host @"
================================================
🚀 RGSZH MiniApp - Полное развертывание с SSL
================================================
"@ -ForegroundColor Magenta

# 1. Проверяем наличие SSL сертификатов
Write-Host "🔐 Проверка SSL сертификатов..." -ForegroundColor Cyan

if (-not (Test-Path "certs/privkey.pem") -or -not (Test-Path "certs/fullchain.pem")) {
    Write-Host "⚠️  SSL сертификаты не найдены локально" -ForegroundColor Yellow
    
    $choice = Read-Host "Создать самоподписанные сертификаты? (Y/N)"
    if ($choice -eq "Y" -or $choice -eq "y") {
        # Создаем самоподписанные сертификаты
        .\create-ssl-certs.ps1 -SelfSigned
    } else {
        Write-Host "❌ Без SSL сертификатов HTTPS не будет работать!" -ForegroundColor Red
        Write-Host "Запустите: .\create-ssl-certs.ps1 -SelfSigned" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ SSL сертификаты найдены" -ForegroundColor Green
}

# 2. Исправляем BOM в файлах
Write-Host "`n🔍 Проверка и исправление BOM в файлах..." -ForegroundColor Cyan

if (Test-Path ".\fix-bom.ps1") {
    .\fix-bom.ps1
} else {
    Write-Warning "Скрипт fix-bom.ps1 не найден, пропускаем проверку BOM"
}

# 3. Убеждаемся что nginx/default.conf существует и правильный
if (-not (Test-Path "nginx/default.conf")) {
    Write-Host "`n📝 Создание nginx/default.conf..." -ForegroundColor Cyan
    
    if (-not (Test-Path "nginx")) {
        New-Item -ItemType Directory -Path "nginx" | Out-Null
    }
    
    # Создаем nginx конфигурацию
    $nginxConfig = @'
# Правильный прокси WebSocket
map $http_upgrade $connection_upgrade {
    default   upgrade;
    ''        close;
}

server {
    listen 80;
    server_name _;

    # Редирект всего HTTP → HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name rgszh-miniapp.org;

    # SSL
    ssl_certificate     /etc/ssl/fullchain.pem;
    ssl_certificate_key /etc/ssl/privkey.pem;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Проксирование к frontend контейнеру для статики
    location / {
        proxy_pass         http://frontend:80/;
        proxy_http_version 1.1;
        proxy_set_header   Host            $host;
        proxy_set_header   X-Real-IP       $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_redirect     off;
        
        # Отключаем кэширование для Telegram
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        add_header Pragma "no-cache";
        expires -1;
    }

    # Проксирование REST API
    location /api/ {
        proxy_pass         http://server:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host            $host;
        proxy_set_header   X-Real-IP       $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_redirect     off;
    }

    # Проксирование Socket.IO (WebSocket + polling)
    location /socket.io/ {
        proxy_pass         http://server:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade         $http_upgrade;
        proxy_set_header   Connection      $connection_upgrade;
        proxy_set_header   Host            $host;
        proxy_set_header   X-Real-IP       $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_redirect     off;
    }
}
'@
    
    # Сохраняем без BOM
    [System.IO.File]::WriteAllText(
        "nginx/default.conf", 
        $nginxConfig, 
        (New-Object System.Text.UTF8Encoding($false))
    )
    
    Write-Host "✅ nginx/default.conf создан" -ForegroundColor Green
}

# 4. Запускаем деплой
Write-Host "`n🚀 Запуск деплоя..." -ForegroundColor Cyan
.\deploy.ps1 -Verbose

# 5. Проверка результата
Write-Host "`n📊 Проверка развертывания..." -ForegroundColor Cyan

Start-Sleep -Seconds 5

try {
    # Проверяем HTTPS
    $response = Invoke-WebRequest -Uri "https://rgszh-miniapp.org" -Method HEAD -SkipCertificateCheck -ErrorAction Stop
    Write-Host "✅ HTTPS работает!" -ForegroundColor Green
} catch {
    Write-Warning "HTTPS недоступен. Проверяем HTTP..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://176.109.110.217" -Method HEAD -ErrorAction Stop
        Write-Host "✅ HTTP работает (будет редирект на HTTPS)" -ForegroundColor Green
    } catch {
        Write-Error "Сайт недоступен!"
    }
}

Write-Host @"

================================================
📋 Итоги развертывания:
================================================
🌐 URL: https://rgszh-miniapp.org
🌐 IP: http://176.109.110.217
📊 API: https://rgszh-miniapp.org/api/status

🔍 Проверка на сервере:
ssh admin@176.109.110.217 'cd rgszh-miniapp && docker compose ps'

⚠️  Для Telegram MiniApp:
1. Закройте приложение в Telegram
2. Очистите кэш Telegram
3. Перезапустите Telegram
4. Откройте MiniApp заново
================================================
"@ -ForegroundColor Cyan