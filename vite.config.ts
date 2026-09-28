import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const munsitProxy = {
  '/api/munsit': {
    target: 'https://api.munsit.com',
    changeOrigin: true,
    secure: true,
    ws: true,
    rewrite: (path: string) => path.replace(/^\/api\/munsit/, '')
  }
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: true,
    proxy: munsitProxy
  },
  preview: {
    proxy: munsitProxy
  }
});
