// vite.config.js
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // ✅ Must match your GitHub repo name
    base: '/Maternal_Gest_front_end/',
    build: {
      chunkSizeWarningLimit: 1000,
      assetsDir: 'assets',
      outDir: 'dist',
      sourcemap: false,
    },
  };
});