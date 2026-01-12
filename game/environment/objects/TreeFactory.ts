
import * as THREE from 'three';

export class TreeFactory {
    static createTree(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
    
        const trunkHeight = 4.8; 
        const trunkRadiusTop = 0.22;
        const trunkRadiusBot = 0.65; 
        const segmentCount = 6;
        const segHeight = trunkHeight / segmentCount;
        
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, flatShading: true });
        
        const trunkGroup = new THREE.Group();
        trunkGroup.userData = { type: 'hard', material: 'wood' };
        group.add(trunkGroup);

        for (let i = 0; i < segmentCount; i++) {
            const alphaBot = i / segmentCount;
            const alphaTop = (i + 1) / segmentCount;
            
            const rBot = THREE.MathUtils.lerp(trunkRadiusBot, trunkRadiusTop, alphaBot);
            const rTop = THREE.MathUtils.lerp(trunkRadiusBot, trunkRadiusTop, alphaTop);
            
            const seg = new THREE.Mesh(
                new THREE.CylinderGeometry(rTop, rBot, segHeight, 8),
                trunkMat
            );
            seg.position.y = (i * segHeight) + (segHeight / 2);
            seg.castShadow = true;
            seg.receiveShadow = true;
            trunkGroup.add(seg);
        }

        for (let i = 0; i < 5; i++) {
            const root = new THREE.Mesh(
                new THREE.ConeGeometry(0.4, 0.8, 5),
                trunkMat
            );
            const angle = (i / 5) * Math.PI * 2;
            root.position.set(Math.cos(angle) * 0.45, 0.2, Math.sin(angle) * 0.45);
            root.rotation.x = 0.5;
            root.rotation.y = angle;
            group.add(root);
        }

        const foliageGroup = new THREE.Group();
        foliageGroup.name = 'foliage';
        group.add(foliageGroup);

        const clumps = [
            { x: 0, y: trunkHeight + 0.5, z: 0, s: 1.4, c: 0x2e7d32 },
            { x: 0.4, y: trunkHeight + 0.2, z: 0.4, s: 1.0, c: 0x388e3c },
            { x: -0.4, y: trunkHeight + 0.3, z: -0.4, s: 0.9, c: 0x1b5e20 },
            { x: 1.2, y: trunkHeight * 0.85, z: 0.6, s: 1.1, c: 0x2e7d32 },
            { x: -1.1, y: trunkHeight * 0.82, z: 0.8, s: 1.0, c: 0x4caf50 },
            { x: 0.2, y: trunkHeight * 0.78, z: -1.3, s: 1.2, c: 0x1b5e20 },
            { x: -1.3, y: trunkHeight * 0.65, z: -0.8, s: 0.85, c: 0x388e3c },
            { x: 1.4, y: trunkHeight * 0.62, z: -0.4, s: 0.8, c: 0x2e7d32 },
            { x: 0.5, y: trunkHeight * 0.58, z: 1.2, s: 0.75, c: 0x66bb6a },
        ];

        clumps.forEach(cfg => {
            const geo = new THREE.DodecahedronGeometry(1, 1);
            const mat = new THREE.MeshStandardMaterial({ 
                color: cfg.c, 
                flatShading: true,
                roughness: 0.8
            });
            
            const clump = new THREE.Mesh(geo, mat);
            clump.position.set(cfg.x, cfg.y, cfg.z);
            clump.scale.setScalar(cfg.s);
            clump.castShadow = true;
            clump.receiveShadow = true;
            clump.userData = { type: 'soft', initialY: cfg.y, phase: Math.random() * Math.PI * 2 };
            foliageGroup.add(clump);

            const dist = Math.sqrt(cfg.x * cfg.x + cfg.z * cfg.z);
            if (dist > 0.4) {
                const bDir = new THREE.Vector3(cfg.x, cfg.y - (trunkHeight * 0.05), cfg.z);
                const trunkPoint = new THREE.Vector3(0, cfg.y - 0.5, 0); 
                
                const bVec = new THREE.Vector3().subVectors(bDir, trunkPoint);
                const bLen = bVec.length();
                
                const branch = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.04, 0.12, bLen, 5),
                    trunkMat
                );
                branch.position.copy(trunkPoint).add(bVec.clone().multiplyScalar(0.5));
                branch.lookAt(bDir.add(group.position));
                branch.rotateX(Math.PI/2);
                foliageGroup.add(branch);
            }
        });

        return { group, trunk: trunkGroup, leaves: foliageGroup as any };
    }

    static createDeadTree(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const deadWoodMat = new THREE.MeshStandardMaterial({ 
            color: 0x2b231d, 
            roughness: 0.9, 
            flatShading: true 
        });
        const bleachedWoodMat = new THREE.MeshStandardMaterial({ 
            color: 0x9a8c81, 
            roughness: 0.8,
            flatShading: true 
        });

        const addGnarledBranch = (parent: THREE.Group | THREE.Mesh, startRad: number, length: number, iterations: number) => {
            if (iterations <= 0) return;

            const segmentCount = 3;
            const segLen = length / segmentCount;
            let currentPivot = new THREE.Group();
            parent.add(currentPivot);

            for (let i = 0; i < segmentCount; i++) {
                const rTop = startRad * (1 - (i + 1) / (segmentCount + iterations));
                const rBot = startRad * (1 - i / (segmentCount + iterations));
                
                const geo = new THREE.CylinderGeometry(rTop, rBot, segLen, 6);
                const mesh = new THREE.Mesh(geo, iterations > 1 ? deadWoodMat : bleachedWoodMat);
                mesh.position.y = segLen / 2;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                
                currentPivot.add(mesh);
                
                currentPivot.rotation.x = (Math.random() - 0.5) * 0.5;
                currentPivot.rotation.z = (Math.random() - 0.5) * 0.5;
                currentPivot.rotation.y = Math.random() * Math.PI * 2;

                const nextPivot = new THREE.Group();
                nextPivot.position.y = segLen;
                currentPivot.add(nextPivot);
                currentPivot = nextPivot;

                if (i === segmentCount - 1 && iterations > 1) {
                    const branchCount = 2 + Math.floor(Math.random() * 2);
                    for (let b = 0; b < branchCount; b++) {
                        addGnarledBranch(currentPivot, rTop, length * 0.7, iterations - 1);
                    }
                }
            }
        };

        const trunkHeight = 2.5 + Math.random() * 1.5;
        const trunkRad = 0.45;
        
        for (let i = 0; i < 6; i++) {
            const root = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 5), deadWoodMat);
            const angle = (i / 6) * Math.PI * 2;
            root.position.set(Math.cos(angle) * 0.4, 0.2, Math.sin(angle) * 0.4);
            root.rotation.x = 0.6 + Math.random() * 0.4;
            root.rotation.y = angle;
            group.add(root);
        }

        addGnarledBranch(group as any, trunkRad, trunkHeight, 3);

        return { group, obstacle: group };
    }

    static createAutumnTree(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
    
        const trunkHeight = 4.8; 
        const trunkRadiusTop = 0.22;
        const trunkRadiusBot = 0.65; 
        const segmentCount = 6;
        const segHeight = trunkHeight / segmentCount;
        
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, flatShading: true });
        
        const trunkGroup = new THREE.Group();
        trunkGroup.userData = { type: 'hard', material: 'wood' };
        group.add(trunkGroup);

        for (let i = 0; i < segmentCount; i++) {
            const rBot = THREE.MathUtils.lerp(trunkRadiusBot, trunkRadiusTop, i / segmentCount);
            const rTop = THREE.MathUtils.lerp(trunkRadiusBot, trunkRadiusTop, (i + 1) / segmentCount);
            const seg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, segHeight, 8), trunkMat);
            seg.position.y = (i * segHeight) + (segHeight / 2);
            seg.castShadow = true;
            seg.receiveShadow = true;
            trunkGroup.add(seg);
        }

        for (let i = 0; i < 5; i++) {
            const root = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 5), trunkMat);
            const angle = (i / 5) * Math.PI * 2;
            root.position.set(Math.cos(angle) * 0.45, 0.2, Math.sin(angle) * 0.45);
            root.rotation.x = 0.5;
            root.rotation.y = angle;
            group.add(root);
        }

        const foliageGroup = new THREE.Group();
        foliageGroup.name = 'foliage';
        group.add(foliageGroup);

        const autumnColors = [0xea580c, 0xc2410c, 0xfacc15, 0x9a3412, 0xd97706];

        const clumps = [
            { x: 0, y: trunkHeight + 0.5, z: 0, s: 1.4 },
            { x: 0.4, y: trunkHeight + 0.2, z: 0.4, s: 1.0 },
            { x: -0.4, y: trunkHeight + 0.3, z: -0.4, s: 0.9 },
            { x: 1.2, y: trunkHeight * 0.85, z: 0.6, s: 1.1 },
            { x: -1.1, y: trunkHeight * 0.82, z: 0.8, s: 1.0 },
            { x: 0.2, y: trunkHeight * 0.78, z: -1.3, s: 1.2 },
            { x: -1.3, y: trunkHeight * 0.65, z: -0.8, s: 0.85 },
            { x: 1.4, y: trunkHeight * 0.62, z: -0.4, s: 0.8 },
            { x: 0.5, y: trunkHeight * 0.58, z: 1.2, s: 0.75 },
        ];

        clumps.forEach((cfg, i) => {
            const color = autumnColors[i % autumnColors.length];
            const geo = new THREE.DodecahedronGeometry(1, 1);
            const mat = new THREE.MeshStandardMaterial({ 
                color: color, 
                flatShading: true,
                roughness: 0.9
            });
            
            const clump = new THREE.Mesh(geo, mat);
            clump.position.set(cfg.x, cfg.y, cfg.z);
            clump.scale.setScalar(cfg.s);
            clump.castShadow = true;
            clump.receiveShadow = true;
            clump.userData = { type: 'soft', initialY: cfg.y, phase: Math.random() * Math.PI * 2 };
            foliageGroup.add(clump);

            const dist = Math.sqrt(cfg.x * cfg.x + cfg.z * cfg.z);
            if (dist > 0.4) {
                const bDir = new THREE.Vector3(cfg.x, cfg.y - (trunkHeight * 0.05), cfg.z);
                const trunkPoint = new THREE.Vector3(0, cfg.y - 0.5, 0); 
                const bVec = new THREE.Vector3().subVectors(bDir, trunkPoint);
                
                const branch = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.04, 0.12, bVec.length(), 5),
                    trunkMat
                );
                branch.position.copy(trunkPoint).add(bVec.clone().multiplyScalar(0.5));
                branch.lookAt(bDir.add(group.position));
                branch.rotateX(Math.PI/2);
                foliageGroup.add(branch);
            }
        });

        return { group, trunk: trunkGroup, leaves: foliageGroup as any };
    }

    static createPineTree(position: THREE.Vector3, scale: number = 1.0) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.scale.setScalar(scale);

        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, flatShading: true });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, flatShading: true, roughness: 0.9 });
        const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });

        const trunkH = 4.5;
        const trunkGroup = new THREE.Group();
        trunkGroup.userData = { type: 'hard', material: 'wood' };
        group.add(trunkGroup);

        const segCount = 6;
        const segH = trunkH / segCount;

        for (let i = 0; i < segCount; i++) {
            const rBot = THREE.MathUtils.lerp(0.3, 0.05, i / segCount);
            const rTop = THREE.MathUtils.lerp(0.3, 0.05, (i + 1) / segCount);
            
            const seg = new THREE.Mesh(
                new THREE.CylinderGeometry(rTop, rBot, segH, 7),
                trunkMat
            );
            seg.position.y = (i * segH) + (segH / 2);
            seg.castShadow = true;
            trunkGroup.add(seg);
        }

        const layers = 4;
        const startY = 1.0;
        const layerHeight = 1.2;
        
        for (let i = 0; i < layers; i++) {
            const p = i / (layers - 1); 
            const rBot = 1.8 * (1.0 - p * 0.6);
            
            const coneGeo = new THREE.ConeGeometry(rBot, layerHeight, 8);
            const cone = new THREE.Mesh(coneGeo, leafMat);
            cone.position.y = startY + i * 0.9;
            cone.castShadow = true;
            group.add(cone);

            if (Math.random() > 0.3) {
                const snowGeo = new THREE.ConeGeometry(rBot * 0.95, layerHeight * 0.4, 8);
                const snow = new THREE.Mesh(snowGeo, snowMat);
                snow.position.y = cone.position.y + layerHeight * 0.1;
                group.add(snow);
            }
        }

        return { group, trunk: trunkGroup };
    }
}
