import * as THREE from 'three';

export class DisturbedGroundFactory {
    private static dirtMaterial: THREE.MeshStandardMaterial | null = null;
    private static darkDirtMaterial: THREE.MeshStandardMaterial | null = null;
    private static pebbleMaterial: THREE.MeshStandardMaterial | null = null;

    private static getDirtMaterial() {
        if (!this.dirtMaterial) {
            this.dirtMaterial = new THREE.MeshStandardMaterial({
                color: 0x5d4037,
                roughness: 1,
                metalness: 0,
                flatShading: true
            });
        }
        return this.dirtMaterial;
    }

    private static getDarkDirtMaterial() {
        if (!this.darkDirtMaterial) {
            this.darkDirtMaterial = new THREE.MeshStandardMaterial({
                color: 0x3e2723,
                roughness: 1,
                metalness: 0,
                flatShading: true
            });
        }
        return this.darkDirtMaterial;
    }

    private static getPebbleMaterial() {
        if (!this.pebbleMaterial) {
            this.pebbleMaterial = new THREE.MeshStandardMaterial({
                color: 0x6d625a,
                roughness: 0.95,
                metalness: 0,
                flatShading: true
            });
        }
        return this.pebbleMaterial;
    }

    static createDisturbedGround(position: THREE.Vector3, cellSize: number = 1.0): THREE.Group {
        const group = new THREE.Group();
        group.position.copy(position);
        group.rotation.y = Math.random() * Math.PI * 2;
        group.userData = {
            type: 'soft',
            interactType: 'dig',
            interactionLabel: 'Press F to Dig',
            buriedObject: true
        };

        const mound = new THREE.Mesh(
            new THREE.DodecahedronGeometry(cellSize * 0.42, 0),
            this.getDirtMaterial()
        );
        mound.position.y = 0.035;
        mound.scale.set(1.0, 0.16, 0.72);
        mound.rotation.set(0.04, 0.2, -0.02);
        mound.receiveShadow = true;
        group.add(mound);

        const depression = new THREE.Mesh(
            new THREE.CylinderGeometry(cellSize * 0.38, cellSize * 0.32, 0.018, 12),
            this.getDarkDirtMaterial()
        );
        depression.position.set(-cellSize * 0.08, 0.012, cellSize * 0.04);
        depression.scale.set(1.0, 1.0, 0.62);
        depression.receiveShadow = true;
        group.add(depression);

        const pebbleGeo = new THREE.DodecahedronGeometry(cellSize * 0.055, 0);
        for (let i = 0; i < 7; i += 1) {
            const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
            const radius = cellSize * (0.22 + Math.random() * 0.22);
            const pebble = new THREE.Mesh(pebbleGeo, this.getPebbleMaterial());
            pebble.position.set(Math.cos(angle) * radius, 0.04, Math.sin(angle) * radius);
            pebble.scale.set(1.0 + Math.random() * 0.8, 0.35 + Math.random() * 0.3, 0.8 + Math.random() * 0.6);
            pebble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            pebble.castShadow = false;
            pebble.receiveShadow = true;
            group.add(pebble);
        }

        return group;
    }
}
