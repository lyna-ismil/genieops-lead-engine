import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                // Only used if VITE_API_BASE_URL is empty/undefined
            },
            '/public': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            }
        }
      },
      plugins: [react()],
      define: {
        // Removed secrets
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
