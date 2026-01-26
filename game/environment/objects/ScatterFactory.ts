import * as THREE from 'three';

export class ScatterFactory {
    private static materials: Map<string, THREE.Material> = new Map();
    private static geometries: Map<string, THREE.BufferGeometry> = new Map();
    private static instancedMaterials: Map<string, THREE.MeshStandardMaterial> = new Map();

    private static getMaterial(color: number, name: string, roughness: number = 0.9): THREE.Material {
        if (!this.materials.has(name)) {
            this.materials.set(name, new THREE.MeshStandardMaterial({ 
                color: color, 
                flatShading: true,
                roughness: roughness
            }));
        }
        return this.materials.get(name)!;
    }

    private static getInstancedColorMaterial(name: string, roughness: number = 0.6): THREE.MeshStandardMaterial {
        if (!this.instancedMaterials.has(name)) {
            this.instancedMaterials.set(name, new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness,
                flatShading: true,
                vertexColors: true
            }));
        }
        return this.instancedMaterials.get(name)!;
    }

    static getPebbleGeometry(): THREE.BufferGeometry {
        const geoKey = 'pebble_geo';
        let geo = this.geometries.get(geoKey);
        if (!geo) {
            geo = new THREE.DodecahedronGeometry(1, 0);
            this.geometries.set(geoKey, geo);
        }
        return geo;
    }

    static getPebbleInstancedMaterial(): THREE.MeshStandardMaterial {
        return this.getInstancedColorMaterial('pebble_instanced', 0.5);
    }

    static getMushroomStalkGeometry(): THREE.BufferGeometry {
        const stalkKey = 'mushroom_stalk_geo';
        let stalkGeo = this.geometries.get(stalkKey);
        if (!stalkGeo) {
            stalkGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.12, 6);
            // Pin pivot to base
            stalkGeo.translate(0, 0.06, 0);
            this.geometries.set(stalkKey, stalkGeo);
        }
        return stalkGeo;
    }

    static getMushroomCapGeometry(): THREE.BufferGeometry {
        const capKey = 'mushroom_cap_geo';
        let capGeo = this.geometries.get(capKey);
        if (!capGeo) {
            capGeo = new THREE.SphereGeometry(0.08, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
            this.geometries.set(capKey, capGeo);
        }
        return capGeo;
    }

    static getMushroomSpotGeometry(): THREE.BufferGeometry {
        const spotKey = 'mushroom_spot_geo';
        let spotGeo = this.geometries.get(spotKey);
        if (!spotGeo) {
            spotGeo = new THREE.SphereGeometry(0.015, 4, 4);
            this.geometries.set(spotKey, spotGeo);
        }
        return spotGeo;
    }

    static getMushroomStalkMaterial(): THREE.Material {
        return this.getMaterial(0xeeeeee, 'mushroom_stalk', 0.5);
    }

    static getMushroomCapInstancedMaterial(): THREE.MeshStandardMaterial {
        return this.getInstancedColorMaterial('mushroom_cap_instanced', 0.5);
    }

    static getMushroomSpotMaterial(): THREE.Material {
        return this.getMaterial(0xffffff, 'mushroom_spot', 0.5);
    }

    static getMushroomCapColors(): number[] {
        return [0xb71c1c, 0x5d4037, 0x795548, 0xeeeeee];
    }

    static createGrassClump(position: THREE.Vector3, type: 'tall' | 'short' | 'dry' = 'short') {
        const group = new THREE.Group();
        group.position.copy(position);

        const bladeCount = type === 'tall' ? 5 : 3;
        const baseHeight = type === 'tall' ? 0.42 : 0.21;
        const color = type === 'dry' ? 0x9a8c81 : (type === 'tall' ? 0x2d3a1e : 0x416128);
        
        const mat = this.getMaterial(color, `grass_${type}`);

        const geoKey = `grass_blade_${type}`;
        let baseGeo = this.geometries.get(geoKey);
        if (!baseGeo) {
            baseGeo = new THREE.ConeGeometry(0.08, 1.0, 3);
            baseGeo.translate(0, 0.5, 0); // pivot at bottom
            this.geometries.set(geoKey, baseGeo);
        }

        for (let i = 0; i < bladeCount; i++) {
            const hScale = baseHeight * (0.8 + Math.random() * 0.4); 
            const wScale = (0.05 + Math.random() * 0.05) / 0.08; 

            const blade = new THREE.Mesh(baseGeo, mat);
            blade.scale.set(wScale, hScale, wScale);
            
            const angle = (i / bladeCount) * Math.PI * 2;
            const dist = Math.random() * 0.15;
            blade.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            blade.rotation.y = Math.random() * Math.PI;
            blade.rotation.z = (Math.random() - 0.5) * 0.4;
            blade.rotation.x = (Math.random() - 0.5) * 0.4;
            
            group.add(blade);
        }

        group.userData = { type: 'soft', phase: Math.random() * Math.PI * 2 };
        return group;
    }

    static createGrassTuft(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);

        // Density requested: 20-35 blades
        const bladeCount = 20 + Math.floor(Math.random() * 16);
        const color = 0x4ade80; // Vibrant Meadows Green
        const mat = this.getMaterial(color, 'grass_tuft');

        const geoKey = 'grass_blade_tuft_geo';
        let baseGeo = this.geometries.get(geoKey);
        if (!baseGeo) {
            baseGeo = new THREE.ConeGeometry(0.06, 1.0, 3);
            baseGeo.translate(0, 0.5, 0); // Pivot at base
            this.geometries.set(geoKey, baseGeo);
        }

        for (let i = 0; i < bladeCount; i++) {
            const hScale = 0.25 + Math.random() * 0.35;
            const wScale = 0.6 + Math.random() * 1.4;

            const blade = new THREE.Mesh(baseGeo, mat);
            blade.scale.set(wScale, hScale, wScale);
            
            // Cluster logic
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 0.22; // Keep it in a bunch
            blade.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            
            blade.rotation.y = Math.random() * Math.PI;
            // Fan out from center
            blade.rotation.z = (Math.cos(angle)) * (0.2 + Math.random() * 0.35);
            blade.rotation.x = (Math.sin(angle)) * (0.2 + Math.random() * 0.35);
            
            blade.castShadow = true;
            group.add(blade);
        }

        group.userData = { type: 'soft', phase: Math.random() * Math.PI * 2 };
        return group;
    }

    static createPebble(position: THREE.Vector3) {
        const s = 0.05 + Math.random() * 0.12;
        
        const geoKey = 'pebble_geo';
        let geo = this.geometries.get(geoKey);
        if (!geo) {
            geo = new THREE.DodecahedronGeometry(1, 0); 
            this.geometries.set(geoKey, geo);
        }
        
        const colors = [0x757575, 0x616161, 0x9e9e9e, 0x5d4037];
        const colorVal = colors[Math.floor(Math.random() * colors.length)];
        const mat = this.getMaterial(colorVal, `pebble_${colorVal}`, 0.5); 
        
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.scale.setScalar(s);
        mesh.position.y += s * 0.5; 
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }

    static createMushroom(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);

        const s = 0.4 + Math.random() * 0.4;
        group.scale.setScalar(s);

        const stalkMat = this.getMaterial(0xeeeeee, 'mushroom_stalk', 0.5);
        const stalkGeo = this.getMushroomStalkGeometry();
        
        const capColors = [0xb71c1c, 0x5d4037, 0x795548, 0xeeeeee];
        const colorVal = capColors[Math.floor(Math.random() * capColors.length)];
        const capMat = this.getMaterial(colorVal, `mushroom_cap_${colorVal}`, 0.5);
        const capGeo = this.getMushroomCapGeometry();

        // Stalk - geo already translated to base
        const stalk = new THREE.Mesh(stalkGeo, stalkMat);
        stalk.position.y = 0;
        group.add(stalk);

        // Cap - stalk top is 0.12
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = 0.12;
        cap.scale.y = 0.6;
        group.add(cap);

        // Small spots if red
        if (colorVal === 0xb71c1c) {
            const spotMat = this.getMaterial(0xffffff, 'mushroom_spot', 0.5);
            const spotGeo = this.getMushroomSpotGeometry();

            for(let i=0; i<5; i++) {
                const spot = new THREE.Mesh(spotGeo, spotMat);
                const angle = Math.random() * Math.PI * 2;
                const r = 0.03 + Math.random() * 0.04;
                // Place spots slightly on the cap curve
                spot.position.set(Math.cos(angle)*r, 0.14 + Math.random() * 0.02, Math.sin(angle)*r);
                group.add(spot);
            }
        }

        group.userData = { type: 'soft', phase: Math.random() * Math.PI * 2 };
        return group;
    }
}