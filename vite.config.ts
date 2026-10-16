import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { seoPages } from './seo/pages';

export default defineConfig({
  base: './',
  plugins: [react(), seoPages()],
});
