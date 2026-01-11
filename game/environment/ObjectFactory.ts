
import * as THREE from 'three';

export class ObjectFactory {
    static createTree(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
    
        // Majestic Proportions
        const trunkHeight = 4.8; 
        const trunkRadiusTop = 0.22;
        const trunkRadiusBot = 0.65; 
        const segmentCount = 6;
        const segHeight = trunkHeight / segmentCount;
        
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, flatShading: true });
        
        // TRUNK GROUP (Segmented)
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

        // ROOT FLARES
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

        // 2. FOLIAGE & BRANCHES
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
        
        // Materials for weathered dead wood
        const deadWoodMat = new THREE.MeshStandardMaterial({ 
            color: 0x2b231d, // Dark weathered bark
            roughness: 0.9, 
            flatShading: true 
        });
        const bleachedWoodMat = new THREE.MeshStandardMaterial({ 
            color: 0x9a8c81, // Lighter sun-bleached sections
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
                
                // Add some random twist and bend
                currentPivot.rotation.x = (Math.random() - 0.5) * 0.5;
                currentPivot.rotation.z = (Math.random() - 0.5) * 0.5;
                currentPivot.rotation.y = Math.random() * Math.PI * 2;

                const nextPivot = new THREE.Group();
                nextPivot.position.y = segLen;
                currentPivot.add(nextPivot);
                currentPivot = nextPivot;

                // Branching logic
                if (i === segmentCount - 1 && iterations > 1) {
                    const branchCount = 2 + Math.floor(Math.random() * 2);
                    for (let b = 0; b < branchCount; b++) {
                        addGnarledBranch(currentPivot, rTop, length * 0.7, iterations - 1);
                    }
                }
            }
        };

        // Main Trunk
        const trunkHeight = 2.5 + Math.random() * 1.5;
        const trunkRad = 0.45;
        
        // Base roots
        for (let i = 0; i < 6; i++) {
            const root = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 5), deadWoodMat);
            const angle = (i / 6) * Math.PI * 2;
            root.position.set(Math.cos(angle) * 0.4, 0.2, Math.sin(angle) * 0.4);
            root.rotation.x = 0.6 + Math.random() * 0.4;
            root.rotation.y = angle;
            group.add(root);
        }

        // Start gnarled recursion
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

        // 2. FOLIAGE
        const foliageGroup = new THREE.Group();
        foliageGroup.name = 'foliage';
        group.add(foliageGroup);

        // Autumn Palette
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

        // Segmented Full-height Trunk
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

        // Cones
        const layers = 4;
        const startY = 1.0;
        const layerHeight = 1.2;
        
        for (let i = 0; i < layers; i++) {
            const p = i / (layers - 1); // 0 to 1
            const rBot = 1.8 * (1.0 - p * 0.6);
            const rTop = 0.8 * (1.0 - p * 0.8);
            
            const coneGeo = new THREE.ConeGeometry(rBot, layerHeight, 8);
            const cone = new THREE.Mesh(coneGeo, leafMat);
            cone.position.y = startY + i * 0.9;
            cone.castShadow = true;
            group.add(cone);

            // Snow dusting on top of branches
            if (Math.random() > 0.3) {
                const snowGeo = new THREE.ConeGeometry(rBot * 0.95, layerHeight * 0.4, 8);
                const snow = new THREE.Mesh(snowGeo, snowMat);
                snow.position.y = cone.position.y + layerHeight * 0.1;
                group.add(snow);
            }
        }

        return { group, trunk: trunkGroup };
    }

    static createCactus(position: THREE.Vector3, scale: number = 1.0) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.scale.setScalar(scale);
        
        const mat = new THREE.MeshStandardMaterial({ color: 0x4caf50, flatShading: true });
        
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.5, 8), mat);
        trunk.position.y = 1.25;
        trunk.castShadow = true;
        trunk.userData = { type: 'hard', material: 'cactus' };
        group.add(trunk);
        
        // Arms
        const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.0, 8), mat);
        arm1.position.set(0.3, 1.5, 0);
        arm1.rotation.z = -Math.PI / 3;
        group.add(arm1);
        
        const arm1Up = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8), mat);
        arm1Up.position.set(0.65, 1.9, 0);
        group.add(arm1Up);

        return { group, trunk };
    }

    static createLightpole(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const mat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.5, 0.25), mat);
        post.position.y = 1.75;
        post.castShadow = true;
        post.userData = { type: 'hard', material: 'wood' };
        group.add(post);
        
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.15), mat);
        arm.position.set(0.3, 3.2, 0);
        group.add(arm);
        
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 }));
        lamp.position.set(0.6, 3.0, 0);
        group.add(lamp);
        
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 2 }));
        bulb.position.set(0.6, 2.9, 0);
        group.add(bulb);
        
        const pointLight = new THREE.PointLight(0xffaa00, 1, 8);
        pointLight.position.set(0.6, 2.8, 0);
        group.add(pointLight);

        return { group, obstacle: post };
    }

    static createBarrel(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const mat = new THREE.MeshStandardMaterial({ color: 0x6d4c41 });
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 1.0, 12), mat);
        barrel.position.y = 0.5;
        barrel.castShadow = true;
        barrel.userData = { type: 'hard', material: 'wood', isSkinnable: false };
        group.add(barrel);
        
        // Bands
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6 });
        const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.05, 12), bandMat);
        b1.position.y = 0.75;
        group.add(b1);
        
        const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.05, 12), bandMat);
        b2.position.y = 0.25;
        group.add(b2);

        return { group, obstacle: barrel };
    }

    static createCrate(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const mat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
        const crate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), mat);
        crate.position.y = 0.5;
        crate.castShadow = true;
        crate.userData = { type: 'hard', material: 'wood' };
        group.add(crate);
        
        return { group, obstacle: crate };
    }

    static createTire(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const mat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        const tire = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.15, 12, 24), mat);
        tire.position.y = 0.2;
        tire.rotation.x = Math.PI / 2;
        tire.castShadow = true;
        tire.userData = { type: 'hard', material: 'rubber' };
        group.add(tire);
        
        return { group, obstacle: tire };
    }

    static createCattail(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x33691e }));
        stem.position.y = 0.6;
        group.add(stem);
        
        const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.25, 4, 8), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
        head.position.y = 1.1;
        group.add(head);
        
        group.userData = { type: 'soft', phase: Math.random() * Math.PI };
        return group;
    }

    static createLilyPad(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const geo = new THREE.CircleGeometry(0.4, 16, 0, Math.PI * 1.8);
        const mat = new THREE.MeshStandardMaterial({ color: 0x4caf50, side: THREE.DoubleSide });
        const pad = new THREE.Mesh(geo, mat);
        pad.rotation.x = -Math.PI / 2;
        group.add(pad);
        
        group.userData = { type: 'soft', phase: Math.random() * Math.PI };
        return group;
    }

    static createDebrisChunk(position: THREE.Vector3, material: THREE.Material) {
        const geo = new THREE.DodecahedronGeometry(0.1, 0);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.copy(position);
        return mesh;
    }

    static createStump(position: THREE.Vector3, quaternion: THREE.Quaternion, material: THREE.Material) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.quaternion.copy(quaternion);
        
        const geo = new THREE.CylinderGeometry(0.65, 0.7, 0.6, 8);
        const stump = new THREE.Mesh(geo, material);
        stump.position.y = 0.3;
        stump.castShadow = true;
        stump.receiveShadow = true;
        stump.userData = { type: 'hard', material: 'wood' };
        
        group.add(stump);
        return group;
    }

    static createLogs(position: THREE.Vector3, quaternion: THREE.Quaternion) {
        const logs: THREE.Mesh[] = [];
        const mat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
        
        for(let i=0; i<3; i++) {
            const log = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8), mat);
            log.position.copy(position);
            log.position.x += (Math.random()-0.5)*2;
            log.position.z += (Math.random()-0.5)*2;
            log.position.y = 0.3;
            log.rotation.z = Math.PI/2;
            log.rotation.y = Math.random() * Math.PI;
            log.castShadow = true;
            log.userData = { type: 'hard', material: 'wood', isLog: true };
            logs.push(log);
        }
        return logs;
    }

    static createFallingTrunk(position: THREE.Vector3, material: THREE.Material) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const geo = new THREE.CylinderGeometry(0.22, 0.65, 4.2, 8);
        const trunk = new THREE.Mesh(geo, material);
        trunk.position.y = 2.1 + 0.6; // Offset for stump
        trunk.castShadow = true;
        
        group.add(trunk);
        return group;
    }

    static createRock(position: THREE.Vector3, scale: number) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const geo = new THREE.DodecahedronGeometry(1, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x757575, flatShading: true });
        const rock = new THREE.Mesh(geo, mat);
        rock.scale.set(scale, scale * 0.8, scale);
        rock.position.y = scale * 0.4;
        rock.castShadow = true;
        rock.receiveShadow = true;
        rock.userData = { type: 'hard', material: 'stone' };
        
        group.add(rock);
        return { group, rock };
    }

    static createDeadWolf(position: THREE.Vector3, rotationY: number) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.rotation.y = rotationY;

        const wolf = this.createWolfModel(0x555555);
        group.add(wolf.group);
        
        // Pose as dead
        wolf.group.rotation.z = Math.PI / 2; // Dead on side
        wolf.group.position.y = 0.15;
        
        // Splayed legs
        if (wolf.parts.legFR) wolf.parts.legFR.rotation.x = 0.8;
        if (wolf.parts.legFL) wolf.parts.legFL.rotation.x = -0.8;
        if (wolf.parts.legBR) wolf.parts.legBR.rotation.x = 1.2;
        if (wolf.parts.legBL) wolf.parts.legBL.rotation.x = -1.2;
        if (wolf.parts.head) wolf.parts.head.rotation.x = 0.5;

        // Make it skinnable
        const hitBox = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.5), new THREE.MeshBasicMaterial({ visible: false }));
        hitBox.userData = { type: 'hard', material: 'flesh', isSkinnable: true };
        group.add(hitBox);

        return { group, obstacle: hitBox };
    }

    static createWolfModel(color: number = 0x555555) {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
        const parts: any = {};

        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 1.1), mat);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);
        parts.body = body;

        // Head
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.9, 0.5);
        group.add(headGroup);
        parts.head = headGroup;

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), mat);
        head.position.z = 0.2;
        head.castShadow = true;
        headGroup.add(head);

        // Snout
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), mat);
        snout.position.set(0, -0.05, 0.55);
        snout.castShadow = true;
        headGroup.add(snout);

        // Ears
        const earGeo = new THREE.BoxGeometry(0.1, 0.2, 0.05);
        const earR = new THREE.Mesh(earGeo, mat);
        earR.position.set(0.15, 0.25, 0.1);
        headGroup.add(earR);
        const earL = new THREE.Mesh(earGeo, mat);
        earL.position.set(-0.15, 0.25, 0.1);
        headGroup.add(earL);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
        const createLeg = (x: number, z: number) => {
            const leg = new THREE.Mesh(legGeo, mat);
            leg.position.set(x, 0.3, z);
            leg.castShadow = true;
            group.add(leg);
            return leg;
        };

        parts.legFR = createLeg(0.2, 0.4);
        parts.legFL = createLeg(-0.2, 0.4);
        parts.legBR = createLeg(0.2, -0.4);
        parts.legBL = createLeg(-0.2, -0.4);

        // Tail
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.4), mat);
        tail.position.set(0, 0.7, -0.6);
        tail.rotation.x = -0.5;
        tail.castShadow = true;
        group.add(tail);
        parts.tail = tail;

        return { group, parts };
    }

    static createBlueBlock() {
        const height = 3.24; // 1.5 * approx standard player height (2.16)
        const geo = new THREE.BoxGeometry(height, height, height);
        const mat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(-4, height / 2, 0); // Positioned at -4 on X and half-height to sit on floor
        mesh.castShadow = true;
        mesh.userData = { type: 'hard', material: 'stone' };
        return mesh;
    }
}
