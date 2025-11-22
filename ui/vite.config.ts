import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env variables with VITE_ prefix
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    return {
      server: {
        port: 3003,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Expose the API key to the app
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
