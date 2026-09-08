import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE = "/nome-do-repo/" quando publicado no GitHub Pages de projeto.
// Localmente e na Vercel/Netlify fica "/".
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  server: {
    port: 5173,
  },
});
