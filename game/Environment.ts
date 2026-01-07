import * as THREE from 'three';

interface TreeData {
    id: string;
    group: THREE.Group;
    trunk: THREE.Mesh;
    leaves: THREE.Mesh;
    health: number;
}

interface FallingObject {
    mesh: THREE.Group;
    velocity: number;
    axis: THREE.Vector3;
    angle: number;
}

export class Environment {
    obstacles: THREE.Object3D[] = [];
    scene: THREE.Scene;

    private trees: Map<string, TreeData> = new Map();
    private fallingObjects: FallingObject[] = [];

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.build(scene);
    }

    update(dt: number) {
        // Animate falling trees
        for (let i = this.fallingObjects.length - 1; i >= 0; i--) {
            const obj = this.fallingObjects[i];
            
            // Gravity acceleration for rotation
            obj.velocity += dt * 5.0; 
            const angleDelta = obj.velocity * dt;
            obj.angle += angleDelta;
            
            // Rotate around the pivot (bottom of trunk)
            obj.mesh.rotateOnWorldAxis(obj.axis, angleDelta);

            // Hit ground at 90 degrees (PI/2)
            if (obj.angle >= Math.PI / 2) {
                this.spawnLogs(obj.mesh);
                this.scene.remove(obj.mesh);
                this.fallingObjects.splice(i, 1);
            }
        }
    }

    damageObstacle(object: THREE.Object3D, amount: number): string | null {
        // Find if object is part of a registered tree
        // We registered the trunk mesh UUID
        const tree = this.trees.get(object.uuid);
        
        if (tree) {
            tree.health -= amount;
            if (tree.health <= 0) {
                this.cutDownTree(tree);
            }
            return 'wood';
        }
        
        // Return default material if not a destroyable tree
        return object.userData.material || null;
    }

    private cutDownTree(tree: TreeData) {
        // 1. Remove from obstacles to stop collision
        this.obstacles = this.obstacles.filter(o => o !== tree.trunk);
        this.trees.delete(tree.trunk.uuid);

        // 2. Hide original tree parts
        tree.trunk.visible = false;
        tree.leaves.visible = false; 

        // 3. Create Stump
        const trunkPos = new THREE.Vector3();
        tree.trunk.getWorldPosition(trunkPos);
        
        const stumpHeight = 0.4;
        const stump = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.5, stumpHeight, 7),
            tree.trunk.material
        );
        stump.position.copy(trunkPos);
        // Adjust Y to sit on ground (trunkPos was center of original trunk)
        stump.position.y = stumpHeight / 2;
        stump.castShadow = true;
        stump.receiveShadow = true;
        this.scene.add(stump);
        // Stump is still an obstacle
        stump.userData = { type: 'hard', material: 'wood' };
        this.obstacles.push(stump);

        // 4. Create Falling Trunk
        const fallGroup = new THREE.Group();
        // Pivot point at top of stump
        fallGroup.position.copy(trunkPos);
        fallGroup.position.y = stumpHeight; 
        
        const fallTrunkHeight = 1.6; // Remaining height (2.0 - 0.4)
        const fallTrunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.35, fallTrunkHeight, 7),
            tree.trunk.material
        );
        // Position cylinder center relative to pivot
        fallTrunk.position.y = fallTrunkHeight / 2;
        fallTrunk.castShadow = true;
        fallTrunk.receiveShadow = true;
        fallGroup.add(fallTrunk);
        
        this.scene.add(fallGroup);

        // Random fall direction
        const angle = Math.random() * Math.PI * 2;
        // Axis is perpendicular to fall direction
        const axis = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize();

        this.fallingObjects.push({
            mesh: fallGroup,
            velocity: 0,
            axis: axis,
            angle: 0
        });
    }

    private spawnLogs(fallingGroup: THREE.Object3D) {
        // Spawn 2 logs where the trunk fell
        const pos = fallingGroup.position.clone();
        const qt = fallingGroup.quaternion.clone();
        
        // Log 1
        const logMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
        const logGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.7, 7);
        
        const log1 = new THREE.Mesh(logGeo, logMat);
        log1.quaternion.copy(qt);
        // Move along the "up" vector of the falling group (which is now horizontal)
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(qt);
        log1.position.copy(pos).add(up.multiplyScalar(0.4));
        log1.castShadow = true;
        log1.receiveShadow = true;
        log1.userData = { type: 'hard', material: 'wood' };
        this.scene.add(log1);
        this.obstacles.push(log1);

        // Log 2
        const log2 = new THREE.Mesh(logGeo, logMat);
        log2.quaternion.copy(qt);
        log2.position.copy(pos).add(up.multiplyScalar(1.2)); 
        log2.castShadow = true;
        log2.receiveShadow = true;
        log2.userData = { type: 'hard', material: 'wood' };
        this.scene.add(log2);
        this.obstacles.push(log2);
    }

    private build(scene: THREE.Scene) {
        // Floor
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(100, 100),
          new THREE.MeshPhongMaterial({ color: 0xcccccc })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
    
        const grid = new THREE.GridHelper(100, 40, 0x000000, 0x000000);
        if(grid.material instanceof THREE.Material) {
            grid.material.opacity = 0.1;
            grid.material.transparent = true;
        }
        scene.add(grid);
    
        // 1. Blue Box
        const blockHeight = 3.5;
        const block = new THREE.Mesh(
            new THREE.BoxGeometry(2, blockHeight, 2), 
            new THREE.MeshPhongMaterial({ color: 0x4a90e2 })
        );
        block.position.set(3, blockHeight / 2, -2);
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData = { type: 'hard' };
        scene.add(block);
        this.obstacles.push(block);
    
        // 2. Tree
        this.createTree(new THREE.Vector3(-5, 0, -4));
    
        // 3. Rock
        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.9, 0),
            new THREE.MeshStandardMaterial({ color: 0x78909c, flatShading: true })
        );
        rock.position.set(2, 0.8, 4); 
        rock.scale.set(1.5, 1.0, 1.5);
        rock.castShadow = true;
        rock.receiveShadow = true;
        rock.userData = { type: 'hard', material: 'stone' };
        scene.add(rock);
        this.obstacles.push(rock);
    
        // 4. Dead Wolf
        const wolfGroup = new THREE.Group();
        wolfGroup.position.set(2.5, 0, 2.5);
        wolfGroup.rotation.y = Math.PI / 3;
        scene.add(wolfGroup);
        this.buildWolf(wolfGroup);
    }

    private createTree(position: THREE.Vector3) {
        const treeGroup = new THREE.Group();
        treeGroup.position.copy(position);
        this.scene.add(treeGroup);
    
        const trunkHeight = 2.0;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.5, trunkHeight, 7),
            new THREE.MeshStandardMaterial({ color: 0x5d4037 })
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        trunk.userData = { type: 'hard', material: 'wood' };
        treeGroup.add(trunk);
        this.obstacles.push(trunk);
    
        const leavesHeight = 4.5;
        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(2.5, leavesHeight, 8),
            new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
        );
        leaves.position.y = trunkHeight + leavesHeight / 2 - 0.2;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        leaves.userData = { type: 'soft' };
        treeGroup.add(leaves);
        this.obstacles.push(leaves);

        // Register Tree Data
        this.trees.set(trunk.uuid, {
            id: trunk.uuid,
            group: treeGroup,
            trunk: trunk,
            leaves: leaves,
            health: 8 // Hits required
        });
    }

    private buildWolf(group: THREE.Group) {
        const furMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 });
    
        // Blood Pool
        const bloodGeo = new THREE.CircleGeometry(0.7, 10);
        const bloodMat = new THREE.MeshBasicMaterial({ color: 0x4a0a0a, transparent: true, opacity: 0.7 });
        const blood = new THREE.Mesh(bloodGeo, bloodMat);
        blood.rotation.x = -Math.PI / 2;
        blood.position.y = 0.005;
        group.add(blood);
    
        // Torso
        const wBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.9), furMat);
        wBody.position.y = 0.2;
        wBody.rotation.z = Math.PI / 2; 
        wBody.rotation.y = 0.2; 
        wBody.castShadow = true;
        wBody.receiveShadow = true;
        group.add(wBody);
    
        // Head
        const wHead = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.4), furMat);
        wHead.position.set(0, 0.25, 0.65);
        wHead.rotation.z = Math.PI / 2.2;
        wHead.rotation.y = 0.2;
        wHead.castShadow = true;
        group.add(wHead);
    
        const wSnout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.25), furMat);
        wSnout.position.set(0, -0.1, 0.25);
        wHead.add(wSnout);
    
        // Ears
        const wEarGeo = new THREE.ConeGeometry(0.06, 0.15, 4);
        const wEarL = new THREE.Mesh(wEarGeo, furMat);
        wEarL.position.set(0.12, 0.2, 0);
        wEarL.rotation.x = -0.5;
        wHead.add(wEarL);
        
        const wEarR = new THREE.Mesh(wEarGeo, furMat);
        wEarR.position.set(-0.12, 0.2, 0);
        wEarR.rotation.x = -0.5;
        wHead.add(wEarR);
    
        // Legs
        const wLegGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.5);
        const wLegs = [
            { x: -0.2, y: 0.15, z: 0.3 }, 
            { x: -0.2, y: 0.15, z: -0.3 }, 
            { x: 0.2, y: 0.35, z: 0.35 }, 
            { x: 0.2, y: 0.35, z: -0.25 },
        ];
        wLegs.forEach(p => {
            const l = new THREE.Mesh(wLegGeo, furMat);
            l.position.set(p.x, p.y, p.z); 
            l.rotation.z = Math.PI / 2.5; 
            l.rotation.x = (Math.random() - 0.5) * 0.5;
            l.castShadow = true;
            group.add(l);
        });
    
        // Tail
        const wTail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.5), furMat);
        wTail.position.set(0, 0.1, -0.6);
        wTail.rotation.x = -1.2;
        wTail.rotation.z = -0.2;
        group.add(wTail);
    
        // Register Obstacle
        wBody.userData = { type: 'soft', isSkinnable: true, name: 'Dead Wolf' };
        this.obstacles.push(wBody);
    }
}