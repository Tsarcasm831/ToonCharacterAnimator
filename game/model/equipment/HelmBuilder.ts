
import * as THREE from 'three';

export class HelmBuilder {
    static build(): THREE.Group {
        const group = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ 
            color: 0x90a4ae, 
            metalness: 0.8, 
            roughness: 0.2,
            flatShading: false,
            side: THREE.DoubleSide
        });
        const brassMat = new THREE.MeshStandardMaterial({ 
            color: 0xd4af37, 
            metalness: 0.9, 
            roughness: 0.1 
        });

        // 1. Main Skull Cap (Bascinet style)
        // Head radius is 0.21. We use 0.235 for a snug fit.
        const helmRadius = 0.235;
        const shellGeo = new THREE.SphereGeometry(helmRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
        
        // Taper the shell slightly to be more egg-shaped
        const sPos = shellGeo.attributes.position;
        for(let i=0; i<sPos.count; i++) {
            const y = sPos.getY(i);
            const z = sPos.getZ(i);
            if (y > 0) sPos.setX(i, sPos.getX(i) * 0.95);
            if (z < 0) sPos.setZ(i, z * 1.05); // Occipital bun
        }
        shellGeo.computeVertexNormals();

        const shell = new THREE.Mesh(shellGeo, metalMat);
        shell.castShadow = true;
        group.add(shell);

        // 2. Face Plate (Visor / Guard)
        const visorHeight = 0.3;
        const visorGeo = new THREE.CylinderGeometry(helmRadius, helmRadius * 1.1, visorHeight, 32, 1, true, -Math.PI * 0.45, Math.PI * 0.9);
        const visor = new THREE.Mesh(visorGeo, metalMat);
        visor.rotation.y = Math.PI; // Face forward
        visor.position.y = -0.05;
        group.add(visor);

        // 3. Eye Slit Reinforcement (Brass trim)
        const trimGeo = new THREE.BoxGeometry(0.26, 0.05, 0.03);
        const trim = new THREE.Mesh(trimGeo, brassMat);
        trim.position.set(0, 0.06, helmRadius - 0.01);
        group.add(trim);

        // 4. Combat Crest (Plume / Ridge)
        const crestGeo = new THREE.BoxGeometry(0.04, 0.08, 0.35);
        const crest = new THREE.Mesh(crestGeo, brassMat);
        crest.position.y = helmRadius;
        crest.position.z = -0.05;
        group.add(crest);

        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 8), metalMat);
        spike.position.y = helmRadius + 0.08;
        group.add(spike);

        return group;
    }
}
