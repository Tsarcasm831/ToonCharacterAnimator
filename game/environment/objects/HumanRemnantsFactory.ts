
import * as THREE from 'three';
import { RockFactory } from './RockFactory';

export class HumanRemnantsFactory {
    private static materials: Map<string, THREE.Material> = new Map();
    private static geometries: Map<string, THREE.BufferGeometry> = new Map();

    private static getMaterial(color: number, name: string, options: any = {}): THREE.Material {
        if (!this.materials.has(name)) {
            const params = { color, ...options };
            this.materials.set(name, new THREE.MeshStandardMaterial(params));
        }
        return this.materials.get(name)!;
    }

    private static getGeometry(name: string, createFn: () => THREE.BufferGeometry): THREE.BufferGeometry {
        if (!this.geometries.has(name)) {
            this.geometries.set(name, createFn());
        }
        return this.geometries.get(name)!;
    }

    static createFence(position: THREE.Vector3, rotationY: number) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.rotation.y = rotationY;

        const woodMat = this.getMaterial(0x5d4037, 'fence_wood', { roughness: 0.9, flatShading: true });
        
        // Two posts
        const postGeo = this.getGeometry('fence_post', () => new THREE.BoxGeometry(0.12, 1.2, 0.12));
        const post1 = new THREE.Mesh(postGeo, woodMat);
        post1.position.set(-0.95, 0.6, 0);
        post1.rotation.y = Math.random();
        post1.castShadow = true;
        group.add(post1);

        const post2 = new THREE.Mesh(postGeo, woodMat);
        post2.position.set(0.95, 0.6, 0);
        post2.rotation.y = Math.random();
        post2.castShadow = true;
        group.add(post2);

        // Two horizontal rails
        const railGeo = this.getGeometry('fence_rail', () => new THREE.BoxGeometry(2.0, 0.1, 0.06));
        const rail1 = new THREE.Mesh(railGeo, woodMat);
        rail1.position.set(0, 0.95, 0);
        rail1.castShadow = true;
        group.add(rail1);

        const rail2 = new THREE.Mesh(railGeo, woodMat);
        rail2.position.set(0, 0.45, 0);
        rail2.castShadow = true;
        group.add(rail2);

        // Random brokenness/tilt
        if (Math.random() > 0.5) {
            rail1.rotation.z = (Math.random() - 0.5) * 0.15;
            group.rotation.x = (Math.random() - 0.5) * 0.1;
        }

        group.userData = { type: 'hard', material: 'wood' };
        return group;
    }

    static createPallet(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);

        const woodMat = this.getMaterial(0x8d6e63, 'pallet_wood', { roughness: 0.95, flatShading: true });
        
        // Base runners
        const runnerGeo = this.getGeometry('pallet_runner', () => new THREE.BoxGeometry(1.2, 0.1, 0.08));
        for(let i=-1; i<=1; i++) {
            const runner = new THREE.Mesh(runnerGeo, woodMat);
            runner.position.set(0, 0.05, i * 0.45);
            runner.castShadow = true;
            group.add(runner);
        }

        // Top slats
        const slatGeo = this.getGeometry('pallet_slat', () => new THREE.BoxGeometry(0.12, 0.02, 1.2));
        for(let i=0; i<6; i++) {
            const slat = new THREE.Mesh(slatGeo, woodMat);
            slat.position.set(-0.5 + i * 0.2, 0.11, 0);
            slat.castShadow = true;
            group.add(slat);
        }

        group.userData = { type: 'hard', material: 'wood' };
        return group;
    }

    static createCampfire(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);

        // 1. Ash circle
        const ashGeo = this.getGeometry('campfire_ash', () => new THREE.CircleGeometry(0.65, 12));
        const ashMat = this.getMaterial(0x1a1a1a, 'campfire_ash', { roughness: 1.0 });
        const ash = new THREE.Mesh(ashGeo, ashMat);
        ash.rotation.x = -Math.PI/2;
        ash.position.y = 0.01;
        group.add(ash);

        // 2. Invisible Collision Cylinder
        // This ensures the player can't walk into the fire
        const collisionGeo = this.getGeometry('campfire_collision', () => new THREE.CylinderGeometry(0.75, 0.75, 1.0, 8));
        const collisionMat = new THREE.MeshBasicMaterial({ visible: false });
        const collision = new THREE.Mesh(collisionGeo, collisionMat);
        collision.position.y = 0.5;
        collision.userData = { type: 'hard', material: 'stone' };
        group.add(collision);

        // 3. Ring of rocks
        const rockMat = this.getMaterial(0x666666, 'campfire_rock', { flatShading: true });
        const rockGeo = this.getGeometry('campfire_rock', () => new THREE.DodecahedronGeometry(0.18, 0));

        for(let i=0; i<8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r = 0.65 + Math.random() * 0.1;
            const rock = new THREE.Mesh(rockGeo, rockMat);
            rock.position.set(Math.cos(angle) * r, 0.1, Math.sin(angle) * r);
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            rock.castShadow = true;
            group.add(rock);
        }

        // 4. Charred logs
        const logMat = this.getMaterial(0x111111, 'campfire_log', { roughness: 1.0 });
        const logGeo = this.getGeometry('campfire_log', () => new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6));
        for(let i=0; i<3; i++) {
            const log = new THREE.Mesh(logGeo, logMat);
            log.position.y = 0.08;
            log.rotation.z = Math.PI/2;
            log.rotation.y = (i/3) * Math.PI * 2 + Math.random();
            group.add(log);
        }

        // 5. Procedural Flames
        const flameColors = [0xff6600, 0xffaa00, 0xffff00];
        const flameGeo = new THREE.DodecahedronGeometry(1, 0);

        flameColors.forEach((color, i) => {
            const fMat = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 2.5,
                transparent: true,
                opacity: 0.6 + (i * 0.1),
                blending: THREE.AdditiveBlending
            });
            const flame = new THREE.Mesh(flameGeo, fMat);
            // Smaller as they get hotter/inner
            const s = 0.35 - (i * 0.08);
            flame.scale.set(s, s * 1.8, s);
            flame.position.y = 0.1 + (i * 0.05);
            flame.userData = { 
                isFlame: true, 
                phase: Math.random() * Math.PI * 2,
                baseScale: s,
                baseY: flame.position.y
            };
            group.add(flame);
        });

        // 6. Firelight
        const fireLight = new THREE.PointLight(0xffaa00, 1.5, 6);
        fireLight.position.set(0, 0.5, 0);
        fireLight.userData = { isFlameLight: true, phase: Math.random() * Math.PI * 2 };
        group.add(fireLight);

        group.userData = { type: 'hard', material: 'stone' }; 
        return group;
    }

    static createRoadSign(position: THREE.Vector3, type: 'stop' | 'yield' = 'stop') {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const metalMat = this.getMaterial(0x444444, 'sign_post_metal', { metalness: 0.7, roughness: 0.4 });
        const postGeo = this.getGeometry('sign_post', () => new THREE.CylinderGeometry(0.035, 0.04, 2.8, 6));
        const post = new THREE.Mesh(postGeo, metalMat);
        post.position.y = 1.4;
        post.rotation.z = (Math.random() - 0.5) * 0.2; 
        group.add(post);

        const signMat = this.getMaterial(type === 'stop' ? 0x991b1b : 0xd9a100, `sign_face_${type}`, { flatShading: true });
        
        let signGeo;
        if (type === 'stop') {
             signGeo = this.getGeometry('sign_shape_stop', () => new THREE.CircleGeometry(0.35, 8)); // Octagon
        } else {
             signGeo = this.getGeometry('sign_shape_yield', () => new THREE.CircleGeometry(0.35, 3)); // Triangle
        }
        
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 2.4, 0.05);
        sign.rotation.copy(post.rotation);
        sign.castShadow = true;
        group.add(sign);

        group.userData = { type: 'hard', material: 'metal' };
        return group;
    }
}
