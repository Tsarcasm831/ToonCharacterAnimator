import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

function createDisplacedGeometry(baseGeometry: THREE.BufferGeometry, noiseScale: number, amplitude: number, seedOffset: number) {
  const geo = baseGeometry.clone();
  const posAttribute = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < posAttribute.count; i++) {
    v.fromBufferAttribute(posAttribute, i);
    
    // Simple fast 3D hash noise based on vertex position
    // We add seedOffset so different variants look different
    const nx = Math.sin(v.x * noiseScale + seedOffset) * Math.cos(v.y * noiseScale);
    const ny = Math.sin(v.y * noiseScale + seedOffset) * Math.cos(v.z * noiseScale);
    const nz = Math.sin(v.z * noiseScale + seedOffset) * Math.cos(v.x * noiseScale);
    
    const noiseVal = (nx + ny + nz) * 0.33; 
    
    v.add(v.clone().normalize().multiplyScalar(noiseVal * amplitude));
    posAttribute.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function Asteroids() {
  const enemies = useGameStore(state => state.enemies);

  const variants = [
    enemies.filter(e => e.variant === 0),
    enemies.filter(e => e.variant === 1),
    enemies.filter(e => e.variant === 2),
  ];

  // Pre-generate highly detailed geometries for the 3 variants
  const rockGeometry = useMemo(() => {
    // Icosahedron with detail level 3 -> hundreds of vertices for craggy rocks
    return createDisplacedGeometry(new THREE.IcosahedronGeometry(1.0, 3), 4.0, 0.4, 0);
  }, []);

  const metallicGeometry = useMemo(() => {
    // Sharp jagged shapes
    return createDisplacedGeometry(new THREE.OctahedronGeometry(1.0, 2), 6.0, 0.3, 10);
  }, []);

  const glowingGeometry = useMemo(() => {
    // High frequency bubbling energy
    return createDisplacedGeometry(new THREE.IcosahedronGeometry(1.0, 4), 10.0, 0.15, 20);
  }, []);

  return (
    <group>
      {/* Variant 0: Rocky block */}
      <Instances limit={1000} geometry={rockGeometry} castShadow receiveShadow>
        <meshStandardMaterial 
          roughness={1.0}
          metalness={0.0}
          color="#8B7B70"
          bumpScale={0.02}
        />
        {variants[0].map((enemy) => (
          <AsteroidInstance key={enemy.id} enemy={enemy} />
        ))}
      </Instances>

      {/* Variant 1: Metallic shard */}
      <Instances limit={1000} geometry={metallicGeometry} castShadow receiveShadow>
        <meshStandardMaterial 
          roughness={0.3}
          metalness={0.9}
          color="#445566"
        />
        {variants[1].map((enemy) => (
          <AsteroidInstance key={enemy.id} enemy={enemy} />
        ))}
      </Instances>

      {/* Variant 2: Glowing unstable */}
      <Instances limit={1000} geometry={glowingGeometry} castShadow receiveShadow>
        <meshStandardMaterial 
          roughness={0.6}
          metalness={0.5}
          emissive="#ff3300"
          emissiveIntensity={1.5}
          color="#220500"
        />
        {variants[2].map((enemy) => (
          <AsteroidInstance key={enemy.id} enemy={enemy} />
        ))}
      </Instances>
    </group>
  );
}

function AsteroidInstance({ enemy }: { enemy: any }) {
  const ref = useRef<any>(null);
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.position.copy(enemy.position);
      ref.current.quaternion.multiply(
        new THREE.Quaternion().setFromAxisAngle(enemy.rotationAxis, enemy.rotationSpeed * delta)
      );
      ref.current.scale.setScalar(enemy.size);
    }
  });

  return (
    <Instance 
      ref={ref} 
      color={enemy.color} 
    />
  );
}
