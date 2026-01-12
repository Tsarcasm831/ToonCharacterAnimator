
import * as THREE from 'three';

export class HelmBuilder {
    static build(): THREE.Group {
        const group = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.8, roughness: 0.2 });
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.1 });

        // Main Bucket
        const bucketGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.25, 12);
        const bucket = new THREE.Mesh(bucketGeo, metalMat);
        bucket.position.y = 0.12;
        bucket.castShadow = true;
        group.add(bucket);

        // Top Dome
        const domeGeo = new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const dome = new THREE.Mesh(domeGeo, metalMat);
        dome.position.y = 0.245;
        group.add(dome);

        // Face Slit Trim
        const trimGeo = new THREE.BoxGeometry(0.24, 0.04, 0.02);
        const trim = new THREE.Mesh(trimGeo, brassMat);
        trim.position.set(0, 0.15, 0.21);
        group.add(trim);

        return group;
    }
}
