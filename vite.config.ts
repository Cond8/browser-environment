// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import * as path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@cond8/core': path.resolve(__dirname, './src/lib/cond8/_core/index.ts'),
    },
  },
  // Optimized build settings
  build: {
    target: 'es2020',
    sourcemap: true,
    minify: 'terser',
  },
  server: {
    // Remove the incorrect proxy configuration
  },
});
