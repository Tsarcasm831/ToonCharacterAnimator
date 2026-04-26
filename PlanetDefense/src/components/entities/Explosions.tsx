import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

export function Explosions() {
  const explosions = useGameStore(state => state.explosions);
  const particles = useGameStore(state => state.particles);

  return (
    <group>
      {/* Explosions (growing spheres & shockwaves) */}
      {explosions.map(exp => (
        <group key={exp.id}>
          <ExplosionSphere explosion={exp} />
          {exp.hasShockwave && <ShockwaveRing explosion={exp} />}
        </group>
      ))}
      
      {/* Particles (flying debris/sparks) */}
      {particles.length > 0 && (
        <Instances limit={2000}>
          <icosahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial 
            vertexColors={false}
            emissiveIntensity={4}
            roughness={0.4}
            metalness={0.8}
            transparent
          />
          {particles.map(p => (
            <ParticleInstance key={p.id} particle={p} />
          ))}
        </Instances>
      )}
    </group>
  );
}

function ExplosionSphere({ explosion }: { explosion: any }) {
  const ref = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (ref.current && materialRef.current) {
      const progress = explosion.life / explosion.maxLife;
      // Ease out cubic
      const scale = explosion.size * (1 - Math.pow(1 - progress, 3));
      ref.current.scale.setScalar(scale);
      
      materialRef.current.opacity = 1 - progress;
      materialRef.current.emissiveIntensity = 8 * (1 - progress);
    }
  });

  return (
    <mesh ref={ref} position={explosion.position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial 
        ref={materialRef}
        color={explosion.color}
        emissive={explosion.color}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
      <pointLight 
        color={explosion.color} 
        intensity={100 * (1 - explosion.life / explosion.maxLife)} 
        distance={explosion.size * 6} 
      />
    </mesh>
  );
}

function ShockwaveRing({ explosion }: { explosion: any }) {
  const ref = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // Random orientation for the shockwave
  const initQuat = useRef(new THREE.Quaternion().random());

  useFrame(() => {
    if (ref.current && materialRef.current) {
      const progress = explosion.life / explosion.maxLife;
      // Linear expansion usually looks good for shockwaves
      const scale = explosion.size * 2 * progress + 0.1; 
      ref.current.scale.setScalar(scale);
      
      materialRef.current.opacity = (1 - progress) * 0.8;
      materialRef.current.emissiveIntensity = 10 * (1 - progress);
    }
  });

  return (
    <mesh ref={ref} position={explosion.position} quaternion={initQuat.current}>
      <torusGeometry args={[1, 0.05, 8, 32]} />
      <meshStandardMaterial 
        ref={materialRef}
        color={explosion.color}
        emissive={explosion.color}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function ParticleInstance({ particle }: { particle: any }) {
  const ref = useRef<any>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.copy(particle.position);
      ref.current.scale.setScalar(particle.size * (1 - particle.life / particle.maxLife));
    }
  });

  return <Instance ref={ref} color={particle.color} />;
}
