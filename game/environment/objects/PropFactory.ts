
import * as THREE from 'three';

export class PropFactory {
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

    static createLightpole(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const mat = this.getMaterial(0x3e2723, 'prop_lightpole_wood');
        const postGeo = this.getGeometry('prop_lightpole_post', () => new THREE.BoxGeometry(0.25, 3.5, 0.25));
        
        const post = new THREE.Mesh(postGeo, mat);
        post.position.y = 1.75; // Center of 3.5m tall post
        post.castShadow = true;
        post.userData = { type: 'hard', material: 'wood', structureType: 'lightpole' };
        group.add(post);
        
        const armGeo = this.getGeometry('prop_lightpole_arm', () => new THREE.BoxGeometry(0.8, 0.15, 0.15));
        const arm = new THREE.Mesh(armGeo, mat);
        arm.position.set(0.3, 3.2, 0);
        group.add(arm);
        
        const lampMat = this.getMaterial(0x222222, 'prop_lightpole_lamp', { metalness: 0.8 });
        const lampGeo = this.getGeometry('prop_lightpole_lamp', () => new THREE.CylinderGeometry(0.1, 0.15, 0.3, 6));
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set(0.6, 3.0, 0);
        group.add(lamp);
        
        const bulbMat = this.getMaterial(0xffffaa, 'prop_lightpole_bulb', { emissive: 0xffffaa, emissiveIntensity: 2 });
        const bulbGeo = this.getGeometry('prop_lightpole_bulb', () => new THREE.SphereGeometry(0.08, 8, 8));
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
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
        
        const mat = this.getMaterial(0x6d4c41, 'prop_barrel_wood');
        const barrelGeo = this.getGeometry('prop_barrel_body', () => new THREE.CylinderGeometry(0.4, 0.35, 1.0, 12));
        
        const barrel = new THREE.Mesh(barrelGeo, mat);
        barrel.position.y = 0.5;
        barrel.castShadow = true;
        barrel.userData = { type: 'hard', material: 'wood', isSkinnable: false };
        group.add(barrel);
        
        const bandMat = this.getMaterial(0x222222, 'prop_barrel_band', { metalness: 0.6 });
        const band1Geo = this.getGeometry('prop_barrel_band1', () => new THREE.CylinderGeometry(0.41, 0.41, 0.05, 12));
        const b1 = new THREE.Mesh(band1Geo, bandMat);
        b1.position.y = 0.75;
        group.add(b1);
        
        const band2Geo = this.getGeometry('prop_barrel_band2', () => new THREE.CylinderGeometry(0.37, 0.37, 0.05, 12));
        const b2 = new THREE.Mesh(band2Geo, bandMat);
        b2.position.y = 0.25;
        group.add(b2);

        return { group, obstacle: barrel };
    }

    static createCrate(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const mat = this.getMaterial(0x8d6e63, 'prop_crate_wood');
        const crateGeo = this.getGeometry('prop_crate', () => new THREE.BoxGeometry(1.0, 1.0, 1.0));
        
        const crate = new THREE.Mesh(crateGeo, mat);
        crate.position.y = 0.5;
        crate.castShadow = true;
        crate.userData = { type: 'hard', material: 'wood' };
        group.add(crate);
        
        return { group, obstacle: crate };
    }

    static createTire(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const mat = this.getMaterial(0x111111, 'prop_tire_rubber', { roughness: 0.9 });
        const tireGeo = this.getGeometry('prop_tire', () => new THREE.TorusGeometry(0.4, 0.15, 12, 24));
        
        const tire = new THREE.Mesh(tireGeo, mat);
        tire.position.y = 0.2;
        tire.rotation.x = Math.PI / 2;
        tire.castShadow = true;
        tire.userData = { type: 'hard', material: 'rubber' };
        group.add(tire);
        
        return { group, obstacle: tire };
    }

    static createBlueBlock() {
        const height = 3.24; 
        const geo = this.getGeometry('prop_blueblock', () => new THREE.BoxGeometry(height, height, height));
        const mat = this.getMaterial(0x0000ff, 'prop_blueblock');
        
        const mesh = new THREE.Mesh(geo, mat);
        // Moved from Z=0 to Z=20 (20 meters South based on world orientation)
        mesh.position.set(-4, height / 2, 20); 
        mesh.castShadow = true;
        mesh.userData = { type: 'hard', material: 'stone' };
        return mesh;
    }
}
