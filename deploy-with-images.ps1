# Deploy script using pre-built Docker images
param(
    [string]$ApiImageTag = "20250811-fixed",
    [string]$UiImageTag = "20250811-local",
    [string]$SSHHost = "176.108.243.189",
    [string]$SSHUser = "admin"
)

Write-Host "🚀 Starting deployment using pre-built images..." -ForegroundColor Green
Write-Host "API Image Tag: $ApiImageTag" -ForegroundColor Yellow
Write-Host "UI Image Tag: $UiImageTag" -ForegroundColor Yellow

# Create deployment commands
$DeployCommands = @"
cd /home/admin/rgszh-miniapp &&
echo '📥 Pulling images from Docker Hub...' &&
docker pull zerotlt/rgszh-miniapp-api:$ApiImageTag &&
docker pull zerotlt/rgszh-miniapp-ui:$UiImageTag &&
echo '🔄 Updating Docker Compose file...' &&
sed -i 's/image: zerotlt\/rgszh-miniapp-api:.*/image: zerotlt\/rgszh-miniapp-api:$ApiImageTag/' docker-compose.yml &&
sed -i 's/image: zerotlt\/rgszh-miniapp-client:.*/image: zerotlt\/rgszh-miniapp-ui:$UiImageTag/' docker-compose.yml &&
echo '🛑 Stopping old containers...' &&
docker compose down &&
echo '▶️ Starting new containers...' &&
docker compose up -d &&
echo '✅ Deployment completed!' &&
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
"@

Write-Host "📡 Connecting to production server and deploying..." -ForegroundColor Yellow

try {
    & ssh -o StrictHostKeyChecking=no "$SSHUser@$SSHHost" $DeployCommands
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
        Write-Host "🌐 Application should be available at: https://$SSHHost" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Deployment failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ SSH connection failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
