import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [],
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2020',
    cssMinify: true,
    minify: 'esbuild',
    esbuildOptions: {
      drop: ['console', 'debugger'],
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        creator: resolve(__dirname, 'creator.html'),
      },
      output: {
        manualChunks: {
          'vendor-gsap': ['gsap'],
          'vendor-three': ['three'],
          'vendor-i18n': ['i18next'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 3000,
  },
});
