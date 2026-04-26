import { Plane } from '@react-three/drei';
import * as THREE from 'three';

export function ProjectionPlane() {
  return (
    <Plane 
      args={[300, 300]} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0, 0]}
      receiveShadow
    >
      <meshBasicMaterial 
        color="#08101a" 
        transparent 
        opacity={0.3} 
        side={THREE.DoubleSide} 
      />
      {/* Subtle grid lines */}
      <gridHelper args={[300, 30, '#00ffff', '#004444']} rotation={[Math.PI / 2, 0, 0]} />
    </Plane>
  );
}
