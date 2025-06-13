# Script de despliegue para Windows Server 2019 con NGINX
# Ejecutar como Administrador

param(
    [string]$NginxPath = "C:\nginx",
    [string]$WebRoot = "C:\inetpub\datacenter-manager",
    [switch]$InstallNginx = $false,
    [switch]$StartServices = $true
)

Write-Host "=== DataCenter Manager - Despliegue en Windows Server 2019 ===" -ForegroundColor Green

# Función para verificar si se ejecuta como administrador
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Error "Este script debe ejecutarse como Administrador"
    exit 1
}

# 1. Instalar NGINX si se solicita
if ($InstallNginx) {
    Write-Host "Instalando NGINX..." -ForegroundColor Yellow
    
    # Crear directorio para NGINX
    if (-not (Test-Path $NginxPath)) {
        New-Item -ItemType Directory -Path $NginxPath -Force
    }
    
    # Descargar NGINX (versión estable para Windows)
    $nginxUrl = "http://nginx.org/download/nginx-1.24.0.zip"
    $nginxZip = "$env:TEMP\nginx.zip"
    
    try {
        Invoke-WebRequest -Uri $nginxUrl -OutFile $nginxZip
        Expand-Archive -Path $nginxZip -DestinationPath $NginxPath -Force
        
        # Mover archivos del subdirectorio
        $extractedDir = Get-ChildItem -Path $NginxPath -Directory | Where-Object { $_.Name -like "nginx-*" } | Select-Object -First 1
        if ($extractedDir) {
            Get-ChildItem -Path $extractedDir.FullName -Recurse | Move-Item -Destination $NginxPath -Force
            Remove-Item -Path $extractedDir.FullName -Recurse -Force
        }
        
        Remove-Item -Path $nginxZip -Force
        Write-Host "NGINX instalado correctamente en $NginxPath" -ForegroundColor Green
    }
    catch {
        Write-Error "Error al instalar NGINX: $($_.Exception.Message)"
        exit 1
    }
}

# 2. Verificar que NGINX existe
if (-not (Test-Path "$NginxPath\nginx.exe")) {
    Write-Error "NGINX no encontrado en $NginxPath. Use -InstallNginx para instalarlo."
    exit 1
}

# 3. Crear directorio web
Write-Host "Configurando directorio web..." -ForegroundColor Yellow
if (-not (Test-Path $WebRoot)) {
    New-Item -ItemType Directory -Path $WebRoot -Force
}

# 4. Copiar archivos de configuración de NGINX
Write-Host "Configurando NGINX..." -ForegroundColor Yellow
$configSource = ".\nginx.conf"
$configDest = "$NginxPath\conf\nginx.conf"

if (Test-Path $configSource) {
    Copy-Item -Path $configSource -Destination $configDest -Force
    Write-Host "Configuración de NGINX actualizada" -ForegroundColor Green
} else {
    Write-Warning "Archivo nginx.conf no encontrado en el directorio actual"
}

# 5. Construir la aplicación
Write-Host "Construyendo la aplicación..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    try {
        # Instalar dependencias si no existen
        if (-not (Test-Path "node_modules")) {
            Write-Host "Instalando dependencias..." -ForegroundColor Yellow
            npm install
        }
        
        # Construir para producción
        Write-Host "Ejecutando build de producción..." -ForegroundColor Yellow
        npm run build
        
        if (Test-Path "dist") {
            Write-Host "Build completado exitosamente" -ForegroundColor Green
        } else {
            Write-Error "Error: No se generó la carpeta dist"
            exit 1
        }
    }
    catch {
        Write-Error "Error durante el build: $($_.Exception.Message)"
        exit 1
    }
} else {
    Write-Error "package.json no encontrado. Ejecute este script desde el directorio raíz del proyecto."
    exit 1
}

# 6. Copiar archivos construidos
Write-Host "Copiando archivos al servidor web..." -ForegroundColor Yellow
if (Test-Path "dist") {
    # Limpiar directorio de destino
    if (Test-Path "$WebRoot\dist") {
        Remove-Item -Path "$WebRoot\dist" -Recurse -Force
    }
    
    # Copiar archivos
    Copy-Item -Path "dist" -Destination $WebRoot -Recurse -Force
    Write-Host "Archivos copiados a $WebRoot\dist" -ForegroundColor Green
} else {
    Write-Error "Directorio dist no encontrado"
    exit 1
}

# 7. Configurar firewall
Write-Host "Configurando firewall..." -ForegroundColor Yellow
try {
    # Permitir HTTP (puerto 80)
    New-NetFirewallRule -DisplayName "DataCenter Manager HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
    
    # Permitir HTTPS (puerto 443) - opcional
    New-NetFirewallRule -DisplayName "DataCenter Manager HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
    
    Write-Host "Reglas de firewall configuradas" -ForegroundColor Green
}
catch {
    Write-Warning "No se pudieron configurar las reglas de firewall automáticamente"
}

# 8. Crear servicio de Windows para NGINX
Write-Host "Configurando servicio de NGINX..." -ForegroundColor Yellow
$serviceName = "nginx"
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($service) {
    Write-Host "Servicio NGINX ya existe, reiniciando..." -ForegroundColor Yellow
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} else {
    Write-Host "Creando servicio NGINX..." -ForegroundColor Yellow
    # Nota: Para crear un servicio de Windows para NGINX, se recomienda usar NSSM o similar
    # Por simplicidad, aquí se proporciona el comando manual
    Write-Host "Para crear el servicio automáticamente, instale NSSM y ejecute:" -ForegroundColor Cyan
    Write-Host "nssm install nginx `"$NginxPath\nginx.exe`"" -ForegroundColor Cyan
}

# 9. Iniciar NGINX
if ($StartServices) {
    Write-Host "Iniciando NGINX..." -ForegroundColor Yellow
    
    # Verificar configuración
    $testResult = & "$NginxPath\nginx.exe" -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Configuración de NGINX válida" -ForegroundColor Green
        
        # Iniciar NGINX
        try {
            Start-Process -FilePath "$NginxPath\nginx.exe" -WorkingDirectory $NginxPath -WindowStyle Hidden
            Start-Sleep -Seconds 2
            
            # Verificar que está ejecutándose
            $nginxProcess = Get-Process -Name "nginx" -ErrorAction SilentlyContinue
            if ($nginxProcess) {
                Write-Host "NGINX iniciado correctamente" -ForegroundColor Green
            } else {
                Write-Warning "NGINX no parece estar ejecutándose"
            }
        }
        catch {
            Write-Error "Error al iniciar NGINX: $($_.Exception.Message)"
        }
    } else {
        Write-Error "Error en la configuración de NGINX:"
        Write-Host $testResult -ForegroundColor Red
        exit 1
    }
}

# 10. Mostrar información final
Write-Host "`n=== Despliegue Completado ===" -ForegroundColor Green
Write-Host "Aplicación desplegada en: $WebRoot\dist" -ForegroundColor White
Write-Host "Configuración NGINX: $NginxPath\conf\nginx.conf" -ForegroundColor White
Write-Host "URL de acceso: http://localhost" -ForegroundColor White
Write-Host "`nComandos útiles:" -ForegroundColor Yellow
Write-Host "  Reiniciar NGINX: $NginxPath\nginx.exe -s reload" -ForegroundColor Cyan
Write-Host "  Detener NGINX: $NginxPath\nginx.exe -s stop" -ForegroundColor Cyan
Write-Host "  Ver logs: Get-Content $NginxPath\logs\error.log -Tail 50" -ForegroundColor Cyan

# 11. Verificar conectividad
Write-Host "`nVerificando conectividad..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost/health" -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Servidor web respondiendo correctamente" -ForegroundColor Green
    }
}
catch {
    Write-Warning "No se pudo verificar la conectividad. Verifique manualmente: http://localhost"
}

Write-Host "`n¡Despliegue completado exitosamente!" -ForegroundColor Green