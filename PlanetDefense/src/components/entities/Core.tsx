import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { useGameStore } from '../../store/useGameStore';

const planetVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vPosition = position;
    gl_Position = projectionMatrix * mvPosition;
}
`;

const planetFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vPosition;

uniform float time;
uniform vec3 oceanColor;
uniform float healthPct;

float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 5; ++i) { // 5 octaves
        v += a * noise(x);
        x = x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewPosition);

    // High detail procedural ocean turbulence
    float elevation = fbm(vPosition * 1.5 + time * 0.02);
    
    // Bump mapping for water
    float eX = fbm((vPosition + vec3(0.01, 0.0, 0.0)) * 1.5 + time * 0.02);
    float eY = fbm((vPosition + vec3(0.0, 0.01, 0.0)) * 1.5 + time * 0.02);
    float eZ = fbm((vPosition + vec3(0.0, 0.0, 0.01)) * 1.5 + time * 0.02);
    vec3 bumpNormal = normalize(n - vec3(eX - elevation, eY - elevation, eZ - elevation) * 5.0);
    
    // Damage effect (lava cracks using high freq fbm everywhere on the base)
    float cracks = smoothstep(0.4, 0.6, fbm(vPosition * 3.0));
    float isDamaged = 1.0 - healthPct;
    float damageMask = smoothstep(0.8 - isDamaged * 0.6, 0.9, 1.0 - elevation + cracks * 0.8) * isDamaged;

    vec3 emissive = vec3(0.0);
    
    // Add glowing magma when damaged
    vec3 lavaColor = vec3(1.0, 0.2, 0.0);
    emissive += lavaColor * damageMask * (0.5 + 0.5 * sin(time * 5.0)) * 2.5;

    // Atmospheric Fresnel
    float fresnel = pow(1.0 - max(dot(bumpNormal, v), 0.0), 3.0);
    emissive += oceanColor * fresnel * 0.8;

    // Ocean styling base
    vec3 finalColor = oceanColor * (0.5 + 0.5 * elevation) + emissive;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

const atmosVertexShader = `
varying vec3 vNormal;
varying vec3 vViewPosition;
void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
`;
const atmosFragmentShader = `
varying vec3 vNormal;
varying vec3 vViewPosition;
uniform vec3 color;
void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewPosition);
    float intensity = pow(0.6 - dot(n, v), 3.0);
    gl_FragColor = vec4(color * intensity, intensity * 0.5);
}
`;

const cloudVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const cloudFragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;
uniform float time;

float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 4; ++i) {
        v += a * noise(x);
        x = x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    // Dynamic clouds
    float c = fbm(vPosition * 2.0 + time * 0.05);
    float cloudMask = smoothstep(0.4, 0.7, c);
    
    // Fake lighting
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float blockLight = max(dot(normalize(vPosition), lightDir), 0.2);
    
    gl_FragColor = vec4(vec3(1.0) * blockLight, cloudMask * 0.6);
}
`;

// Extracted inner component for the actual ThreeGlobe instance to simplify updates
function EarthGlobe() {
  const coreRadius = useGameStore(s => s.coreRadius);
  const setSelectedNation = useGameStore(s => s.setSelectedNation);
  const [globe, setGlobe] = useState<ThreeGlobe | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<any | null>(null);

  useEffect(() => {
    const newGlobe = new ThreeGlobe()
      .showGlobe(false) // Hide the solid globe to show our procedural ocean beneath
      .polygonAltitude(0.01)
      .polygonSideColor(() => 'rgba(0, 50, 100, 0.8)') // Semi-transparent blue sides
      .polygonCapColor(() => 'rgba(0, 200, 255, 0.9)'); // Opaque blue lids

    // three-globe has a default radius of 100. Scale it to fit our coreRadius.
    const scale = (coreRadius * 1.002) / 100;
    newGlobe.scale.setScalar(scale);

    setGlobe(newGlobe);
    
    fetch('https://raw.githubusercontent.com/vasturiano/three-globe/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(countries => {
        newGlobe.polygonsData(countries.features);
      });
  }, [coreRadius]);

  // Update colors when hover state changes
  useEffect(() => {
    if (globe) {
      globe.polygonCapColor((feat: any) => {
        return feat === hoveredCountry ? 'rgba(0, 255, 255, 0.7)' : 'rgba(2, 20, 40, 0.8)';
      });
    }
  }, [globe, hoveredCountry]);

  // Sync to scene graph rotation
  useFrame((state, delta) => {
    if (globe) {
      globe.rotation.y += delta * 0.1;
    }
  });

  if (!globe) return null;

  return (
    <primitive 
      object={globe} 
      onPointerMove={(e: any) => {
        e.stopPropagation();
        if (e.object && e.object.__data) {
          setHoveredCountry(e.object.__data);
          setSelectedNation(e.object.__data.properties.ADMIN);
        }
      }}
      onPointerOut={() => {
        setHoveredCountry(null);
        setSelectedNation(null);
      }}
    />
  );
}

export function Core() {
  const planetRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const cloudMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);
  
  const coreRadius = useGameStore(s => s.coreRadius);
  const health = useGameStore(s => s.health);
  const maxHealth = useGameStore(s => s.maxHealth);

  useFrame((state, delta) => {
    timeRef.current += delta;
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.1;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.15; // clouds drift faster
      cloudRef.current.rotation.z += delta * 0.02;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.2;
      ring1Ref.current.rotation.y -= delta * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += delta * 0.3;
      ring2Ref.current.rotation.z -= delta * 0.15;
    }

    if (materialRef.current) {
      materialRef.current.uniforms.time.value = timeRef.current;
      materialRef.current.uniforms.healthPct.value = health / maxHealth;
    }
    if (cloudMaterialRef.current) {
      cloudMaterialRef.current.uniforms.time.value = timeRef.current;
    }
  });

  const oceanColor = new THREE.Color(0.01, 0.05, 0.2);

  return (
    <group>
      {/* Main Procedural Ocean Surface */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[coreRadius, 128, 128]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={planetVertexShader}
          fragmentShader={planetFragmentShader}
          uniforms={{
            time: { value: 0 },
            healthPct: { value: 1 },
            oceanColor: { value: oceanColor },
          }}
        />
      </mesh>

      {/* Realistic Geojson Earth Layer */}
      <EarthGlobe />

      {/* Cloud Layer */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[coreRadius * 1.05, 64, 64]} />
        <shaderMaterial
          ref={cloudMaterialRef}
          vertexShader={cloudVertexShader}
          fragmentShader={cloudFragmentShader}
          uniforms={{
            time: { value: 0 }
          }}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>

      {/* Volumetric Atmosphere Edge Glow */}
      <mesh>
        <sphereGeometry args={[coreRadius * 1.15, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosVertexShader}
          fragmentShader={atmosFragmentShader}
          uniforms={{ color: { value: new THREE.Color(0.1, 0.5, 1.0) } }}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[coreRadius * 1.15, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosVertexShader}
          fragmentShader={atmosFragmentShader}
          uniforms={{ color: { value: new THREE.Color(0.1, 0.5, 1.0) } }}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Orbital Defense Rings */}
      <mesh ref={ring1Ref} rotation={[Math.PI/3, 0, 0]}>
        <torusGeometry args={[coreRadius * 1.6, 0.15, 16, 128]} />
        <meshStandardMaterial color="#334455" metalness={0.9} roughness={0.3} />
      </mesh>
      
      <mesh ref={ring1Ref} rotation={[Math.PI/3, 0, 0]}>
        <torusGeometry args={[coreRadius * 1.5, 0.05, 16, 128]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>

      <mesh ref={ring2Ref} rotation={[-Math.PI/4, Math.PI/4, 0]}>
        <torusGeometry args={[coreRadius * 2.2, 0.08, 16, 128]} />
        <meshStandardMaterial color="#112233" metalness={0.8} roughness={0.5} />
      </mesh>
      
      <mesh ref={ring2Ref} rotation={[-Math.PI/4, Math.PI/4, 0]}>
        <torusGeometry args={[coreRadius * 2.2, 0.08, 16, 10]} />
        <meshStandardMaterial color="#fff" wireframe />
      </mesh>

      <pointLight color="#0088ff" intensity={150} distance={100} decay={2} />
    </group>
  );
}
