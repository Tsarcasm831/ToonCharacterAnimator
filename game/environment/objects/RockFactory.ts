
import * as THREE from 'three';

export class RockFactory {
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
}
