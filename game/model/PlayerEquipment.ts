
import * as THREE from 'three';
import { AxeBuilder } from './equipment/AxeBuilder';
import { SwordBuilder } from './equipment/SwordBuilder';
import { PickaxeBuilder } from './equipment/PickaxeBuilder';
import { KnifeBuilder } from './equipment/KnifeBuilder';
import { FishingPoleBuilder } from './equipment/FishingPoleBuilder';
import { HalberdBuilder } from './equipment/HalberdBuilder';
import { BowBuilder } from './equipment/BowBuilder';
import { PlayerConfig } from '../../types';

export class PlayerEquipment {
    static updateHeldItem(
        itemName: string | null,
        currentHeldItem: string | null,
        parts: any,
        equippedMeshes: any
    ): string | null {
        // Force cleanup if changing from Bow (left hand) to non-Bow (right hand) or vice versa
        // Or simply always clean up to be safe
        if (equippedMeshes.heldItem) {
            // Remove from whichever parent it is attached to
            if (equippedMeshes.heldItem.parent) {
                equippedMeshes.heldItem.parent.remove(equippedMeshes.heldItem);
            }
            equippedMeshes.heldItem = undefined;
        }
        
        // Cleanup Quiver if it exists
        if (equippedMeshes.quiver) {
            if (equippedMeshes.quiver.parent) {
                equippedMeshes.quiver.parent.remove(equippedMeshes.quiver);
            }
            equippedMeshes.quiver = undefined;
        }

        if (!itemName) return null;

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.85, roughness: 0.2, flatShading: false });

        let itemGroup: THREE.Group | null = null;
        let isLeftHand = false;

        if (itemName === 'Axe') {
            itemGroup = AxeBuilder.build(woodMat, metalMat);
        } else if (itemName === 'Sword') {
            itemGroup = SwordBuilder.build(woodMat, metalMat);
        } else if (itemName === 'Pickaxe') {
            itemGroup = PickaxeBuilder.build(woodMat, metalMat);
        } else if (itemName === 'Knife') {
             itemGroup = KnifeBuilder.build(metalMat);
        } else if (itemName === 'Fishing Pole') {
             itemGroup = FishingPoleBuilder.build(woodMat, metalMat);
        } else if (itemName === 'Halberd') {
             itemGroup = HalberdBuilder.build(woodMat, metalMat);
        } else if (itemName === 'Bow') {
             itemGroup = BowBuilder.buildBow(woodMat);
             isLeftHand = true;
             
             // Add Quiver
             const quiver = BowBuilder.buildQuiver();
             // Attach to Torso (Back)
             // Torso center is 0,0,0. Back is +Z? 
             // TorsoBuilder: cylinder scale(1,1,0.68). Back is -Z or +Z?
             // Characters face Z+ in many systems, here they face +Z local?
             // Let's attach to torsoContainer or shirt torso.
             // Using `parts.torso` (the mesh) or `parts.torsoContainer`.
             // `parts.torso` has scale applied. 
             quiver.position.set(0.15, 0.2, -0.25); // Offset to back right shoulder
             quiver.rotation.z = -0.4; // Tilt
             quiver.rotation.x = 0.2;
             
             // Attach to torsoContainer to follow body lean, but might clip.
             // Attach to upper torso (chest/shoulders) ideally.
             if (parts.torso) {
                 parts.torso.add(quiver);
                 equippedMeshes.quiver = quiver;
             }
        }

        if (itemGroup) {
            if (isLeftHand) {
                if (parts.leftHandMount) parts.leftHandMount.add(itemGroup);
            } else {
                if (parts.rightHandMount) parts.rightHandMount.add(itemGroup);
            }
            equippedMeshes.heldItem = itemGroup;
        }

        return itemName;
    }

    static updateArmor(config: PlayerConfig, parts: any, equippedMeshes: any) {
        // ... (Existing Armor Logic remains unchanged, just cutting for brevity in update if not modified) ...
        const { helm, shoulders, shield, mask, hood } = config.equipment;
        
        if (helm && !equippedMeshes.helm) {
            const helmGroup = new THREE.Group();
            
            // Materials - Enhanced for realism
            const steelMat = new THREE.MeshStandardMaterial({ 
                color: 0xa0a8b0, 
                metalness: 0.9, 
                roughness: 0.4,
                flatShading: false,
                side: THREE.FrontSide
            });
            const goldMat = new THREE.MeshStandardMaterial({ 
                color: 0xd4af37, 
                metalness: 0.8, 
                roughness: 0.3 
            });
            const leatherMat = new THREE.MeshStandardMaterial({
                color: 0x3d2b1f, // Dark brown leather interior
                roughness: 0.9,
                metalness: 0.0,
                side: THREE.BackSide // Render interior faces
            });

            // 1. Dome Shells (Exterior and Interior)
            const domeGeo = new THREE.SphereGeometry(0.24, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
            
            // Exterior Steel Dome
            const domeExt = new THREE.Mesh(domeGeo, steelMat);
            domeExt.scale.set(1, 1.25, 1);
            domeExt.castShadow = true;
            helmGroup.add(domeExt);

            // Interior Leather Lining (Prevents transparency)
            const domeInt = new THREE.Mesh(domeGeo, leatherMat);
            domeInt.scale.set(0.98, 1.23, 0.98); // Slightly smaller to avoid Z-fighting
            helmGroup.add(domeInt);

            // 2. Reinforced Rim (Gold Band)
            const rimGeo = new THREE.TorusGeometry(0.238, 0.018, 8, 48);
            const rim = new THREE.Mesh(rimGeo, goldMat);
            rim.rotation.x = Math.PI / 2;
            rim.position.y = 0.01;
            rim.castShadow = true;
            helmGroup.add(rim);

            // 3. Cross Bands (Spangen)
            const strapGeo = new THREE.TorusGeometry(0.245, 0.014, 6, 32, Math.PI);
            
            // Front-to-Back Strap
            const strapFB = new THREE.Mesh(strapGeo, goldMat);
            strapFB.rotation.y = Math.PI / 2;
            strapFB.scale.y = 1.25;
            strapFB.castShadow = true;
            helmGroup.add(strapFB);

            // Side-to-Side Strap
            const strapLR = new THREE.Mesh(strapGeo, goldMat);
            strapLR.scale.y = 1.25;
            strapLR.castShadow = true;
            helmGroup.add(strapLR);

            // 4. Finial / Spike (Matching the image)
            const finialBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.03, 16), goldMat);
            finialBase.position.y = 0.24 * 1.25; 
            helmGroup.add(finialBase);
            
            const spikeTip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.12, 16), goldMat);
            spikeTip.position.y = (0.24 * 1.25) + 0.07;
            helmGroup.add(spikeTip);

            // 5. Nasal Guard
            const nasalBox = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.18, 0.015), goldMat);
            nasalBox.position.set(0, -0.05, 0.245);
            nasalBox.rotation.x = -0.12; 
            nasalBox.castShadow = true;
            helmGroup.add(nasalBox);

            // 6. Cheek Guards (More flared like the image)
            const cheekGeo = new THREE.BoxGeometry(0.015, 0.22, 0.16);
            const createCheek = (side: number) => {
                const cheek = new THREE.Group();
                const plate = new THREE.Mesh(cheekGeo, steelMat);
                plate.position.set(0, -0.11, 0);
                
                // Gold trim for cheek plate
                const trim = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.23, 0.02), goldMat);
                trim.position.set(0, -0.11, 0.08);
                plate.add(trim);

                // Add padding to interior of cheek plate
                const pad = new THREE.Mesh(cheekGeo, leatherMat);
                pad.scale.set(0.9, 0.98, 0.98);
                pad.position.set(-0.002 * side, -0.11, 0);
                cheek.add(pad);

                cheek.add(plate);
                cheek.position.set(0.2 * side, -0.02, 0.08);
                cheek.rotation.y = -0.4 * side;
                cheek.rotation.z = -0.15 * side;
                return cheek;
            };

            helmGroup.add(createCheek(1));
            helmGroup.add(createCheek(-1));

            // 7. Rivets (Small golden spheres along the bands)
            const rivetGeo = new THREE.SphereGeometry(0.01, 8, 8);
            const addRivets = (count: number, radius: number, yPos: number) => {
                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    const rivet = new THREE.Mesh(rivetGeo, goldMat);
                    rivet.position.set(Math.cos(angle) * radius, yPos, Math.sin(angle) * radius);
                    helmGroup.add(rivet);
                }
            };
            addRivets(12, 0.235, 0.02); // Rim rivets

            // Placement adjustment
            helmGroup.position.y = 0.05; 
            parts.headMount.add(helmGroup);
            equippedMeshes.helm = helmGroup;

        } else if (!helm && equippedMeshes.helm) { 
            parts.headMount.remove(equippedMeshes.helm); 
            delete equippedMeshes.helm; 
        }
        
        // Hood Logic (Assassin Style with Cutout)
        if (hood && !equippedMeshes.hood) {
            // High resolution for clean cuts
            const hoodGeo = new THREE.SphereGeometry(0.25, 64, 64);
            const pos = hoodGeo.attributes.position;
            const v = new THREE.Vector3();
            
            // 1. SCULPT VERTICES
            for(let i=0; i<pos.count; i++) {
                v.fromBufferAttribute(pos, i);
                if (v.y > 0.05 && v.z > 0) {
                    const xFactor = Math.max(0, 1.0 - Math.abs(v.x)/0.18); 
                    const yFactor = Math.max(0, 1.0 - Math.abs(v.y - 0.22)/0.25);
                    const displacement = xFactor * yFactor;
                    v.z += displacement * 0.18; 
                    v.y -= displacement * 0.06; 
                    if (Math.abs(v.x) < 0.05) v.z += 0.01; 
                }
                if (v.y < 0.1 && v.y > -0.2 && v.z > -0.1) {
                    if (Math.abs(v.x) > 0.15) {
                        v.x *= 1.05;
                        v.z *= 1.02;
                    }
                }
                if (v.y < -0.1) {
                    const t = (-0.1 - v.y) / 0.15; 
                    v.x *= 1.0 + (t * 0.7);
                    v.z *= 1.0 + (t * 0.35);
                    if (v.z > 0.1) {
                        const centerBias = Math.max(0, 1.0 - Math.abs(v.x)/0.35);
                        v.y -= centerBias * 0.22; 
                        v.z += centerBias * 0.08;
                    }
                    if (v.z < -0.1) {
                        v.y -= 0.05; 
                    }
                }
                pos.setXYZ(i, v.x, v.y, v.z);
            }
            
            // 2. CUT OUT FACE
            if (hoodGeo.index) {
                const indices = hoodGeo.index.array;
                const newIndices: number[] = [];
                const vA = new THREE.Vector3();
                const vB = new THREE.Vector3();
                const vC = new THREE.Vector3();
                const center = new THREE.Vector3();
                const cutMinY = -0.18; 
                const cutMaxY = 0.06;  
                const cutWidth = 0.13; 
                const cutMinZ = 0.1;   

                for(let i=0; i<indices.length; i+=3) {
                    const a = indices[i];
                    const b = indices[i+1];
                    const c = indices[i+2];
                    vA.fromBufferAttribute(pos, a);
                    vB.fromBufferAttribute(pos, b);
                    vC.fromBufferAttribute(pos, c);
                    center.copy(vA).add(vB).add(vC).divideScalar(3);
                    const isInside = center.z > cutMinZ && Math.abs(center.x) < cutWidth && center.y > cutMinY && center.y < cutMaxY;
                    if (!isInside) {
                        newIndices.push(a, b, c);
                    }
                }
                hoodGeo.setIndex(newIndices);
            }

            hoodGeo.computeVertexNormals();
            
            const hoodMat = new THREE.MeshStandardMaterial({ 
                color: 0x111111, 
                roughness: 0.95, 
                metalness: 0.05,
                side: THREE.DoubleSide,
                flatShading: false
            });
            
            const h = new THREE.Mesh(hoodGeo, hoodMat);
            h.position.set(0, 0.04, 0); 
            h.castShadow = true;
            parts.headMount.add(h);
            equippedMeshes.hood = h;
            
        } else if (!hood && equippedMeshes.hood) {
            parts.headMount.remove(equippedMeshes.hood);
            delete equippedMeshes.hood;
        }

        if (mask && !equippedMeshes.mask) {
            const maskGroup = new THREE.Group();
            const r = 0.22; 
            const pWidth = 2.5; 
            const pStart = (Math.PI / 2) - (pWidth / 2);
            const tStart = 1.3; 
            const tLen = 1.6; 
            const maskGeo = new THREE.SphereGeometry(r, 64, 32, pStart, pWidth, tStart, tLen);
            const pos = maskGeo.attributes.position;
            const v = new THREE.Vector3();
            const noseCenterY = -0.06;
            const mouthCenterY = -0.11;
            const chinCenterY = -0.165;

            for(let i=0; i<pos.count; i++) {
                v.fromBufferAttribute(pos, i);
                const ax = Math.abs(v.x);
                let maxTopY = -0.01; 
                if (ax > 0.03) {
                    const t = Math.min(1.0, (ax - 0.03) / 0.05);
                    const dip = -0.065;
                    maxTopY = THREE.MathUtils.lerp(-0.01, dip, t);
                }
                if (v.y > maxTopY) {
                    const over = v.y - maxTopY;
                    v.y = maxTopY - over * 0.1;
                    v.z *= 0.99; 
                }
                let zPush = 0;
                if (ax < 0.06 && v.y > -0.12 && v.y < 0.01) {
                    const dy = (v.y - noseCenterY);
                    const bulge = Math.exp(-(ax*ax)/(0.045*0.045)) * Math.exp(-(dy*dy)/(0.05*0.05));
                    zPush += bulge * 0.055; 
                }
                if (ax < 0.09 && v.y < -0.08 && v.y > -0.22) {
                    const dyMouth = (v.y - mouthCenterY);
                    const bulgeMouth = Math.exp(-(ax*ax)/(0.07*0.07)) * Math.exp(-(dyMouth*dyMouth)/(0.05*0.05));
                    const dyChin = (v.y - chinCenterY);
                    const bulgeChin = Math.exp(-(ax*ax)/(0.065*0.065)) * Math.exp(-(dyChin*dyChin)/(0.045*0.045));
                    zPush += bulgeMouth * 0.025;
                    zPush += bulgeChin * 0.035; 
                }
                v.z += zPush;
                if (ax > 0.08) {
                    let sidePush = 0.015;
                    if (v.y > -0.05) {
                        sidePush *= Math.max(0, ((-0.05) - v.y) / 0.05);
                    }
                    v.z += sidePush; 
                }
                if (v.y > -0.05 && ax > 0.1) {
                    v.x *= 0.95; 
                }
                if (v.y < -0.15) {
                    const t = (-0.15 - v.y) / 0.1;
                    v.x *= (1.0 - t * 0.2); 
                }
                pos.setXYZ(i, v.x, v.y, v.z);
            }
            maskGeo.computeVertexNormals();

            const maskMat = new THREE.MeshStandardMaterial({ 
                color: 0x1a1a1a, 
                roughness: 0.9,
                side: THREE.DoubleSide,
                flatShading: false
            });

            const m = new THREE.Mesh(maskGeo, maskMat);
            m.castShadow = true;
            maskGroup.add(m);
            
            maskGroup.position.set(config.maskX, config.maskY, config.maskZ);
            maskGroup.rotation.x = config.maskRotX;
            maskGroup.scale.set(
                config.maskScale * config.maskStretchX,
                config.maskScale * config.maskStretchY,
                config.maskScale * config.maskStretchZ
            );

            parts.headMount.add(maskGroup);
            equippedMeshes.mask = maskGroup;
        } else if (!mask && equippedMeshes.mask) {
            parts.headMount.remove(equippedMeshes.mask);
            delete equippedMeshes.mask;
        }

        if (shoulders && !equippedMeshes.leftPauldron) {
            const createPauldron = (isLeft: boolean) => {
                const group = new THREE.Group();
                const steelMat = new THREE.MeshStandardMaterial({ color: 0xa0a8b0, metalness: 0.9, roughness: 0.4, flatShading: false, side: THREE.FrontSide });
                const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });
                const leatherMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9, side: THREE.BackSide });

                const mainPlateGeo = new THREE.SphereGeometry(0.18, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
                const mainPlate = new THREE.Mesh(mainPlateGeo, steelMat);
                mainPlate.scale.set(1.0, 0.8, 1.2);
                mainPlate.castShadow = true;
                group.add(mainPlate);

                const mainLiner = new THREE.Mesh(mainPlateGeo, leatherMat);
                mainLiner.scale.set(0.98, 0.78, 1.18);
                group.add(mainLiner);

                const lameCount = 2;
                for (let i = 1; i <= lameCount; i++) {
                    const lameGroup = new THREE.Group();
                    const lameGeo = new THREE.SphereGeometry(0.18 - (i * 0.01), 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.35);
                    const lame = new THREE.Mesh(lameGeo, steelMat);
                    lame.scale.set(1.0, 0.6, 1.1);
                    lame.castShadow = true;
                    
                    const liner = new THREE.Mesh(lameGeo, leatherMat);
                    liner.scale.set(0.98, 0.58, 1.08);
                    lameGroup.add(liner);
                    lameGroup.add(lame);

                    lameGroup.position.y = -i * 0.08;
                    lameGroup.rotation.z = (isLeft ? -0.2 : 0.2) * i;
                    group.add(lameGroup);

                    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.17 - (i * 0.01), 0.008, 4, 16, Math.PI * 2), goldMat);
                    trim.rotation.x = Math.PI / 2;
                    trim.position.y = 0.01;
                    lameGroup.add(trim);
                }

                const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.22), goldMat);
                ridge.position.y = 0.12;
                ridge.rotation.z = isLeft ? 0.3 : -0.3;
                group.add(ridge);

                const rivetGeo = new THREE.SphereGeometry(0.01, 6, 6);
                for (let i = 0; i < 4; i++) {
                    const r = new THREE.Mesh(rivetGeo, goldMat);
                    const angle = (i / 4) * Math.PI - (Math.PI / 2);
                    r.position.set(Math.cos(angle) * 0.17, 0.02, Math.sin(angle) * 0.17);
                    mainPlate.add(r);
                }

                group.position.set(0, config.shoulderY, 0); 
                group.scale.setScalar(config.shoulderScale);
                return group;
            };

            equippedMeshes.leftPauldron = createPauldron(true);
            equippedMeshes.rightPauldron = createPauldron(false);
            parts.leftShoulderMount.add(equippedMeshes.leftPauldron);
            parts.rightShoulderMount.add(equippedMeshes.rightPauldron);

        } else if (!shoulders && equippedMeshes.leftPauldron) {
            parts.leftShoulderMount.remove(equippedMeshes.leftPauldron!);
            parts.rightShoulderMount.remove(equippedMeshes.rightPauldron!);
            delete equippedMeshes.leftPauldron; 
            delete equippedMeshes.rightPauldron;
        }

        if (shield && !equippedMeshes.shield) {
            const shape = new THREE.Shape();
            shape.moveTo(0, 0.2); shape.lineTo(0.15, 0.15); shape.lineTo(0.12, -0.1); shape.quadraticCurveTo(0, -0.3, -0.12, -0.1); shape.lineTo(-0.15, 0.15); shape.lineTo(0, 0.2);
            const depth = 0.03;
            const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 });
            geo.translate(0, 0, -depth / 2);
            const s = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
            s.rotation.set(0, 0, Math.PI / 2);
            s.castShadow = true;
            parts.leftShieldMount.add(s); equippedMeshes.shield = s;
        } else if (!shield && equippedMeshes.shield) { parts.leftShieldMount.remove(equippedMeshes.shield); delete equippedMeshes.shield; }
    }
}
