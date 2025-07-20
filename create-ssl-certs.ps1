# create-ssl-certs.ps1 - Создание SSL сертификатов для RGSZH MiniApp

param(
    [string]$Domain = "rgszh-miniapp.org",
    [switch]$SelfSigned,
    [switch]$LetsEncrypt
)

Write-Host "🔐 Создание SSL сертификатов для $Domain" -ForegroundColor Cyan

# Создаем директорию для сертификатов
if (-not (Test-Path "certs")) {
    New-Item -ItemType Directory -Path "certs" | Out-Null
    Write-Host "✅ Создана директория certs" -ForegroundColor Green
}

if ($SelfSigned) {
    Write-Host "📝 Создание самоподписанных сертификатов..." -ForegroundColor Yellow
    
    # Создаем самоподписанный сертификат на сервере
    $sshCommands = @"
#!/bin/bash
set -e

echo "🔐 Генерация самоподписанного сертификата..."

# Создаем директорию
mkdir -p /home/admin/rgszh-miniapp/certs

# Генерируем приватный ключ
openssl genrsa -out /home/admin/rgszh-miniapp/certs/privkey.pem 2048

# Генерируем сертификат
openssl req -new -x509 -key /home/admin/rgszh-miniapp/certs/privkey.pem \
    -out /home/admin/rgszh-miniapp/certs/fullchain.pem \
    -days 365 \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=RGSZH/OU=IT/CN=$Domain"

# Устанавливаем права
chmod 600 /home/admin/rgszh-miniapp/certs/privkey.pem
chmod 644 /home/admin/rgszh-miniapp/certs/fullchain.pem

echo "✅ Самоподписанный сертификат создан"
ls -la /home/admin/rgszh-miniapp/certs/
"@
    
    # Сохраняем скрипт
    $tempScript = New-TemporaryFile
    [System.IO.File]::WriteAllText($tempScript.FullName, $sshCommands.Replace("`r`n", "`n"), [System.Text.Encoding]::UTF8)
    
    # Выполняем на сервере
    Write-Host "🔗 Создание сертификатов на сервере..." -ForegroundColor Cyan
    scp $tempScript.FullName admin@176.109.110.217:/tmp/create-certs.sh
    ssh admin@176.109.110.217 'bash /tmp/create-certs.sh'
    
    Remove-Item $tempScript.FullName
    
    # Копируем сертификаты локально для резервной копии
    Write-Host "📥 Копирование сертификатов локально..." -ForegroundColor Cyan
    scp admin@176.109.110.217:/home/admin/rgszh-miniapp/certs/privkey.pem ./certs/
    scp admin@176.109.110.217:/home/admin/rgszh-miniapp/certs/fullchain.pem ./certs/
    
    Write-Host "✅ Самоподписанные сертификаты созданы!" -ForegroundColor Green
    Write-Host "⚠️  Браузеры будут показывать предупреждение о безопасности" -ForegroundColor Yellow
    
} elseif ($LetsEncrypt) {
    Write-Host "🌐 Настройка Let's Encrypt сертификатов..." -ForegroundColor Cyan
    
    # Скрипт для Let's Encrypt
    $letsEncryptScript = @"
#!/bin/bash
set -e

echo "🌐 Установка Certbot..."
sudo apt-get update
sudo apt-get install -y certbot

echo "📝 Получение сертификата Let's Encrypt..."
sudo certbot certonly --standalone \
    -d $Domain \
    --non-interactive \
    --agree-tos \
    --email admin@$Domain \
    --redirect \
    --keep-until-expiring

echo "🔗 Создание символических ссылок..."
mkdir -p /home/admin/rgszh-miniapp/certs
sudo ln -sf /etc/letsencrypt/live/$Domain/privkey.pem /home/admin/rgszh-miniapp/certs/privkey.pem
sudo ln -sf /etc/letsencrypt/live/$Domain/fullchain.pem /home/admin/rgszh-miniapp/certs/fullchain.pem

# Даем права на чтение docker контейнерам
sudo chmod 755 /etc/letsencrypt/live/
sudo chmod 755 /etc/letsencrypt/archive/

echo "✅ Let's Encrypt сертификат установлен!"
"@
    
    Write-Host @"
    
⚠️  Для Let's Encrypt требуется:
1. Домен $Domain должен указывать на IP 176.109.110.217
2. Порты 80 и 443 должны быть доступны из интернета
3. Выполните команду на сервере:

ssh admin@176.109.110.217 'bash -s' << 'EOF'
$letsEncryptScript
EOF

"@ -ForegroundColor Yellow
    
} else {
    Write-Host @"

Использование:
  .\create-ssl-certs.ps1 -SelfSigned     # Создать самоподписанный сертификат
  .\create-ssl-certs.ps1 -LetsEncrypt    # Инструкции для Let's Encrypt

Примеры:
  .\create-ssl-certs.ps1 -SelfSigned -Domain "rgszh-miniapp.org"
  .\create-ssl-certs.ps1 -LetsEncrypt -Domain "rgszh-miniapp.org"

"@ -ForegroundColor Cyan
}