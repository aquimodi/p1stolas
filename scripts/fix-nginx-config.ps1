# Script para corregir problemas de codificacion en archivos de configuracion NGINX
# Ubicacion: D:\nginx\pistolas\scripts\fix-nginx-config.ps1

param(
    [string]$NginxPath = "D:\nginx"
)

Write-Host "=== Corrigiendo Configuracion NGINX ===" -ForegroundColor Green

$ProjectRoot = "D:\nginx\pistolas"
$ConfDPath = "$NginxPath\conf\conf.d"

# Funcion para verificar y corregir codificacion de archivos
function Fix-FileEncoding {
    param(
        [string]$SourceFile,
        [string]$DestFile
    )
    
    if (Test-Path $SourceFile) {
        try {
            # Leer el archivo como UTF-8 sin BOM
            $content = Get-Content -Path $SourceFile -Raw -Encoding UTF8
            
            # Escribir sin BOM
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($DestFile, $content, $utf8NoBom)
            
            Write-Host "✅ Archivo corregido: $DestFile" -ForegroundColor Green
            return $true
        } catch {
            Write-Error "❌ Error al corregir $SourceFile : $($_.Exception.Message)"
            return $false
        }
    } else {
        Write-Warning "⚠️  Archivo fuente no encontrado: $SourceFile"
        return $false
    }
}

# Crear directorio conf.d si no existe
if (-not (Test-Path $ConfDPath)) {
    New-Item -ItemType Directory -Path $ConfDPath -Force | Out-Null
    Write-Host "✅ Directorio conf.d creado: $ConfDPath" -ForegroundColor Green
}

Write-Host "🔧 Corrigiendo archivos de configuracion..." -ForegroundColor Yellow

# Corregir configuracion principal
$mainConfigSource = "$ProjectRoot\nginx.conf"
$mainConfigDest = "$NginxPath\conf\nginx.conf"
Fix-FileEncoding -SourceFile $mainConfigSource -DestFile $mainConfigDest

# Corregir configuracion de pistolas
$pistolasConfigSource = "$ProjectRoot\conf.d\pistolas.conf"
$pistolasConfigDest = "$ConfDPath\pistolas.conf"
Fix-FileEncoding -SourceFile $pistolasConfigSource -DestFile $pistolasConfigDest

# Corregir archivo de ejemplo
$exampleConfigSource = "$ProjectRoot\conf.d\ejemplo-otra-app.conf.disabled"
$exampleConfigDest = "$ConfDPath\ejemplo-otra-app.conf.disabled"
Fix-FileEncoding -SourceFile $exampleConfigSource -DestFile $exampleConfigDest

Write-Host "`n🔍 Verificando configuracion..." -ForegroundColor Yellow

# Verificar sintaxis de NGINX
try {
    $testResult = & "$NginxPath\nginx.exe" -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Configuracion de NGINX valida" -ForegroundColor Green
        Write-Host $testResult -ForegroundColor Cyan
    } else {
        Write-Error "❌ Error en la configuracion de NGINX:"
        Write-Host $testResult -ForegroundColor Red
        
        # Mostrar contenido del archivo problematico para debug
        Write-Host "`n🔍 Contenido del archivo pistolas.conf:" -ForegroundColor Yellow
        if (Test-Path $pistolasConfigDest) {
            $content = Get-Content $pistolasConfigDest -Raw
            $firstLine = ($content -split "`n")[0]
            Write-Host "Primera linea: '$firstLine'" -ForegroundColor Cyan
            Write-Host "Longitud: $($firstLine.Length) caracteres" -ForegroundColor Cyan
            
            # Mostrar bytes de los primeros caracteres
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($firstLine.Substring(0, [Math]::Min(10, $firstLine.Length)))
            Write-Host "Primeros bytes: $($bytes -join ', ')" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Error "❌ Error al ejecutar nginx -t: $($_.Exception.Message)"
}

Write-Host "`n📋 Archivos de configuracion:" -ForegroundColor Yellow
Write-Host "  - Principal: $mainConfigDest" -ForegroundColor Cyan
Write-Host "  - Pistolas: $pistolasConfigDest" -ForegroundColor Cyan
Write-Host "  - Ejemplo: $exampleConfigDest" -ForegroundColor Cyan

Write-Host "`n🚀 Comandos siguientes:" -ForegroundColor Yellow
Write-Host "  1. Verificar: $NginxPath\nginx.exe -t" -ForegroundColor Cyan
Write-Host "  2. Iniciar: $NginxPath\nginx.exe" -ForegroundColor Cyan
Write-Host "  3. Recargar: $NginxPath\nginx.exe -s reload" -ForegroundColor Cyan

Write-Host "`n✅ Correccion de configuracion completada!" -ForegroundColor Green