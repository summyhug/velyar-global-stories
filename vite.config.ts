import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      external: (id) => {
        // Only exclude Node.js modules from the bundle - keep Capacitor plugins bundled
        const nodeModules = ['path', 'fs', 'os', 'crypto'];
        return nodeModules.includes(id);
      }
    }
  }
}));
