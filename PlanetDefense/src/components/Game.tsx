import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { HUD } from './ui/HUD';
import { Suspense } from 'react';

export function Game() {
  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <Canvas
        camera={{ position: [0, 20, 50], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <HUD />
    </div>
  );
}
