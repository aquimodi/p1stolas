// vite.config.ts
import { defineConfig, loadEnv } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDev = mode === "development";
  const apiUrl = env.VITE_API_URL || (isDev ? "/api" : "https://your-backend-domain.com/api");
  const apiBaseUrl = isDev ? "http://localhost:3002" : null;
  console.log(`\u{1F527} Vite Config [${mode.toUpperCase()}]:`);
  console.log(`   - API URL: ${apiUrl}`);
  if (isDev && apiBaseUrl) {
    console.log(`   - Proxy target: ${apiBaseUrl}`);
  }
  console.log(`   - Debug mode: ${env.VITE_DEBUG_MODE || "false"}`);
  console.log(`   - Demo mode: ${env.VITE_DEMO_MODE || "false"}`);
  const config = {
    plugins: [react()],
    // Optimize dependencies
    optimizeDeps: {
      exclude: ["lucide-react"],
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "zustand",
        "axios"
      ]
    },
    // Define global constants
    define: {
      // Make environment variables available to the client
      "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl),
      "import.meta.env.VITE_DEBUG_MODE": JSON.stringify(env.VITE_DEBUG_MODE || "false"),
      "import.meta.env.VITE_DEMO_MODE": JSON.stringify(env.VITE_DEMO_MODE || "false")
    },
    // Build configuration
    build: {
      // Generate sourcemaps for better debugging
      sourcemap: isDev ? true : false,
      // Optimize for production
      minify: isDev ? false : "esbuild",
      // Chunk size warnings
      chunkSizeWarningLimit: 1e3,
      // Better error reporting
      reportCompressedSize: true,
      // Output configuration
      outDir: "dist",
      assetsDir: "assets",
      // Rollup options for better optimization
      rollupOptions: {
        output: {
          // Manual chunks for better caching
          manualChunks: {
            vendor: ["react", "react-dom"],
            router: ["react-router-dom"],
            utils: ["zustand", "axios", "date-fns"]
          }
        }
      }
    },
    // Preview configuration (for production testing)
    preview: {
      port: 4173,
      host: "0.0.0.0",
      strictPort: false
    }
  };
  if (isDev) {
    config.server = {
      host: "0.0.0.0",
      // Allow external connections
      port: 5173,
      strictPort: false,
      open: false,
      // Don't auto-open browser
      cors: true,
      // Proxy configuration for development
      proxy: {
        "/api": {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
          // Allow self-signed certificates
          ws: true,
          // Enable websocket proxying
          timeout: 3e4,
          // 30 second timeout
          proxyTimeout: 3e4,
          // Configure proxy event handlers
          configure: (proxy, _options) => {
            proxy.on("error", (err, req, res) => {
              console.log("\u{1F534} Proxy error:", err.message);
              console.log("  - Request:", req.method, req.url);
              console.log("  - Target:", apiBaseUrl + req.url);
              if (!res.headersSent) {
                res.writeHead(503, {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*"
                });
                res.end(JSON.stringify({
                  error: true,
                  message: "Backend server is not available"
                }));
              }
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              if (env.VITE_DEBUG_MODE === "true") {
                console.log("\u{1F536} Proxying:", req.method, req.url, "\u2192", apiBaseUrl + req.url);
              }
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              if (env.VITE_DEBUG_MODE === "true") {
                console.log("\u{1F7E2} Proxy response:", proxyRes.statusCode, req.url);
              }
              if (!proxyRes.headers["access-control-allow-origin"]) {
                proxyRes.headers["access-control-allow-origin"] = "*";
              }
            });
          }
        }
      }
    };
  }
  return config;
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIC8vIExvYWQgZW52IHZhcmlhYmxlc1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKTtcbiAgXG4gIC8vIERldGVybWluZSBpZiB3ZSdyZSBpbiBkZXZlbG9wbWVudCBtb2RlXG4gIGNvbnN0IGlzRGV2ID0gbW9kZSA9PT0gJ2RldmVsb3BtZW50JztcbiAgXG4gIC8vIEdldCBBUEkgVVJMIGZyb20gZW52aXJvbm1lbnRcbiAgY29uc3QgYXBpVXJsID0gZW52LlZJVEVfQVBJX1VSTCB8fCAoaXNEZXYgPyAnL2FwaScgOiAnaHR0cHM6Ly95b3VyLWJhY2tlbmQtZG9tYWluLmNvbS9hcGknKTtcbiAgXG4gIC8vIEZvciBkZXZlbG9wbWVudCwgdXNlIGxvY2FsaG9zdCBiYWNrZW5kXG4gIGNvbnN0IGFwaUJhc2VVcmwgPSBpc0RldiA/ICdodHRwOi8vbG9jYWxob3N0OjMwMDInIDogbnVsbDtcbiAgXG4gIGNvbnNvbGUubG9nKGBcdUQ4M0RcdUREMjcgVml0ZSBDb25maWcgWyR7bW9kZS50b1VwcGVyQ2FzZSgpfV06YCk7XG4gIGNvbnNvbGUubG9nKGAgICAtIEFQSSBVUkw6ICR7YXBpVXJsfWApO1xuICBpZiAoaXNEZXYgJiYgYXBpQmFzZVVybCkge1xuICAgIGNvbnNvbGUubG9nKGAgICAtIFByb3h5IHRhcmdldDogJHthcGlCYXNlVXJsfWApO1xuICB9XG4gIGNvbnNvbGUubG9nKGAgICAtIERlYnVnIG1vZGU6ICR7ZW52LlZJVEVfREVCVUdfTU9ERSB8fCAnZmFsc2UnfWApO1xuICBjb25zb2xlLmxvZyhgICAgLSBEZW1vIG1vZGU6ICR7ZW52LlZJVEVfREVNT19NT0RFIHx8ICdmYWxzZSd9YCk7XG4gIFxuICBjb25zdCBjb25maWcgPSB7XG4gICAgcGx1Z2luczogW3JlYWN0KCldLFxuICAgIFxuICAgIC8vIE9wdGltaXplIGRlcGVuZGVuY2llc1xuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgICAgIGluY2x1ZGU6IFtcbiAgICAgICAgJ3JlYWN0JyxcbiAgICAgICAgJ3JlYWN0LWRvbScsXG4gICAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcbiAgICAgICAgJ3p1c3RhbmQnLFxuICAgICAgICAnYXhpb3MnXG4gICAgICBdXG4gICAgfSxcbiAgICBcbiAgICAvLyBEZWZpbmUgZ2xvYmFsIGNvbnN0YW50c1xuICAgIGRlZmluZToge1xuICAgICAgLy8gTWFrZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgYXZhaWxhYmxlIHRvIHRoZSBjbGllbnRcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9BUElfVVJMJzogSlNPTi5zdHJpbmdpZnkoYXBpVXJsKSxcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9ERUJVR19NT0RFJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfREVCVUdfTU9ERSB8fCAnZmFsc2UnKSxcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9ERU1PX01PREUnOiBKU09OLnN0cmluZ2lmeShlbnYuVklURV9ERU1PX01PREUgfHwgJ2ZhbHNlJyksXG4gICAgfSxcbiAgICBcbiAgICAvLyBCdWlsZCBjb25maWd1cmF0aW9uXG4gICAgYnVpbGQ6IHtcbiAgICAgIC8vIEdlbmVyYXRlIHNvdXJjZW1hcHMgZm9yIGJldHRlciBkZWJ1Z2dpbmdcbiAgICAgIHNvdXJjZW1hcDogaXNEZXYgPyB0cnVlIDogZmFsc2UsXG4gICAgICAvLyBPcHRpbWl6ZSBmb3IgcHJvZHVjdGlvblxuICAgICAgbWluaWZ5OiBpc0RldiA/IGZhbHNlIDogJ2VzYnVpbGQnLFxuICAgICAgLy8gQ2h1bmsgc2l6ZSB3YXJuaW5nc1xuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgICAgLy8gQmV0dGVyIGVycm9yIHJlcG9ydGluZ1xuICAgICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IHRydWUsXG4gICAgICAvLyBPdXRwdXQgY29uZmlndXJhdGlvblxuICAgICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgICBhc3NldHNEaXI6ICdhc3NldHMnLFxuICAgICAgLy8gUm9sbHVwIG9wdGlvbnMgZm9yIGJldHRlciBvcHRpbWl6YXRpb25cbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgLy8gTWFudWFsIGNodW5rcyBmb3IgYmV0dGVyIGNhY2hpbmdcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgIHZlbmRvcjogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcbiAgICAgICAgICAgIHJvdXRlcjogWydyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgICB1dGlsczogWyd6dXN0YW5kJywgJ2F4aW9zJywgJ2RhdGUtZm5zJ11cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIFByZXZpZXcgY29uZmlndXJhdGlvbiAoZm9yIHByb2R1Y3Rpb24gdGVzdGluZylcbiAgICBwcmV2aWV3OiB7XG4gICAgICBwb3J0OiA0MTczLFxuICAgICAgaG9zdDogJzAuMC4wLjAnLFxuICAgICAgc3RyaWN0UG9ydDogZmFsc2VcbiAgICB9XG4gIH07XG4gIFxuICAvLyBEZXZlbG9wbWVudC1zcGVjaWZpYyBjb25maWd1cmF0aW9uXG4gIGlmIChpc0Rldikge1xuICAgIGNvbmZpZy5zZXJ2ZXIgPSB7XG4gICAgICBob3N0OiAnMC4wLjAuMCcsIC8vIEFsbG93IGV4dGVybmFsIGNvbm5lY3Rpb25zXG4gICAgICBwb3J0OiA1MTczLFxuICAgICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gICAgICBvcGVuOiBmYWxzZSwgLy8gRG9uJ3QgYXV0by1vcGVuIGJyb3dzZXJcbiAgICAgIGNvcnM6IHRydWUsXG4gICAgICBcbiAgICAgIC8vIFByb3h5IGNvbmZpZ3VyYXRpb24gZm9yIGRldmVsb3BtZW50XG4gICAgICBwcm94eToge1xuICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGFwaUJhc2VVcmwsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHNlY3VyZTogZmFsc2UsIC8vIEFsbG93IHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlc1xuICAgICAgICAgIHdzOiB0cnVlLCAvLyBFbmFibGUgd2Vic29ja2V0IHByb3h5aW5nXG4gICAgICAgICAgdGltZW91dDogMzAwMDAsIC8vIDMwIHNlY29uZCB0aW1lb3V0XG4gICAgICAgICAgcHJveHlUaW1lb3V0OiAzMDAwMCxcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBDb25maWd1cmUgcHJveHkgZXZlbnQgaGFuZGxlcnNcbiAgICAgICAgICBjb25maWd1cmU6IChwcm94eSwgX29wdGlvbnMpID0+IHtcbiAgICAgICAgICAgIHByb3h5Lm9uKCdlcnJvcicsIChlcnIsIHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcdUQ4M0RcdUREMzQgUHJveHkgZXJyb3I6JywgZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnICAtIFJlcXVlc3Q6JywgcmVxLm1ldGhvZCwgcmVxLnVybCk7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCcgIC0gVGFyZ2V0OicsIGFwaUJhc2VVcmwgKyByZXEudXJsKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIEVuc3VyZSByZXNwb25zZSBpcyBzZW50IGlmIG5vdCBhbHJlYWR5IHNlbnRcbiAgICAgICAgICAgICAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMywge1xuICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKidcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0JhY2tlbmQgc2VydmVyIGlzIG5vdCBhdmFpbGFibGUnXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcHJveHkub24oJ3Byb3h5UmVxJywgKHByb3h5UmVxLCByZXEsIF9yZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGVudi5WSVRFX0RFQlVHX01PREUgPT09ICd0cnVlJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcdUQ4M0RcdUREMzYgUHJveHlpbmc6JywgcmVxLm1ldGhvZCwgcmVxLnVybCwgJ1x1MjE5MicsIGFwaUJhc2VVcmwgKyByZXEudXJsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcycsIChwcm94eVJlcywgcmVxLCBfcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChlbnYuVklURV9ERUJVR19NT0RFID09PSAndHJ1ZScpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnXHVEODNEXHVERkUyIFByb3h5IHJlc3BvbnNlOicsIHByb3h5UmVzLnN0YXR1c0NvZGUsIHJlcS51cmwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyBBZGQgQ09SUyBoZWFkZXJzIGlmIG5vdCBwcmVzZW50XG4gICAgICAgICAgICAgIGlmICghcHJveHlSZXMuaGVhZGVyc1snYWNjZXNzLWNvbnRyb2wtYWxsb3ctb3JpZ2luJ10pIHtcbiAgICAgICAgICAgICAgICBwcm94eVJlcy5oZWFkZXJzWydhY2Nlc3MtY29udHJvbC1hbGxvdy1vcmlnaW4nXSA9ICcqJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cbiAgXG4gIHJldHVybiBjb25maWc7XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsY0FBYyxlQUFlO0FBQy9QLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUV4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFHM0MsUUFBTSxRQUFRLFNBQVM7QUFHdkIsUUFBTSxTQUFTLElBQUksaUJBQWlCLFFBQVEsU0FBUztBQUdyRCxRQUFNLGFBQWEsUUFBUSwwQkFBMEI7QUFFckQsVUFBUSxJQUFJLDBCQUFtQixLQUFLLFlBQVksQ0FBQyxJQUFJO0FBQ3JELFVBQVEsSUFBSSxpQkFBaUIsTUFBTSxFQUFFO0FBQ3JDLE1BQUksU0FBUyxZQUFZO0FBQ3ZCLFlBQVEsSUFBSSxzQkFBc0IsVUFBVSxFQUFFO0FBQUEsRUFDaEQ7QUFDQSxVQUFRLElBQUksb0JBQW9CLElBQUksbUJBQW1CLE9BQU8sRUFBRTtBQUNoRSxVQUFRLElBQUksbUJBQW1CLElBQUksa0JBQWtCLE9BQU8sRUFBRTtBQUU5RCxRQUFNLFNBQVM7QUFBQSxJQUNiLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQTtBQUFBLElBR2pCLGNBQWM7QUFBQSxNQUNaLFNBQVMsQ0FBQyxjQUFjO0FBQUEsTUFDeEIsU0FBUztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBR0EsUUFBUTtBQUFBO0FBQUEsTUFFTixnQ0FBZ0MsS0FBSyxVQUFVLE1BQU07QUFBQSxNQUNyRCxtQ0FBbUMsS0FBSyxVQUFVLElBQUksbUJBQW1CLE9BQU87QUFBQSxNQUNoRixrQ0FBa0MsS0FBSyxVQUFVLElBQUksa0JBQWtCLE9BQU87QUFBQSxJQUNoRjtBQUFBO0FBQUEsSUFHQSxPQUFPO0FBQUE7QUFBQSxNQUVMLFdBQVcsUUFBUSxPQUFPO0FBQUE7QUFBQSxNQUUxQixRQUFRLFFBQVEsUUFBUTtBQUFBO0FBQUEsTUFFeEIsdUJBQXVCO0FBQUE7QUFBQSxNQUV2QixzQkFBc0I7QUFBQTtBQUFBLE1BRXRCLFFBQVE7QUFBQSxNQUNSLFdBQVc7QUFBQTtBQUFBLE1BRVgsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBO0FBQUEsVUFFTixjQUFjO0FBQUEsWUFDWixRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsWUFDN0IsUUFBUSxDQUFDLGtCQUFrQjtBQUFBLFlBQzNCLE9BQU8sQ0FBQyxXQUFXLFNBQVMsVUFBVTtBQUFBLFVBQ3hDO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUdBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUdBLE1BQUksT0FBTztBQUNULFdBQU8sU0FBUztBQUFBLE1BQ2QsTUFBTTtBQUFBO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixNQUFNO0FBQUE7QUFBQSxNQUNOLE1BQU07QUFBQTtBQUFBLE1BR04sT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFVBQ04sUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFVBQ2QsUUFBUTtBQUFBO0FBQUEsVUFDUixJQUFJO0FBQUE7QUFBQSxVQUNKLFNBQVM7QUFBQTtBQUFBLFVBQ1QsY0FBYztBQUFBO0FBQUEsVUFHZCxXQUFXLENBQUMsT0FBTyxhQUFhO0FBQzlCLGtCQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUssS0FBSyxRQUFRO0FBQ25DLHNCQUFRLElBQUksMEJBQW1CLElBQUksT0FBTztBQUMxQyxzQkFBUSxJQUFJLGdCQUFnQixJQUFJLFFBQVEsSUFBSSxHQUFHO0FBQy9DLHNCQUFRLElBQUksZUFBZSxhQUFhLElBQUksR0FBRztBQUcvQyxrQkFBSSxDQUFDLElBQUksYUFBYTtBQUNwQixvQkFBSSxVQUFVLEtBQUs7QUFBQSxrQkFDakIsZ0JBQWdCO0FBQUEsa0JBQ2hCLCtCQUErQjtBQUFBLGdCQUNqQyxDQUFDO0FBQ0Qsb0JBQUksSUFBSSxLQUFLLFVBQVU7QUFBQSxrQkFDckIsT0FBTztBQUFBLGtCQUNQLFNBQVM7QUFBQSxnQkFDWCxDQUFDLENBQUM7QUFBQSxjQUNKO0FBQUEsWUFDRixDQUFDO0FBRUQsa0JBQU0sR0FBRyxZQUFZLENBQUMsVUFBVSxLQUFLLFNBQVM7QUFDNUMsa0JBQUksSUFBSSxvQkFBb0IsUUFBUTtBQUNsQyx3QkFBUSxJQUFJLHVCQUFnQixJQUFJLFFBQVEsSUFBSSxLQUFLLFVBQUssYUFBYSxJQUFJLEdBQUc7QUFBQSxjQUM1RTtBQUFBLFlBQ0YsQ0FBQztBQUVELGtCQUFNLEdBQUcsWUFBWSxDQUFDLFVBQVUsS0FBSyxTQUFTO0FBQzVDLGtCQUFJLElBQUksb0JBQW9CLFFBQVE7QUFDbEMsd0JBQVEsSUFBSSw2QkFBc0IsU0FBUyxZQUFZLElBQUksR0FBRztBQUFBLGNBQ2hFO0FBR0Esa0JBQUksQ0FBQyxTQUFTLFFBQVEsNkJBQTZCLEdBQUc7QUFDcEQseUJBQVMsUUFBUSw2QkFBNkIsSUFBSTtBQUFBLGNBQ3BEO0FBQUEsWUFDRixDQUFDO0FBQUEsVUFDSDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQ1QsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
