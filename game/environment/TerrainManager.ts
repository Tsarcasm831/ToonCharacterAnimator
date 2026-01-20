import * as THREE from 'three';
import { ENV_CONSTANTS, BIOME_DATA } from './EnvironmentTypes';
import { TerrainTextureFactory } from './TerrainTextureFactory';
import { WATER_VERTEX_SHADER, WATER_FRAGMENT_SHADER } from './Shaders';

export class TerrainManager {
    private group: THREE.Group;
    private meshes: THREE.Mesh[] = [];
    private waterMesh: THREE.Mesh | null = null;

    constructor(group: THREE.Group) {
        this.group = group;
    }

    async buildAsync(batchSize: number = 10) {
        const yieldFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

        // Terrain Optimization: Use LODs for patches
        const patchSize = ENV_CONSTANTS.PATCH_SIZE;
        const biomeSize = ENV_CONSTANTS.BIOME_SIZE;
        const gridRadius = 7; 

        // Shared geometries for efficiency
        const highResSharedGeo = new THREE.PlaneGeometry(patchSize, patchSize, 32, 32);
        const lowResSharedGeo = new THREE.PlaneGeometry(patchSize, patchSize, 1, 1);

        let x = -gridRadius;
        let z = -gridRadius;
        const totalPatches = (gridRadius * 2 + 1) ** 2;
        let created = 0;
        
        while (x <= gridRadius) {
            let batchCount = 0;
            while (x <= gridRadius && batchCount < batchSize) {
                const centerX = x * patchSize;
                const centerZ = z * patchSize;
                
                const biomeX = Math.round(centerX / biomeSize);
                const biomeZ = Math.round(centerZ / biomeSize);
                const biomeKey = `${biomeX},${biomeZ}`;
                
                const biomeData = BIOME_DATA[biomeKey] || BIOME_DATA['0,0'];
                const type = biomeData.type;
                
                // Only use high resolution if near the pond for vertex deformation
                const distToPond = Math.sqrt(Math.pow(centerX - ENV_CONSTANTS.POND_X, 2) + Math.pow(centerZ - ENV_CONSTANTS.POND_Z, 2));
                const patchDiagRadius = (patchSize / 2) * 1.414;
                
                let geo: THREE.BufferGeometry;
                
                if (distToPond < (ENV_CONSTANTS.POND_RADIUS + patchDiagRadius)) {
                    // NEAR POND: Deformable High-Res
                    geo = highResSharedGeo.clone();
                    const posAttribute = geo.attributes.position;
                    const vertex = new THREE.Vector3();
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
                } else {
                    // DISTANT: Static Low-Res
                    geo = lowResSharedGeo;
                }

                const texture = TerrainTextureFactory.getTexture(type);
                const mat = new THREE.MeshStandardMaterial({ 
                    map: texture,
                    color: 0xdddddd,
                    roughness: 0.9,
                    metalness: (type === 'Metal' || type === 'Obsidian') ? 0.4 : 0.05
                });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.rotation.x = -Math.PI / 2;
                mesh.position.set(centerX, 0, centerZ);
                mesh.receiveShadow = true;
                mesh.userData = { type: 'terrain', terrainType: type };
                this.group.add(mesh);
                this.meshes.push(mesh);

                created++;
                batchCount++;
                z++;
                if (z > gridRadius) {
                    z = -gridRadius;
                    x++;
                }
            }
            if (created < totalPatches) {
                await yieldFrame();
            }
        }
        
        // Water Plane
        this.buildWater();
        
        // Grid helper at low frequency
        const grid = new THREE.GridHelper(200, 50, 0x000000, 0x000000); 
        if(grid.material instanceof THREE.Material) {
            grid.material.opacity = 0.05;
            grid.material.transparent = true;
        }
        grid.position.y = 0.01;
        this.group.add(grid);
    }

    private buildWater() {
        const waterGeo = new THREE.CircleGeometry(ENV_CONSTANTS.POND_RADIUS, 32);
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
        this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
        this.waterMesh.rotation.x = -Math.PI / 2;
        this.waterMesh.position.set(ENV_CONSTANTS.POND_X, -0.4, ENV_CONSTANTS.POND_Z);
        this.waterMesh.name = 'pond_water';
        this.group.add(this.waterMesh);
    }

    update(dt: number) {
        if (this.waterMesh && this.waterMesh.material instanceof THREE.ShaderMaterial) {
            this.waterMesh.material.uniforms.uTime.value += dt;
        }
    }
}
