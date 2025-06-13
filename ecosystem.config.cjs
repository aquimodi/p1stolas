module.exports = {
  apps: [
    {
      name: 'datacenter-api',
      script: 'server/index.js',
      cwd: 'D:/inetpub/pistolas',
      exec_mode: 'cluster',
      instances: 'max',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
        IP_ADDRESS: process.env.IP_ADDRESS || '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3002,
        IP_ADDRESS: process.env.IP_ADDRESS || '0.0.0.0',
        JWT_SECRET: process.env.JWT_SECRET || 'datacenter-app-secret-key',
        DB_SERVER: process.env.DB_SERVER,
        DB_NAME: process.env.DB_NAME || 'QEIS1DAT',
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_PORT: process.env.DB_PORT || '1433',
        DB_ENCRYPT: process.env.DB_ENCRYPT || 'true',
        MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
        MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '10485760'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      error_file: 'D:/inetpub/pistolas/logs/pm2/error.log',
      out_file: 'D:/inetpub/pistolas/logs/pm2/output.log'
    }
  ]
};