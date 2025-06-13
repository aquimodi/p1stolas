# Script para configurar y gestionar el backend
# Ubicación: D:\nginx\pistolas\scripts\backend-setup.ps1

param(
    [string]$Action = "setup",  # setup, start, stop, restart, logs, status
    [switch]$Production = $false
)

Write-Host "=== Gestión del Backend DataCenter Manager ===" -ForegroundColor Green

$ProjectRoot = "D:\nginx\pistolas"
$BackendDir = "$ProjectRoot\server"
$LogsDir = "$ProjectRoot\logs"

# Función para verificar si se ejecuta como administrador
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Función para crear directorios necesarios
function Initialize-Directories {
    if (-not (Test-Path $LogsDir)) {
        New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
        Write-Host "✅ Directorio de logs creado: $LogsDir" -ForegroundColor Green
    }
}

# Función para verificar dependencias
function Test-Dependencies {
    Write-Host "🔍 Verificando dependencias..." -ForegroundColor Yellow
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Error "❌ Node.js no está instalado o no está en el PATH"
        return $false
    }
    
    # Verificar PM2
    try {
        $pm2Version = pm2 --version
        Write-Host "✅ PM2: $pm2Version" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  PM2 no está instalado. Instalando..." -ForegroundColor Yellow
        npm install -g pm2
        npm install -g pm2-windows-service
    }
    
    return $true
}

# Función para instalar dependencias del backend
function Install-BackendDependencies {
    Write-Host "📦 Instalando dependencias del backend..." -ForegroundColor Yellow
    
    if (-not (Test-Path $BackendDir)) {
        Write-Error "❌ Directorio del backend no encontrado: $BackendDir"
        return $false
    }
    
    Push-Location $BackendDir
    try {
        npm install
        Write-Host "✅ Dependencias del backend instaladas" -ForegroundColor Green
        return $true
    } catch {
        Write-Error "❌ Error al instalar dependencias del backend: $($_.Exception.Message)"
        return $false
    } finally {
        Pop-Location
    }
}

# Función para configurar PM2 como servicio
function Setup-PM2Service {
    if (-not (Test-Administrator)) {
        Write-Error "❌ Se requieren permisos de administrador para configurar PM2 como servicio"
        return $false
    }
    
    Write-Host "🔧 Configurando PM2 como servicio de Windows..." -ForegroundColor Yellow
    
    try {
        pm2-service-install
        Write-Host "✅ PM2 configurado como servicio de Windows" -ForegroundColor Green
        return $true
    } catch {
        Write-Warning "⚠️  Error al configurar PM2 como servicio: $($_.Exception.Message)"
        return $false
    }
}

# Función para iniciar el backend
function Start-Backend {
    Write-Host "🚀 Iniciando backend..." -ForegroundColor Yellow
    
    Push-Location $ProjectRoot
    try {
        if ($Production) {
            pm2 start ecosystem.config.cjs --env production
        } else {
            pm2 start ecosystem.config.cjs
        }
        
        Start-Sleep -Seconds 3
        pm2 save
        
        Write-Host "✅ Backend iniciado con PM2" -ForegroundColor Green
        Show-BackendStatus
        return $true
    } catch {
        Write-Error "❌ Error al iniciar el backend: $($_.Exception.Message)"
        return $false
    } finally {
        Pop-Location
    }
}

# Función para detener el backend
function Stop-Backend {
    Write-Host "🛑 Deteniendo backend..." -ForegroundColor Yellow
    
    try {
        pm2 stop datacenter-backend
        Write-Host "✅ Backend detenido" -ForegroundColor Green
    } catch {
        Write-Error "❌ Error al detener el backend: $($_.Exception.Message)"
    }
}

# Función para reiniciar el backend
function Restart-Backend {
    Write-Host "🔄 Reiniciando backend..." -ForegroundColor Yellow
    
    try {
        pm2 restart datacenter-backend
        Write-Host "✅ Backend reiniciado" -ForegroundColor Green
        Show-BackendStatus
    } catch {
        Write-Error "❌ Error al reiniciar el backend: $($_.Exception.Message)"
    }
}

# Función para mostrar logs
function Show-BackendLogs {
    Write-Host "📋 Mostrando logs del backend..." -ForegroundColor Yellow
    pm2 logs datacenter-backend --lines 50
}

# Función para mostrar estado
function Show-BackendStatus {
    Write-Host "📊 Estado del backend:" -ForegroundColor Yellow
    pm2 status
    
    # Verificar conectividad
    Write-Host "`n🔍 Verificando conectividad..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/api/health" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend respondiendo correctamente en puerto 3002" -ForegroundColor Green
            $healthData = $response.Content | ConvertFrom-Json
            Write-Host "   - Uptime: $([math]::Round($healthData.uptime, 2)) segundos" -ForegroundColor Cyan
            Write-Host "   - PID: $($healthData.pid)" -ForegroundColor Cyan
            Write-Host "   - Entorno: $($healthData.environment)" -ForegroundColor Cyan
        }
    } catch {
        Write-Warning "⚠️  Backend no responde en puerto 3002: $($_.Exception.Message)"
    }
}

# Función principal de configuración
function Setup-Backend {
    Write-Host "🔧 Configurando backend completo..." -ForegroundColor Yellow
    
    Initialize-Directories
    
    if (-not (Test-Dependencies)) {
        Write-Error "❌ Error en las dependencias"
        return
    }
    
    if (-not (Install-BackendDependencies)) {
        Write-Error "❌ Error al instalar dependencias del backend"
        return
    }
    
    Setup-PM2Service
    
    if (Start-Backend) {
        Write-Host "`n🎉 Backend configurado y iniciado exitosamente!" -ForegroundColor Green
        Write-Host "`nComandos útiles:" -ForegroundColor Yellow
        Write-Host "  - Ver estado: .\scripts\backend-setup.ps1 -Action status" -ForegroundColor Cyan
        Write-Host "  - Ver logs: .\scripts\backend-setup.ps1 -Action logs" -ForegroundColor Cyan
        Write-Host "  - Reiniciar: .\scripts\backend-setup.ps1 -Action restart" -ForegroundColor Cyan
        Write-Host "  - Detener: .\scripts\backend-setup.ps1 -Action stop" -ForegroundColor Cyan
    }
}

# Ejecutar acción según parámetro
switch ($Action.ToLower()) {
    "setup" { Setup-Backend }
    "start" { Start-Backend }
    "stop" { Stop-Backend }
    "restart" { Restart-Backend }
    "logs" { Show-BackendLogs }
    "status" { Show-BackendStatus }
    default {
        Write-Host "Acciones disponibles: setup, start, stop, restart, logs, status" -ForegroundColor Yellow
        Write-Host "Ejemplo: .\scripts\backend-setup.ps1 -Action start -Production" -ForegroundColor Cyan
    }
}