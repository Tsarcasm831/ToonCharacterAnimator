
import * as THREE from 'three';
import { PlayerConfig, OutfitType } from '../../types';
import { PlayerMaterials } from './PlayerMaterials';
import { PlayerPartsRegistry } from './PlayerPartsRegistry';
import { ShirtBuilder } from './mesh/ShirtBuilder';
import { PantsBuilder } from './mesh/PantsBuilder';
import { ShortsBuilder } from './mesh/ShortsBuilder';
import { ShoeBuilder } from './mesh/ShoeBuilder';
import { FootBuilder } from './mesh/FootBuilder';
import { ApronBuilder } from './mesh/ApronBuilder';

export class PlayerClothingManager {
    private partsRegistry: PlayerPartsRegistry;
    private materials: PlayerMaterials;

    private shirtMeshes: THREE.Object3D[] = [];
    private pantsMeshes: THREE.Object3D[] = [];
    private shortsMeshes: THREE.Object3D[] = [];
    private apronMeshes: THREE.Object3D[] = [];
    
    private lastShirtConfigHash: string = '';
    private lastPantsConfigHash: string = '';
    private lastShortsConfigHash: string = '';
    private lastApronConfigHash: string = '';
    private lastShoeState: boolean | null = null;

    constructor(registry: PlayerPartsRegistry, materials: PlayerMaterials) {
        this.partsRegistry = registry;
        this.materials = materials;
    }

    applyOutfit(outfit: OutfitType, skinColor: string) {
        this.materials.applyOutfit(outfit, skinColor);
    }

    update(config: PlayerConfig) {
        this.updatePants(config);
        this.updateShorts(config);
        this.updateShirt(config);
        this.updateApron(config);
        this.updateShoes(config);
    }

    private updateShirt(config: PlayerConfig) {
        const hash = `${config.outfit}_${config.shirtColor}_${config.shirtColor2}_${config.bodyType}_${config.equipment.shirt}_${config.equipment.quiltedArmor}_${config.equipment.leatherArmor}_${config.equipment.heavyLeatherArmor}_${config.equipment.ringMail}_${config.equipment.plateMail}`;
        if (hash === this.lastShirtConfigHash) return;
        this.lastShirtConfigHash = hash;

        // Cleanup old shirt
        if (this.partsRegistry.parts.shirt) this.partsRegistry.parts.shirt = null;

        this.shirtMeshes.forEach(m => {
            if (m.parent) m.parent.remove(m);
            if ((m as THREE.Mesh).geometry) (m as THREE.Mesh).geometry.dispose();
        });
        this.shirtMeshes = [];

        // Build new shirt
        const result = ShirtBuilder.build(this.partsRegistry.parts, config);
        if (result) {
            this.shirtMeshes = result.meshes;
            this.partsRegistry.parts.shirt = result.refs;
        }
    }

    private updatePants(config: PlayerConfig) {
        const hash = `${config.outfit}_${config.equipment.pants}_${config.pantsColor}`;
        if (hash === this.lastPantsConfigHash) return;
        this.lastPantsConfigHash = hash;

        this.pantsMeshes.forEach(m => {
            if (m.parent) m.parent.remove(m);
            if ((m as THREE.Mesh).geometry) (m as THREE.Mesh).geometry.dispose();
        });
        this.pantsMeshes = [];

        const meshes = PantsBuilder.build(this.partsRegistry.parts, config);
        if (meshes) {
            this.pantsMeshes = meshes;
        }
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

        const meshes = ShortsBuilder.build(this.partsRegistry.parts, config);
        if (meshes) {
            this.shortsMeshes = meshes;
        }
    }

    private updateApron(config: PlayerConfig) {
        const hash = `${config.equipment.blacksmithApron}_${config.apronColor}_${config.apronDetailColor}_${config.apronX}_${config.apronY}_${config.apronZ}_${config.apronScale}_${config.apronWidth}_${config.apronHeight}`;
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

        const result = ApronBuilder.build(this.partsRegistry.parts, config);
        if (result) {
            this.apronMeshes = result.meshes;
        }
    }

    private updateShoes(config: PlayerConfig) {
        const currentShoes = config.equipment.shoes;
        if (currentShoes === this.lastShoeState) return;
        this.lastShoeState = currentShoes;

        const removeGroups = (groups: THREE.Group[]) => {
            groups.forEach(g => {
                if (g.parent) g.parent.remove(g);
                g.traverse(c => {
                    if (c instanceof THREE.Mesh) c.geometry.dispose();
                });
            });
        };

        // Clear existing feet/shoes arrays in registry
        removeGroups(this.partsRegistry.forefootGroups);
        removeGroups(this.partsRegistry.heelGroups);
        this.partsRegistry.forefootGroups.length = 0;
        this.partsRegistry.heelGroups.length = 0;
        this.partsRegistry.toeUnits.length = 0; // Cleared as FootBuilder populates it

        // Helper to attach new foot parts
        const attachFoot = (isLeft: boolean, shin: THREE.Group) => {
            const oldFoot = shin.children.find(c => c.name.includes('_foot_anchor') || c.name.includes('_heel'));
            if (oldFoot) shin.remove(oldFoot);

            // Create temporary arrays to capture output, then push to registry
            const arrays = {
                forefootGroups: [],
                heelGroups: [],
                toeUnits: []
            };

            const result = currentShoes 
                ? ShoeBuilder.create(this.materials, isLeft, arrays)
                : FootBuilder.create(this.materials, isLeft, arrays);
            
            const footOffsetY = -0.42; // shinLen
            result.heelGroup.position.y = footOffsetY;
            shin.add(result.heelGroup);

            // Update Registry
            // @ts-ignore
            this.partsRegistry.forefootGroups.push(...arrays.forefootGroups);
            // @ts-ignore
            this.partsRegistry.heelGroups.push(...arrays.heelGroups);
            // @ts-ignore
            this.partsRegistry.toeUnits.push(...arrays.toeUnits);
        };

        attachFoot(false, this.partsRegistry.parts.rightShin);
        attachFoot(true, this.partsRegistry.parts.leftShin);
    }
}
