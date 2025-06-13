# DataCenter Manager

Una aplicación moderna para la gestión eficiente del ciclo de vida de equipamiento en datacenters, desde la planificación hasta la integración con DCIM.

![DataCenter Manager Banner](https://images.unsplash.com/photo-1733036363190-fd1f5410d9f2?q=80&w=3474&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)

## 🚀 Características Principales

- ✅ **Gestión de proyectos completa**: Centraliza toda la información desde la fase de planificación
- 🔍 **Verificación inteligente de equipos**: OCR y IA para el reconocimiento automatizado de albaranes
- 📋 **Control de inventario**: Seguimiento de equipamiento desde recepción hasta instalación
- 🤖 **Procesamiento con IA**: Utiliza Mistral AI para análisis inteligente de documentación
- 🔄 **Integración DCIM**: Exportación directa al sistema de gestión del datacenter
- 📱 **Responsive**: Interfaz adaptable para uso en dispositivos móviles
- 🌐 **Aplicación Unificada**: Frontend y backend integrados en una sola aplicación Node.js

## 📋 Requisitos del Sistema Windows Server 2019

### Mínimos
- **Windows Server**: 2019 o superior
- **Node.js**: v18.0.0 o superior
- **npm**: v8.0.0 o superior
- **RAM**: 8GB mínimo
- **Almacenamiento**: 10GB disponibles
- **PowerShell**: 5.1 o superior

### Para Producción
- **SQL Server**: 2016 o superior (opcional, usa modo demo por defecto)
- **PM2**: Para gestión de procesos Node.js
- **Certificado SSL**: Para HTTPS en producción (opcional)

## 🛠️ Instalación en Windows Server 2019

### 📥 1. Preparación del Servidor

**Instalar Node.js:**
```powershell
# Descargar e instalar Node.js 18 LTS desde https://nodejs.org
# O usar Chocolatey si está disponible:
choco install nodejs --version 18.19.0

# Verificar instalación
node --version
npm --version
```

**Instalar PM2 globalmente:**
```powershell
npm install -g pm2
npm install -g pm2-windows-service

# Verificar PM2
pm2 --version
```

**Configurar usuario para la aplicación (opcional pero recomendado):**
```powershell
# Crear usuario para el servicio
New-LocalUser -Name "DataCenterApp" -Password (ConvertTo-SecureString "P@ssw0rd123!" -AsPlainText -Force) -Description "Usuario para DataCenter Manager"

# El directorio de aplicación ya existe
Get-Item -Path "D:\inetpub\pistolas"
```

### 📂 2. Desplegar el Código

**Los archivos ya están en la ubicación correcta:**
```powershell
# Verificar archivos en D:\inetpub\pistolas\
Get-ChildItem -Path "D:\inetpub\pistolas\" -Recurse | Select-Object Name, Length

# Ir al directorio de la aplicación
Set-Location D:\inetpub\pistolas

# Instalar dependencias
npm install
```

### ⚙️ 3. Configurar Variables de Entorno

**Frontend (.env):**
```powershell
# Crear archivo .env en la raíz del proyecto
@"
VITE_API_URL=/api
VITE_DEBUG_MODE=false
VITE_DEMO_MODE=false
VITE_CONTACT_EMAIL=info@tu-empresa.com
"@ | Out-File -FilePath "D:\inetpub\pistolas\.env" -Encoding UTF8
```

**Backend (server\.env):**
```powershell
# Crear archivo .env en el directorio server
@"
NODE_ENV=production
PORT=3002
IP_ADDRESS=0.0.0.0

# JWT Secret (generar uno nuevo)
JWT_SECRET=datacenter_secret_key_cambiar_en_produccion_2025

# Base de Datos SQL Server (opcional en modo demo)
DB_SERVER=localhost\SQLEXPRESS
DB_NAME=QEIS1DAT
DB_USER=datacenter_user
DB_PASSWORD=P@ssw0rd_CAMBIAR_EN_PRODUCCION
DB_PORT=1433
DB_ENCRYPT=true

# API de IA (opcional)
MISTRAL_API_KEY=tu_clave_mistral_aqui

# Logging
LOG_LEVEL=info

# CORS (configurado para aplicación unificada)
CORS_ORIGIN=*

# Límites de archivos
MAX_FILE_SIZE=10485760
"@ | Out-File -FilePath "D:\inetpub\pistolas\server\.env" -Encoding UTF8
```

### 🏗️ 4. Construir y Configurar la Aplicación

```powershell
# Ir al directorio de la aplicación
Set-Location D:\inetpub\pistolas

# Construir el frontend para producción
npm run build

# Verificar que la carpeta dist se creó correctamente
Get-ChildItem .\dist

# El backend automáticamente servirá estos archivos estáticos
```

### 🔧 5. Configurar PM2 como Servicio de Windows

```powershell
# Ir al directorio de la aplicación
Set-Location D:\inetpub\pistolas

# Instalar PM2 como servicio de Windows
pm2-service-install

# Iniciar la aplicación con PM2
pm2 start ecosystem.config.cjs --env production

# Guardar la configuración de PM2
pm2 save

# Verificar que está funcionando
pm2 status
pm2 logs datacenter-api --lines 20
```

### 🌐 6. Configurar Firewall de Windows

```powershell
# Abrir puerto para la aplicación (solo puerto 3002 necesario)
New-NetFirewallRule -DisplayName "DataCenter Manager App" -Direction Inbound -Protocol TCP -LocalPort 3002 -Action Allow

# Verificar reglas
Get-NetFirewallRule -DisplayName "*DataCenter Manager*"
```

### 🔐 7. Configurar HTTPS (Opcional)

**Para desarrollo con certificado autofirmado:**
```powershell
# Crear certificado autofirmado
$cert = New-SelfSignedCertificate -DnsName "tu-servidor.local" -CertStoreLocation "cert:\LocalMachine\My"

# Nota: Para configurar HTTPS en Express, necesitarías modificar el servidor
# En producción, se recomienda usar un proxy reverso o balanceador de carga con SSL
```

**Para producción, usar certificado válido:**
- Obtener certificado SSL de una autoridad certificadora
- Configurar Express para usar HTTPS (requiere modificación del código)
- O usar un balanceador de carga externo con terminación SSL

## 📊 Arquitectura de la Aplicación

### 🏗️ **Aplicación Unificada (Sin Proxy Inverso)**

```
┌─────────────────────────────────────┐
│          Windows Server 2019        │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │     Node.js + Express           │ │
│  │     D:\inetpub\pistolas         │ │
│  │                                 │ │
│  │  ┌─────────────┬─────────────┐  │ │
│  │  │   Frontend  │   Backend   │  │ │
│  │  │  (Archivos  │     API     │  │ │
│  │  │  Estáticos) │   (/api/*) │  │ │
│  │  └─────────────┴─────────────┘  │ │
│  │                                 │ │
│  │         Puerto 3002             │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │        PM2 Service              │ │
│  │    (Gestión de Procesos)        │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │      SQL Server (Opcional)      │ │
│  │        (Modo Demo por           │ │
│  │         defecto)                │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 🚀 **Ventajas de esta Arquitectura:**

- ✅ **Simplicidad**: Un solo servicio, un solo puerto
- ✅ **Sin proxy**: Eliminamos complejidad de configuración
- ✅ **Mantenimiento fácil**: Todo en un proceso gestionado por PM2
- ✅ **Menor latencia**: Sin saltos adicionales entre serviços
- ✅ **Configuración mínima**: Solo firewall para un puerto

## 📊 Comandos de Gestión en Windows

### Desarrollo Local
```powershell
# Ir al directorio de la aplicación
Set-Location D:\inetpub\pistolas

# Instalar dependencias
npm install

# Iniciar modo desarrollo completo (frontend + backend)
npm run dev:full

# Solo frontend
npm run dev

# Solo backend
npm run dev:backend

# Verificar conectividad
npm run check:backend
```

### Producción
```powershell
# Ir al directorio de la aplicación
Set-Location D:\inetpub\pistolas

# Construir aplicación completa
npm run build

# Iniciar con PM2
pm2 start ecosystem.config.cjs --env production

# Gestión PM2
pm2 status                    # Ver estado de procesos
pm2 logs datacenter-api      # Ver logs en tiempo real
pm2 restart datacenter-api   # Reiniciar aplicación
pm2 stop datacenter-api      # Detener aplicación
pm2 delete datacenter-api    # Eliminar proceso de PM2

# Reiniciar servicio PM2 de Windows
Restart-Service PM2

# Ver logs del sistema
Get-EventLog -LogName Application -Source "PM2" -Newest 10
```

### Mantenimiento
```powershell
# Ir al directorio de la aplicación
Set-Location D:\inetpub\pistolas

# Backup de la aplicación
Compress-Archive -Path "D:\inetpub\pistolas" -DestinationPath "D:\Backups\DataCenterManager_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"

# Actualizar aplicación
git pull origin main  # Si usa git
npm install           # Actualizar dependencias
npm run build         # Reconstruir frontend
pm2 restart datacenter-api  # Reiniciar

# Verificar servicios
Get-Service | Where-Object {$_.Name -like "*PM2*"}
Get-Process -Name "node"

# Verificar puerto en uso
netstat -an | findstr ":3002"
```

## 🔍 Diagnósticos y Solución de Problemas

### Scripts de Diagnóstico
```powershell
# Ir al directorio de la aplicación
Set-Location D:\inetpub\pistolas

# Verificar conectividad completa
node check-connection.js

# Test de CORS
node test-cors.js

# Test directo a la aplicación
Invoke-WebRequest -Uri "http://localhost:3002/api/health" -Method GET

# Test frontend (servido por el backend)
Invoke-WebRequest -Uri "http://localhost:3002" -Method GET

# Test API desde frontend
Invoke-WebRequest -Uri "http://localhost:3002/api/health" -Method GET
```

### Problemas Comunes

**Aplicación no responde:**
```powershell
# Verificar proceso Node.js
Get-Process -Name "node" -ErrorAction SilentlyContinue

# Verificar PM2
pm2 status
pm2 logs datacenter-api --lines 50

# Reiniciar servicios
pm2 restart datacenter-api
Restart-Service PM2
```

**Puerto ocupado:**
```powershell
# Verificar qué proceso usa el puerto 3002
netstat -ano | findstr ":3002"

# Terminar proceso si es necesario (usar con cuidado)
# Get-Process -Id <PID> | Stop-Process -Force
```

**Frontend no carga:**
```powershell
# Verificar que la carpeta dist existe
Get-ChildItem "D:\inetpub\pistolas\dist"

# Reconstruir frontend
npm run build

# Verificar configuración de archivos estáticos en el backend
Get-Content "D:\inetpub\pistolas\server\index.js" | Select-String "static"
```

**Base de datos no conecta:**
```powershell
# Verificar SQL Server
Get-Service -Name "*SQL*"

# Test de conexión
sqlcmd -S localhost\SQLEXPRESS -E -Q "SELECT 1"

# Usar modo demo si hay problemas con BD
# Editar .env y cambiar VITE_DEMO_MODE=true
```

### URLs de Verificación

Una vez configurado, verificar estas URLs:

- **Aplicación completa**: `http://tu-servidor:3002`
- **API Health Check**: `http://tu-servidor:3002/api/health`
- **Diagnósticos completos**: `http://tu-servidor:3002/api/diagnostics/full`
- **Test CORS**: `http://tu-servidor:3002/api/test-cors`

## 🎯 Estructura del Proyecto en Windows

```
D:\inetpub\pistolas\
├── 📁 src\                    # Código fuente Frontend React
├── 📁 server\                 # Backend Express
├── 📁 dist\                   # Build de producción (servido por Express)
├── 📁 uploads\                # Archivos subidos
├── 📁 logs\                   # Logs del sistema
├── 📄 .env                    # Variables entorno frontend
├── 📄 server\.env             # Variables entorno backend
├── 📄 ecosystem.config.cjs    # Configuración PM2
└── 📄 package.json            # Dependencias y scripts
```

## 🚀 Flujo de Despliegue Rápido

```powershell
# 1. Preparar servidor
npm install -g pm2 pm2-windows-service

# 2. Ir al directorio de la aplicación
Set-Location D:\inetpub\pistolas

# 3. Instalar dependencias
npm install

# 4. Configurar entorno
# (Crear archivos .env como se indica arriba)

# 5. Construir aplicación
npm run build

# 6. Configurar PM2 como servicio
pm2-service-install

# 7. Iniciar aplicación
pm2 start ecosystem.config.cjs --env production
pm2 save

# 8. Configurar firewall
New-NetFirewallRule -DisplayName "DataCenter Manager" -Direction Inbound -Protocol TCP -LocalPort 3002 -Action Allow

# 9. Verificar funcionamiento
Invoke-WebRequest -Uri "http://localhost:3002/api/health" -Method GET
```

## 👥 Usuarios de Prueba

| Email                        | Contraseña    | Rol             |
|-----------------------------|---------------|-----------------|
| admin@datacenter.com        | admin123      | Administrador   |
| tecnico@datacenter.com      | tecnico123    | Técnico         |
| supervisor@datacenter.com   | supervisor123 | Supervisor      |
| junior@datacenter.com       | junior123     | Técnico Junior  |

## 🔗 Enlaces de Monitoreo

- **Aplicación principal**: `http://tu-servidor:3002`
- **Estado de la API**: `http://tu-servidor:3002/api/health`
- **Diagnósticos completos**: `http://tu-servidor:3002/api/diagnostics/full`
- **Logs PM2**: `pm2 logs datacenter-api --lines 50 --raw`
- **Monitor PM2**: `pm2 monit`

## 📞 Soporte Técnico

Para soporte técnico, contactar a: [info@datacenter-manager.com](mailto:info@datacenter-manager.com)

## 📜 Licencia

Copyright © 2025 DataCenter Manager. Todos los derechos reservados.

---

### 🚀 ¡Aplicación Unificada para Windows Server 2019!

La aplicación ha sido optimizada para funcionar como una **aplicación unificada** en Windows Server 2019, donde el backend Express sirve tanto la API como los archivos estáticos del frontend, eliminando completamente la necesidad de proxy inverso y simplificando la arquitectura de despliegue.

Ubicación del proyecto: **D:\inetpub\pistolas**