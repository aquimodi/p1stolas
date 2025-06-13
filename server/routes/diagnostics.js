import express from 'express';
import { getConnection, executeQuery } from '../utils/dbConnector.js';
import { getSettings } from '../utils/settings.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Diagnóstico completo del sistema
router.get('/full', async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    settings: {},
    environment: {},
    database: {},
    endpoints: {},
    errors: []
  };

  try {
    // 1. Verificar configuración
    logger.info('🔍 Starting full system diagnostics...');
    
    try {
      diagnostics.settings = getSettings();
      logger.info('✅ Settings loaded successfully');
    } catch (error) {
      logger.error('❌ Error loading settings:', error);
      diagnostics.errors.push({
        component: 'settings',
        error: error.message
      });
    }

    // 2. Verificar variables de entorno
    diagnostics.environment = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DB_SERVER: process.env.VITE_DB_SERVER ? '✅ Set' : '❌ Missing',
      DB_NAME: process.env.VITE_DB_NAME ? '✅ Set' : '❌ Missing',
      DB_USER: process.env.VITE_DB_USER ? '✅ Set' : '❌ Missing',
      DB_PASSWORD: process.env.VITE_DB_PASSWORD ? '✅ Set' : '❌ Missing',
      DB_PORT: process.env.VITE_DB_PORT || 'Not set',
      DB_ENCRYPT: process.env.VITE_DB_ENCRYPT || 'Not set'
    };

    // 3. Verificar conexión a la base de datos
    if (!diagnostics.settings.demoMode) {
      try {
        logger.info('🔍 Testing database connection...');
        const connection = await getConnection();
        
        if (connection) {
          diagnostics.database.connection = '✅ Connected';
          
          // Probar consulta básica
          try {
            const testQuery = 'SELECT 1 as test';
            const result = await executeQuery(testQuery);
            diagnostics.database.query = '✅ Query successful';
            diagnostics.database.testResult = result;
          } catch (queryError) {
            logger.error('❌ Database query failed:', queryError);
            diagnostics.database.query = '❌ Query failed';
            diagnostics.database.queryError = queryError.message;
            diagnostics.errors.push({
              component: 'database_query',
              error: queryError.message
            });
          }

          // Verificar tablas principales
          try {
            const tablesQuery = `
              SELECT TABLE_NAME 
              FROM INFORMATION_SCHEMA.TABLES 
              WHERE TABLE_TYPE = 'BASE TABLE' 
              AND TABLE_NAME IN ('Projects', 'Orders', 'DeliveryNotes', 'Equipments', 'EstimatedEquipments', 'Users')
              ORDER BY TABLE_NAME
            `;
            const tables = await executeQuery(tablesQuery);
            diagnostics.database.tables = tables.map(t => t.TABLE_NAME);
            logger.info('✅ Database tables verified:', diagnostics.database.tables);

            // Contar registros en cada tabla
            diagnostics.database.counts = {};
            for (const table of diagnostics.database.tables) {
              try {
                const countQuery = `SELECT COUNT(*) as count FROM ${table.TABLE_NAME}`;
                const countResult = await executeQuery(countQuery);
                diagnostics.database.counts[table.TABLE_NAME] = countResult[0].count;
              } catch (countError) {
                diagnostics.database.counts[table.TABLE_NAME] = 'Error: ' + countError.message;
              }
            }
          } catch (tablesError) {
            logger.error('❌ Error checking tables:', tablesError);
            diagnostics.database.tables = 'Error: ' + tablesError.message;
            diagnostics.errors.push({
              component: 'database_tables',
              error: tablesError.message
            });
          }
        } else {
          diagnostics.database.connection = '❌ Connection failed';
          diagnostics.errors.push({
            component: 'database_connection',
            error: 'No connection object returned'
          });
        }
      } catch (dbError) {
        logger.error('❌ Database connection error:', dbError);
        diagnostics.database.connection = '❌ Connection error';
        diagnostics.database.error = dbError.message;
        diagnostics.errors.push({
          component: 'database_connection',
          error: dbError.message
        });
      }
    } else {
      diagnostics.database.connection = '⚠️ Demo mode - No real DB connection';
    }

    // 4. Verificar endpoints principales
    diagnostics.endpoints = {
      '/api/health': '✅ Available (you\'re using it now)',
      '/api/projects': 'Testing...',
      '/api/orders': 'Testing...',
      '/api/delivery-notes': 'Testing...',
      '/api/equipment': 'Testing...',
      '/api/incidents': 'Testing...',
      '/api/users': 'Testing...'
    };

    // Probar endpoint de proyectos
    try {
      if (!diagnostics.settings.demoMode) {
        const projectsQuery = 'SELECT COUNT(*) as count FROM Projects';
        const projectsResult = await executeQuery(projectsQuery);
        diagnostics.endpoints['/api/projects'] = `✅ Available (${projectsResult[0].count} records)`;
      } else {
        diagnostics.endpoints['/api/projects'] = '⚠️ Demo mode - Using sample data';
      }
    } catch (error) {
      diagnostics.endpoints['/api/projects'] = '❌ Error: ' + error.message;
      diagnostics.errors.push({
        component: 'projects_endpoint',
        error: error.message
      });
    }

    // Log final results
    logger.info('🎯 Diagnostics completed');
    logger.info('Settings mode:', diagnostics.settings.demoMode ? 'DEMO' : 'PRODUCTION');
    logger.info('Database connection:', diagnostics.database.connection);
    logger.info('Total errors found:', diagnostics.errors.length);

    res.json(diagnostics);
  } catch (error) {
    logger.error('❌ Critical error during diagnostics:', error);
    diagnostics.errors.push({
      component: 'diagnostics_system',
      error: error.message
    });
    res.status(500).json(diagnostics);
  }
});

// Test específico de conectividad a la base de datos
router.get('/database', async (req, res) => {
  try {
    const settings = getSettings();
    
    if (settings.demoMode) {
      return res.json({
        status: 'demo_mode',
        message: 'Running in demo mode - no real database connection'
      });
    }

    logger.info('🔍 Testing database connectivity...');
    
    const connection = await getConnection();
    
    if (!connection) {
      throw new Error('Failed to get database connection');
    }

    // Test basic query
    const result = await executeQuery('SELECT GETDATE() as server_time, @@VERSION as server_version');
    
    logger.info('✅ Database test successful');
    
    res.json({
      status: 'success',
      message: 'Database connection successful',
      server_time: result[0].server_time,
      server_version: result[0].server_version.substring(0, 100) + '...'
    });
    
  } catch (error) {
    logger.error('❌ Database test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      config: {
        server: process.env.VITE_DB_SERVER ? 'Set' : 'Missing',
        database: process.env.VITE_DB_NAME ? 'Set' : 'Missing',
        user: process.env.VITE_DB_USER ? 'Set' : 'Missing',
        password: process.env.VITE_DB_PASSWORD ? 'Set' : 'Missing'
      }
    });
  }
});

// Test de todos los endpoints principales
router.get('/endpoints', async (req, res) => {
  const endpoints = {};
  const settings = getSettings();

  try {
    // Test Projects endpoint
    try {
      if (!settings.demoMode) {
        const projectsResult = await executeQuery('SELECT COUNT(*) as count FROM Projects');
        endpoints.projects = {
          status: 'success',
          count: projectsResult[0].count,
          message: `Found ${projectsResult[0].count} projects`
        };
      } else {
        endpoints.projects = {
          status: 'demo',
          message: 'Demo mode - using sample data'
        };
      }
    } catch (error) {
      endpoints.projects = {
        status: 'error',
        error: error.message
      };
    }

    // Test Orders endpoint
    try {
      if (!settings.demoMode) {
        const ordersResult = await executeQuery('SELECT COUNT(*) as count FROM Orders');
        endpoints.orders = {
          status: 'success',
          count: ordersResult[0].count,
          message: `Found ${ordersResult[0].count} orders`
        };
      } else {
        endpoints.orders = {
          status: 'demo',
          message: 'Demo mode - using sample data'
        };
      }
    } catch (error) {
      endpoints.orders = {
        status: 'error',
        error: error.message
      };
    }

    // Test DeliveryNotes endpoint
    try {
      if (!settings.demoMode) {
        const notesResult = await executeQuery('SELECT COUNT(*) as count FROM DeliveryNotes');
        endpoints.deliveryNotes = {
          status: 'success',
          count: notesResult[0].count,
          message: `Found ${notesResult[0].count} delivery notes`
        };
      } else {
        endpoints.deliveryNotes = {
          status: 'demo',
          message: 'Demo mode - using sample data'
        };
      }
    } catch (error) {
      endpoints.deliveryNotes = {
        status: 'error',
        error: error.message
      };
    }

    res.json({
      mode: settings.demoMode ? 'demo' : 'production',
      endpoints
    });

  } catch (error) {
    logger.error('❌ Endpoints test failed:', error);
    res.status(500).json({
      error: 'Failed to test endpoints',
      message: error.message
    });
  }
});

export default router;