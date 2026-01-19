
import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

const METAL_COLOR = '#8a9197';
const METAL_DARK = '#5a6066';
const LEATHER_LACING = '#6b3a2a';
const BELT_LEATHER = '#4a3020';

export class PlateMailBuilder {
    static build(parts: any, config: PlayerConfig) {
        const createdMeshes: THREE.Object3D[] = [];
        const refs: any = { torso: null, sleeves: [], details: [] };

        // --- MATERIALS ---
        const metalMat = new THREE.MeshStandardMaterial({
            color: METAL_COLOR,
            metalness: 0.85,
            roughness: 0.35,
        });

        const metalDarkMat = new THREE.MeshStandardMaterial({
            color: METAL_DARK,
            metalness: 0.8,
            roughness: 0.4,
        });

        const lacingMat = new THREE.MeshStandardMaterial({
            color: LEATHER_LACING,
            roughness: 0.9,
            metalness: 0.0
        });

        const beltMat = new THREE.MeshStandardMaterial({
            color: BELT_LEATHER,
            roughness: 0.85,
            metalness: 0.0
        });

        // --- DIMENSIONS (matching ShirtBuilder) ---
        const torsoRadiusTop = 0.32;
        const torsoRadiusBottom = 0.28;
        const torsoDepthScale = 0.70;
        const torsoHeight = 0.54;

        // --- MAIN CUIRASS GROUP ---
        const cuirassGroup = new THREE.Group();
        cuirassGroup.position.y = parts.torso?.position?.y ?? 0.38;
        parts.torsoContainer.add(cuirassGroup);
        createdMeshes.push(cuirassGroup);
        refs.torso = cuirassGroup;

        // --- A. MAIN CHEST PLATE (Front & Back as one piece) ---
        const chestGeo = new THREE.CylinderGeometry(
            torsoRadiusTop, 
            torsoRadiusBottom, 
            torsoHeight * 0.85, 
            32, 
            8
        );
        chestGeo.scale(1, 1, torsoDepthScale);

        // Sculpt the chest plate
        const pos = chestGeo.attributes.position;
        const v = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            
            // Add chest curve (barrel shape)
            if (v.z > 0) {
                const heightFactor = (v.y + torsoHeight * 0.425) / (torsoHeight * 0.85);
                const chestBulge = Math.sin(heightFactor * Math.PI) * 0.04;
                v.z += chestBulge;
            }
            
            // Slight taper at sides for lacing area
            const sideAngle = Math.atan2(v.z, v.x);
            if (Math.abs(sideAngle) > Math.PI * 0.35 && Math.abs(sideAngle) < Math.PI * 0.65) {
                v.x *= 0.92;
            }
            
            pos.setXYZ(i, v.x, v.y, v.z);
        }
        chestGeo.computeVertexNormals();

        const chestPlate = new THREE.Mesh(chestGeo, metalMat);
        chestPlate.position.y = 0.04;
        chestPlate.castShadow = true;
        cuirassGroup.add(chestPlate);
        createdMeshes.push(chestPlate);

        // --- B. SIDE LACING (Left and Right) ---
        const createSideLacing = (side: number) => {
            const lacingGroup = new THREE.Group();
            const numLaces = 5;
            const lacingHeight = torsoHeight * 0.6;
            const startY = 0.12;
            
            for (let i = 0; i < numLaces; i++) {
                const y = startY - (i * lacingHeight / (numLaces - 1));
                
                // Lace cross pattern
                const laceGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6);
                laceGeo.rotateZ(Math.PI / 2);
                
                const lace = new THREE.Mesh(laceGeo, lacingMat);
                lace.position.set(side * 0.28, y, 0);
                lace.rotation.y = side * 0.3;
                lacingGroup.add(lace);
                
                // Lace holes (dark metal rings)
                for (let h of [-1, 1]) {
                    const holeGeo = new THREE.TorusGeometry(0.012, 0.004, 6, 12);
                    const hole = new THREE.Mesh(holeGeo, metalDarkMat);
                    hole.position.set(side * (0.26 + h * 0.025), y, 0.01);
                    hole.rotation.y = Math.PI / 2 + side * 0.3;
                    lacingGroup.add(hole);
                }
            }
            
            return lacingGroup;
        };

        const leftLacing = createSideLacing(-1);
        cuirassGroup.add(leftLacing);
        createdMeshes.push(leftLacing);

        const rightLacing = createSideLacing(1);
        cuirassGroup.add(rightLacing);
        createdMeshes.push(rightLacing);

        // --- C. SHOULDER PAULDRONS (Short caps) ---
        const createPauldron = (side: number) => {
            const pauldronGroup = new THREE.Group();
            
            // Main shoulder cap - hemisphere
            const capGeo = new THREE.SphereGeometry(0.14, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
            capGeo.scale(1.1, 0.7, 0.9);
            
            const cap = new THREE.Mesh(capGeo, metalMat);
            cap.rotation.z = side * 0.25;
            cap.castShadow = true;
            pauldronGroup.add(cap);
            
            // Lower rim/edge
            const rimGeo = new THREE.TorusGeometry(0.13, 0.015, 8, 24, Math.PI * 1.2);
            rimGeo.scale(1.1, 0.9, 1);
            const rim = new THREE.Mesh(rimGeo, metalDarkMat);
            rim.rotation.x = Math.PI / 2;
            rim.rotation.z = -Math.PI * 0.1;
            rim.position.y = -0.06;
            pauldronGroup.add(rim);
            
            return pauldronGroup;
        };

        // Attach pauldrons to shoulder mounts
        if (parts.leftShoulderMount) {
            const leftPauldron = createPauldron(-1);
            leftPauldron.position.set(0.06, 0.04, 0);
            parts.leftShoulderMount.add(leftPauldron);
            createdMeshes.push(leftPauldron);
        }

        if (parts.rightShoulderMount) {
            const rightPauldron = createPauldron(1);
            rightPauldron.position.set(-0.06, 0.04, 0);
            parts.rightShoulderMount.add(rightPauldron);
            createdMeshes.push(rightPauldron);
        }

        // --- D. BELT / WAIST BAND ---
        const beltGeo = new THREE.CylinderGeometry(
            torsoRadiusBottom + 0.01, 
            torsoRadiusBottom + 0.015, 
            0.08, 
            24
        );
        beltGeo.scale(1, 1, torsoDepthScale);
        const belt = new THREE.Mesh(beltGeo, beltMat);
        belt.position.y = -0.2;
        belt.castShadow = true;
        cuirassGroup.add(belt);
        createdMeshes.push(belt);

        // Belt buckle
        const buckleGeo = new THREE.BoxGeometry(0.06, 0.05, 0.02);
        const buckle = new THREE.Mesh(buckleGeo, metalDarkMat);
        buckle.position.set(0, -0.2, torsoRadiusBottom * torsoDepthScale + 0.01);
        cuirassGroup.add(buckle);
        createdMeshes.push(buckle);

        // --- E. TASSETS (Hanging hip plates) ---
        const createTasset = () => {
            const tassetGroup = new THREE.Group();
            
            // Main plate - rounded rectangle shape
            const plateShape = new THREE.Shape();
            const tw = 0.08, th = 0.12;
            const radius = 0.02;
            
            plateShape.moveTo(-tw + radius, 0);
            plateShape.lineTo(tw - radius, 0);
            plateShape.quadraticCurveTo(tw, 0, tw, -radius);
            plateShape.lineTo(tw, -th + radius);
            plateShape.quadraticCurveTo(tw, -th, tw - radius, -th);
            plateShape.lineTo(-tw + radius, -th);
            plateShape.quadraticCurveTo(-tw, -th, -tw, -th + radius);
            plateShape.lineTo(-tw, -radius);
            plateShape.quadraticCurveTo(-tw, 0, -tw + radius, 0);

            const plateGeo = new THREE.ExtrudeGeometry(plateShape, {
                depth: 0.025,
                bevelEnabled: true,
                bevelSize: 0.008,
                bevelThickness: 0.005,
                bevelSegments: 2
            });
            
            const plate = new THREE.Mesh(plateGeo, metalMat);
            plate.castShadow = true;
            tassetGroup.add(plate);
            
            // Hanging ring/strap connection
            const ringGeo = new THREE.TorusGeometry(0.015, 0.005, 6, 12);
            const ring = new THREE.Mesh(ringGeo, beltMat);
            ring.position.set(0, 0.02, 0.012);
            tassetGroup.add(ring);
            
            return tassetGroup;
        };

        // Front tassets (2)
        for (let side of [-1, 1]) {
            const tasset = createTasset();
            tasset.position.set(side * 0.1, -0.26, torsoRadiusBottom * torsoDepthScale - 0.02);
            tasset.rotation.x = -0.15;
            cuirassGroup.add(tasset);
            createdMeshes.push(tasset);
        }

        // Side tassets (2)
        for (let side of [-1, 1]) {
            const tasset = createTasset();
            tasset.position.set(side * 0.24, -0.26, 0);
            tasset.rotation.y = side * Math.PI / 2;
            tasset.rotation.x = -0.1;
            cuirassGroup.add(tasset);
            createdMeshes.push(tasset);
        }

        // --- F. NECK GUARD (Simple collar) ---
        const collarGeo = new THREE.CylinderGeometry(0.13, 0.15, 0.06, 16, 1, true);
        const collar = new THREE.Mesh(collarGeo, metalDarkMat);
        collar.position.y = torsoHeight * 0.42 + 0.04;
        collar.castShadow = true;
        cuirassGroup.add(collar);
        createdMeshes.push(collar);

        // --- G. ARM PROTECTION (Upper arm plates) ---
        const createArmPlate = () => {
            const armGeo = new THREE.CylinderGeometry(0.075, 0.07, 0.14, 12, 1, true);
            armGeo.translate(0, -0.07, 0);
            const arm = new THREE.Mesh(armGeo, metalMat);
            arm.castShadow = true;
            return arm;
        };

        [parts.rightArm, parts.leftArm].forEach(arm => {
            if (!arm) return;
            const plate = createArmPlate();
            plate.position.y = -0.02;
            arm.add(plate);
            createdMeshes.push(plate);
            refs.sleeves.push(plate);
        });

        // --- H. FOREARM VAMBRACES ---
        const createVambrace = () => {
            const vamGeo = new THREE.CylinderGeometry(0.058, 0.052, 0.14, 12, 1, true);
            vamGeo.translate(0, -0.07, 0);
            const vam = new THREE.Mesh(vamGeo, metalMat);
            vam.castShadow = true;
            return vam;
        };

        [parts.rightForeArm, parts.leftForeArm].forEach(fore => {
            if (!fore) return;
            const vambrace = createVambrace();
            vambrace.position.y = -0.06;
            fore.add(vambrace);
            createdMeshes.push(vambrace);
            refs.sleeves.push(vambrace);
        });

        return { meshes: createdMeshes, refs };
    }
}
