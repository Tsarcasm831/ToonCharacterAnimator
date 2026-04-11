import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL;
    const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

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
        'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
        'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(supabaseUrl),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
        'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabaseAnonKey)
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
        sourcemap: false,
        minify: 'terser',
        copyPublicDir: true,
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html')
          },
          onwarn(warning, warn) {
            if (warning.code === 'CHUNK_SIZE_LIMIT') return;
            warn(warning);
          },
          output: {
            manualChunks: {
              'vendor-three': ['three'],
              'vendor-react': ['react', 'react-dom'],
              'vendor-ui': ['lucide-react'],
              'game-runtime': [
                './game/core/Game.ts',
                './game/entities/BaseEntity.ts',
                './game/entities/HumanoidEntity.ts',
                './game/animator/LocomotionAnimator.ts',
                './game/core/EnemyCache.ts',
                './components/ui/panels/BuilderUI.tsx',
                './components/CombatScene.tsx',
                './components/WorldScene.tsx'
              ],
              'game-systems': [
                './hooks/useCombatState.ts',
                './hooks/useEnvironmentState.ts',
                './hooks/useEconomyLogic.ts'
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
