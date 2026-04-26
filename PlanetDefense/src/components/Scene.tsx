import { useGameStore } from '../store/useGameStore';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Core } from './entities/Core';
import { DefenseField } from './entities/DefenseField';
import { Asteroids } from './entities/Asteroids';
import { Missiles } from './entities/Missiles';
import { Explosions } from './entities/Explosions';
import { ProjectionPlane } from './entities/ProjectionPlane';
import { ProjectionLines } from './entities/ProjectionLines';
import { CinematicBackground } from './entities/Background';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useRef } from 'react';

function GameLoop() {
  const update = useGameStore(s => s.update);
  const fireMissile = useGameStore(s => s.fireMissile);

  useFrame((state, delta) => {
    update(Math.min(delta, 0.1));

    const gs = useGameStore.getState();
    if (gs.status === 'playing' && gs.missilesReady > 0 && gs.enemies.length > 0 && gs.fireCooldown === 0) {
      fireMissile();
    }
  });
  return null;
}

export function Scene() {
  return (
    <>
      <OrbitControls enablePan={false} minDistance={20} maxDistance={250} makeDefault />
      <GameLoop />
      
      {/* Environment / Lighting */}
      <color attach="background" args={['#010205']} />
      <fog attach="fog" args={['#010205', 50, 300]} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[100, 100, -100]} intensity={2.5} color="#abcdef" castShadow />
      <directionalLight position={[-100, -50, 100]} intensity={1} color="#ffaa55" />
      
      <CinematicBackground />
      
      {/* Entities */}
      <Core />
      <DefenseField />
      <Asteroids />
      <Missiles />
      <Explosions />
      <ProjectionPlane />
      <ProjectionLines />

      {/* Post Processing */}
      <EffectComposer enableNormalPass={false} multisampling={4}>
        <Bloom 
          luminanceThreshold={0.2} 
          mipmapBlur 
          intensity={2.0} 
          radius={0.8}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.2} />
      </EffectComposer>
    </>
  );
}
