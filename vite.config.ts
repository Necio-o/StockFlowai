import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // Esto es para que el instalador funcione bien:
    base: process.env.NODE_ENV === 'development' ? '/' : './',
    server: {
      port: 3001, // <--- Forzamos a que siempre sea el 3001
      strictPort: true, 
    },
    plugins: [react()],
  };
});