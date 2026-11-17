import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: fileURLToPath(new URL('src/main.tsx', import.meta.url)),
      output: {
        entryFileNames: 'pet.js',
        assetFileNames: 'pet.[ext]',
        format: 'iife',
        name: 'PathwayPet'
      }
    }
  }
});
