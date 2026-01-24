import * as THREE from 'three';
import { PlayerConfig } from '../../types';
import { PlayerMaterials } from './PlayerMaterials';
import { ShirtBuilder } from './mesh/ShirtBuilder';
import { PantsBuilder } from './mesh/PantsBuilder';
import { ShortsBuilder } from './mesh/ShortsBuilder';
import { GreavesBuilder } from './mesh/GreavesBuilder';
import { RobeBuilder } from './equipment/apparel/RobeBuilder';
import { ShoeBuilder } from './mesh/ShoeBuilder';
import { FootBuilder } from './mesh/FootBuilder';
import { HairBuilder } from './mesh/HairBuilder';
import { ApronBuilder } from './mesh/ApronBuilder';
import { CapeBuilder } from './equipment/apparel/CapeBuilder';
import { BeltBuilder } from './equipment/apparel/BeltBuilder';
import { BracersBuilder } from './equipment/apparel/BracersBuilder';
import { GloveBuilder } from './mesh/GloveBuilder';

export class BodyMorpher {
    private parts: any;
    private materials: PlayerMaterials;
    private forefootGroups: THREE.Group[];
    private heelGroups: THREE.Group[];
    private toeUnits: THREE.Group[];
    private irises: THREE.Mesh[];
    private pupils: THREE.Mesh[];
    private eyes: THREE.Mesh[];
    private eyelids: THREE.Group[];
    private rightFingers: THREE.Group[];
    private rightThumb: THREE.Group | null;
    private leftFingers: THREE.Group[];
    private leftThumb: THREE.Group | null;
    private buttockCheeks: THREE.Mesh[];
    private upperLip: THREE.Object3D | null;
    private lowerLip: THREE.Object3D | null;

    // Track dynamic meshes
    private shirtMeshes: THREE.Object3D[] = [];
    private pantsMeshes: THREE.Object3D[] = [];
    private greavesMeshes: THREE.Object3D[] = [];
    private shortsMeshes: THREE.Object3D[] = []; // Add shortsMeshes array
    private robeMeshes: THREE.Object3D[] = [];
    private apronMeshes: THREE.Object3D[] = [];
    private capeMeshes: THREE.Object3D[] = [];
    private beltMeshes: THREE.Object3D[] = [];
    private bracerMeshes: THREE.Object3D[] = [];
    private gloveMeshes: THREE.Object3D[] = [];
    private gloveRightFingers: THREE.Group[] = [];
    private gloveRightThumb: THREE.Group | null = null;
    private gloveLeftFingers: THREE.Group[] = [];
    private gloveLeftThumb: THREE.Group | null = null;
    private lastShirtConfigHash: string = '';
    private lastPantsConfigHash: string = '';
    private lastGreavesConfigHash: string = '';
    private lastShortsConfigHash: string = ''; // Add lastShortsConfigHash
    private lastRobeConfigHash: string = '';
    private lastApronConfigHash: string = '';
    private lastCapeConfigHash: string = '';
    private lastBeltConfigHash: string = '';
    private lastBracersConfigHash: string = '';
    private lastGloveConfigHash: string = '';
    private lastShoeState: boolean | null = null;
    private lastHairHash: string = '';

    constructor(parts: any, materials: PlayerMaterials, arrays: {
        forefootGroups: THREE.Group[],
        heelGroups: THREE.Group[],
        toeUnits: THREE.Group[],
        irises: THREE.Mesh[],
        pupils: THREE.Mesh[],
        eyes: THREE.Mesh[],
        eyelids: THREE.Group[],
        rightFingers: THREE.Group[],
        rightThumb: THREE.Group | null,
        leftFingers: THREE.Group[],
        leftThumb: THREE.Group | null,
        buttockCheeks: THREE.Mesh[],
        upperLip: THREE.Object3D | null,
        lowerLip: THREE.Object3D | null,
    }) {
        this.parts = parts;
        this.materials = materials;
        this.forefootGroups = arrays.forefootGroups;
        this.heelGroups = arrays.heelGroups;
        this.toeUnits = arrays.toeUnits;
        this.irises = arrays.irises;
        this.pupils = arrays.pupils;
        this.eyes = arrays.eyes;
        this.eyelids = arrays.eyelids;
        this.rightFingers = arrays.rightFingers;
        this.rightThumb = arrays.rightThumb;
        this.leftFingers = arrays.leftFingers;
        this.leftThumb = arrays.leftThumb;
        this.buttockCheeks = arrays.buttockCheeks;
        this.upperLip = arrays.upperLip;
        this.lowerLip = arrays.lowerLip;
    }

    morph(config: PlayerConfig, isCombatStance: boolean = false) {
        const lerp = THREE.MathUtils.lerp;
        const damp = 0.15;

        const isFemale = config.bodyType === 'female';
        const isNaked = config.outfit === 'naked';
        const isNude = config.outfit === 'nude';
        const isClothed = !isNaked && !isNude;

        const tW = config.torsoWidth;
        const tH = config.torsoHeight;

        let baseLegSpacing = 0.12;
        let hipScale = 1.0;
        let shoulderScale = 1.0;
        let torsoWidthMult = 1.0;

        if (isFemale) {
            torsoWidthMult = 0.85;
            shoulderScale = 1.0;
            hipScale = 1.15;
            baseLegSpacing = 0.14;

            if (this.parts.buttocks) {
                this.parts.buttocks.visible = true;
                const bs = config.buttScale;
                this.parts.buttocks.scale.set(1 * bs, 1 * bs, 1 * bs);
            }
            this.parts.chest.visible = true;
            this.parts.maleChest.visible = false;
        } else {
            shoulderScale = 1.0;
            hipScale = 1.0;
            baseLegSpacing = 0.12;
            torsoWidthMult = 1.0;

            if (this.parts.buttocks) {
                const bs = config.buttScale;
                this.parts.buttocks.scale.set(0.8 * bs, 0.8 * bs, 0.3 * bs);
                this.parts.buttocks.visible = false;
            }
            this.parts.chest.visible = false;
            this.parts.maleChest.visible = true;
        }

        this.parts.torsoContainer.scale.set(tW * torsoWidthMult, tH, tW * torsoWidthMult);
        this.parts.topCap.scale.set(shoulderScale, 0.8, shoulderScale);
        
        // Pelvis scaling should be relative to its parent (torso), 
        // but torso is already scaled by torsoWidthMult. 
        // We want hipScale to be an absolute multiplier for hip width.
        this.parts.pelvis.scale.set(hipScale, 1, hipScale);

        // Fix: Reset PelvisMesh scale to ensure it recovers from any animation stretching
        // The PelvisMesh is the skin layer, which should stay at (1, 1, 0.7)
        const pelvisMesh = this.parts.pelvis.children.find((c: any) => c.name === 'PelvisMesh');
        if (pelvisMesh) {
            pelvisMesh.scale.set(1, 1, 0.7);
        }

        const legX = baseLegSpacing * tW;
        this.parts.leftThigh.position.x = legX;
        this.parts.rightThigh.position.x = -legX;

        const aS = config.armScale;
        const invTW = 1 / (tW * torsoWidthMult);
        const invTH = 1 / tH;
        this.parts.rightArm.scale.set(aS * invTW, aS * invTH, aS * invTW);
        this.parts.leftArm.scale.set(aS * invTW, aS * invTH, aS * invTW);

        const lS = config.legScale;
        this.parts.rightThigh.scale.setScalar(lS);
        this.parts.leftThigh.scale.setScalar(lS);

        const nT = config.neckThickness;
        const nH = config.neckHeight;
        if (this.parts.neck) {
            this.parts.neck.scale.set(nT, nH, nT);
            this.parts.neck.position.y = 0.70 + (0.12 * nH);
        }
        if (this.parts.neckBase) this.parts.neckBase.scale.set(nT, 1, nT);

        const hS = config.headScale;
        const parentScaleX = tW * torsoWidthMult * nT;
        const parentScaleY = tH * nH;
        const safePX = parentScaleX || 1;
        const safePY = parentScaleY || 1;
        this.parts.head.scale.set(hS / safePX, hS / safePY, hS / safePX);

        if (this.parts.brain) {
            this.parts.brain.visible = config.showBrain;
            const bS = config.brainSize;
            this.parts.brain.scale.set(bS, bS, bS);
        }

        // --- BUTTOCKS LOGIC ---
        if (this.parts.buttocks && this.buttockCheeks.length > 0) {
            this.parts.buttocks.children.forEach((container: THREE.Group, i: number) => {
                const cheek = this.buttockCheeks[i];
                const undie = container.children.find(c => c.name === 'undie');
                const cover = container.children.find(c => c.name === 'pantsButtCover');
                const side = i === 0 ? -1 : 1;
                container.position.set(
                    side * (0.075 + config.buttX),
                    -0.06 + config.buttY,
                    -0.11 + config.buttZ
                );
                const hasPants = config.equipment.pants;
                if (hasPants) {
                    cheek.visible = false;
                    if (undie) undie.visible = false;
                } else {
                    cheek.visible = true;
                    cheek.material = this.materials.skin;
                    if (undie) undie.visible = isNaked;
                }
                if (cover) {
                    if (hasPants) {
                        cover.visible = true;
                        cover.scale.set(1.08, 1.02, 0.95);
                    } else {
                        cover.visible = false;
                    }
                }
            });
        }

        if (this.parts.underwearBottom) {
            this.parts.underwearBottom.visible = isNaked;
            // Reset underwear scale to match the reduced TorsoBuilder values
            // This prevents underwear from poking through pants
            this.parts.underwearBottom.scale.set(1.0, 1.0, 1.0);
        }
        if (this.parts.maleBulge) this.parts.maleBulge.visible = !isFemale && !config.equipment.pants;
        const showBra = isNaked && isFemale;
        if (this.parts.braStrap) this.parts.braStrap.visible = showBra;
        if (this.parts.braCups) this.parts.braCups.forEach((c: THREE.Mesh) => c.visible = showBra);

        this.parts.jaw.scale.setScalar(config.chinSize);
        this.parts.jaw.position.y = -0.05 + config.chinHeight;
        this.parts.jawMesh.scale.y = 0.45 * config.chinLength;
        this.parts.jawMesh.position.z = 0.09 + config.chinForward;

        if (this.parts.maxilla) {
            this.parts.maxilla.scale.set(config.maxillaScaleX, config.maxillaScaleY, config.maxillaScaleZ);
            this.parts.maxilla.position.set(0, -0.075 + config.maxillaOffsetY, 0.18 + config.maxillaOffsetZ);
        }
        if (this.upperLip) {
            this.upperLip.scale.set(config.upperLipWidth, config.upperLipHeight, 0.5 * config.upperLipThick);
            this.upperLip.position.y = -0.028 + config.upperLipOffsetY;
            this.upperLip.position.z = 0.025 + config.upperLipOffsetZ;
        }
        if (this.lowerLip) {
            this.lowerLip.scale.set(config.lowerLipWidth, config.lowerLipHeight, 0.5 * config.lowerLipThick);
            this.lowerLip.position.y = 0.035 + config.lowerLipOffsetY;
            this.lowerLip.position.z = 0.11 + config.lowerLipOffsetZ;
        }
        if (this.parts.nose?.userData.basePosition) {
            const base = this.parts.nose.userData.basePosition as THREE.Vector3;
            this.parts.nose.position.set(base.x, base.y + config.noseHeight, base.z + config.noseForward);
        }

        // --- Foot Swapping ---
        this.updateShoes(config);

        this.heelGroups.forEach(hg => { hg.scale.setScalar(config.heelScale); hg.scale.y *= config.heelHeight; });
        this.forefootGroups.forEach(fg => fg.scale.set(config.footWidth, 1, config.footLength));
        this.toeUnits.forEach(u => {
            if (u.userData.initialX !== undefined) u.position.x = u.userData.initialX * config.toeSpread;
        });

        this.irises.forEach(i => i.scale.setScalar(config.irisScale));
        this.pupils.forEach(p => p.scale.setScalar(config.pupilScale));

        this.updateGloves(config);

        const updateHand = (fingers: THREE.Group[], thumb: THREE.Group | null, isLeft: boolean) => {
            const held = config.selectedItem;
            // Bow (Left Hand Hold) vs Other (Right Hand Hold)
            let isHoldingThisHand = false;

            if (held === 'Bow') {
                // Left holds bow, Right holds string (so both grip)
                isHoldingThisHand = true;
            } else if (held) {
                isHoldingThisHand = !isLeft;
            }

            const shouldFist = isLeft ? isCombatStance || isHoldingThisHand : (isHoldingThisHand || isCombatStance);
            const baseCurl = shouldFist ? 1.6 : 0.1;
            fingers.forEach((fGroup, i) => {
                 const curl = baseCurl + (shouldFist ? i * 0.1 : i * 0.05);
                 const prox = fGroup.children.find(c => c.name === 'proximal');
                 if (prox) {
                     prox.rotation.x = lerp(prox.rotation.x, curl, damp);
                     const dist = prox.children.find(c => c.name === 'distal');
                     if (dist) dist.rotation.x = lerp(dist.rotation.x, curl * 1.1, damp);
                 }
            });
            if (thumb) {
                const prox = thumb.children.find(c => c.name === 'proximal');
                if (prox) {
                     const tX = shouldFist ? 1.5 : 0.1;
                     prox.rotation.x = lerp(prox.rotation.x, tX, damp);
                     const tZBase = shouldFist ? -0.2 : 0;
                     const tZ = isLeft ? -tZBase : tZBase;
                     prox.rotation.z = lerp(prox.rotation.z, tZ, damp);
                     const dist = prox.children.find(c => c.name === 'distal');
                     if (dist) dist.rotation.x = lerp(dist.rotation.x, shouldFist ? 1.0 : 0.1, damp);
                }
            }
        };
        updateHand(this.rightFingers, this.rightThumb, false);
        updateHand(this.leftFingers, this.leftThumb, true);
        updateHand(this.gloveRightFingers, this.gloveRightThumb, false);
        updateHand(this.gloveLeftFingers, this.gloveLeftThumb, true);

        // --- SHIRT RIGGING ---
        if (this.parts.shirt && this.parts.shirt.torso) {
            const s = this.parts.shirt.torso;
            const baseY = this.parts.torso?.position?.y ?? 0.38;
            s.position.set(config.shirtX, baseY + config.shirtY, config.shirtZ);
            s.rotation.set(config.shirtRotX, config.shirtRotY, config.shirtRotZ);
            s.scale.set(
                config.shirtScale * config.shirtStretchX,
                config.shirtScale * config.shirtStretchY,
                config.shirtScale * config.shirtStretchZ
            );
        }

        this.updatePants(config);
        this.updateGreaves(config);
        this.updateShorts(config); // Call updateShorts
        this.updateShirt(config);
        
        // Update Abs Positioning & Scale in real-time (without rebuilding shirt)
        if (this.parts.shirt && this.parts.shirt.details) {
            this.parts.shirt.details.forEach((child: any) => {
                if (child.userData.isAbs && child.userData.basePos) {
                    const base = child.userData.basePos;
                    const centerY = -0.07; 
                    const distY = base.y - centerY;
                    
                    // Combine base ab settings with shirt-specific ab offsets
                    const finalSpacing = config.absSpacing * config.shirtAbsSpacing;
                    const newY = centerY + (distY * finalSpacing) + config.absY + (config.shirtAbsY * 5);
                    
                    child.position.set(
                        base.x + config.absX + (config.shirtAbsX * 5),
                        newY,
                        base.z + config.absZ + (config.shirtAbsZ * 5)
                    );
                    
                    // Scale slightly larger than skin abs to form the fabric layer
                    const finalScale = config.absScale * config.shirtAbsScale;
                    child.scale.set(1.4 * finalScale, 0.9 * finalScale, 0.8 * finalScale);
                }
            });
        }
        
        this.updateRobe(config);
        this.updateApron(config);
        this.updateCape(config);
        this.updateBelt(config);
        this.updateBracers(config);
        this.updateHair(config);

        const hairMesh = this.parts.head?.getObjectByName('HairInstanced') as THREE.InstancedMesh;
        if (hairMesh && hairMesh.material) {
             (hairMesh.material as THREE.MeshToonMaterial).color.set(config.hairColor);
        }
    }

    private updateShirt(config: PlayerConfig) {
        const hash = `${config.outfit}_${config.shirtColor}_${config.bodyType}_${config.equipment.shirt}_${config.equipment.quiltedArmor}_${config.equipment.leatherArmor}_${config.equipment.heavyLeatherArmor}_${config.equipment.ringMail}_${config.equipment.plateMail}_${config.equipment.leatherDoublet}`;
        if (hash === this.lastShirtConfigHash) return;
        this.lastShirtConfigHash = hash;
        if (this.parts.shirt) this.parts.shirt = null;
        this.shirtMeshes.forEach(m => {
            if (m.parent) m.parent.remove(m);
            if ((m as THREE.Mesh).geometry) (m as THREE.Mesh).geometry.dispose();
        });
        this.shirtMeshes = [];
        const result = ShirtBuilder.build(this.parts, config);
        if (result) {
            this.shirtMeshes = result.meshes;
            this.parts.shirt = result.refs;
            
            // Update Abs Positioning & Scale (Shirt Overlays)
            if (this.parts.shirt && this.parts.shirt.details) {
                this.parts.shirt.details.forEach((child: any) => {
                    if (child.userData.isAbs && child.userData.basePos) {
                        const base = child.userData.basePos;
                        const centerY = -0.07; 
                        const distY = base.y - centerY;
                        
                        // Combine base ab settings with shirt-specific ab offsets
                        const finalSpacing = config.absSpacing * config.shirtAbsSpacing;
                        const newY = centerY + (distY * finalSpacing) + config.absY + (config.shirtAbsY * 5);
                        
                        child.position.set(
                            base.x + config.absX + (config.shirtAbsX * 5),
                            newY,
                            base.z + config.absZ + (config.shirtAbsZ * 5)
                        );
                        
                        // Scale slightly larger than skin abs to form the fabric layer
                        const finalScale = config.absScale * config.shirtAbsScale;
                        child.scale.set(1.4 * finalScale, 0.9 * finalScale, 0.8 * finalScale);
                    }
                });
            }
        }
    }

    private updatePants(config: PlayerConfig) {
        const hash = `${config.outfit}_${config.equipment.pants}_${config.equipment.hideBreeches}_${config.equipment.leatherPants}_${config.equipment.chainLeggings}_${config.equipment.plateLeggings}_${config.equipment.warlordLegPlates}_${config.pantsColor}`;
        if (hash === this.lastPantsConfigHash) return;
        this.lastPantsConfigHash = hash;
        this.pantsMeshes.forEach(m => {
            if (m.parent) m.parent.remove(m);
            if ((m as THREE.Mesh).geometry) (m as THREE.Mesh).geometry.dispose();
        });
        this.pantsMeshes = [];
        const meshes = PantsBuilder.build(this.parts, config);
        if (meshes) this.pantsMeshes = meshes;
    }

    private updateGreaves(config: PlayerConfig) {
        const hash = `${config.outfit}_${config.equipment.greaves}_${config.pantsColor}`;
        if (hash === this.lastGreavesConfigHash) return;
        this.lastGreavesConfigHash = hash;

        this.greavesMeshes.forEach(m => {
            if (m.parent) m.parent.remove(m);
            if ((m as THREE.Mesh).geometry) (m as THREE.Mesh).geometry.dispose();
        });
        this.greavesMeshes = [];

        const meshes = GreavesBuilder.build(this.parts, config);
        if (meshes) this.greavesMeshes = meshes;
    }

    private updateShorts(config: PlayerConfig) {
        const hash = `${config.outfit}_${config.equipment.shorts}_${config.pantsColor}`;
        if (hash === this.lastShortsConfigHash) return;
        this.lastShortsConfigHash = hash;

        this.shortsMeshes.forEach(m => {
            if (m.parent) m.parent.remove(m);
            if ((m as THREE.Mesh).geometry) (m as THREE.Mesh).geometry.dispose();
        });
        this.shortsMeshes = [];

        const meshes = ShortsBuilder.build(this.parts, config);
        if (meshes) this.shortsMeshes = meshes;
    }

    private updateRobe(config: PlayerConfig) {
        const hash = `${config.equipment.robe}_${config.robeColor}_${config.robeTrimColor}_${config.bodyType}`;
        if (hash === this.lastRobeConfigHash) return;
        this.lastRobeConfigHash = hash;

        this.robeMeshes.forEach(m => {
            if (m.parent) m.parent.remove(m);
            if ((m as THREE.Mesh).geometry) (m as THREE.Mesh).geometry.dispose();
        });
        this.robeMeshes = [];

        const result = RobeBuilder.build(this.parts, config);
        if (result) {
            this.robeMeshes = result.meshes;
        }
    }

    private updateApron(config: PlayerConfig) {
        const hash = `${config.equipment.blacksmithApron}_${config.apronColor}_${config.apronDetailColor}_${config.apronX}_${config.apronY}_${config.apronZ}_${config.apronScale}_${config.apronWidth}_${config.apronHeight}_${config.apronBibX}_${config.apronBibY}_${config.apronBibZ}_${config.apronBibScale}_${config.apronSkirtX}_${config.apronSkirtY}_${config.apronSkirtZ}_${config.apronSkirtScaleX}_${config.apronSkirtScaleY}_${config.apronSkirtScaleZ}_${config.apronStrapX}_${config.apronStrapY}_${config.apronStrapZ}_${config.apronStrapRotX}_${config.apronStrapRotY}_${config.apronStrapRotZ}`;
        if (hash === this.lastApronConfigHash) return;
        this.lastApronConfigHash = hash;

        this.apronMeshes.forEach(m => {
            if (m.parent) m.parent.remove(m);
            if (m instanceof THREE.Mesh && m.geometry) m.geometry.dispose();
            m.traverse(c => {
                if (c instanceof THREE.Mesh) {
                    if (c.geometry) c.geometry.dispose();
                }
            });
        });
        this.apronMeshes = [];

        // Import should be handled by adding it to the top of the file if not present, 
        // but looking at previous edits, I should check imports.
        // For now I will assume I need to add the import too.
        const result = ApronBuilder.build(this.parts, config);
        if (result) {
            this.apronMeshes = result.meshes;
        }
    }

    private updateShoes(config: PlayerConfig) {
        if (config.equipment.shoes === this.lastShoeState) return;
        this.lastShoeState = config.equipment.shoes;

        const shinLen = 0.42;
        const footOffsetY = -shinLen;

        const swapFeet = (isLeft: boolean, shin: THREE.Group) => {
            // Find and remove existing foot anchor
            const oldAnchor = shin.children.find(c => c.name.includes('_foot_anchor'));
            if (oldAnchor) {
                shin.remove(oldAnchor);
                oldAnchor.traverse(child => {
                    if (child instanceof THREE.Mesh) child.geometry.dispose();
                });
            }

            // Re-populate skeletal arrays via the builder
            const result = config.equipment.shoes
                ? ShoeBuilder.create(this.materials, isLeft, this)
                : FootBuilder.create(this.materials, isLeft, this);

            result.heelGroup.position.y = footOffsetY;
            shin.add(result.heelGroup);
        };

        // Reset tracking arrays
        this.heelGroups.length = 0;
        this.forefootGroups.length = 0;
        this.toeUnits.length = 0;

        if (this.parts.rightShin) swapFeet(false, this.parts.rightShin);
        if (this.parts.leftShin) swapFeet(true, this.parts.leftShin);
    }

    private updateHair(config: PlayerConfig) {
        const hash = `${config.hairStyle}_${config.headScale}`;
        if (hash === this.lastHairHash) return;
        this.lastHairHash = hash;

        const hairCap = this.parts.head?.getObjectByName('HairCap');
        if (hairCap) {
            hairCap.visible = config.hairStyle !== 'bald';
        }

        HairBuilder.build(this.parts, config, this.materials.hair);
    }

    private updateCape(config: PlayerConfig) {
        const hash = `${config.equipment.cape}_${config.robeColor}`;
        if (hash === this.lastCapeConfigHash) return;
        this.lastCapeConfigHash = hash;

        this.capeMeshes.forEach(m => {
            if (m.parent) m.parent.remove(m);
            if (m instanceof THREE.Mesh && m.geometry) m.geometry.dispose();
        });
        this.capeMeshes = [];

        const result = CapeBuilder.build(this.parts, config);
        if (result) {
            this.capeMeshes = result.meshes;
        }
    }

    private updateBelt(config: PlayerConfig) {
        const hash = `${config.equipment.belt}`;
        if (hash === this.lastBeltConfigHash) return;
        this.lastBeltConfigHash = hash;

        this.beltMeshes.forEach(m => {
            if (m.parent) m.parent.remove(m);
            if (m instanceof THREE.Mesh && m.geometry) m.geometry.dispose();
        });
        this.beltMeshes = [];

        const result = BeltBuilder.build(this.parts, config);
        if (result) {
            this.beltMeshes = result.meshes;
        }
    }

    private updateBracers(config: PlayerConfig) {
        const hash = `${config.equipment.bracers}`;
        if (hash === this.lastBracersConfigHash) return;
        this.lastBracersConfigHash = hash;

        this.bracerMeshes.forEach(m => {
            if (m.parent) m.parent.remove(m);
            if (m instanceof THREE.Mesh && m.geometry) m.geometry.dispose();
        });
        this.bracerMeshes = [];

        if (!config.equipment.bracers) return;

        // Add bracers to forearms
        if (this.parts.rightForeArm) {
            const rightBracer = BracersBuilder.build(false, config);
            this.parts.rightForeArm.add(rightBracer);
            this.bracerMeshes.push(rightBracer);
        }
        if (this.parts.leftForeArm) {
            const leftBracer = BracersBuilder.build(true, config);
            this.parts.leftForeArm.add(leftBracer);
            this.bracerMeshes.push(leftBracer);
        }
    }

    private updateGloves(config: PlayerConfig) {
        const hash = `${config.equipment.gloves}`;
        if (hash === this.lastGloveConfigHash) return;
        this.lastGloveConfigHash = hash;

        this.gloveMeshes.forEach(m => {
            if (m.parent) m.parent.remove(m);
            m.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else if (child.material) {
                        child.material.dispose();
                    }
                }
            });
        });
        this.gloveMeshes = [];
        this.gloveRightFingers = [];
        this.gloveRightThumb = null;
        this.gloveLeftFingers = [];
        this.gloveLeftThumb = null;

        if (!config.equipment.gloves) return;

        const gloveArrays = {
            rightFingers: [] as THREE.Group[],
            rightThumb: null as THREE.Group | null,
            leftFingers: [] as THREE.Group[],
            leftThumb: null as THREE.Group | null,
            thenars: [] as THREE.Mesh[]
        };

        if (this.parts.rightHand) {
            const rightGlove = GloveBuilder.create(false, gloveArrays);
            this.parts.rightHand.add(rightGlove);
            this.gloveMeshes.push(rightGlove);
        }

        if (this.parts.leftHand) {
            const leftGlove = GloveBuilder.create(true, gloveArrays);
            this.parts.leftHand.add(leftGlove);
            this.gloveMeshes.push(leftGlove);
        }

        this.gloveRightFingers = gloveArrays.rightFingers;
        this.gloveRightThumb = gloveArrays.rightThumb;
        this.gloveLeftFingers = gloveArrays.leftFingers;
        this.gloveLeftThumb = gloveArrays.leftThumb;
    }
}
