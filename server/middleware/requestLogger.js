import { logger } from '../utils/logger.js';
import { getSettings } from '../utils/settings.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Process the request
  next();

  // Once the response is sent, log the request
  res.on('finish', () => {
    const { debugMode } = getSettings();
    
    // Only log details if debug mode is enabled
    if (debugMode) {
      const duration = Date.now() - start;
      const log = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent') || '-',
        body: req.method === 'GET' ? undefined : req.body
      };
      
      logger.info('API Request', log);
      
      // For extra visibility in dev tools
      if (process.env.NODE_ENV === 'development') {
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
      }
    }
  });
};