import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPositionNormal;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 color;
  uniform float time;
  uniform float pulseSpeed;
  varying vec3 vNormal;
  varying vec3 vPositionNormal;
  varying vec2 vUv;

  void main() {
    float intensity = pow(0.2 - dot(vNormal, vPositionNormal), 4.0);
    float pulse = sin(time * pulseSpeed) * 0.1 + 0.9;
    
    // Hex/Grid holographic pattern approximation
    float grid = 0.0;
    grid += sin(vUv.x * 200.0) * sin(vUv.y * 200.0) * 0.05;
    float scanline = sin(vUv.y * 50.0 - time * 2.0) * 0.1;

    vec3 finalColor = color * intensity * pulse + (grid + scanline) * color;
    
    // Fade out at poles
    float poleFade = sin(vUv.y * 3.14159);
    
    gl_FragColor = vec4(finalColor, intensity * 0.6 * poleFade + max(0.0, grid + scanline));
  }
`;

export function DefenseField() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  
  const spawnRadius = useGameStore(s => s.spawnRadius);
  const health = useGameStore(s => s.health);
  const maxHealth = useGameStore(s => s.maxHealth);

  useFrame((state, delta) => {
    timeRef.current += delta;
    
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = timeRef.current;
      materialRef.current.uniforms.pulseSpeed.value = 2.0 + (1.0 - health / maxHealth) * 10.0;
      
      const healthPct = health / maxHealth;
      const targetColor = new THREE.Color().lerpColors(
        new THREE.Color(1, 0.1, 0.1),
        new THREE.Color(0, 0.4, 0.8),
        healthPct
      );
      materialRef.current.uniforms.color.value.copy(targetColor);
    }
    if (meshRef.current) {
        meshRef.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[spawnRadius, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          color: { value: new THREE.Color(0, 0.4, 0.8) },
          time: { value: 0 },
          pulseSpeed: { value: 2.0 },
        }}
        transparent
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
