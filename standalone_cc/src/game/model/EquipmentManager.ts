
import * as THREE from 'three';
import { PlayerConfig } from '../../types';
import { PlayerEquipment } from './PlayerEquipment';

export class EquipmentManager {
    equippedMeshes: {
        helm?: THREE.Object3D;
        mask?: THREE.Object3D;
        plagueDoctorMask?: THREE.Object3D;
        hood?: THREE.Object3D;
        mageHat?: THREE.Object3D;
        leftPauldron?: THREE.Object3D;
        rightPauldron?: THREE.Object3D;
        shield?: THREE.Object3D;
        heldItem?: THREE.Object3D;
        quiver?: THREE.Object3D;
    } = {};

    private parts: any;
    private currentHeldItem: string | null = null;

    constructor(parts: any) {
        this.parts = parts;
    }

    private applyHandMountOffsets(config: PlayerConfig) {
        const rightHandMount = this.parts.rightHandMount as THREE.Object3D | undefined;
        const leftHandMount = this.parts.leftHandMount as THREE.Object3D | undefined;
        if (!rightHandMount || !leftHandMount) return;

        const isImp = config.impersonationModel === 'imp';

        if (isImp) {
            rightHandMount.position.set(0.008, -0.175, 0.045);
            leftHandMount.position.set(-0.008, -0.175, 0.045);
            rightHandMount.rotation.set(0, 0, Math.PI / 2);
            leftHandMount.rotation.set(0, Math.PI, 0);
            return;
        }

        rightHandMount.position.set(0, -0.06, -0.02);
        leftHandMount.position.set(0, -0.06, -0.02);
        rightHandMount.rotation.set(0, 0, 0);
        leftHandMount.rotation.set(0, Math.PI, 0);
    }

    private applyEmbellishmentColor(target: THREE.Object3D, embellishmentColor?: string) {
        target.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            if (!(child.material instanceof THREE.MeshStandardMaterial)) return;

            const material = child.material;
            const defaultColorHex = material.userData.defaultEmbellishmentColorHex as number | undefined;

            if (defaultColorHex === undefined) {
                material.userData.defaultEmbellishmentColorHex = material.color.getHex();
            }

            if (embellishmentColor) {
                material.color.set(embellishmentColor);
                return;
            }

            material.color.set((material.userData.defaultEmbellishmentColorHex as number) ?? material.color.getHex());
        });
    }

    updateEquipment(config: PlayerConfig) {
        PlayerEquipment.updateArmor(config, this.parts, this.equippedMeshes);
    }

    updateHeldItem(itemName: string | null) {
        this.currentHeldItem = PlayerEquipment.updateHeldItem(
            itemName,
            this.currentHeldItem,
            this.parts,
            this.equippedMeshes
        );
    }

    positionEquipment(config: PlayerConfig) {
        this.applyHandMountOffsets(config);

        // --- RIGGING UPDATES ---
        if (this.equippedMeshes.helm) {
            this.equippedMeshes.helm.position.set(config.helmX, config.helmY, config.helmZ);
            this.equippedMeshes.helm.rotation.x = config.helmRotX;
            this.equippedMeshes.helm.scale.setScalar(config.helmScale);
            this.applyEmbellishmentColor(this.equippedMeshes.helm, config.embellishmentColor);
        }
        if (this.equippedMeshes.hood) {
            this.equippedMeshes.hood.position.set(config.hoodX, config.hoodY, config.hoodZ);
            this.equippedMeshes.hood.scale.setScalar(config.hoodScale);
            this.equippedMeshes.hood.traverse((child: THREE.Object3D) => {
                if (!(child instanceof THREE.Mesh)) return;
                if (!(child.material instanceof THREE.MeshStandardMaterial)) return;

                const hoodMat = child.material;
                const isUnique = hoodMat.userData.isUniqueHoodMaterial as boolean | undefined;
                if (!isUnique) {
                    child.material = hoodMat.clone();
                    (child.material as THREE.MeshStandardMaterial).userData.isUniqueHoodMaterial = true;
                }

                child.material.color.set(config.hoodColor);
            });
        }
        if (this.equippedMeshes.mageHat) {
            this.equippedMeshes.mageHat.position.set(config.mageHatX, config.mageHatY, config.mageHatZ);
            this.equippedMeshes.mageHat.rotation.x = config.mageHatRotX;
            this.equippedMeshes.mageHat.scale.setScalar(config.mageHatScale);
            
            // Update colors in real-time
            this.equippedMeshes.mageHat.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    if (child.material instanceof THREE.MeshStandardMaterial) {
                        if (child.geometry.type === 'CylinderGeometry' && child.position.y > 0) {
                            child.material.color.set(config.mageHatBandColor);
                        } else if (child.geometry.type !== 'BoxGeometry' && child.geometry.type !== 'ConeGeometry') {
                            child.material.color.set(config.mageHatColor);
                        }
                    }
                }
            });
        }
        if (this.equippedMeshes.mask) {
            this.equippedMeshes.mask.position.set(config.maskX, config.maskY, config.maskZ);
            this.equippedMeshes.mask.rotation.x = config.maskRotX;
            this.equippedMeshes.mask.scale.set(
                config.maskScale * config.maskStretchX,
                config.maskScale * config.maskStretchY,
                config.maskScale * config.maskStretchZ
            );
        }
        if (this.equippedMeshes.plagueDoctorMask) {
            this.equippedMeshes.plagueDoctorMask.position.set(config.plagueMaskX, config.plagueMaskY, config.plagueMaskZ);
            this.equippedMeshes.plagueDoctorMask.rotation.x = config.plagueMaskRotX;
            this.equippedMeshes.plagueDoctorMask.scale.setScalar(config.plagueMaskScale);
            this.equippedMeshes.plagueDoctorMask.traverse((child) => {
                if (!(child instanceof THREE.Mesh)) return;
                if (!(child.material instanceof THREE.MeshStandardMaterial)) return;

                const mat = child.material;
                const isUnique = mat.userData.isUniquePlagueMaskMaterial as boolean | undefined;
                if (!isUnique) {
                    child.material = mat.clone();
                    (child.material as THREE.MeshStandardMaterial).userData.isUniquePlagueMaskMaterial = true;
                }

                const material = child.material as THREE.MeshStandardMaterial;
                const part = material.userData.plagueMaskPart as string | undefined;
                if (part === 'trim') {
                    material.color.set(config.plagueMaskTrimColor);
                    return;
                }
                if (part === 'lens') {
                    material.color.set(config.plagueMaskLensColor);
                    return;
                }
                material.color.set(config.plagueMaskColor);
            });
        }
        if (this.equippedMeshes.leftPauldron) {
            this.equippedMeshes.leftPauldron.position.set(config.shoulderX, config.shoulderY, config.shoulderZ);
            this.equippedMeshes.leftPauldron.scale.setScalar(config.shoulderScale);
            this.applyEmbellishmentColor(this.equippedMeshes.leftPauldron, config.embellishmentColor);
        }
        if (this.equippedMeshes.rightPauldron) {
            this.equippedMeshes.rightPauldron.position.set(-config.shoulderX, config.shoulderY, config.shoulderZ);
            this.equippedMeshes.rightPauldron.scale.setScalar(config.shoulderScale);
            this.applyEmbellishmentColor(this.equippedMeshes.rightPauldron, config.embellishmentColor);
        }
        if (this.equippedMeshes.shield) {
            this.equippedMeshes.shield.position.set(config.shieldX, config.shieldY, config.shieldZ);
            this.equippedMeshes.shield.rotation.z = config.shieldRotZ;
            this.equippedMeshes.shield.scale.setScalar(config.shieldScale);
        }
    }
}
