import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Log error 
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Prepare response
  const errorResponse = {
    error: true,
    message: err.message || 'Error interno del servidor'
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};