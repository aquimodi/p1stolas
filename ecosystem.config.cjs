module.exports = {
  apps: [
    {
      name: 'datacenter-backend',
      script: './server/index.js',
      cwd: 'D:/nginx/pistolas',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
        IP_ADDRESS: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
        IP_ADDRESS: '0.0.0.0'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      // Configuración específica para Windows
      exec_mode: 'fork',
      // Reiniciar en caso de error
      min_uptime: '10s',
      max_restarts: 10,
      // Variables de entorno adicionales
      env_file: './server/.env'
    }
  ]
};