# Despliegue en Windows Server 2019 con NGINX

Esta guía describe cómo desplegar DataCenter Manager en Windows Server 2019 usando NGINX como servidor web.

## Requisitos Previos

### Software Necesario
- **Windows Server 2019** o superior
- **Node.js** v18.0.0 o superior
- **npm** v8.0.0 o superior
- **PowerShell** 5.1 o superior (incluido en Windows Server 2019)
- **NGINX** para Windows (se puede instalar automáticamente)

### Permisos
- Acceso de **Administrador** en el servidor
- Permisos para modificar el firewall de Windows
- Permisos para crear servicios de Windows

## Instalación Rápida

### 1. Preparar el Servidor

```powershell
# Ejecutar PowerShell como Administrador

# Verificar versión de Node.js
node --version
npm --version

# Si Node.js no está instalado, descargarlo desde https://nodejs.org
```

### 2. Ubicar la Aplicación

La aplicación debe estar ubicada en: **`D:\nginx\pistolas`**

```powershell
# Verificar que la aplicación está en la ubicación correcta
Get-ChildItem "D:\nginx\pistolas"
```

### 3. Desplegar la Aplicación

```powershell
# Navegar al directorio de la aplicación
cd D:\nginx\pistolas

# Ejecutar script de despliegue (instala NGINX automáticamente)
.\deploy-windows.ps1 -InstallNginx -StartServices

# O si NGINX ya está instalado
.\deploy-windows.ps1 -StartServices
```

### 4. Verificar el Despliegue

```powershell
# Verificar que NGINX está ejecutándose
Get-Process -Name "nginx"

# Probar conectividad
Invoke-WebRequest -Uri "http://localhost"
```

## Instalación Manual

### 1. Instalar NGINX

```powershell
# Ejecutar desde D:\nginx\pistolas
.\install-nginx.ps1
```

### 2. Configurar NGINX

```powershell
# La configuración se copia automáticamente desde D:\nginx\pistolas\nginx.conf
# Verificar configuración
D:\nginx\nginx.exe -t
```

### 3. Construir la Aplicación

```powershell
# Desde D:\nginx\pistolas
npm install
npm run build
```

### 4. Configurar Firewall

```powershell
# Permitir tráfico HTTP
New-NetFirewallRule -DisplayName "DataCenter Manager HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Permitir tráfico HTTPS (opcional)
New-NetFirewallRule -DisplayName "DataCenter Manager HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

### 5. Iniciar NGINX

```powershell
# Iniciar NGINX
Start-Process -FilePath "D:\nginx\nginx.exe" -WorkingDirectory "D:\nginx"

# Verificar que está ejecutándose
Get-Process -Name "nginx"
```

## Configuración de Producción

### Variables de Entorno

Crear archivo `.env` en `D:\nginx\pistolas`:

```env
# Configuración para producción
NODE_ENV=production
IP_ADDRESS=192.168.1.100
VITE_API_URL=http://192.168.1.100:3002/api
VITE_DEBUG_MODE=false
VITE_DEMO_MODE=false
```

### HTTPS (Opcional)

Para habilitar HTTPS:

1. Obtener certificados SSL
2. Colocar certificados en `D:\nginx\ssl\`
3. Descomentar la sección HTTPS en `nginx.conf`
4. Reiniciar NGINX

### Servicio de Windows

Para ejecutar NGINX como servicio de Windows, instalar NSSM:

```powershell
# Descargar NSSM desde https://nssm.cc/download
# Instalar NGINX como servicio
nssm install nginx "D:\nginx\nginx.exe"
nssm set nginx AppDirectory "D:\nginx"
nssm start nginx
```

## Gestión del Servidor

### Comandos Útiles

```powershell
# Reiniciar NGINX
D:\nginx\nginx.exe -s reload

# Detener NGINX
D:\nginx\nginx.exe -s stop

# Ver logs de error
Get-Content "D:\nginx\logs\error.log" -Tail 50

# Ver logs de acceso
Get-Content "D:\nginx\logs\access.log" -Tail 50

# Verificar configuración
D:\nginx\nginx.exe -t
```

### Actualizar la Aplicación

```powershell
# Navegar al directorio de la aplicación
cd D:\nginx\pistolas

# Actualizar código (si usa Git)
git pull

# Reinstalar dependencias si es necesario
npm install

# Reconstruir
npm run build

# Reiniciar NGINX
D:\nginx\nginx.exe -s reload
```

### Monitoreo

```powershell
# Verificar estado del servicio
Get-Process -Name "nginx"

# Verificar conectividad
Test-NetConnection -ComputerName localhost -Port 80

# Verificar logs en tiempo real
Get-Content "D:\nginx\logs\access.log" -Wait
```

## Solución de Problemas

### NGINX no inicia

```powershell
# Verificar configuración
D:\nginx\nginx.exe -t

# Verificar logs
Get-Content "D:\nginx\logs\error.log"

# Verificar que el puerto no está ocupado
netstat -an | findstr ":80"
```

### Aplicación no carga

1. Verificar que los archivos están en `D:\nginx\pistolas\dist`
2. Verificar permisos de archivos
3. Revisar logs de NGINX
4. Verificar configuración de firewall

### Problemas de CORS

Si hay problemas de CORS, verificar la configuración en `nginx.conf`:

```nginx
add_header Access-Control-Allow-Origin "*" always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
```

## Estructura de Archivos

```
D:\
├── nginx\
│   ├── conf\
│   │   └── nginx.conf
│   ├── logs\
│   │   ├── access.log
│   │   └── error.log
│   ├── nginx.exe
│   └── pistolas\
│       ├── dist\
│       │   ├── index.html
│       │   ├── assets\
│       │   └── ...
│       ├── src\
│       ├── package.json
│       ├── nginx.conf
│       └── deploy-windows.ps1
```

## URLs de Acceso

- **Aplicación principal**: `http://tu-servidor`
- **Health check**: `http://tu-servidor/health`
- **Archivos estáticos**: `http://tu-servidor/assets/`

## Seguridad

### Recomendaciones

1. **Firewall**: Configurar reglas específicas para los puertos necesarios
2. **HTTPS**: Implementar certificados SSL en producción
3. **Actualizaciones**: Mantener NGINX y Node.js actualizados
4. **Logs**: Monitorear logs regularmente
5. **Backups**: Realizar copias de seguridad de la configuración

### Headers de Seguridad

La configuración incluye headers de seguridad básicos:

- `X-Frame-Options`
- `X-XSS-Protection`
- `X-Content-Type-Options`
- `Content-Security-Policy`

## Contacto

Para soporte técnico, contactar al equipo de desarrollo.