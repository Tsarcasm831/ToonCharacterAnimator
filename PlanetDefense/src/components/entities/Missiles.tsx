import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

export function Missiles() {
  const missiles = useGameStore(state => state.missiles);

  return (
    <group>
      {missiles.map((missile) => (
        <Missile key={missile.id} missile={missile} />
      ))}
    </group>
  );
}

function Missile({ missile }: { missile: any }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (ref.current) {
      ref.current.position.copy(missile.position);
      const target = missile.position.clone().add(missile.velocity);
      ref.current.lookAt(target);
      ref.current.rotateX(Math.PI / 2);
    }
  });

  return (
    <group>
      <mesh ref={ref}>
        <coneGeometry args={[0.5, 2, 8]} />
        <meshStandardMaterial 
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <Trail
        width={1.5}
        length={10}
        color={new THREE.Color(0, 1, 1)}
        attenuation={(t) => t * t}
        target={ref as any}
      />
      <pointLight position={missile.position} color="#00ffff" intensity={10} distance={10} decay={2} />
    </group>
  );
}
