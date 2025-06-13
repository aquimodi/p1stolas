# Despliegue en Windows Server 2019 con NGINX (Configuración Modular)

Esta guía describe cómo desplegar DataCenter Manager en Windows Server 2019 usando NGINX con configuración modular que permite múltiples aplicaciones.

## Arquitectura de Configuración

### 🏗️ **Estructura Modular**

```
D:\nginx\
├── nginx.exe                    # Ejecutable principal
├── conf\
│   ├── nginx.conf               # Configuración principal
│   └── conf.d\                  # Configuraciones por aplicación
│       ├── pistolas.conf        # Configuración de DataCenter Manager
│       ├── otra-app.conf        # Otra aplicación (ejemplo)
│       └── *.conf               # Más aplicaciones
├── logs\
│   ├── access.log
│   └── error.log
└── pistolas\                    # Aplicación DataCenter Manager
    ├── dist\                    # Archivos construidos
    ├── src\                     # Código fuente
    ├── conf.d\                  # Configuraciones fuente
    │   ├── pistolas.conf
    │   └── ejemplo-otra-app.conf.disabled
    ├── nginx.conf               # Configuración principal fuente
    └── deploy-windows.ps1       # Script de despliegue
```

## Ventajas de esta Configuración

✅ **Múltiples aplicaciones** en el mismo servidor NGINX  
✅ **Configuración independiente** para cada aplicación  
✅ **Escalabilidad** fácil para nuevas aplicaciones  
✅ **Gestión centralizada** de logs y configuración global  
✅ **CORS habilitado** para acceso desde fuera  
✅ **Headers de seguridad** aplicados globalmente  

## Instalación Rápida

### 1. Preparar el Servidor

```powershell
# Ejecutar PowerShell como Administrador
# Verificar Node.js
node --version
npm --version
```

### 2. Ubicar la Aplicación

La aplicación debe estar en: **`D:\nginx\pistolas`**

### 3. Desplegar

```powershell
# Desde D:\nginx\pistolas
.\deploy-windows.ps1 -InstallNginx -StartServices
```

## Configuración de Múltiples Aplicaciones

### Método 1: Diferentes Dominios/Subdominios

```nginx
# En D:\nginx\conf\conf.d\app1.conf
server {
    listen 80;
    server_name app1.tu-dominio.com;
    root D:/nginx/app1/dist;
    # ... resto de configuración
}

# En D:\nginx\conf\conf.d\app2.conf
server {
    listen 80;
    server_name app2.tu-dominio.com;
    root D:/nginx/app2/dist;
    # ... resto de configuración
}
```

### Método 2: Diferentes Puertos

```nginx
# En D:\nginx\conf\conf.d\app1.conf
server {
    listen 80;
    server_name localhost;
    root D:/nginx/app1/dist;
    # ... resto de configuración
}

# En D:\nginx\conf\conf.d\app2.conf
server {
    listen 8080;
    server_name localhost;
    root D:/nginx/app2/dist;
    # ... resto de configuración
}
```

### Método 3: Diferentes Rutas

```nginx
# En D:\nginx\conf\conf.d\apps.conf
server {
    listen 80;
    server_name localhost;
    
    location /app1/ {
        alias D:/nginx/app1/dist/;
        try_files $uri $uri/ /app1/index.html;
    }
    
    location /app2/ {
        alias D:/nginx/app2/dist/;
        try_files $uri $uri/ /app2/index.html;
    }
}
```

## Gestión de Aplicaciones

### Añadir Nueva Aplicación

1. **Crear configuración:**
```powershell
# Crear D:\nginx\conf\conf.d\nueva-app.conf
```

2. **Configurar la aplicación:**
```nginx
server {
    listen 8081;  # Puerto diferente
    server_name localhost;
    root D:/nginx/nueva-app/dist;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /health {
        return 200 "nueva-app-healthy\n";
        add_header Content-Type text/plain;
    }
}
```

3. **Recargar NGINX:**
```powershell
D:\nginx\nginx.exe -s reload
```

### Comandos de Gestión

```powershell
# Verificar configuración
D:\nginx\nginx.exe -t

# Recargar configuración (sin interrumpir servicio)
D:\nginx\nginx.exe -s reload

# Reiniciar NGINX
D:\nginx\nginx.exe -s stop
Start-Process -FilePath "D:\nginx\nginx.exe" -WorkingDirectory "D:\nginx"

# Ver logs
Get-Content "D:\nginx\logs\error.log" -Tail 50
Get-Content "D:\nginx\logs\access.log" -Tail 50
```

## URLs de Acceso

Con la configuración actual:

- **DataCenter Manager**: `http://tu-servidor/` o `http://tu-servidor/health`
- **NGINX Status**: `http://tu-servidor/nginx-health`
- **Nuevas aplicaciones**: Según configuración (puerto/dominio)

## Configuración de Firewall

```powershell
# Permitir puertos adicionales para nuevas aplicaciones
New-NetFirewallRule -DisplayName "App Puerto 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
New-NetFirewallRule -DisplayName "App Puerto 8081" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow
```

## Configuración HTTPS

Para habilitar HTTPS en múltiples aplicaciones:

1. **Obtener certificados SSL** para cada dominio
2. **Colocar certificados** en `D:\nginx\ssl\`
3. **Configurar cada aplicación:**

```nginx
server {
    listen 443 ssl http2;
    server_name app1.tu-dominio.com;
    
    ssl_certificate D:/nginx/ssl/app1.crt;
    ssl_certificate_key D:/nginx/ssl/app1.key;
    
    root D:/nginx/app1/dist;
    # ... resto de configuración
}
```

## Monitoreo y Logs

### Logs Centralizados

Todos los logs se almacenan en `D:\nginx\logs\`:
- `access.log`: Todas las peticiones HTTP
- `error.log`: Errores de todas las aplicaciones

### Health Checks

- **Global**: `http://tu-servidor/nginx-health`
- **Por aplicación**: `http://tu-servidor/health` (pistolas)

### Monitoreo de Procesos

```powershell
# Ver procesos NGINX
Get-Process -Name "nginx"

# Verificar puertos en uso
netstat -an | findstr ":80"
netstat -an | findstr ":8080"
```

## Solución de Problemas

### Conflictos de Puerto

```powershell
# Verificar qué proceso usa un puerto
netstat -ano | findstr ":80"

# Cambiar puerto en configuración si hay conflicto
# Editar D:\nginx\conf\conf.d\app.conf
```

### Problemas de Configuración

```powershell
# Verificar sintaxis
D:\nginx\nginx.exe -t

# Ver errores específicos
Get-Content "D:\nginx\logs\error.log" -Tail 20
```

### Aplicación No Carga

1. Verificar que `dist/` existe en el directorio de la aplicación
2. Verificar permisos de archivos
3. Revisar configuración del `server_name`
4. Comprobar que el puerto no está ocupado

## Ejemplos de Configuración

### Aplicación React con API Backend

```nginx
server {
    listen 8080;
    server_name localhost;
    root D:/nginx/mi-app/dist;
    
    # Servir archivos estáticos
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy para API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Aplicación con Autenticación

```nginx
server {
    listen 8081;
    server_name app-segura.local;
    root D:/nginx/app-segura/dist;
    
    # Configuración de seguridad adicional
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'" always;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Contacto

Para soporte técnico, contactar al equipo de desarrollo.