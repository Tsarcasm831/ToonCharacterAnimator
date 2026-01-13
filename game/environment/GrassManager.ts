
import * as THREE from 'three';
import { ENV_CONSTANTS } from './EnvironmentTypes';

const GRASS_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vColor;
varying float vHeightFactor;
uniform float uTime;
uniform vec3 uWindDir;

void main() {
    vUv = uv;
    vColor = instanceColor;

    // Instance matrix transform
    vec4 worldPos = instanceMatrix * vec4(position, 1.0);
    
    // Height factor: bottom vertices (y near 0) stay pinned, top vertices sway
    // Position is local to the blade before instance transform
    float h = position.y; 
    vHeightFactor = h / 0.5; // Normalized height for fragment shader
    
    // WIND SIMULATION
    float windStrength = 0.25;
    float windSpeed = 1.2;
    
    // 1. Large Gusts (Low frequency)
    float gusts = sin(worldPos.x * 0.1 + worldPos.z * 0.1 + uTime * 0.5);
    
    // 2. Individual Sway (Medium frequency)
    float noise = sin(worldPos.x * 1.5 + worldPos.z * 1.5 + uTime * windSpeed);
    
    // 3. Micro-flutter (High frequency at tips)
    float flutter = sin(uTime * 15.0 + worldPos.x) * 0.02 * vHeightFactor;
    
    // Total displacement scales by height (bend)
    float totalSway = (noise * 0.5 + gusts * 0.5) * windStrength * vHeightFactor;
    
    vec3 displacement = uWindDir * (totalSway + flutter);
    
    // Add a slight downward curve as it bends
    displacement.y -= totalSway * totalSway * 0.5;
    
    gl_Position = projectionMatrix * viewMatrix * (worldPos + vec4(displacement, 0.0));
}
`;

const GRASS_FRAGMENT_SHADER = `
varying vec2 vUv;
varying vec3 vColor;
varying float vHeightFactor;

void main() {
    // 1. Gradient: Darker at the roots (Fake AO), brighter at tips
    vec3 baseColor = vColor * 0.6; // Darken base
    vec3 tipColor = vColor * 1.4;  // Brighten tip
    
    vec3 finalColor = mix(baseColor, tipColor, vHeightFactor);
    
    // 2. Add a slight highlight to the edges
    float edge = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
    finalColor *= (0.9 + edge * 0.1);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export class GrassManager {
    private mesh: THREE.InstancedMesh;
    private count: number = 15000; // Increased count
    private parent: THREE.Object3D;

    constructor(parent: THREE.Object3D) {
        this.parent = parent;

        // 1. Geometry: Single Curved Plane (More realistic than cross-plane)
        // A simple plane curved slightly
        const bladeWidth = 0.08;
        const bladeHeight = 0.38; // Reduced 30% from 0.55
        
        // 3 segments high for bending
        const geometry = new THREE.PlaneGeometry(bladeWidth, bladeHeight, 1, 3);
        geometry.translate(0, bladeHeight / 2, 0);
        
        // Curve vertices slightly to look like a blade
        const pos = geometry.attributes.position;
        for(let i=0; i<pos.count; i++) {
            const y = pos.getY(i);
            const bend = (y / bladeHeight) * 0.1;
            pos.setZ(i, pos.getZ(i) + bend);
            
            // Taper top
            if (y > bladeHeight * 0.9) {
                pos.setX(i, pos.getX(i) * 0.1); // Sharp tip
            }
        }
        geometry.computeVertexNormals();

        // 2. Material: Custom shader for wind
        const material = new THREE.ShaderMaterial({
            vertexShader: GRASS_VERTEX_SHADER,
            fragmentShader: GRASS_FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uWindDir: { value: new THREE.Vector3(1, 0, 0.3).normalize() }
            },
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.InstancedMesh(geometry, material, this.count);
        this.mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        this.mesh.castShadow = false; 
        this.mesh.receiveShadow = true;
        this.parent.add(this.mesh);

        this.populate();
    }

    private populate() {
        const dummy = new THREE.Object3D();
        const patchSize = 39; // Strictly within 40 grid
        const color = new THREE.Color();
        
        const tuftChance = 0.25; 
        const patchNoiseScale = 0.12;

        const pondX = ENV_CONSTANTS.POND_X;
        const pondZ = ENV_CONSTANTS.POND_Z;
        const pondRadiusSq = Math.pow(ENV_CONSTANTS.POND_RADIUS + 0.6, 2);
        
        let i = 0;
        let attempts = 0;
        const maxAttempts = this.count * 4; // Reduced max attempts to prevent long hangs

        while (i < this.count && attempts < maxAttempts) {
            attempts++;
            // Generate in Verdant Meadows range: X[-19.5, 19.5], Z[-19.5, 19.5]
            const x = (Math.random() - 0.5) * patchSize;
            const z = (Math.random() - 0.5) * patchSize;
            
            // 1. POND EXCLUSION (Simple bounding box check first for speed)
            if (Math.abs(x - pondX) < 6 && Math.abs(z - pondZ) < 6) {
                const dx = x - pondX;
                const dz = z - pondZ;
                if (dx*dx + dz*dz < pondRadiusSq) continue;
            }

            // 2. PATCH DENSITY NOISE
            const noise = Math.sin(x * patchNoiseScale) * Math.cos(z * patchNoiseScale);
            // Optimized: simplified density check
            if (noise < -0.2 && Math.random() > 0.3) continue; // Skip some low noise areas

            // 3. SPAWN BLADES
            const bladesInTuft = Math.random() < tuftChance ? 3 + Math.floor(Math.random() * 5) : 1;
            
            for (let t = 0; t < bladesInTuft; t++) {
                if (i >= this.count) break;

                const tx = x + (Math.random() - 0.5) * 0.4;
                const tz = z + (Math.random() - 0.5) * 0.4;

                // STRICT BOUNDARY CHECK (Clamp instead of continue to avoid wasted cycles)
                const clampedTx = Math.max(-19.8, Math.min(19.8, tx));
                const clampedTz = Math.max(-19.8, Math.min(19.8, tz));

                if (Math.abs(clampedTx - pondX) < 6 && Math.abs(clampedTz - pondZ) < 6) {
                     const tdx = clampedTx - pondX;
                     const tdz = clampedTz - pondZ;
                     if (tdx*tdx + tdz*tdz < pondRadiusSq) continue;
                }
                
                dummy.position.set(clampedTx, 0, clampedTz);
                dummy.rotation.y = Math.random() * Math.PI * 2;
                
                // Randomize tilt slightly for messy look
                dummy.rotation.x = (Math.random() - 0.5) * 0.3;
                dummy.rotation.z = (Math.random() - 0.5) * 0.3;
                
                const scaleY = 0.5 + Math.random() * 0.4; // Reduced range by 30% from [0.7, 1.3]
                const scaleXZ = 1.0 + Math.random() * 0.5;
                dummy.scale.set(scaleXZ, scaleY, scaleXZ);
                
                dummy.updateMatrix();
                this.mesh.setMatrixAt(i, dummy.matrix);

                // COLOR JITTER (More vibrant green)
                const hue = 0.28 + (Math.random() - 0.5) * 0.04; 
                const sat = 0.5 + Math.random() * 0.3;
                const light = 0.35 + Math.random() * 0.2;
                color.setHSL(hue, sat, light);
                
                if (Math.random() < 0.03) {
                    color.setHSL(0.12, 0.4, 0.4); // Dry blade
                }

                this.mesh.setColorAt(i, color);
                i++;
            }
        }
        
        this.mesh.count = i; // Update actual count in case we didn't fill buffer
        this.mesh.instanceMatrix.needsUpdate = true;
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    }

    update(dt: number) {
        if (this.mesh.material instanceof THREE.ShaderMaterial) {
            this.mesh.material.uniforms.uTime.value = performance.now() * 0.001;
        }
    }
}
