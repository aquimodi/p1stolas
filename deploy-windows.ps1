# Script de despliegue para Windows Server 2019 con NGINX
# Ejecutar como Administrador

param(
    [string]$NginxPath = "D:\nginx",
    [string]$WebRoot = "D:\nginx\pistolas",
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

# 3. Verificar que el directorio de la aplicación existe
if (-not (Test-Path $WebRoot)) {
    Write-Error "El directorio de la aplicación no existe: $WebRoot"
    Write-Host "Asegúrese de que la aplicación esté ubicada en: $WebRoot" -ForegroundColor Yellow
    exit 1
}

# 4. Crear directorio conf.d si no existe
$confDPath = "$NginxPath\conf\conf.d"
if (-not (Test-Path $confDPath)) {
    New-Item -ItemType Directory -Path $confDPath -Force
    Write-Host "Directorio conf.d creado en $confDPath" -ForegroundColor Green
}

# 5. Copiar configuraciones de NGINX
Write-Host "Configurando NGINX..." -ForegroundColor Yellow

# Copiar configuración principal
$mainConfigSource = "$WebRoot\nginx.conf"
$mainConfigDest = "$NginxPath\conf\nginx.conf"

if (Test-Path $mainConfigSource) {
    Copy-Item -Path $mainConfigSource -Destination $mainConfigDest -Force
    Write-Host "Configuración principal de NGINX actualizada" -ForegroundColor Green
} else {
    Write-Warning "Archivo nginx.conf no encontrado en $WebRoot"
}

# Copiar configuración específica de la aplicación
$appConfigSource = "$WebRoot\conf.d\pistolas.conf"
$appConfigDest = "$confDPath\pistolas.conf"

if (Test-Path $appConfigSource) {
    Copy-Item -Path $appConfigSource -Destination $appConfigDest -Force
    Write-Host "Configuración de aplicación pistolas.conf actualizada" -ForegroundColor Green
} else {
    Write-Warning "Archivo conf.d/pistolas.conf no encontrado en $WebRoot"
}

# Copiar archivo de ejemplo (opcional)
$exampleConfigSource = "$WebRoot\conf.d\ejemplo-otra-app.conf.disabled"
$exampleConfigDest = "$confDPath\ejemplo-otra-app.conf.disabled"

if (Test-Path $exampleConfigSource) {
    Copy-Item -Path $exampleConfigSource -Destination $exampleConfigDest -Force
    Write-Host "Archivo de ejemplo copiado" -ForegroundColor Green
}

# 6. Verificar que existe la carpeta dist
if (-not (Test-Path "$WebRoot\dist")) {
    Write-Host "Construyendo la aplicación..." -ForegroundColor Yellow
    
    # Cambiar al directorio de la aplicación
    Push-Location $WebRoot
    
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
            Pop-Location
            exit 1
        }
    }
    catch {
        Write-Error "Error durante el build: $($_.Exception.Message)"
        Pop-Location
        exit 1
    }
    finally {
        Pop-Location
    }
} else {
    Write-Host "La carpeta dist ya existe en $WebRoot\dist" -ForegroundColor Green
}

# 7. Configurar firewall
Write-Host "Configurando firewall..." -ForegroundColor Yellow
try {
    # Permitir HTTP (puerto 80)
    New-NetFirewallRule -DisplayName "NGINX HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
    
    # Permitir HTTPS (puerto 443) - opcional
    New-NetFirewallRule -DisplayName "NGINX HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
    
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
Write-Host "Aplicación ubicada en: $WebRoot" -ForegroundColor White
Write-Host "Archivos web servidos desde: $WebRoot\dist" -ForegroundColor White
Write-Host "Configuración NGINX principal: $NginxPath\conf\nginx.conf" -ForegroundColor White
Write-Host "Configuración aplicación: $NginxPath\conf\conf.d\pistolas.conf" -ForegroundColor White
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
        Write-Host "✓ Aplicación pistolas respondiendo correctamente" -ForegroundColor Green
    }
}
catch {
    Write-Warning "No se pudo verificar la conectividad de pistolas. Verifique manualmente: http://localhost"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost/nginx-health" -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ NGINX respondiendo correctamente" -ForegroundColor Green
    }
}
catch {
    Write-Warning "No se pudo verificar la conectividad de NGINX"
}

Write-Host "`n¡Despliegue completado exitosamente!" -ForegroundColor Green
Write-Host "`nPara añadir más aplicaciones:" -ForegroundColor Yellow
Write-Host "1. Cree un nuevo archivo .conf en $NginxPath\conf\conf.d\" -ForegroundColor Cyan
Write-Host "2. Configure el server_name o puerto diferente" -ForegroundColor Cyan
Write-Host "3. Ejecute: $NginxPath\nginx.exe -s reload" -ForegroundColor Cyan