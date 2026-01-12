
import * as THREE from 'three';

export class PropFactory {
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

    static createBlueBlock() {
        const height = 3.24; 
        const geo = new THREE.BoxGeometry(height, height, height);
        const mat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(-4, height / 2, 0); 
        mesh.castShadow = true;
        mesh.userData = { type: 'hard', material: 'stone' };
        return mesh;
    }
}
