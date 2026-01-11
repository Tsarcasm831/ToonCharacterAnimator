
import * as THREE from 'three';
import { ENV_CONSTANTS } from './EnvironmentTypes';
import { TerrainTextureFactory } from './TerrainTextureFactory';

const WATER_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vWorldPosition;
uniform float uTime;

void main() {
    vUv = uv;
    vec3 pos = position;
    float dist = length(pos.xy);
    pos.z += sin(dist * 2.0 - uTime * 1.5) * 0.05;
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const WATER_FRAGMENT_SHADER = `
varying vec2 vUv;
varying vec3 vWorldPosition;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uFoamColor;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
    vec2 center = vec2(8.0, 6.0);
    float dist = length(vWorldPosition.xz - center);
    float radius = ${ENV_CONSTANTS.POND_RADIUS.toFixed(1)};
    float n1 = noise(vUv * 15.0 + uTime * 0.5);
    float n2 = noise(vUv * 25.0 - uTime * 0.3);
    float caustics = pow(n1 * n2, 1.5) * 0.5;
    float foamLine = smoothstep(radius - 0.5, radius, dist);
    float finalFoam = caustics + foamLine * 0.4;
    vec3 color = mix(uColor, uFoamColor, finalFoam);
    float alpha = 0.7 + foamLine * 0.3;
    gl_FragColor = vec4(color, alpha);
}
`;

const SKY_VERTEX_SHADER = `
varying vec3 vWorldPosition;
varying vec3 vViewDir;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vViewDir = normalize(vWorldPosition);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAGMENT_SHADER = `
varying vec3 vWorldPosition;
varying vec3 vViewDir;

uniform vec3 topColor;
uniform vec3 bottomColor;
uniform vec3 sunColor;
uniform vec3 sunPos;
uniform float sunSize;

void main() {
    float h = vViewDir.y;
    
    // Gradient Sky
    // Use a steeper curve for the horizon to prevent whiteout
    float gradientFactor = max(pow(max(h + 0.1, 0.0), 0.8), 0.0);
    vec3 skyColor = mix(bottomColor, topColor, gradientFactor);
    
    // Sun/Moon Disk
    float sunIntensity = dot(vViewDir, normalize(sunPos));
    float sunGlow = pow(max(sunIntensity, 0.0), 120.0) * 1.5;
    float sunDisk = smoothstep(sunSize, sunSize + 0.005, sunIntensity);
    
    vec3 finalColor = skyColor + (sunColor * sunGlow) + (sunColor * sunDisk);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export class SceneBuilder {
    static build(scene: THREE.Scene) {
        // Sky
        const uniforms = {
            topColor: { value: new THREE.Color(0x0077ff) },
            bottomColor: { value: new THREE.Color(0xf0f5ff) },
            sunColor: { value: new THREE.Color(0xffffff) },
            sunPos: { value: new THREE.Vector3(1, 1, 1) },
            sunSize: { value: 0.999 }
        };
        
        // Increased sphere size to 150 for better immersion
        const skyGeo = new THREE.SphereGeometry(150, 32, 16);
        const skyMat = new THREE.ShaderMaterial({
            vertexShader: SKY_VERTEX_SHADER,
            fragmentShader: SKY_FRAGMENT_SHADER,
            uniforms,
            side: THREE.BackSide,
            fog: false
        });
        const sky = new THREE.Mesh(skyGeo, skyMat);
        sky.name = 'skysphere';
        scene.add(sky);

        // Terrain
        const patchSize = 40;
        const gridRadius = 1; 
        const terrainMap: Record<string, string> = {
            '0,0': 'Grass',
            '1,0': 'Sand',
            '1,1': 'Gravel',
            '0,1': 'Dirt',
            '-1,1': 'Wood',
            '-1,0': 'Stone',
            '-1,-1': 'Metal',
            '0,-1': 'Snow',
            '1,-1': 'Leaves'
        };

        for (let x = -gridRadius; x <= gridRadius; x++) {
            for (let z = -gridRadius; z <= gridRadius; z++) {
                const key = `${x},${z}`;
                const type = terrainMap[key] || 'Grass';
                const geo = new THREE.PlaneGeometry(patchSize, patchSize, 64, 64);
                const posAttribute = geo.attributes.position;
                const vertex = new THREE.Vector3();
                const centerX = x * patchSize;
                const centerZ = z * patchSize;

                for (let i = 0; i < posAttribute.count; i++) {
                    vertex.fromBufferAttribute(posAttribute, i);
                    const wX = centerX + vertex.x;
                    const wZ = centerZ - vertex.y; 
                    const pdx = wX - ENV_CONSTANTS.POND_X;
                    const pdz = wZ - ENV_CONSTANTS.POND_Z;
                    const dist = Math.sqrt(pdx*pdx + pdz*pdz);
                    if (dist < ENV_CONSTANTS.POND_RADIUS) {
                        const normDist = dist / ENV_CONSTANTS.POND_RADIUS;
                        const depth = ENV_CONSTANTS.POND_DEPTH * (1 - normDist * normDist);
                        vertex.z -= depth; 
                    }
                    posAttribute.setZ(i, vertex.z);
                }
                geo.computeVertexNormals();
                const texture = TerrainTextureFactory.getTexture(type);
                const mat = new THREE.MeshStandardMaterial({ 
                    map: texture,
                    color: 0xdddddd,
                    roughness: 0.9,
                    metalness: type === 'Metal' ? 0.6 : 0.1
                });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.rotation.x = -Math.PI / 2;
                mesh.position.set(centerX, 0, centerZ);
                mesh.receiveShadow = true;
                mesh.userData = { type: 'terrain', terrainType: type };
                scene.add(mesh);
            }
        }
        
        // Water Plane
        const waterGeo = new THREE.CircleGeometry(ENV_CONSTANTS.POND_RADIUS, 64);
        const waterMat = new THREE.ShaderMaterial({
            vertexShader: WATER_VERTEX_SHADER,
            fragmentShader: WATER_FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x2196f3) },
                uFoamColor: { value: new THREE.Color(0xffffff) }
            },
            transparent: true,
            side: THREE.DoubleSide
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.set(ENV_CONSTANTS.POND_X, -0.4, ENV_CONSTANTS.POND_Z);
        water.name = 'pond_water';
        scene.add(water);
    
        // Grid
        const grid = new THREE.GridHelper(100, 40, 0x000000, 0x000000);
        if(grid.material instanceof THREE.Material) {
            grid.material.opacity = 0.05;
            grid.material.transparent = true;
        }
        grid.position.y = 0.01;
        scene.add(grid);
    }
}
