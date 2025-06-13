# Script para instalar NGINX en Windows Server 2019
# Ejecutar como Administrador

param(
    [string]$InstallPath = "D:\nginx",
    [string]$Version = "1.24.0",
    [switch]$CreateService = $true
)

Write-Host "=== Instalador de NGINX para Windows Server 2019 ===" -ForegroundColor Green

# Verificar permisos de administrador
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Error "Este script debe ejecutarse como Administrador"
    exit 1
}

# Crear directorio de instalación
Write-Host "Creando directorio de instalación: $InstallPath" -ForegroundColor Yellow
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
}

# Descargar NGINX
$nginxUrl = "http://nginx.org/download/nginx-$Version.zip"
$nginxZip = "$env:TEMP\nginx-$Version.zip"

Write-Host "Descargando NGINX $Version..." -ForegroundColor Yellow
try {
    # Usar TLS 1.2 para la descarga
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $nginxUrl -OutFile $nginxZip -UseBasicParsing
    Write-Host "Descarga completada" -ForegroundColor Green
}
catch {
    Write-Error "Error al descargar NGINX: $($_.Exception.Message)"
    exit 1
}

# Extraer NGINX
Write-Host "Extrayendo NGINX..." -ForegroundColor Yellow
try {
    # Usar .NET para extraer el ZIP
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($nginxZip, $InstallPath)
    
    # Mover archivos del subdirectorio nginx-x.x.x al directorio raíz
    $extractedDir = Get-ChildItem -Path $InstallPath -Directory | Where-Object { $_.Name -like "nginx-*" } | Select-Object -First 1
    if ($extractedDir) {
        Get-ChildItem -Path $extractedDir.FullName -Recurse | ForEach-Object {
            $dest = $_.FullName.Replace($extractedDir.FullName, $InstallPath)
            if ($_.PSIsContainer) {
                if (-not (Test-Path $dest)) {
                    New-Item -ItemType Directory -Path $dest -Force | Out-Null
                }
            } else {
                Move-Item -Path $_.FullName -Destination $dest -Force
            }
        }
        Remove-Item -Path $extractedDir.FullName -Recurse -Force
    }
    
    Write-Host "Extracción completada" -ForegroundColor Green
}
catch {
    Write-Error "Error al extraer NGINX: $($_.Exception.Message)"
    exit 1
}

# Limpiar archivo temporal
Remove-Item -Path $nginxZip -Force -ErrorAction SilentlyContinue

# Verificar instalación
if (Test-Path "$InstallPath\nginx.exe") {
    Write-Host "NGINX instalado correctamente en $InstallPath" -ForegroundColor Green
} else {
    Write-Error "Error: nginx.exe no encontrado después de la instalación"
    exit 1
}

# Crear configuración básica si no existe
$configPath = "$InstallPath\conf\nginx.conf"
if (-not (Test-Path $configPath)) {
    Write-Host "Creando configuración básica..." -ForegroundColor Yellow
    
    $basicConfig = @"
worker_processes auto;
error_log logs/error.log;
pid logs/nginx.pid;

events {
    worker_connections 1024;
    use select;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    
    sendfile on;
    keepalive_timeout 65;
    
    server {
        listen 80;
        server_name localhost;
        
        location / {
            root html;
            index index.html index.htm;
        }
        
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root html;
        }
    }
}
"@
    
    $basicConfig | Out-File -FilePath $configPath -Encoding UTF8
    Write-Host "Configuración básica creada" -ForegroundColor Green
}

# Configurar firewall
Write-Host "Configurando firewall..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "NGINX HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "NGINX HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
    Write-Host "Reglas de firewall configuradas" -ForegroundColor Green
}
catch {
    Write-Warning "No se pudieron configurar las reglas de firewall automáticamente"
}

# Crear servicio de Windows (opcional)
if ($CreateService) {
    Write-Host "Configurando servicio de Windows..." -ForegroundColor Yellow
    
    # Verificar si NSSM está disponible
    $nssmPath = Get-Command "nssm" -ErrorAction SilentlyContinue
    
    if ($nssmPath) {
        try {
            # Crear servicio con NSSM
            & nssm install nginx "$InstallPath\nginx.exe"
            & nssm set nginx AppDirectory "$InstallPath"
            & nssm set nginx DisplayName "NGINX Web Server"
            & nssm set nginx Description "NGINX HTTP and reverse proxy server"
            & nssm set nginx Start SERVICE_AUTO_START
            
            Write-Host "Servicio NGINX creado con NSSM" -ForegroundColor Green
        }
        catch {
            Write-Warning "Error al crear el servicio con NSSM: $($_.Exception.Message)"
        }
    } else {
        Write-Host "NSSM no encontrado. Para crear un servicio automático:" -ForegroundColor Cyan
        Write-Host "1. Descarga NSSM desde https://nssm.cc/download" -ForegroundColor Cyan
        Write-Host "2. Ejecuta: nssm install nginx `"$InstallPath\nginx.exe`"" -ForegroundColor Cyan
    }
}

# Probar configuración
Write-Host "Probando configuración..." -ForegroundColor Yellow
try {
    $testResult = & "$InstallPath\nginx.exe" -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Configuración válida" -ForegroundColor Green
    } else {
        Write-Warning "Problemas en la configuración:"
        Write-Host $testResult -ForegroundColor Yellow
    }
}
catch {
    Write-Warning "No se pudo probar la configuración"
}

# Mostrar información final
Write-Host "`n=== Instalación Completada ===" -ForegroundColor Green
Write-Host "NGINX instalado en: $InstallPath" -ForegroundColor White
Write-Host "Archivo ejecutable: $InstallPath\nginx.exe" -ForegroundColor White
Write-Host "Configuración: $InstallPath\conf\nginx.conf" -ForegroundColor White
Write-Host "Logs: $InstallPath\logs\" -ForegroundColor White

Write-Host "`nComandos útiles:" -ForegroundColor Yellow
Write-Host "  Iniciar: $InstallPath\nginx.exe" -ForegroundColor Cyan
Write-Host "  Detener: $InstallPath\nginx.exe -s stop" -ForegroundColor Cyan
Write-Host "  Reiniciar: $InstallPath\nginx.exe -s reload" -ForegroundColor Cyan
Write-Host "  Probar config: $InstallPath\nginx.exe -t" -ForegroundColor Cyan

Write-Host "`nPara iniciar NGINX ahora, ejecute:" -ForegroundColor Yellow
Write-Host "  cd $InstallPath" -ForegroundColor Cyan
Write-Host "  .\nginx.exe" -ForegroundColor Cyan

Write-Host "`n¡Instalación completada exitosamente!" -ForegroundColor Green