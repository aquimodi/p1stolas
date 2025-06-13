import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Determine if we're in development mode
  const isDev = mode === 'development';
  
  // Get API URL from environment
  const apiUrl = env.VITE_API_URL || (isDev ? '/api' : 'https://your-backend-domain.com/api');
  
  // For development, use localhost backend
  const apiBaseUrl = isDev ? 'http://localhost:3002' : null;
  
  console.log(`🔧 Vite Config [${mode.toUpperCase()}]:`);
  console.log(`   - API URL: ${apiUrl}`);
  if (isDev && apiBaseUrl) {
    console.log(`   - Proxy target: ${apiBaseUrl}`);
  }
  console.log(`   - Debug mode: ${env.VITE_DEBUG_MODE || 'false'}`);
  console.log(`   - Demo mode: ${env.VITE_DEMO_MODE || 'false'}`);
  
  const config = {
    plugins: [react()],
    
    // Optimize dependencies
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'zustand',
        'axios'
      ]
    },
    
    // Define global constants
    define: {
      // Make environment variables available to the client
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      'import.meta.env.VITE_DEBUG_MODE': JSON.stringify(env.VITE_DEBUG_MODE || 'false'),
      'import.meta.env.VITE_DEMO_MODE': JSON.stringify(env.VITE_DEMO_MODE || 'false'),
    },
    
    // Build configuration
    build: {
      // Generate sourcemaps for better debugging
      sourcemap: isDev ? true : false,
      // Optimize for production
      minify: isDev ? false : 'esbuild',
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      // Better error reporting
      reportCompressedSize: true,
      // Output configuration
      outDir: 'dist',
      assetsDir: 'assets',
      // Rollup options for better optimization
      rollupOptions: {
        output: {
          // Manual chunks for better caching
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            utils: ['zustand', 'axios', 'date-fns']
          }
        }
      }
    },
    
    // Preview configuration (for production testing)
    preview: {
      port: 4173,
      host: '0.0.0.0',
      strictPort: false
    }
  };
  
  // Development-specific configuration
  if (isDev) {
    config.server = {
      host: '0.0.0.0', // Allow external connections
      port: 5173,
      strictPort: false,
      open: false, // Don't auto-open browser
      cors: true,
      
      // Proxy configuration for development
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false, // Allow self-signed certificates
          ws: true, // Enable websocket proxying
          timeout: 30000, // 30 second timeout
          proxyTimeout: 30000,
          
          // Configure proxy event handlers
          configure: (proxy, _options) => {
            proxy.on('error', (err, req, res) => {
              console.log('🔴 Proxy error:', err.message);
              console.log('  - Request:', req.method, req.url);
              console.log('  - Target:', apiBaseUrl + req.url);
              
              // Ensure response is sent if not already sent
              if (!res.headersSent) {
                res.writeHead(503, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({
                  error: true,
                  message: 'Backend server is not available'
                }));
              }
            });
            
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              if (env.VITE_DEBUG_MODE === 'true') {
                console.log('🔶 Proxying:', req.method, req.url, '→', apiBaseUrl + req.url);
              }
            });
            
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              if (env.VITE_DEBUG_MODE === 'true') {
                console.log('🟢 Proxy response:', proxyRes.statusCode, req.url);
              }
              
              // Add CORS headers if not present
              if (!proxyRes.headers['access-control-allow-origin']) {
                proxyRes.headers['access-control-allow-origin'] = '*';
              }
            });
          },
        }
      }
    };
  }
  
  return config;
});