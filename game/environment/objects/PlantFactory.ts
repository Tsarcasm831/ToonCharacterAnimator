
import * as THREE from 'three';

export class PlantFactory {
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

    static createCactus(position: THREE.Vector3, scale: number = 1.0) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.scale.setScalar(scale);
        
        const mat = this.getMaterial(0x4caf50, 'plant_cactus', { flatShading: true });
        
        const trunkGeo = this.getGeometry('plant_cactus_trunk', () => new THREE.CylinderGeometry(0.2, 0.2, 2.5, 8));
        const trunk = new THREE.Mesh(trunkGeo, mat);
        trunk.position.y = 1.25;
        trunk.castShadow = true;
        trunk.userData = { type: 'hard', material: 'cactus' };
        group.add(trunk);
        
        const arm1Geo = this.getGeometry('plant_cactus_arm1', () => new THREE.CylinderGeometry(0.15, 0.15, 1.0, 8));
        const arm1 = new THREE.Mesh(arm1Geo, mat);
        arm1.position.set(0.3, 1.5, 0);
        arm1.rotation.z = -Math.PI / 3;
        group.add(arm1);
        
        const arm1UpGeo = this.getGeometry('plant_cactus_arm1up', () => new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8));
        const arm1Up = new THREE.Mesh(arm1UpGeo, mat);
        arm1Up.position.set(0.65, 1.9, 0);
        group.add(arm1Up);

        return { group, trunk };
    }

    static createCattail(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const stemMat = this.getMaterial(0x33691e, 'plant_cattail_stem');
        const stemGeo = this.getGeometry('plant_cattail_stem', () => new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6));
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.6;
        group.add(stem);
        
        const headMat = this.getMaterial(0x3e2723, 'plant_cattail_head');
        const headGeo = this.getGeometry('plant_cattail_head', () => new THREE.CapsuleGeometry(0.05, 0.25, 4, 8));
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.1;
        group.add(head);
        
        group.userData = { type: 'soft', phase: Math.random() * Math.PI };
        return group;
    }

    static createLilyPad(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const geo = this.getGeometry('plant_lilypad', () => new THREE.CircleGeometry(0.4, 16, 0, Math.PI * 1.8));
        const mat = this.getMaterial(0x4caf50, 'plant_lilypad', { side: THREE.DoubleSide });
        
        const pad = new THREE.Mesh(geo, mat);
        pad.rotation.x = -Math.PI / 2;
        group.add(pad);
        
        group.userData = { type: 'soft', phase: Math.random() * Math.PI };
        return group;
    }
}
