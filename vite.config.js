import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/credentials/',
  plugins: [tailwindcss()],
  root: '.',
  build: {
    outDir: 'dist',
  },
});
