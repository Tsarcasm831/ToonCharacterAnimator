
import * as THREE from 'three';
import { ENV_CONSTANTS, BIOME_DATA } from './EnvironmentTypes';
import { PlayerUtils } from '../player/PlayerUtils';

const GRASS_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vColor;
varying float vHeightFactor;
uniform float uTime;
uniform vec3 uWindDir;

void main() {
    vUv = uv;
    vColor = instanceColor;

    vec4 worldPos = instanceMatrix * vec4(position, 1.0);
    
    float h = position.y; 
    vHeightFactor = h / 0.38; 
    
    float windStrength = 0.2;
    float windSpeed = 1.0;
    
    float gusts = sin(worldPos.x * 0.1 + worldPos.z * 0.1 + uTime * 0.5);
    float noise = sin(worldPos.x * 1.5 + worldPos.z * 1.5 + uTime * windSpeed);
    
    float totalSway = (noise * 0.5 + gusts * 0.5) * windStrength * vHeightFactor;
    vec3 displacement = uWindDir * totalSway;
    displacement.y -= totalSway * totalSway * 0.2;
    
    gl_Position = projectionMatrix * viewMatrix * (worldPos + vec4(displacement, 0.0));
}
`;

const GRASS_FRAGMENT_SHADER = `
varying vec2 vUv;
varying vec3 vColor;
varying float vHeightFactor;

void main() {
    vec3 baseColor = vColor * 0.7;
    vec3 tipColor = vColor * 1.3;
    vec3 finalColor = mix(baseColor, tipColor, vHeightFactor);
    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export class GrassManager {
    private mesh: THREE.InstancedMesh;
    private count: number = 4000; // Wider coverage across the whole scene
    private parent: THREE.Object3D;

    constructor(parent: THREE.Object3D) {
        this.parent = parent;

        const bladeWidth = 0.18; // Wider to compensate for lower count
        const bladeHeight = 0.42; 
        
        const geometry = new THREE.PlaneGeometry(bladeWidth, bladeHeight, 1, 1); 
        geometry.translate(0, bladeHeight / 2, 0);
        
        const pos = geometry.attributes.position;
        for(let i=0; i<pos.count; i++) {
            const y = pos.getY(i);
            if (y > bladeHeight * 0.9) {
                pos.setX(i, pos.getX(i) * 0.1); 
            }
        }
        geometry.computeVertexNormals();

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
        this.mesh.receiveShadow = true;
        this.mesh.frustumCulled = true;
        this.parent.add(this.mesh);

        this.populate();
    }

    private isGrassGround(x: number, z: number): boolean {
        // Check water first (ponds)
        const pondDepth = PlayerUtils.getTerrainHeight(x, z);
        if (pondDepth < -0.1) return false;

        // Check biome type
        const biomeSize = ENV_CONSTANTS.BIOME_SIZE;
        const ix = Math.round(x / biomeSize);
        const iz = Math.round(z / biomeSize);
        const key = `${ix},${iz}`;
        const biome = BIOME_DATA[key] || BIOME_DATA['0,0'];
        
        // Only allow grass on grass-type biomes
        return biome.type === 'Grass';
    }

    private populate() {
        const dummy = new THREE.Object3D();
        const patchSize = 180; 
        const color = new THREE.Color();

        let i = 0;
        let attempts = 0;
        const maxAttempts = this.count * 5;

        while (i < this.count && attempts < maxAttempts) {
            attempts++;
            const x = (Math.random() - 0.5) * patchSize;
            const z = (Math.random() - 0.5) * patchSize;

            // Check if this position is suitable for grass
            if (!this.isGrassGround(x, z)) continue;

            const tx = x + (Math.random() - 0.5) * 0.4;
            const tz = z + (Math.random() - 0.5) * 0.4;

            const ty = PlayerUtils.getTerrainHeight(tx, tz);
            dummy.position.set(tx, ty, tz);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            
            const scaleY = 0.7 + Math.random() * 0.6;
            dummy.scale.set(1.0, scaleY, 1.0);
            
            dummy.updateMatrix();
            this.mesh.setMatrixAt(i, dummy.matrix);

            const hue = 0.28 + (Math.random() - 0.5) * 0.04; 
            const sat = 0.4 + Math.random() * 0.4;
            const light = 0.35 + Math.random() * 0.2;
            color.setHSL(hue, sat, light);
            this.mesh.setColorAt(i, color);
            i++;
        }
        
        this.mesh.count = i;
        this.mesh.instanceMatrix.needsUpdate = true;
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    }

    update(dt: number) {
        if (this.mesh.material instanceof THREE.ShaderMaterial) {
            this.mesh.material.uniforms.uTime.value = performance.now() * 0.001;
        }
    }

    dispose() {
        this.parent.remove(this.mesh);
        this.mesh.geometry.dispose();
        if (Array.isArray(this.mesh.material)) {
            this.mesh.material.forEach(m => m.dispose());
        } else {
            this.mesh.material.dispose();
        }
    }
}
