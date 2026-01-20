import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: ['.trycloudflare.com']
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // Replaced __dirname with '.' for resolve path
          '@': path.resolve('.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'three': ['three'],
              'react-vendor': ['react', 'react-dom'],
              'game-core': [
                './game/core/Game.ts',
                './game/player/Player.ts',
                './game/model/PlayerModel.ts',
                './game/animator/PlayerAnimator.ts'
              ],
              'game-entities': [
                './game/managers/EntityManager.ts'
              ],
              'ui-components': [
                './components/ui/ControlPanel.tsx',
                './components/ui/InventoryModal.tsx',
                './components/ui/TradeModal.tsx'
              ]
            }
          }
        },
        chunkSizeWarningLimit: 1000
      },
      optimizeDeps: {
        include: ['three', 'react', 'react-dom']
      }
    };
});
