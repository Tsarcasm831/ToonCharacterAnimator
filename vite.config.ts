import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: ['.trycloudflare.com']
      },
      plugins: [
        react()
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      },
      build: {
        target: 'es2020',
        outDir: 'dist',
        // Keep /assets for public files; put bundled assets elsewhere to avoid collisions.
        assetsDir: 'static',
        sourcemap: true,
        minify: 'terser',
        copyPublicDir: true,
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html')
          },
          output: {
            manualChunks: {
              'vendor-three': ['three'],
              'vendor-react': ['react', 'react-dom'],
              'vendor-ui': ['lucide-react'],
              'game-core': [
                './game/core/Game.ts',
                './game/entities/BaseEntity.ts',
                './game/entities/HumanoidEntity.ts',
                './game/animator/LocomotionAnimator.ts',
                './game/core/EnemyCache.ts'
              ],
              'game-systems': [
                './hooks/useCombatState.ts',
                './hooks/useEnvironmentState.ts',
                './hooks/useEconomyLogic.ts'
              ],
              'ui-components': [
                './components/ui/panels/BuilderUI.tsx',
                './components/CombatScene.tsx',
                './components/WorldScene.tsx'
              ]
            },
            chunkFileNames: 'static/[name]-[hash].js',
            entryFileNames: 'static/[name]-[hash].js',
            assetFileNames: 'static/[name]-[hash].[ext]'
          }
        },
        chunkSizeWarningLimit: 1500,
        cssCodeSplit: true
      },
      optimizeDeps: {
        include: ['three', 'react', 'react-dom', 'lucide-react']
      },
      test: {
        environment: 'jsdom'
      },
      assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.png', '**/*.jpg', '**/*.svg', '**/*.opus']
    };
});
