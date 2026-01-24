
import { HoodBuilder } from './equipment/apparel/HoodBuilder';
import { HelmBuilder } from './equipment/apparel/HelmBuilder';
import { MaskBuilder } from './equipment/apparel/MaskBuilder';
import { PauldronBuilder } from './equipment/apparel/PauldronBuilder';
import { ShieldBuilder } from './equipment/apparel/ShieldBuilder';
import { MageHatBuilder } from './equipment/apparel/MageHatBuilder';
import { SkirtBuilder } from './equipment/apparel/SkirtBuilder';
import { SkullcapBuilder } from './equipment/apparel/SkullcapBuilder';
import { updateHeldItem as updateHeldItemEquipment } from './equipment/HeldItemEquipment';
import { PlayerConfig } from '../../types';

export class PlayerEquipment {
    static updateHeldItem(
        itemName: string | null,
        currentHeldItem: string | null,
        parts: any,
        equippedMeshes: any
    ): string | null {
        return updateHeldItemEquipment(itemName, currentHeldItem, parts, equippedMeshes);
    }

    static updateArmor(config: PlayerConfig, parts: any, equippedMeshes: any) {
        const { helm, shoulders, shield, mask, hood, mageHat, skirt, skullcap } = config.equipment;
        
        if (helm && !equippedMeshes.helm) {
            const helmGroup = HelmBuilder.build();
            parts.headMount.add(helmGroup);
            equippedMeshes.helm = helmGroup;
        } else if (!helm && equippedMeshes.helm) {
            parts.headMount.remove(equippedMeshes.helm);
            delete equippedMeshes.helm;
        }
        
        if (hood && !equippedMeshes.hood) {
            const h = HoodBuilder.build(parts, config);
            parts.headMount.add(h);
            equippedMeshes.hood = h;
        } else if (!hood && equippedMeshes.hood) {
            parts.headMount.remove(equippedMeshes.hood);
            delete equippedMeshes.hood;
        }

        if (mageHat && !equippedMeshes.mageHat) {
            const h = MageHatBuilder.build(config);
            parts.headMount.add(h);
            equippedMeshes.mageHat = h;
        } else if (!mageHat && equippedMeshes.mageHat) {
            parts.headMount.remove(equippedMeshes.mageHat);
            delete equippedMeshes.mageHat;
        }

        if (mask && !equippedMeshes.mask) {
            const maskGroup = MaskBuilder.build(config);
            parts.headMount.add(maskGroup);
            equippedMeshes.mask = maskGroup;
        } else if (!mask && equippedMeshes.mask) {
            parts.headMount.remove(equippedMeshes.mask);
            delete equippedMeshes.mask;
        }

        if (shoulders && !equippedMeshes.leftPauldron) {
            equippedMeshes.leftPauldron = PauldronBuilder.build(true, config);
            equippedMeshes.rightPauldron = PauldronBuilder.build(false, config);
            parts.leftShoulderMount.add(equippedMeshes.leftPauldron);
            parts.rightShoulderMount.add(equippedMeshes.rightPauldron);
        } else if (!shoulders && equippedMeshes.leftPauldron) {
            if (equippedMeshes.leftPauldron.parent) equippedMeshes.leftPauldron.parent.remove(equippedMeshes.leftPauldron);
            if (equippedMeshes.rightPauldron.parent) equippedMeshes.rightPauldron.parent.remove(equippedMeshes.rightPauldron);
            delete equippedMeshes.leftPauldron; 
            delete equippedMeshes.rightPauldron;
        }

        if (shield && !equippedMeshes.shield) {
            const shieldMesh = ShieldBuilder.build();
            parts.leftShieldMount.add(shieldMesh);
            equippedMeshes.shield = shieldMesh;
        } else if (!shield && equippedMeshes.shield) {
            parts.leftShieldMount.remove(equippedMeshes.shield);
            delete equippedMeshes.shield;
        }

        if (skirt && !equippedMeshes.skirt) {
            const skirtRes = SkirtBuilder.build(parts, config);
            if (skirtRes) equippedMeshes.skirt = skirtRes.meshes;
        } else if (!skirt && equippedMeshes.skirt) {
            if (Array.isArray(equippedMeshes.skirt)) {
                equippedMeshes.skirt.forEach((m: any) => {
                    if (m.parent) m.parent.remove(m);
                });
            }
            delete equippedMeshes.skirt;
        }

        if (skullcap && !equippedMeshes.skullcap) {
            const skullcapGroup = SkullcapBuilder.build();
            parts.headMount.add(skullcapGroup);
            equippedMeshes.skullcap = skullcapGroup;
        } else if (!skullcap && equippedMeshes.skullcap) {
            parts.headMount.remove(equippedMeshes.skullcap);
            delete equippedMeshes.skullcap;
        }
    }
}
