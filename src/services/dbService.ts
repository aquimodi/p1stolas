import sql from 'mssql';

const config = {
  server: import.meta.env.VITE_DB_SERVER,
  database: import.meta.env.VITE_DB_NAME,
  user: import.meta.env.VITE_DB_USER,
  password: import.meta.env.VITE_DB_PASSWORD,
  port: Number(import.meta.env.VITE_DB_PORT),
  options: {
    encrypt: import.meta.env.VITE_DB_ENCRYPT === 'true',
    trustServerCertificate: true
  }
};

let pool: sql.ConnectionPool | null = null;

export const getConnection = async (): Promise<sql.ConnectionPool> => {
  try {
    if (pool) {
      return pool;
    }
    
    pool = await new sql.ConnectionPool(config).connect();
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

// Example query function
export const executeQuery = async <T>(query: string, params?: any[]): Promise<T[]> => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }
    
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
};

// Example stored procedure function
export const executeStoredProcedure = async <T>(
  procedureName: string, 
  params?: { [key: string]: any }
): Promise<T[]> => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }
    
    const result = await request.execute(procedureName);
    return result.recordset;
  } catch (error) {
    console.error('Stored procedure execution error:', error);
    throw error;
  }
};

// Example transaction function
export const executeTransaction = async (queries: string[]): Promise<void> => {
  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    for (const query of queries) {
      await transaction.request().query(query);
    }
    
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('Transaction error:', error);
    throw error;
  }
};