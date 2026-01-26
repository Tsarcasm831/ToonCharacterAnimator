import * as THREE from 'three';
import { PlayerConfig } from '../../../../types';

const LEATHER_COLOR = '#5d4037';
const METAL_COLOR = '#b0bec5';

export class BracersBuilder {
    static build(isLeft: boolean, config: PlayerConfig): THREE.Group {
        const group = new THREE.Group();
        
        const leatherMat = new THREE.MeshStandardMaterial({
            color: LEATHER_COLOR,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const metalMat = new THREE.MeshStandardMaterial({
            color: METAL_COLOR,
            metalness: 0.8,
            roughness: 0.3
        });

        // Main bracer body - wraps around forearm
        const bracerGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.14, 16, 1, true);
        const bracer = new THREE.Mesh(bracerGeo, leatherMat);
        bracer.position.y = -0.12;
        bracer.castShadow = true;
        group.add(bracer);

        // Metal plate on top
        const plateGeo = new THREE.BoxGeometry(0.06, 0.12, 0.025);
        const plate = new THREE.Mesh(plateGeo, metalMat);
        plate.position.set(0, -0.12, 0.045);
        plate.castShadow = true;
        group.add(plate);

        // Metal studs/rivets
        const studGeo = new THREE.SphereGeometry(0.008, 6, 6);
        const studPositions = [
            { x: 0, y: -0.06, z: 0.055 },
            { x: 0, y: -0.12, z: 0.055 },
            { x: 0, y: -0.18, z: 0.055 },
        ];
        
        studPositions.forEach(pos => {
            const stud = new THREE.Mesh(studGeo, metalMat);
            stud.position.set(pos.x, pos.y, pos.z);
            group.add(stud);
        });

        // Wrist guard extension
        const wristGeo = new THREE.CylinderGeometry(0.048, 0.055, 0.03, 16, 1, true);
        const wrist = new THREE.Mesh(wristGeo, metalMat);
        wrist.position.y = -0.2;
        group.add(wrist);

        return group;
    }
}
