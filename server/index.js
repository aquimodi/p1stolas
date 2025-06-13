const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3002;
const IP_ADDRESS = process.env.IP_ADDRESS || '0.0.0.0';

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Servir archivos estáticos del frontend
const frontendPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  console.log(`✅ Sirviendo archivos estáticos desde: ${frontendPath}`);
} else {
  console.warn(`⚠️  Directorio dist no encontrado: ${frontendPath}`);
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    port: PORT,
    pid: process.pid
  });
});

app.get('/api/diagnostics/full', (req, res) => {
  const diagnostics = {
    server: {
      status: 'running',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: PORT,
      ipAddress: IP_ADDRESS
    },
    database: {
      connection: 'demo-mode', // En modo demo
      status: 'simulated'
    },
    frontend: {
      distExists: fs.existsSync(frontendPath),
      distPath: frontendPath
    },
    timestamp: new Date().toISOString(),
    errors: []
  };

  res.json(diagnostics);
});

// Test CORS endpoint
app.get('/api/test-cors', (req, res) => {
  res.json({
    message: 'CORS está funcionando correctamente',
    origin: req.headers.origin || 'No origin header',
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Catch all para SPA (debe ir al final)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: 'Frontend no encontrado',
      message: 'El directorio dist no existe o no contiene index.html'
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, IP_ADDRESS, () => {
  console.log(`🚀 Servidor iniciado en http://${IP_ADDRESS}:${PORT}`);
  console.log(`📁 Directorio de trabajo: ${process.cwd()}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
  console.log(`📊 PID: ${process.pid}`);
  
  // Verificar archivos importantes
  const envPath = path.join(__dirname, '.env');
  console.log(`📋 Archivo .env: ${fs.existsSync(envPath) ? '✅' : '❌'}`);
  console.log(`📋 Directorio dist: ${fs.existsSync(frontendPath) ? '✅' : '❌'}`);
});

// Manejo de señales para cierre limpio
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});