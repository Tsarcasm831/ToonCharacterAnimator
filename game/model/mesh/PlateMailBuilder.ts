
import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

const METAL_COLOR = '#b0bec5'; // Polished Steel
const BRASS_COLOR = '#e6c35c'; // Pale Gold/Brass
const LEATHER_COLOR = '#3e2723';
const DARK_METAL = '#546e7a';

export class PlateMailBuilder {
    static build(parts: any, config: PlayerConfig) {
        const createdMeshes: THREE.Object3D[] = [];
        const refs: any = { torso: null, sleeves: [], details: [] };

        // --- MATERIALS ---
        const metalMat = new THREE.MeshStandardMaterial({
            color: METAL_COLOR,
            metalness: 0.9,
            roughness: 0.3,
            flatShading: false,
        });

        const darkMetalMat = new THREE.MeshStandardMaterial({
            color: DARK_METAL,
            metalness: 0.8,
            roughness: 0.5,
        });

        const brassMat = new THREE.MeshStandardMaterial({
            color: BRASS_COLOR,
            metalness: 1.0,
            roughness: 0.2,
            emissive: 0x443300,
            emissiveIntensity: 0.2
        });

        const leatherMat = new THREE.MeshStandardMaterial({
            color: LEATHER_COLOR,
            roughness: 0.9,
            metalness: 0.0
        });

        // Shared Geometry
        const rivetGeo = new THREE.SphereGeometry(0.012, 8, 8);

        // 1. MAIN TORSO GROUP
        const torsoRadiusTop = 0.31;
        const torsoHeight = 0.54;
        const torsoDepthScale = 0.72;

        const torsoGroup = new THREE.Group();
        torsoGroup.position.y = parts.torso?.position?.y ?? 0.38;
        parts.torsoContainer.add(torsoGroup);
        createdMeshes.push(torsoGroup);
        refs.torso = torsoGroup;

        // --- A. GORGET (Neck Protection) ---
        const gorgetGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.12, 16, 1, true);
        const gorget = new THREE.Mesh(gorgetGeo, brassMat); // Gold collar
        gorget.position.y = torsoHeight / 2 + 0.08;
        gorget.castShadow = true;
        torsoGroup.add(gorget);
        createdMeshes.push(gorget);

        // --- B. CUIRASS (Chest Plate) ---
        const chestH = 0.35;
        // More angular chest shape
        const chestGeo = new THREE.CylinderGeometry(0.34, 0.28, chestH, 4, 1); 
        chestGeo.scale(1, 1, 0.6); // Flatten depth
        chestGeo.rotateY(Math.PI / 4); // Turn so flat side faces forward/back? No, point faces forward.
        // Actually, cylinder(4) gives a square. rotated 45deg gives diamond.
        // We want a slight point in front.
        
        // Let's use a sculpted Box instead for the main plate
        const plateGeo = new THREE.BoxGeometry(0.6, chestH, 0.4, 4, 4, 2);
        const pPos = plateGeo.attributes.position;
        const v = new THREE.Vector3();
        for(let i=0; i<pPos.count; i++) {
            v.fromBufferAttribute(pPos, i);
            
            // Taper waist
            const t = 0.5 - (v.y / chestH); // 0 (top) to 1 (bottom)
            v.x *= (1.0 - t * 0.25);
            v.z *= (1.0 - t * 0.15);

            // Barrel chest curve
            const xNorm = (v.x / 0.3);
            v.z += (1.0 - Math.abs(xNorm)) * 0.12; 

            // Pectoral definition
            if (v.z > 0 && v.y > 0) {
                 v.z += 0.03;
            }

            pPos.setXYZ(i, v.x, v.y, v.z);
        }
        plateGeo.computeVertexNormals();

        const chestPlate = new THREE.Mesh(plateGeo, metalMat);
        chestPlate.position.y = 0.12;
        chestPlate.castShadow = true;
        torsoGroup.add(chestPlate);
        createdMeshes.push(chestPlate);

        // --- C. EAGLE CREST (Procedural Emblem) ---
        const crestGroup = new THREE.Group();
        crestGroup.position.set(0, 0.15, 0.22); // Front of chest
        // Curve to match chest
        crestGroup.rotation.x = -0.15;
        torsoGroup.add(crestGroup);
        
        // 1. Eagle Head
        const eHead = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.04), brassMat);
        eHead.position.set(0.02, 0.08, 0);
        eHead.rotation.z = -0.2;
        crestGroup.add(eHead);
        
        // Beak
        const eBeak = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.05, 4), brassMat);
        eBeak.rotation.z = -1.5;
        eBeak.position.set(0.05, 0.08, 0);
        crestGroup.add(eBeak);

        // 2. Wings (Fan shape)
        const wingGeo = new THREE.BoxGeometry(0.02, 0.12, 0.01);
        wingGeo.translate(0, 0.06, 0); // Pivot at base
        
        for(let side of [-1, 1]) {
            const wingRoot = new THREE.Group();
            wingRoot.position.set(side * 0.03, 0.02, 0);
            // Rotate group to flair up
            wingRoot.rotation.z = side * 0.4; 
            crestGroup.add(wingRoot);

            // Feathers
            for(let i=0; i<4; i++) {
                const feather = new THREE.Mesh(wingGeo, brassMat);
                feather.rotation.z = side * (i * 0.4 + 1.2); // Fan out
                feather.scale.set(1, 1.0 - (i*0.1), 1);
                feather.position.z = -i * 0.005;
                wingRoot.add(feather);
            }
        }
        
        // 3. Body/Tail
        const eBody = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.15, 4), brassMat);
        eBody.rotation.x = Math.PI; // Point down
        eBody.scale.set(1, 1, 0.5);
        eBody.position.y = -0.05;
        crestGroup.add(eBody);

        // --- D. ABDOMEN (Plackart/Faulds) ---
        // Segmented overlapping plates
        const numSegs = 4;
        const segH = 0.08;
        
        for(let i=0; i<numSegs; i++) {
            // Tapering downwards
            const r = 0.29 - (i * 0.01);
            const segGeo = new THREE.CylinderGeometry(r, r, segH, 32, 1, true, -Math.PI*0.8, Math.PI*1.6);
            segGeo.scale(1, 1, torsoDepthScale);
            
            const seg = new THREE.Mesh(segGeo, metalMat);
            seg.position.y = -0.12 - (i * (segH * 0.7)); // Overlap
            seg.castShadow = true;
            
            // Add Gold Trim to bottom edge
            const trimGeo = new THREE.TorusGeometry(r, 0.008, 4, 32, Math.PI*1.6);
            trimGeo.scale(1, 1, torsoDepthScale);
            const trim = new THREE.Mesh(trimGeo, brassMat);
            trim.rotation.x = Math.PI/2;
            trim.rotation.z = -Math.PI*0.8; // Align opening
            trim.position.y = -segH/2;
            seg.add(trim);

            torsoGroup.add(seg);
            createdMeshes.push(seg);
        }

        // --- E. PAULDRONS (Shoulder Guards) ---
        // Large, layered, winged style
        const createPauldron = (isLeft: boolean) => {
            const pGroup = new THREE.Group();
            
            // 3 Layers of plates
            const layers = 3;
            for(let i=0; i<layers; i++) {
                // Shape: A section of a cone/sphere flattened
                const size = 0.28 - (i * 0.04);
                const plateGeo = new THREE.CylinderGeometry(0.05, size, 0.3, 16, 1, true, 0, Math.PI);
                // Bend/Flatten
                const pPos = plateGeo.attributes.position;
                for(let k=0; k<pPos.count; k++){
                    v.fromBufferAttribute(pPos, k);
                    // Curve out
                    v.z += Math.cos(v.x * 3) * 0.05;
                    pPos.setXYZ(k, v.x, v.y, v.z);
                }
                plateGeo.computeVertexNormals();
                plateGeo.scale(1, 1, 0.6);
                plateGeo.rotateZ(Math.PI/2); // Lay flat-ish
                plateGeo.rotateX(Math.PI); // Convex up

                const plate = new THREE.Mesh(plateGeo, metalMat);
                // Offset layers
                plate.position.y = 0.08 - (i * 0.06);
                plate.position.x = (i * 0.05); // cascading out
                plate.rotation.z = (i * 0.1); 

                pGroup.add(plate);

                // Gold Trim
                const trimPath = new THREE.Path();
                // Approximate the arc
                trimPath.absarc(0, 0, size, 0, Math.PI, false);
                const pts = trimPath.getPoints(20);
                const trimLineGeo = new THREE.BufferGeometry().setFromPoints(pts);
                // Create a tube along the edge? A torus segment is easier if shape aligns
                // Let's use thick Line or thin box along edge. 
                // Creating a TubeGeometry from path is best for visual.
                const tubeGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, -0.15, p.y * 0.6))), 12, 0.015, 6, false);
                // Re-orient to match the cylinder geometry transform
                // Cylinder was rotated Z PI/2 then X PI.
                // It's tricky to match perfectly.
                // Simple alternative: Torus segment
                const trimTorus = new THREE.Mesh(new THREE.TorusGeometry(size, 0.015, 6, 16, Math.PI), brassMat);
                trimTorus.scale.set(1, 0.6, 1);
                trimTorus.rotation.x = Math.PI/2;
                trimTorus.position.x = 0.15; // End of cylinder
                
                // Manual adjustment to align with the flared cylinder edge
                trimTorus.position.set(0, 0, 0);
                trimTorus.rotation.set(Math.PI/2, Math.PI/2, 0); 
                // Actually the cylinder lies along X axis. Top edge is at x=+0.15 (height/2).
                
                // Let's just create a scaled copy of the plate, slightly larger, with gold material, behind it? 
                // Or a thin strip.
                // Let's stick to the reference look: Distinct gold border.
                // Use a slightly larger mesh with BackSide? No, just a torus arc manually placed.
                
                const rim = new THREE.Mesh(new THREE.TorusGeometry(size, 0.015, 8, 20, Math.PI), brassMat);
                rim.scale.set(1, 0.6, 1);
                rim.rotation.x = -Math.PI/2;
                rim.rotation.z = Math.PI/2;
                rim.position.x = 0.15; // Align with outer edge
                plate.add(rim);
            }
            
            // Top Round Guard (The joint cover)
            const topGuard = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16, 0, Math.PI*2, 0, Math.PI*0.5), metalMat);
            topGuard.scale.set(1, 0.7, 1);
            topGuard.position.set(-0.05, 0.15, 0);
            pGroup.add(topGuard);
            
            // Vertical Ridge on Top Guard
            const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.22), brassMat);
            ridge.position.set(-0.05, 0.18, 0);
            pGroup.add(ridge);

            return pGroup;
        };

        const lPauldron = createPauldron(true);
        lPauldron.position.set(0.18, 0.08, 0);
        lPauldron.rotation.z = -0.3; // Angle down
        parts.leftShoulderMount.add(lPauldron);
        createdMeshes.push(lPauldron);

        const rPauldron = createPauldron(false);
        rPauldron.position.set(-0.18, 0.08, 0);
        rPauldron.rotation.z = 0.3;
        rPauldron.scale.x = -1; // Mirror
        parts.rightShoulderMount.add(rPauldron);
        createdMeshes.push(rPauldron);

        // --- F. TASSETS (Thigh Guards) ---
        // Attached to the bottom of the torso group
        const createTasset = () => {
            const tGroup = new THREE.Group();
            const tW = 0.22;
            const tH = 0.35;
            
            // Shield-like shape
            const shape = new THREE.Shape();
            shape.moveTo(-tW/2, 0);
            shape.lineTo(tW/2, 0);
            shape.lineTo(tW/2, -tH * 0.7);
            shape.quadraticCurveTo(0, -tH, -tW/2, -tH * 0.7);
            
            const tGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 });
            const tasset = new THREE.Mesh(tGeo, metalMat);
            tGroup.add(tasset);

            // Gold Trim Center
            const trim = new THREE.Mesh(new THREE.BoxGeometry(0.03, tH, 0.04), brassMat);
            trim.position.set(0, -tH/2, 0.01);
            tGroup.add(trim);
            
            return tGroup;
        };

        for(let side of [-1, 1]) {
            const tasset = createTasset();
            // Position at hips
            tasset.position.set(side * 0.12, -0.4, 0.18); 
            // Angle to cover thigh
            tasset.rotation.x = -0.1; 
            tasset.rotation.z = side * -0.1;
            tasset.rotation.y = side * 0.2;
            
            torsoGroup.add(tasset);
            createdMeshes.push(tasset);
            
            // Leather strap connecting tasset
            const strap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.01), leatherMat);
            strap.position.set(side * 0.12, -0.38, 0.17);
            strap.rotation.x = -0.1;
            torsoGroup.add(strap);
        }

        // --- G. ARMS (Vambraces & Gauntlets) ---
        const createArmPlate = (isUpper: boolean) => {
            const rad = isUpper ? 0.085 : 0.065;
            const len = isUpper ? 0.16 : 0.16;
            const geo = new THREE.CylinderGeometry(rad, rad * 0.9, len, 16, 1, true);
            geo.translate(0, -len / 2, 0);
            const mesh = new THREE.Mesh(geo, metalMat);
            mesh.castShadow = true;
            
            // Gold trim at cuffs
            const cuff = new THREE.Mesh(new THREE.TorusGeometry(rad * 0.9, 0.008, 6, 16), brassMat);
            cuff.rotation.x = Math.PI / 2;
            cuff.position.y = -len + 0.01;
            mesh.add(cuff);
            
            if (isUpper) {
                const topCuff = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.008, 6, 16), brassMat);
                topCuff.rotation.x = Math.PI / 2;
                topCuff.position.y = -0.01;
                mesh.add(topCuff);
            }
            
            return mesh;
        };

        [parts.rightArm, parts.leftArm].forEach(arm => {
            if (!arm) return;
            const up = createArmPlate(true);
            up.position.y = -0.02;
            arm.add(up);
            createdMeshes.push(up);
            refs.sleeves.push(up);
        });

        [parts.rightForeArm, parts.leftForeArm].forEach(fore => {
            if (!fore) return;
            const down = createArmPlate(false);
            down.position.y = -0.02;
            fore.add(down);
            createdMeshes.push(down);
            refs.sleeves.push(down);
            
            // Elbow Couter (Cup)
            const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12, 0, Math.PI*2, 0, Math.PI*0.4), metalMat);
            elbow.position.set(0, 0.0, -0.02); // Back of elbow
            elbow.rotation.x = -Math.PI/2;
            fore.add(elbow);
            createdMeshes.push(elbow);
            
            // Elbow Spike
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.08, 8), brassMat);
            spike.rotation.x = -Math.PI/2;
            spike.position.set(0, 0, 0.08); // Sticking out of elbow cup
            elbow.add(spike);
        });

        return { meshes: createdMeshes, refs };
    }
}
