import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

export function CinematicBackground() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Deep dense starfield */}
      <Stars radius={300} depth={100} count={10000} factor={6} saturation={0.5} fade speed={0.5} />

      {/* Orbiting space dust/debris nearby */}
      <group scale={150}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial 
            color="#2255ff" 
            transparent 
            opacity={0.02} 
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
