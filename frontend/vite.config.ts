import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/react(?:-dom|-router-dom)?[\\/]/.test(id)) return 'react-vendor';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('socket.io-client') || id.includes('qrcode.react') || id.includes('canvas-confetti')) return 'checkout-vendor';
          return undefined;
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true
      }
    }
  }
});
