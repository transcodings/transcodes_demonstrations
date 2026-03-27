import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5180,
    proxy: {
      '/api': {
        target: 'http://localhost:3007',
        changeOrigin: true,
      },
      '/.well-known/webauthn': {
        target: 'http://localhost:3500',
        rewrite: () => '/v1/project/ca30425a3c52e2bfa6603a64/well-known/webauthn',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            const staticFile = path.resolve(__dirname, 'public/.well-known/webauthn');
            const content = fs.readFileSync(staticFile, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(content);
          });
        },
      },
    },
  },
});
