// vite.config.ts
import { defineConfig, loadEnv } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDev = mode === "development";
  const ipAddress = env.IP_ADDRESS || "localhost";
  const apiUrl = env.VITE_API_URL || (isDev ? "/api" : `http://${ipAddress}:3002/api`);
  console.log(`\u{1F527} Vite Config [${mode.toUpperCase()}]:`);
  console.log(`   - IP Address: ${ipAddress}`);
  console.log(`   - API URL: ${apiUrl}`);
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
    // Build configuration for production
    build: {
      // Generate sourcemaps for better debugging in development
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
          target: `http://${ipAddress}:3002`,
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
              console.log("  - Target:", `http://${ipAddress}:3002${req.url}`);
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
                console.log("\u{1F536} Proxying:", req.method, req.url, "\u2192", `http://${ipAddress}:3002${req.url}`);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIC8vIExvYWQgZW52IHZhcmlhYmxlc1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKTtcbiAgXG4gIC8vIERldGVybWluZSBpZiB3ZSdyZSBpbiBkZXZlbG9wbWVudCBtb2RlXG4gIGNvbnN0IGlzRGV2ID0gbW9kZSA9PT0gJ2RldmVsb3BtZW50JztcbiAgXG4gIC8vIEdldCBBUEkgVVJMIGZyb20gZW52aXJvbm1lbnQgLSB1c2UgSVBfQUREUkVTUyBmb3IgcHJvZHVjdGlvblxuICBjb25zdCBpcEFkZHJlc3MgPSBlbnYuSVBfQUREUkVTUyB8fCAnbG9jYWxob3N0JztcbiAgY29uc3QgYXBpVXJsID0gZW52LlZJVEVfQVBJX1VSTCB8fCAoaXNEZXYgPyAnL2FwaScgOiBgaHR0cDovLyR7aXBBZGRyZXNzfTozMDAyL2FwaWApO1xuICBcbiAgY29uc29sZS5sb2coYFx1RDgzRFx1REQyNyBWaXRlIENvbmZpZyBbJHttb2RlLnRvVXBwZXJDYXNlKCl9XTpgKTtcbiAgY29uc29sZS5sb2coYCAgIC0gSVAgQWRkcmVzczogJHtpcEFkZHJlc3N9YCk7XG4gIGNvbnNvbGUubG9nKGAgICAtIEFQSSBVUkw6ICR7YXBpVXJsfWApO1xuICBjb25zb2xlLmxvZyhgICAgLSBEZWJ1ZyBtb2RlOiAke2Vudi5WSVRFX0RFQlVHX01PREUgfHwgJ2ZhbHNlJ31gKTtcbiAgY29uc29sZS5sb2coYCAgIC0gRGVtbyBtb2RlOiAke2Vudi5WSVRFX0RFTU9fTU9ERSB8fCAnZmFsc2UnfWApO1xuICBcbiAgY29uc3QgY29uZmlnID0ge1xuICAgIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgICBcbiAgICAvLyBPcHRpbWl6ZSBkZXBlbmRlbmNpZXNcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXG4gICAgICBpbmNsdWRlOiBbXG4gICAgICAgICdyZWFjdCcsXG4gICAgICAgICdyZWFjdC1kb20nLFxuICAgICAgICAncmVhY3Qtcm91dGVyLWRvbScsXG4gICAgICAgICd6dXN0YW5kJyxcbiAgICAgICAgJ2F4aW9zJ1xuICAgICAgXVxuICAgIH0sXG4gICAgXG4gICAgLy8gRGVmaW5lIGdsb2JhbCBjb25zdGFudHNcbiAgICBkZWZpbmU6IHtcbiAgICAgIC8vIE1ha2UgZW52aXJvbm1lbnQgdmFyaWFibGVzIGF2YWlsYWJsZSB0byB0aGUgY2xpZW50XG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfQVBJX1VSTCc6IEpTT04uc3RyaW5naWZ5KGFwaVVybCksXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfREVCVUdfTU9ERSc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX0RFQlVHX01PREUgfHwgJ2ZhbHNlJyksXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfREVNT19NT0RFJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfREVNT19NT0RFIHx8ICdmYWxzZScpLFxuICAgIH0sXG4gICAgXG4gICAgLy8gQnVpbGQgY29uZmlndXJhdGlvbiBmb3IgcHJvZHVjdGlvblxuICAgIGJ1aWxkOiB7XG4gICAgICAvLyBHZW5lcmF0ZSBzb3VyY2VtYXBzIGZvciBiZXR0ZXIgZGVidWdnaW5nIGluIGRldmVsb3BtZW50XG4gICAgICBzb3VyY2VtYXA6IGlzRGV2ID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgLy8gT3B0aW1pemUgZm9yIHByb2R1Y3Rpb25cbiAgICAgIG1pbmlmeTogaXNEZXYgPyBmYWxzZSA6ICdlc2J1aWxkJyxcbiAgICAgIC8vIENodW5rIHNpemUgd2FybmluZ3NcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgICAgIC8vIEJldHRlciBlcnJvciByZXBvcnRpbmdcbiAgICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiB0cnVlLFxuICAgICAgLy8gT3V0cHV0IGNvbmZpZ3VyYXRpb25cbiAgICAgIG91dERpcjogJ2Rpc3QnLFxuICAgICAgYXNzZXRzRGlyOiAnYXNzZXRzJyxcbiAgICAgIC8vIFJvbGx1cCBvcHRpb25zIGZvciBiZXR0ZXIgb3B0aW1pemF0aW9uXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIC8vIE1hbnVhbCBjaHVua3MgZm9yIGJldHRlciBjYWNoaW5nXG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgICB2ZW5kb3I6IFsncmVhY3QnLCAncmVhY3QtZG9tJ10sXG4gICAgICAgICAgICByb3V0ZXI6IFsncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgICAgdXRpbHM6IFsnenVzdGFuZCcsICdheGlvcycsICdkYXRlLWZucyddXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyBQcmV2aWV3IGNvbmZpZ3VyYXRpb24gKGZvciBwcm9kdWN0aW9uIHRlc3RpbmcpXG4gICAgcHJldmlldzoge1xuICAgICAgcG9ydDogNDE3MyxcbiAgICAgIGhvc3Q6ICcwLjAuMC4wJyxcbiAgICAgIHN0cmljdFBvcnQ6IGZhbHNlXG4gICAgfVxuICB9O1xuICBcbiAgLy8gRGV2ZWxvcG1lbnQtc3BlY2lmaWMgY29uZmlndXJhdGlvblxuICBpZiAoaXNEZXYpIHtcbiAgICBjb25maWcuc2VydmVyID0ge1xuICAgICAgaG9zdDogJzAuMC4wLjAnLCAvLyBBbGxvdyBleHRlcm5hbCBjb25uZWN0aW9uc1xuICAgICAgcG9ydDogNTE3MyxcbiAgICAgIHN0cmljdFBvcnQ6IGZhbHNlLFxuICAgICAgb3BlbjogZmFsc2UsIC8vIERvbid0IGF1dG8tb3BlbiBicm93c2VyXG4gICAgICBjb3JzOiB0cnVlLFxuICAgICAgXG4gICAgICAvLyBQcm94eSBjb25maWd1cmF0aW9uIGZvciBkZXZlbG9wbWVudFxuICAgICAgcHJveHk6IHtcbiAgICAgICAgJy9hcGknOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgaHR0cDovLyR7aXBBZGRyZXNzfTozMDAyYCxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgc2VjdXJlOiBmYWxzZSwgLy8gQWxsb3cgc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzXG4gICAgICAgICAgd3M6IHRydWUsIC8vIEVuYWJsZSB3ZWJzb2NrZXQgcHJveHlpbmdcbiAgICAgICAgICB0aW1lb3V0OiAzMDAwMCwgLy8gMzAgc2Vjb25kIHRpbWVvdXRcbiAgICAgICAgICBwcm94eVRpbWVvdXQ6IDMwMDAwLFxuICAgICAgICAgIFxuICAgICAgICAgIC8vIENvbmZpZ3VyZSBwcm94eSBldmVudCBoYW5kbGVyc1xuICAgICAgICAgIGNvbmZpZ3VyZTogKHByb3h5LCBfb3B0aW9ucykgPT4ge1xuICAgICAgICAgICAgcHJveHkub24oJ2Vycm9yJywgKGVyciwgcmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1x1RDgzRFx1REQzNCBQcm94eSBlcnJvcjonLCBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCcgIC0gUmVxdWVzdDonLCByZXEubWV0aG9kLCByZXEudXJsKTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJyAgLSBUYXJnZXQ6JywgYGh0dHA6Ly8ke2lwQWRkcmVzc306MzAwMiR7cmVxLnVybH1gKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIEVuc3VyZSByZXNwb25zZSBpcyBzZW50IGlmIG5vdCBhbHJlYWR5IHNlbnRcbiAgICAgICAgICAgICAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMywge1xuICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKidcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0JhY2tlbmQgc2VydmVyIGlzIG5vdCBhdmFpbGFibGUnXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcHJveHkub24oJ3Byb3h5UmVxJywgKHByb3h5UmVxLCByZXEsIF9yZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGVudi5WSVRFX0RFQlVHX01PREUgPT09ICd0cnVlJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcdUQ4M0RcdUREMzYgUHJveHlpbmc6JywgcmVxLm1ldGhvZCwgcmVxLnVybCwgJ1x1MjE5MicsIGBodHRwOi8vJHtpcEFkZHJlc3N9OjMwMDIke3JlcS51cmx9YCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBwcm94eS5vbigncHJveHlSZXMnLCAocHJveHlSZXMsIHJlcSwgX3JlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoZW52LlZJVEVfREVCVUdfTU9ERSA9PT0gJ3RydWUnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1x1RDgzRFx1REZFMiBQcm94eSByZXNwb25zZTonLCBwcm94eVJlcy5zdGF0dXNDb2RlLCByZXEudXJsKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy8gQWRkIENPUlMgaGVhZGVycyBpZiBub3QgcHJlc2VudFxuICAgICAgICAgICAgICBpZiAoIXByb3h5UmVzLmhlYWRlcnNbJ2FjY2Vzcy1jb250cm9sLWFsbG93LW9yaWdpbiddKSB7XG4gICAgICAgICAgICAgICAgcHJveHlSZXMuaGVhZGVyc1snYWNjZXNzLWNvbnRyb2wtYWxsb3ctb3JpZ2luJ10gPSAnKic7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIFxuICByZXR1cm4gY29uZmlnO1xufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLGNBQWMsZUFBZTtBQUMvUCxPQUFPLFdBQVc7QUFHbEIsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFFeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBRzNDLFFBQU0sUUFBUSxTQUFTO0FBR3ZCLFFBQU0sWUFBWSxJQUFJLGNBQWM7QUFDcEMsUUFBTSxTQUFTLElBQUksaUJBQWlCLFFBQVEsU0FBUyxVQUFVLFNBQVM7QUFFeEUsVUFBUSxJQUFJLDBCQUFtQixLQUFLLFlBQVksQ0FBQyxJQUFJO0FBQ3JELFVBQVEsSUFBSSxvQkFBb0IsU0FBUyxFQUFFO0FBQzNDLFVBQVEsSUFBSSxpQkFBaUIsTUFBTSxFQUFFO0FBQ3JDLFVBQVEsSUFBSSxvQkFBb0IsSUFBSSxtQkFBbUIsT0FBTyxFQUFFO0FBQ2hFLFVBQVEsSUFBSSxtQkFBbUIsSUFBSSxrQkFBa0IsT0FBTyxFQUFFO0FBRTlELFFBQU0sU0FBUztBQUFBLElBQ2IsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBO0FBQUEsSUFHakIsY0FBYztBQUFBLE1BQ1osU0FBUyxDQUFDLGNBQWM7QUFBQSxNQUN4QixTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFHQSxRQUFRO0FBQUE7QUFBQSxNQUVOLGdDQUFnQyxLQUFLLFVBQVUsTUFBTTtBQUFBLE1BQ3JELG1DQUFtQyxLQUFLLFVBQVUsSUFBSSxtQkFBbUIsT0FBTztBQUFBLE1BQ2hGLGtDQUFrQyxLQUFLLFVBQVUsSUFBSSxrQkFBa0IsT0FBTztBQUFBLElBQ2hGO0FBQUE7QUFBQSxJQUdBLE9BQU87QUFBQTtBQUFBLE1BRUwsV0FBVyxRQUFRLE9BQU87QUFBQTtBQUFBLE1BRTFCLFFBQVEsUUFBUSxRQUFRO0FBQUE7QUFBQSxNQUV4Qix1QkFBdUI7QUFBQTtBQUFBLE1BRXZCLHNCQUFzQjtBQUFBO0FBQUEsTUFFdEIsUUFBUTtBQUFBLE1BQ1IsV0FBVztBQUFBO0FBQUEsTUFFWCxlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUE7QUFBQSxVQUVOLGNBQWM7QUFBQSxZQUNaLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxZQUM3QixRQUFRLENBQUMsa0JBQWtCO0FBQUEsWUFDM0IsT0FBTyxDQUFDLFdBQVcsU0FBUyxVQUFVO0FBQUEsVUFDeEM7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBR0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sWUFBWTtBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBR0EsTUFBSSxPQUFPO0FBQ1QsV0FBTyxTQUFTO0FBQUEsTUFDZCxNQUFNO0FBQUE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLE1BQU07QUFBQTtBQUFBLE1BQ04sTUFBTTtBQUFBO0FBQUEsTUFHTixPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsVUFDTixRQUFRLFVBQVUsU0FBUztBQUFBLFVBQzNCLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQTtBQUFBLFVBQ1IsSUFBSTtBQUFBO0FBQUEsVUFDSixTQUFTO0FBQUE7QUFBQSxVQUNULGNBQWM7QUFBQTtBQUFBLFVBR2QsV0FBVyxDQUFDLE9BQU8sYUFBYTtBQUM5QixrQkFBTSxHQUFHLFNBQVMsQ0FBQyxLQUFLLEtBQUssUUFBUTtBQUNuQyxzQkFBUSxJQUFJLDBCQUFtQixJQUFJLE9BQU87QUFDMUMsc0JBQVEsSUFBSSxnQkFBZ0IsSUFBSSxRQUFRLElBQUksR0FBRztBQUMvQyxzQkFBUSxJQUFJLGVBQWUsVUFBVSxTQUFTLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFHL0Qsa0JBQUksQ0FBQyxJQUFJLGFBQWE7QUFDcEIsb0JBQUksVUFBVSxLQUFLO0FBQUEsa0JBQ2pCLGdCQUFnQjtBQUFBLGtCQUNoQiwrQkFBK0I7QUFBQSxnQkFDakMsQ0FBQztBQUNELG9CQUFJLElBQUksS0FBSyxVQUFVO0FBQUEsa0JBQ3JCLE9BQU87QUFBQSxrQkFDUCxTQUFTO0FBQUEsZ0JBQ1gsQ0FBQyxDQUFDO0FBQUEsY0FDSjtBQUFBLFlBQ0YsQ0FBQztBQUVELGtCQUFNLEdBQUcsWUFBWSxDQUFDLFVBQVUsS0FBSyxTQUFTO0FBQzVDLGtCQUFJLElBQUksb0JBQW9CLFFBQVE7QUFDbEMsd0JBQVEsSUFBSSx1QkFBZ0IsSUFBSSxRQUFRLElBQUksS0FBSyxVQUFLLFVBQVUsU0FBUyxRQUFRLElBQUksR0FBRyxFQUFFO0FBQUEsY0FDNUY7QUFBQSxZQUNGLENBQUM7QUFFRCxrQkFBTSxHQUFHLFlBQVksQ0FBQyxVQUFVLEtBQUssU0FBUztBQUM1QyxrQkFBSSxJQUFJLG9CQUFvQixRQUFRO0FBQ2xDLHdCQUFRLElBQUksNkJBQXNCLFNBQVMsWUFBWSxJQUFJLEdBQUc7QUFBQSxjQUNoRTtBQUdBLGtCQUFJLENBQUMsU0FBUyxRQUFRLDZCQUE2QixHQUFHO0FBQ3BELHlCQUFTLFFBQVEsNkJBQTZCLElBQUk7QUFBQSxjQUNwRDtBQUFBLFlBQ0YsQ0FBQztBQUFBLFVBQ0g7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBRUEsU0FBTztBQUNULENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
