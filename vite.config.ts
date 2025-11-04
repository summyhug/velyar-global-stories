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
      "story-camera": resolve(__dirname, "./StoryCamera/index.ts"),
    },
  },
  define: {
    global: 'globalThis',
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      external: (id) => {
        // Exclude Node.js modules and Capacitor plugins from the bundle
        const nodeModules = ['path', 'fs', 'os', 'crypto', 'tailwindcss-animate'];
        const capacitorPlugins = [
          '@capacitor/app',
          '@capacitor/device',
          '@capacitor/push-notifications',
          '@capacitor/status-bar'
        ];
        return nodeModules.includes(id) || capacitorPlugins.some(plugin => id.startsWith(plugin));
      }
    }
  }
}));
