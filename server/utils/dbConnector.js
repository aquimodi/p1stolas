import sql from 'mssql';
import { logger } from './logger.js';
import { getSettings } from './settings.js';

// Pool configuration
let pool = null;

// Create a new connection pool
const createPool = async () => {
  const { demoMode } = getSettings();
  
  // If demo mode is enabled, don't create actual DB connection
  if (demoMode) {
    logger.info('🟡 Running in demo mode - no actual DB connection established');
    return null;
  }
  
  // Validate required environment variables (using correct backend variable names)
  const requiredVars = ['DB_SERVER', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: true,
      connectTimeout: 30000,
      requestTimeout: 30000
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
  
  try {
    logger.info('🔌 Creating new SQL connection pool...');
    logger.info(`📊 Connecting to database: ${config.database} on ${config.server}:${config.port}`);
    
    const newPool = await new sql.ConnectionPool(config).connect();
    
    // Log success but don't expose connection details
    logger.info(`✅ Connected to database ${config.database} on ${config.server}`);
    
    // Test the connection
    const testResult = await newPool.request().query('SELECT 1 as test');
    logger.info('✅ Database connection test successful');
    
    return newPool;
  } catch (error) {
    logger.error('❌ Error creating connection pool:', {
      message: error.message,
      code: error.code,
      server: config.server,
      database: config.database,
      port: config.port
    });
    throw error;
  }
};

// Get connection from the pool
export const getConnection = async () => {
  const { demoMode } = getSettings();
  
  // In demo mode, return null
  if (demoMode) {
    logger.debug('🟡 Demo mode: returning null connection');
    return null;
  }
  
  // Create a new pool if needed
  if (!pool) {
    logger.info('🔌 No existing pool, creating new connection...');
    pool = await createPool();
  } else if (!pool.connected) {
    logger.warn('⚠️ Pool disconnected, recreating connection...');
    try {
      await pool.close();
    } catch (error) {
      logger.warn('Warning: Error closing disconnected pool:', error.message);
    }
    pool = await createPool();
  }
  
  return pool;
};

// Close the connection pool
export const closePool = async () => {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      logger.info('✅ SQL connection pool closed');
    } catch (error) {
      logger.error('❌ Error closing connection pool:', error);
      throw error;
    }
  }
};

// Execute a SQL query
export const executeQuery = async (query, params = []) => {
  const { demoMode } = getSettings();
  
  // In demo mode, return mock data
  if (demoMode) {
    logger.info('🟡 Demo mode: Skipping actual DB query', { query: query.substring(0, 100) + '...' });
    return [];
  }
  
  logger.debug('📊 Executing query:', { query: query.substring(0, 100) + '...' });
  
  const connection = await getConnection();
  
  if (!connection) {
    throw new Error('No database connection available');
  }
  
  const request = connection.request();
  
  // Add parameters to request
  params.forEach((param, index) => {
    request.input(`param${index}`, param);
    logger.debug(`📊 Query parameter ${index}:`, param);
  });
  
  try {
    const result = await request.query(query);
    logger.debug('✅ Query executed successfully, rows returned:', result.recordset?.length || 0);
    return result.recordset;
  } catch (error) {
    logger.error('❌ Error executing query:', {
      message: error.message,
      query: query.substring(0, 100) + '...',
      params: params
    });
    throw error;
  }
};

// Execute a stored procedure
export const executeStoredProcedure = async (procedureName, params = {}) => {
  const { demoMode } = getSettings();
  
  // In demo mode, return mock data
  if (demoMode) {
    logger.info('🟡 Demo mode: Skipping stored procedure execution', { procedureName });
    return [{ Id: 'demo-id-' + Date.now() }];
  }
  
  logger.debug('📊 Executing stored procedure:', procedureName);
  
  const connection = await getConnection();
  
  if (!connection) {
    throw new Error('No database connection available');
  }
  
  const request = connection.request();
  
  // Add parameters to request
  Object.entries(params).forEach(([key, value]) => {
    request.input(key, value);
    logger.debug(`📊 SP parameter ${key}:`, value);
  });
  
  try {
    const result = await request.execute(procedureName);
    logger.debug('✅ Stored procedure executed successfully');
    return result.recordset;
  } catch (error) {
    logger.error('❌ Error executing stored procedure:', {
      message: error.message,
      procedure: procedureName,
      params: params
    });
    throw error;
  }
};

// Execute a transaction
export const executeTransaction = async (queries = []) => {
  const { demoMode } = getSettings();
  
  // In demo mode, don't execute transaction
  if (demoMode) {
    logger.info('🟡 Demo mode: Skipping transaction execution', { queryCount: queries.length });
    return;
  }
  
  logger.debug('📊 Executing transaction with', queries.length, 'queries');
  
  const connection = await getConnection();
  
  if (!connection) {
    throw new Error('No database connection available');
  }
  
  const transaction = new sql.Transaction(connection);
  
  try {
    await transaction.begin();
    logger.debug('📊 Transaction started');
    
    for (const query of queries) {
      await transaction.request().query(query);
    }
    
    await transaction.commit();
    logger.debug('✅ Transaction committed successfully');
  } catch (error) {
    await transaction.rollback();
    logger.error('❌ Transaction error, rolled back:', error);
    throw error;
  }
};