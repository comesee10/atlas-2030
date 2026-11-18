import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  base: '/atlas-2030/pet/dist/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    modulePreload: false,
    target: 'es2020',
    rollupOptions: {
      input: fileURLToPath(new URL('src/main.tsx', import.meta.url)),
      output: {
        entryFileNames: 'pet.js',
        chunkFileNames: 'pet-[name].[hash].js',
        assetFileNames: 'pet.[ext]',
        format: 'es',
        manualChunks(id) {
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
        }
      }
    }
  }
});
