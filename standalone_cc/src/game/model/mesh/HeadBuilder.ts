
import * as THREE from 'three';
import { PlayerMaterials } from '../PlayerMaterials';
import { BrainBuilder } from './BrainBuilder';
import { EarBuilder } from './EarBuilder';

export class HeadBuilder {
    static build(materials: PlayerMaterials, arrays: any) {
        const headRadius = 0.21;
        const headGeo = new THREE.SphereGeometry(headRadius, 64, 64);
        const posAttribute = headGeo.attributes.position;
        const vertex = new THREE.Vector3();
        
        const sculptLeftCenter = new THREE.Vector3(0.068, -0.015, headRadius * 0.86);
        const sculptRightCenter = new THREE.Vector3(-0.068, -0.015, headRadius * 0.86);

        // === SCULPTING HEAD (CRANIUM) ===
        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);
            let x = vertex.x;
            let y = vertex.y;
            let z = vertex.z;
            
            // 1. Flatten Top (Reduce Bulbousness)
            if (y > headRadius * 0.4) {
                const factor = (y - headRadius * 0.4) / (headRadius * 0.6);
                y -= factor * 0.045; 
                if (Math.abs(x) > headRadius * 0.4) x *= (1.0 + factor * 0.08); 
            }

            // 2. Flatten Sides
            if (Math.abs(x) > headRadius * 0.65) {
                const factor = (Math.abs(x) - headRadius * 0.65) / (headRadius * 0.35);
                x *= (1.0 - factor * 0.25);
            }

            // 3. Occipital Bun
            if (z < 0) {
                z *= 1.08;
                if (y < 0 && z < -0.1) z *= 0.95; 
            }

            // 4. Face Flatness
            if (z > 0.06) {
                const zFactor = (z - 0.06) / (headRadius - 0.06);
                z -= Math.max(0, zFactor) * 0.03;
            }

            // 5. Neck Taper
            if (z < -0.05 && y < -0.05) {
                 const taper = Math.min(1.0, (Math.abs(y) - 0.05) * 4.0);
                 z *= (1.0 - taper * 0.15); 
                 x *= (1.0 - taper * 0.1);
            }

            // 6. Cheek Hollows
            if (y < -0.02 && z > 0) {
                if (Math.abs(x) > 0.11) x *= 0.94; 
            }

            // 7. Brow Ridge
            if (y > 0.04 && y < 0.11 && z > 0.12) z *= 1.025; 

            // 8. Eye Sockets
            const sRad = 0.085; 
            const sDepth = 0.03; 
            const distL = new THREE.Vector3(x,y,z).distanceTo(sculptLeftCenter);
            const distR = new THREE.Vector3(x,y,z).distanceTo(sculptRightCenter);

            if (distL < sRad && x > 0.02) z -= Math.cos((distL/sRad)*Math.PI*0.5) * sDepth; 
            if (distR < sRad && x < -0.02) z -= Math.cos((distR/sRad)*Math.PI*0.5) * sDepth; 

            // 9. Bridge of Nose
            if (Math.abs(x) < 0.035 && y > -0.08 && y < 0.05 && z > 0.15) {
                const yDist = Math.abs(y - (-0.03));
                const yFactor = Math.max(0, 1.0 - (yDist / 0.07));
                const xFactor = Math.max(0, 1.0 - (Math.abs(x) / 0.035));
                z += 0.02 * xFactor * yFactor * yFactor; 
            }
            
            vertex.set(x, y, z);
            posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        // Compute normals on the full mesh to ensure smooth shading across splits
        headGeo.computeVertexNormals();
        
        // --- SPLIT CRANIUM INTO PARTS ---
        const posAttr = headGeo.attributes.position;
        const normAttr = headGeo.attributes.normal;
        const indexAttr = headGeo.index;

        const partsData: Record<string, { pos: number[], norm: number[] }> = {
            top: { pos: [], norm: [] },
            front: { pos: [], norm: [] },
            cheeksBottom: { pos: [], norm: [] },
            backTop: { pos: [], norm: [] },
            backMiddle: { pos: [], norm: [] },
            backBottom: { pos: [], norm: [] }
        };

        if (indexAttr) {
            for (let i = 0; i < indexAttr.count; i += 3) {
                const a = indexAttr.getX(i);
                const b = indexAttr.getX(i+1);
                const c = indexAttr.getX(i+2);

                const vA = new THREE.Vector3().fromBufferAttribute(posAttr, a);
                const vB = new THREE.Vector3().fromBufferAttribute(posAttr, b);
                const vC = new THREE.Vector3().fromBufferAttribute(posAttr, c);

                const cent = new THREE.Vector3().addVectors(vA, vB).add(vC).multiplyScalar(1/3);
                
                let category = 'front';

                if (cent.z < -0.02) {
                    // Split Back into 3 vertical sections
                    if (cent.y > 0.02) {
                        category = 'backTop';
                    } else if (cent.y > -0.09) {
                        category = 'backMiddle';
                    } else {
                        category = 'backBottom';
                    }
                } else if (cent.y > 0.04) {
                    // Combined Top section (Crown + Forehead)
                    category = 'top';
                } else if (Math.abs(cent.x) > 0.055 && cent.y < -0.06) {
                    // Lower cheeks only (Purple)
                    category = 'cheeksBottom';
                } else {
                    // Center face + Upper Cheeks (Teal)
                    category = 'front'; 
                }

                const pushVert = (idx: number) => {
                    partsData[category].pos.push(posAttr.getX(idx), posAttr.getY(idx), posAttr.getZ(idx));
                    partsData[category].norm.push(normAttr.getX(idx), normAttr.getY(idx), normAttr.getZ(idx));
                };
                pushVert(a); pushVert(b); pushVert(c);
            }
        }

        const createPartMesh = (data: {pos: number[], norm: number[]}, mat: THREE.Material, name: string) => {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(data.pos, 3));
            geo.setAttribute('normal', new THREE.Float32BufferAttribute(data.norm, 3));
            const mesh = new THREE.Mesh(geo, mat);
            mesh.name = name;
            mesh.castShadow = true;
            return mesh;
        };

        const head = new THREE.Group();
        head.add(createPartMesh(partsData.top, materials.skin, 'HeadTop'));
        head.add(createPartMesh(partsData.front, materials.skin, 'HeadFront'));
        head.add(createPartMesh(partsData.cheeksBottom, materials.skin, 'HeadCheeksBottom'));
        head.add(createPartMesh(partsData.backTop, materials.skin, 'HeadBackTop'));
        head.add(createPartMesh(partsData.backMiddle, materials.skin, 'HeadBackMiddle'));
        head.add(createPartMesh(partsData.backBottom, materials.skin, 'HeadBackBottom'));

        // --- HAIR COVERS ---
        const createCover = (data: {pos: number[], norm: number[]}, name: string) => {
             const newPos: number[] = [];
             const srcPos = data.pos;
             const srcNorm = data.norm;
             const expansion = 0.01;

             for(let i=0; i<srcPos.length; i+=3) {
                 newPos.push(
                     srcPos[i] + srcNorm[i] * expansion,
                     srcPos[i+1] + srcNorm[i+1] * expansion,
                     srcPos[i+2] + srcNorm[i+2] * expansion
                 );
             }
             
             const geo = new THREE.BufferGeometry();
             geo.setAttribute('position', new THREE.Float32BufferAttribute(newPos, 3));
             geo.setAttribute('normal', new THREE.Float32BufferAttribute(srcNorm, 3));
             const mesh = new THREE.Mesh(geo, materials.hair);
             mesh.name = name;
             mesh.castShadow = true;
             return mesh;
        };

        const hairCap = new THREE.Group();
        hairCap.name = 'HairCap';
        hairCap.add(createCover(partsData.top, 'HairCover_Top'));
        hairCap.add(createCover(partsData.backTop, 'HairCover_BackTop'));
        hairCap.add(createCover(partsData.backMiddle, 'HairCover_BackMiddle'));
        head.add(hairCap);

        head.position.y = 0.32;
        
        const headMount = new THREE.Group();
        head.add(headMount);

        // === BRAIN ===
        const brain = BrainBuilder.build(materials);
        head.add(brain);


        // === LIP HELPER (TAPERED, NON-SAUSAGE PROFILE) ===
        const createRealisticLip = (pts: THREE.Vector3[], r: number, name: string, flattenZ = 0.5) => {
            const group = new THREE.Group();
            group.name = name;

            const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
            const tubularSegments = 40;
            const radialSegments = 12;
            const tubeGeo = new THREE.TubeGeometry(curve, tubularSegments, r, radialSegments, false);

            // Taper each ring from ends to center while preserving the lip centerline.
            const tPos = tubeGeo.attributes.position;
            const tVec = new THREE.Vector3();
            const ringCenter = new THREE.Vector3();
            const vertsPerRing = radialSegments + 1;

            for (let ring = 0; ring <= tubularSegments; ring++) {
                ringCenter.set(0, 0, 0);
                const ringStart = ring * vertsPerRing;
                for (let j = 0; j < vertsPerRing; j++) {
                    const idx = ringStart + j;
                    ringCenter.x += tPos.getX(idx);
                    ringCenter.y += tPos.getY(idx);
                    ringCenter.z += tPos.getZ(idx);
                }
                ringCenter.multiplyScalar(1 / vertsPerRing);

                const u = ring / tubularSegments;
                const taper = Math.sin(u * Math.PI);
                const ringScale = 0.55 + 0.45 * Math.sqrt(Math.max(0, taper));

                for (let j = 0; j < vertsPerRing; j++) {
                    const idx = ringStart + j;
                    tVec.fromBufferAttribute(tPos, idx);
                    tVec.sub(ringCenter).multiplyScalar(ringScale).add(ringCenter);
                    tPos.setXYZ(idx, tVec.x, tVec.y, tVec.z);
                }
            }
            tPos.needsUpdate = true;
            tubeGeo.computeVertexNormals();

            const tube = new THREE.Mesh(tubeGeo, materials.lip);
            tube.castShadow = true;
            group.add(tube);

            group.scale.set(1, 1, flattenZ);
             
            return group;
        };

        // === MAXILLA ===
        const maxilla = new THREE.Group();
        maxilla.position.set(0, -0.075, 0.18); 
        head.add(maxilla);

        const maxillaGeo = new THREE.BoxGeometry(0.12, 0.05, 0.06, 12, 12, 6);
        const mPos = maxillaGeo.attributes.position;
        for(let i=0; i<mPos.count; i++) {
            vertex.fromBufferAttribute(mPos, i);
            let x = vertex.x, y = vertex.y, z = vertex.z;
            const nx = x / 0.06, ny = y / 0.025;

            // Philtrum groove above upper lip.
            if (y > -0.01 && z > 0.02) {
                const philtrumWidth = 0.015;
                if (Math.abs(x) < philtrumWidth) {
                    const dip = Math.cos((x / philtrumWidth) * Math.PI * 0.5);
                    z -= dip * 0.0045;
                }
            }
             
            if (z > 0) z -= (x*x) * 4.0;
            if (y > 0) { const t = Math.pow(ny, 2); z -= t * 0.025; x *= (1.0 - t * 0.15); }
            if (y < 0) { const t = Math.pow(Math.abs(ny), 2); z -= t * 0.015; x *= (1.0 - t * 0.05); }
            const rSq = nx*nx + ny*ny;
            if (z > 0 && rSq > 0.5) z -= (rSq - 0.5) * 0.025;
            if (z < 0) { x *= 1.25; y *= 1.25; }
            mPos.setXYZ(i, x, y, z);
        }
        maxillaGeo.computeVertexNormals();
        const maxillaMesh = new THREE.Mesh(maxillaGeo, materials.skin);
        maxillaMesh.name = 'MaxillaMesh';
        maxillaMesh.castShadow = true;
        maxilla.add(maxillaMesh);

        // --- UPPER LIP ATTACHED TO MAXILLA (5-POINT CUPID'S BOW) ---
        const upperLipPts = [
            new THREE.Vector3(-0.05, -0.015, -0.02),
            new THREE.Vector3(-0.015, 0.005, 0.01),
            new THREE.Vector3(0, -0.002, 0.012),
            new THREE.Vector3(0.015, 0.005, 0.01),
            new THREE.Vector3(0.05, -0.015, -0.02)
        ];
        const upperLip = createRealisticLip(upperLipPts, 0.009, 'upperLip', 0.5);
        upperLip.position.set(0, -0.028, 0.025);
        maxilla.add(upperLip);


        // === MANDIBLE ===
        const jaw = new THREE.Group();
        jaw.position.set(0, -0.05, 0.02); 
        head.add(jaw);
        
        const jawRadius = 0.135; 
        const jawGeo = new THREE.SphereGeometry(jawRadius, 48, 32);
        const jPos = jawGeo.attributes.position;
        const jVec = new THREE.Vector3();

        for(let i=0; i<jPos.count; i++) {
            jVec.fromBufferAttribute(jPos, i);
            const x = jVec.x, y = jVec.y, z = jVec.z;
            const zRel = z / jawRadius;
            if (y > 0) { jVec.y *= 0.4; jVec.x *= 0.92; jVec.z *= 0.9; }
            if (z < 0) { jVec.x *= 1.1; jVec.y *= 0.8; }
            if (z > 0) { jVec.x *= (1.0 - (zRel * 0.45)); if (y < 0.02) jVec.z += Math.max(0, zRel - 0.2) * 0.025; }
            if (y < -jawRadius * 0.5) jVec.y += ((-jawRadius * 0.5) - y) * 0.5;
            if (y < 0 && Math.abs(x) > jawRadius * 0.5) jVec.y += 0.01;
            jPos.setXYZ(i, jVec.x, jVec.y, jVec.z);
        }
        jawGeo.computeVertexNormals();
        jawGeo.scale(1, 1.5, 1); 

        const jawMesh = new THREE.Mesh(jawGeo, materials.skin);
        jawMesh.name = 'JawMesh';
        jawMesh.position.set(0, -0.05, 0.04); 
        jawMesh.rotation.x = 0.25;
        jawMesh.castShadow = true;
        jaw.add(jawMesh);

        // --- LOWER LIP ATTACHED TO JAW ---
        const lowerLipPts = [
            new THREE.Vector3(-0.048, 0.012, -0.015),
            new THREE.Vector3(-0.02, -0.008, 0.015),
            new THREE.Vector3(0, -0.01, 0.018),
            new THREE.Vector3(0.02, -0.008, 0.015),
            new THREE.Vector3(0.048, 0.012, -0.015)
        ];
        const lowerLip = createRealisticLip(lowerLipPts, 0.01, 'lowerLip', 0.5);
        lowerLip.position.set(0, 0.035, 0.11);
        jaw.add(lowerLip);

        const faceGroup = new THREE.Group();
        head.add(faceGroup);

        // === EYES ===
        const eyeRadius = 0.042;
        const eyeGeo = new THREE.SphereGeometry(eyeRadius, 32, 32);
        eyeGeo.rotateX(Math.PI / 2); 
        const irisRadiusBase = eyeRadius * 0.65;
        const irisGeo = new THREE.CircleGeometry(irisRadiusBase, 32);
        const pupilRadiusBase = eyeRadius * 0.32;
        const pupilGeo = new THREE.CircleGeometry(pupilRadiusBase, 32);
        const eyelidRadius = eyeRadius * 1.10; 
        const lidGeo = new THREE.SphereGeometry(eyelidRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);

        for (let side of [1, -1]) {
            const eyeContainer = new THREE.Group();
            eyeContainer.position.set(side * 0.082, -0.02, 0.118);
            faceGroup.add(eyeContainer);
            const eyeball = new THREE.Mesh(eyeGeo, materials.sclera);
            eyeContainer.add(eyeball);
            arrays.eyes.push(eyeball);

            const iris = new THREE.Mesh(irisGeo, materials.iris);
            iris.position.z = eyeRadius + 0.001; 
            eyeball.add(iris);
            arrays.irises.push(iris); 

            const pupil = new THREE.Mesh(pupilGeo, materials.pupil);
            pupil.position.z = eyeRadius + 0.002;
            eyeball.add(pupil);
            arrays.pupils.push(pupil);

            const topLid = new THREE.Group();
            const topLidMesh = new THREE.Mesh(lidGeo, materials.skin);
            topLid.add(topLidMesh);
            const botLid = new THREE.Group();
            const botLidMesh = new THREE.Mesh(lidGeo, materials.skin);
            botLidMesh.rotation.x = Math.PI;
            botLid.add(botLidMesh);
            topLid.rotation.x = -0.7; botLid.rotation.x = 0.7;  
            eyeContainer.add(topLid); eyeContainer.add(botLid);
            arrays.eyelids.push(topLid); arrays.eyelids.push(botLid);
        }

        // Nose
        const nose = new THREE.Group();
        nose.position.set(0, -0.06, 0.198);
        nose.userData.basePosition = nose.position.clone();
        faceGroup.add(nose);
        const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.06, 8), materials.skin);
        bridge.rotation.x = -0.4; bridge.position.y = 0.02; nose.add(bridge);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), materials.skin);
        tip.position.set(0, -0.01, 0.02); nose.add(tip);
        [-1, 1].forEach(s => {
            const ala = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), materials.skin);
            ala.position.set(s * 0.02, -0.015, 0.01); ala.scale.set(1.2, 0.8, 1); nose.add(ala);
        });

        // We return the specific lip meshes so PlayerModel can find them easily
        const ears = EarBuilder.build(materials);
        head.add(ears);

        return { head, headMount, maxilla, jaw, jawMesh, faceGroup, nose, brain, upperLip, lowerLip, ears };
    }
}
