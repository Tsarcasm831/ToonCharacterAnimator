
import * as THREE from 'three';

export class RockFactory {
    private static formationMaterials: Map<string, THREE.Material> = new Map();
    private static formationGeometries: Map<string, THREE.BufferGeometry> = new Map();

    private static getFormationMaterial(name: string, color: number): THREE.Material {
        if (!this.formationMaterials.has(name)) {
            this.formationMaterials.set(name, new THREE.MeshStandardMaterial({
                color,
                roughness: 0.92,
                metalness: 0.02,
                flatShading: true
            }));
        }
        return this.formationMaterials.get(name)!;
    }

    private static getFormationGeometry(name: string, create: () => THREE.BufferGeometry): THREE.BufferGeometry {
        if (!this.formationGeometries.has(name)) {
            this.formationGeometries.set(name, create());
        }
        return this.formationGeometries.get(name)!;
    }

    static createRock(position: THREE.Vector3, scale: number) {
        try {
            const group = new THREE.Group();
            group.position.copy(position);

            // --- 1. THE EXTERIOR (Unchanged Look) ---
            const geo = new THREE.DodecahedronGeometry(1, 1);
            const mat = new THREE.MeshStandardMaterial({ 
                color: 0x757575, 
                flatShading: true 
            });
            const rock = new THREE.Mesh(geo, mat);
            rock.scale.set(scale, scale * 0.8, scale);
            rock.position.y = scale * 0.4;
            rock.castShadow = true;
            rock.receiveShadow = true;
            
            // --- 2. THE CRYSTALLINE INTERIOR ---
            // We create a group to hold the shards
            const crystalInterior = new THREE.Group();
            crystalInterior.visible = false; // Hidden until "shatter"

            const crystalMat = new THREE.MeshPhongMaterial({
                color: 0x00e5ff, // Example: Cyan crystal
                shininess: 100,
                transparent: true,
                opacity: 0.9,
                flatShading: true
            });

            // Generate 5-8 internal shards
            for (let i = 0; i < 6; i++) {
                const shardGeo = new THREE.TetrahedronGeometry(scale * 0.5, 0);
                const shard = new THREE.Mesh(shardGeo, crystalMat);
                
                // Randomly position and rotate shards inside the rock's volume
                shard.position.set(
                    (Math.random() - 0.5) * scale,
                    (Math.random() - 0.5) * scale,
                    (Math.random() - 0.5) * scale
                );
                shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                shard.scale.set(Math.random() + 0.5, Math.random() + 0.5, Math.random() + 0.5);
                
                crystalInterior.add(shard);
            }

            group.add(rock);
            group.add(crystalInterior);

            // Store references for the shattering logic
            rock.userData = { 
                type: 'hard', 
                material: 'stone', 
                isShell: true,
                shards: crystalInterior 
            };

            return { group, rock, crystalInterior };
        } catch (e) {
            console.error("RockFactory: Error creating rock", e);
            return { group: undefined, rock: undefined };
        }
    }

    static shatterRock(rockMesh: THREE.Mesh) {
        const shards = rockMesh.userData.shards as THREE.Group;
        if (!shards) return;
        
        // Hide the outer shell
        rockMesh.visible = false;
        
        // Show the crystals
        shards.visible = true;
        
        // Optional: Animate the shards flying outward
        shards.children.forEach((child) => {
            const shard = child as THREE.Mesh;
            const direction = shard.position.clone().normalize();
            // Simple manual animation property:
            shard.userData.velocity = direction.multiplyScalar(0.1);
        });
    }

    static createCopperOreRock(position: THREE.Vector3, scale: number) {
        try {
            const group = new THREE.Group();
            group.position.copy(position);
            
            const geo = new THREE.DodecahedronGeometry(1, 1);
            const mat = new THREE.MeshStandardMaterial({ color: 0x757575, flatShading: true });
            const rock = new THREE.Mesh(geo, mat);
            rock.scale.set(scale, scale * 0.8, scale);
            rock.position.y = scale * 0.4;
            rock.castShadow = true;
            rock.receiveShadow = true;
            rock.userData = { type: 'hard', material: 'stone', hasOre: true, oreType: 'copper' };
            
            group.add(rock);

            const copperChunks = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < copperChunks; i++) {
                const chunkGeo = new THREE.DodecahedronGeometry(0.15, 0);
                const copperMat = new THREE.MeshStandardMaterial({ 
                    color: 0xb87333, 
                    metalness: 0.8, 
                    roughness: 0.3,
                    flatShading: true 
                });
                const chunk = new THREE.Mesh(chunkGeo, copperMat);
                
                const angle = (i / copperChunks) * Math.PI * 2 + Math.random() * 0.5;
                const distance = scale * (0.3 + Math.random() * 0.4);
                const height = scale * (0.2 + Math.random() * 0.6);
                
                chunk.position.set(
                    Math.cos(angle) * distance,
                    height,
                    Math.sin(angle) * distance
                );
                
                chunk.scale.set(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4);
                chunk.castShadow = true;
                chunk.receiveShadow = true;
                chunk.userData = { type: 'ore', material: 'copper' };
                
                rock.add(chunk);
            }
            
            return { group, rock };
        } catch (e) {
            console.error("RockFactory: Error creating copper ore rock", e);
            return { group: undefined, rock: undefined };
        }
    }

    static createRockFormation(position: THREE.Vector3, scale: number = 1.0) {
        try {
            const group = new THREE.Group();
            group.position.copy(position);
            group.rotation.y = Math.random() * Math.PI * 2;

            const formation = new THREE.Group();
            formation.userData = { type: 'hard', material: 'stone', structureType: 'rock_formation' };
            group.add(formation);

            const darkMat = this.getFormationMaterial('formation_dark_stone', 0x4b5052);
            const midMat = this.getFormationMaterial('formation_mid_stone', 0x6c7171);
            const lightMat = this.getFormationMaterial('formation_light_stone', 0x8a8780);

            const coreGeo = this.getFormationGeometry('formation_core', () => new THREE.DodecahedronGeometry(1, 0));
            const slabGeo = this.getFormationGeometry('formation_slab', () => new THREE.BoxGeometry(1, 1, 1, 2, 1, 2));
            const spireGeo = this.getFormationGeometry('formation_spire', () => new THREE.ConeGeometry(0.55, 1.9, 6));
            const shardGeo = this.getFormationGeometry('formation_shard', () => new THREE.TetrahedronGeometry(0.9, 0));

            const variants = [
                [
                    { geo: coreGeo, mat: midMat, pos: [0, 0.56, 0], scale: [1.35, 0.72, 1.0], rot: [0.08, 0.4, -0.08] },
                    { geo: coreGeo, mat: darkMat, pos: [-0.78, 0.52, 0.15], scale: [0.86, 0.62, 0.7], rot: [0.2, -0.2, 0.16] },
                    { geo: coreGeo, mat: lightMat, pos: [0.82, 0.48, -0.1], scale: [0.78, 0.58, 0.92], rot: [-0.18, 0.8, -0.12] },
                    { geo: spireGeo, mat: darkMat, pos: [-0.34, 1.48, -0.16], scale: [0.72, 0.98, 0.58], rot: [0.18, 0.35, -0.28] },
                    { geo: spireGeo, mat: midMat, pos: [0.42, 1.3, 0.08], scale: [0.62, 0.86, 0.5], rot: [-0.24, -0.55, 0.22] },
                    { geo: shardGeo, mat: lightMat, pos: [0.08, 2.12, -0.08], scale: [0.48, 0.78, 0.42], rot: [0.38, 0.22, -0.18] },
                    { geo: shardGeo, mat: darkMat, pos: [-1.08, 0.92, -0.42], scale: [0.38, 0.62, 0.34], rot: [-0.4, 0.7, 0.34] },
                ],
                [
                    { geo: slabGeo, mat: darkMat, pos: [-0.18, 0.38, 0.04], scale: [1.65, 0.42, 1.05], rot: [0.05, 0.28, -0.1] },
                    { geo: coreGeo, mat: midMat, pos: [-0.95, 0.44, -0.18], scale: [0.82, 0.5, 0.74], rot: [0.16, -0.45, 0.2] },
                    { geo: coreGeo, mat: lightMat, pos: [0.84, 0.5, 0.1], scale: [0.92, 0.56, 0.72], rot: [-0.22, 0.72, -0.12] },
                    { geo: slabGeo, mat: midMat, pos: [0.18, 0.92, -0.16], scale: [0.95, 0.36, 0.78], rot: [-0.28, -0.2, 0.22] },
                    { geo: shardGeo, mat: darkMat, pos: [1.15, 0.96, -0.42], scale: [0.44, 0.62, 0.36], rot: [0.38, -0.68, -0.28] },
                ],
                [
                    { geo: coreGeo, mat: darkMat, pos: [-0.22, 0.55, 0.04], scale: [1.0, 0.68, 1.08], rot: [0.14, 0.18, -0.12] },
                    { geo: coreGeo, mat: midMat, pos: [0.66, 0.5, -0.26], scale: [0.78, 0.54, 0.74], rot: [-0.16, -0.6, 0.12] },
                    { geo: coreGeo, mat: lightMat, pos: [-0.82, 0.42, 0.28], scale: [0.62, 0.48, 0.68], rot: [0.22, 0.95, -0.2] },
                    { geo: spireGeo, mat: darkMat, pos: [-0.08, 1.34, -0.1], scale: [0.58, 0.9, 0.5], rot: [0.2, 0.16, -0.12] },
                    { geo: shardGeo, mat: midMat, pos: [0.44, 1.58, 0.22], scale: [0.42, 0.7, 0.36], rot: [-0.38, -0.45, 0.34] },
                    { geo: spireGeo, mat: lightMat, pos: [-0.62, 1.02, 0.14], scale: [0.34, 0.58, 0.32], rot: [-0.28, 0.72, 0.22] },
                ],
            ];

            const boulders = variants[Math.floor(Math.random() * variants.length)];

            boulders.forEach((cfg) => {
                const mesh = new THREE.Mesh(cfg.geo, cfg.mat);
                mesh.position.set(cfg.pos[0] * scale, cfg.pos[1] * scale, cfg.pos[2] * scale);
                mesh.scale.set(cfg.scale[0] * scale, cfg.scale[1] * scale, cfg.scale[2] * scale);
                mesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                formation.add(mesh);
            });

            formation.scale.set(1.0, 1.0, 0.88 + Math.random() * 0.22);

            return { group, obstacle: formation };
        } catch (e) {
            console.error("RockFactory: Error creating rock formation", e);
            return { group: undefined, obstacle: undefined };
        }
    }

    static createMudClump(position: THREE.Vector3, scale: number = 1.0) {
        try {
            const group = new THREE.Group();
            group.position.copy(position);
            group.rotation.y = Math.random() * Math.PI * 2;

            const clump = new THREE.Group();
            clump.userData = { type: 'hard', material: 'mud', structureType: 'mud_clump' };
            group.add(clump);

            const mudMat = new THREE.MeshStandardMaterial({
                color: 0x5d4037,
                roughness: 0.95,
                metalness: 0.0,
                flatShading: true
            });

            const mudGeo = new THREE.DodecahedronGeometry(1, 0);
            const mudGeo2 = new THREE.DodecahedronGeometry(0.7, 0);
            const mudGeo3 = new THREE.DodecahedronGeometry(0.5, 0);

            const mounds = [
                { geo: mudGeo, pos: [0, 0.3, 0], scale: [1.0, 0.6, 0.9], rot: [0.1, 0.3, -0.05] },
                { geo: mudGeo2, pos: [-0.4, 0.25, 0.2], scale: [0.8, 0.5, 0.7], rot: [-0.15, -0.4, 0.1] },
                { geo: mudGeo2, pos: [0.5, 0.2, -0.15], scale: [0.7, 0.45, 0.65], rot: [0.2, 0.5, -0.12] },
                { geo: mudGeo3, pos: [-0.2, 0.5, 0.3], scale: [0.6, 0.4, 0.5], rot: [0.25, 0.2, -0.08] },
                { geo: mudGeo3, pos: [0.3, 0.45, -0.25], scale: [0.55, 0.35, 0.48], rot: [-0.1, -0.3, 0.15] },
            ];

            mounds.forEach((cfg) => {
                const mesh = new THREE.Mesh(cfg.geo, mudMat);
                mesh.position.set(cfg.pos[0] * scale, cfg.pos[1] * scale, cfg.pos[2] * scale);
                mesh.scale.set(cfg.scale[0] * scale, cfg.scale[1] * scale, cfg.scale[2] * scale);
                mesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                clump.add(mesh);
            });

            clump.scale.set(1.0, 1.0, 0.9 + Math.random() * 0.2);

            return { group, obstacle: clump };
        } catch (e) {
            console.error("RockFactory: Error creating mud clump", e);
            return { group: undefined, obstacle: undefined };
        }
    }
}
