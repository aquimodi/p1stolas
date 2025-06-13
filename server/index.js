import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Routes
import projectRoutes from './routes/projects.js';
import orderRoutes from './routes/orders.js';
import deliveryNoteRoutes from './routes/deliveryNotes.js';
import equipmentRoutes from './routes/equipment.js';
import incidentRoutes from './routes/incidents.js';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/uploads.js';
import utilsRoutes from './routes/utils.js';
import diagnosticsRoutes from './routes/diagnostics.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// Utils
import { logger } from './utils/logger.js';

// Get __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server configuration
const app = express();
const PORT = process.env.PORT || 3002;
const IP_ADDRESS = process.env.IP_ADDRESS || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Log startup configuration
console.log('🚀 Starting DataCenter Manager API Server');
console.log('  - Port:', PORT);
console.log('  - IP Address:', IP_ADDRESS);
console.log('  - Environment:', NODE_ENV);
console.log('  - CORS Origin:', process.env.CORS_ORIGIN || '*');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB default

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Accept only certain file types
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/jpeg',
      'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten PDF, Excel, JPG y PNG.'), false);
    }
  }
});

// CORS Configuration - Habilitado para acceso externo
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔍 CORS check for origin:', origin);
    
    // Get allowed origins from environment variable
    const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'];
    
    // Always allow requests with no origin (Postman, mobile apps, etc.)
    if (!origin) {
      console.log('🟢 CORS: No origin header - allowing request');
      return callback(null, true);
    }
    
    // If wildcard is set, allow all origins
    if (allowedOrigins.includes('*')) {
      console.log('🟢 CORS: Wildcard enabled - allowing all origins');
      return callback(null, true);
    }
    
    // Check against specific allowed origins
    if (allowedOrigins.includes(origin)) {
      console.log('🟢 CORS: Origin allowed:', origin);
      return callback(null, true);
    }
    
    console.log('🚫 CORS: Origin blocked:', origin);
    console.log('🚫 CORS: Allowed origins:', allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Demo-Mode', 
    'Accept', 
    'Origin',
    'X-Requested-With',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: [
    'Content-Length',
    'Content-Type',
    'Date',
    'Server'
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

// Use CORS with options
app.use(cors(corsOptions));

// Security middleware (but relaxed for external access)
app.use(helmet({ 
  contentSecurityPolicy: NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false,
  crossOriginEmbedderPolicy: false // Disable for external access
}));

app.use(compression());
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Make uploads directory accessible
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/diagnostics', diagnosticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery-notes', deliveryNoteRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/uploads', uploadRoutes(upload));
app.use('/api/utils', utilsRoutes);

// Health check endpoint - accessible at multiple paths
app.get(['/api/health', '/health'], (req, res) => {
  console.log('🏥 Health check requested from:', req.ip, 'origin:', req.headers.origin);
  
  const healthData = { 
    status: 'ok', 
    version: '1.0.2', 
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    server: {
      port: PORT,
      ip: IP_ADDRESS,
      cors: process.env.CORS_ORIGIN || '*'
    },
    cors: {
      origin: req.headers.origin || 'none',
      allowedOrigins: process.env.CORS_ORIGIN || '*',
      externalAccessEnabled: true
    }
  };
  
  res.status(200).json(healthData);
});

// Simple Hello World for testing
app.get(['/api', '/'], (req, res) => {
  console.log('👋 API root requested from:', req.ip, 'origin:', req.headers.origin);
  res.json({ 
    message: 'Welcome to DataCenter Manager API',
    apiVersion: '1.0.2',
    environment: NODE_ENV,
    serverTime: new Date().toISOString(),
    server: {
      ip: IP_ADDRESS,
      port: PORT
    },
    cors: {
      configured: true,
      externalAccess: true,
      allowedOrigins: process.env.CORS_ORIGIN || '*'
    },
    endpoints: {
      health: '/api/health',
      diagnostics: '/api/diagnostics/full',
      projects: '/api/projects',
      orders: '/api/orders',
      deliveryNotes: '/api/delivery-notes',
      equipment: '/api/equipment',
      incidents: '/api/incidents',
      users: '/api/users'
    }
  });
});

// Test CORS endpoint
app.get('/api/test-cors', (req, res) => {
  console.log('🧪 CORS test from:', req.ip, 'origin:', req.headers.origin);
  res.json({
    message: 'CORS test successful - External access enabled',
    origin: req.headers.origin || 'none',
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    server: {
      ip: IP_ADDRESS,
      port: PORT
    },
    corsConfig: {
      allowedOrigins: process.env.CORS_ORIGIN || '*',
      externalAccess: true
    }
  });
});

// Serve frontend in production
if (NODE_ENV === 'production') {
  // Serve static files from the dist directory (built frontend)
  app.use(express.static(path.join(__dirname, '..', 'dist')));

  // Handle SPA routing - send all requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

// Error handler middleware (must be last)
app.use(errorHandler);

// Start the server with specific IP binding
const server = app.listen(PORT, IP_ADDRESS, () => {
  console.log('🎉 Server successfully started!');
  console.log(`  📡 API URL: http://${IP_ADDRESS}:${PORT}/api`);
  console.log(`  🏥 Health: http://${IP_ADDRESS}:${PORT}/api/health`);
  console.log(`  🔍 Diagnostics: http://${IP_ADDRESS}:${PORT}/api/diagnostics/full`);
  console.log(`  🧪 CORS Test: http://${IP_ADDRESS}:${PORT}/api/test-cors`);
  console.log(`  🌍 CORS: ${process.env.CORS_ORIGIN || '*'} (External access enabled)`);
  console.log(`  📂 Uploads: http://${IP_ADDRESS}:${PORT}/uploads`);
  console.log(`  🔒 External Access: ENABLED`);
  console.log(`  📁 Max File Size: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB`);
  
  logger.info(`Server running on ${IP_ADDRESS}:${PORT} with external access enabled`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Try a different port or kill the process using this port.`);
    console.error(`   You can try: lsof -ti:${PORT} | xargs kill -9`);
    console.error(`   Or on Windows: netstat -ano | findstr :${PORT}`);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

export default app;