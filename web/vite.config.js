import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    // Vite's preview server rejects requests with an unrecognized Host
    // header by default (DNS-rebinding protection) - the Railway domain
    // needs to be allowed explicitly, since it isn't localhost.
    allowedHosts: ['smart-gate-web-production.up.railway.app'],
  },
});
