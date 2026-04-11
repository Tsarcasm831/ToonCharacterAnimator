import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { fileURLToPath } from 'url';
import path from 'path';

export default defineConfig({
  base: './',
  root: path.dirname(fileURLToPath(import.meta.url)),
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'assets/images/**/*',
          dest: 'assets/images'
        },
        {
          src: 'CHANGELOG.md',
          dest: '.'
        }
      ]
    })
  ],
});
