import * as THREE from 'three';
import { PlayerConfig, OutfitType } from '../../types';
import { PlayerMaterials } from './PlayerMaterials';
import { PlayerEquipment } from './PlayerEquipment';
import { PlayerMeshBuilder } from './PlayerMeshBuilder';
import { ShirtBuilder } from './mesh/ShirtBuilder';
import { PantsBuilder } from './mesh/PantsBuilder';
import { HairBuilder } from './mesh/HairBuilder';
import { FootBuilder } from './mesh/FootBuilder';
import { ShoeBuilder } from './mesh/ShoeBuilder';
import { BodyMorpher } from './BodyMorpher';
import { EquipmentManager } from './EquipmentManager';
import { HairSimulation } from './HairSimulation';

export class PlayerModel {
    group: THREE.Group;
    parts: any = {};
    
    private materials: PlayerMaterials;
    private bodyMorpher: BodyMorpher;
    private equipmentManager: EquipmentManager;
    private hairSimulation: HairSimulation;
    
    public forefootGroups: THREE.Group[] = [];
    public heelGroups: THREE.Group[] = [];
    public toeUnits: THREE.Group[] = [];
    public irises: THREE.Mesh[] = [];
    public pupils: THREE.Mesh[] = [];
    public eyes: THREE.Mesh[] = []; // Sclera meshes for rotation
    public eyelids: THREE.Group[] = [];
    public rightFingers: THREE.Group[] = [];
    public rightThumb: THREE.Group | null = null;
    public leftFingers: THREE.Group[] = [];
    public leftThumb: THREE.Group | null = null;
    public buttockCheeks: THREE.Mesh[] = [];

    // Lip References
    private upperLip: THREE.Object3D | null = null;
    private lowerLip: THREE.Object3D | null = null;

    equippedMeshes: {
        helm?: THREE.Object3D;
        mask?: THREE.Object3D;
        hood?: THREE.Object3D;
        leftPauldron?: THREE.Object3D;
        rightPauldron?: THREE.Object3D;
        shield?: THREE.Object3D;
        heldItem?: THREE.Object3D;
        quiver?: THREE.Object3D;
    } = {};

    private lastDebugHead: boolean = false;
    private debugHeadMaterials: Record<string, THREE.Material> = {
        'HeadTop': new THREE.MeshStandardMaterial({ color: 0xff5555, roughness: 0.5, name: 'DebugTop' }), 
        'HeadFront': new THREE.MeshStandardMaterial({ color: 0x55ffff, roughness: 0.5, name: 'DebugFront' }), 
        'HeadCheeksBottom': new THREE.MeshStandardMaterial({ color: 0x800080, roughness: 0.5, name: 'DebugCheeksBottom' }), 
        'HeadBackTop': new THREE.MeshStandardMaterial({ color: 0x8888ff, roughness: 0.5, name: 'DebugBackTop' }), 
        'HeadBackMiddle': new THREE.MeshStandardMaterial({ color: 0x4444ff, roughness: 0.5, name: 'DebugBackMiddle' }), 
        'HeadBackBottom': new THREE.MeshStandardMaterial({ color: 0x000088, roughness: 0.5, name: 'DebugBackBottom' }), 
        'MaxillaMesh': new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5, name: 'DebugMaxilla' }), 
        'JawMesh': new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5, name: 'DebugJaw' }), 
    };

    constructor(config: PlayerConfig) {
        this.materials = new PlayerMaterials(config);
        const build = PlayerMeshBuilder.build(this.materials, config);
        this.group = build.group;
        this.parts = build.parts;
        this.forefootGroups = build.arrays.forefootGroups;
        this.heelGroups = build.arrays.heelGroups;
        this.toeUnits = build.arrays.toeUnits;
        this.irises = build.arrays.irises;
        this.pupils = build.arrays.pupils;
        this.eyes = build.arrays.eyes;
        this.eyelids = build.arrays.eyelids;
        this.rightFingers = build.arrays.rightFingers;
        this.rightThumb = build.arrays.rightThumb;
        this.leftFingers = build.arrays.leftFingers;
        this.leftThumb = build.arrays.leftThumb;
        this.buttockCheeks = build.arrays.buttockCheeks;
        this.upperLip = this.parts.upperLip || null;
        this.lowerLip = this.parts.lowerLip || null;

        this.equipmentManager = new EquipmentManager(this.parts);
        this.equippedMeshes = this.equipmentManager.equippedMeshes;
        this.bodyMorpher = new BodyMorpher(this.parts, this.materials, {
            forefootGroups: this.forefootGroups,
            heelGroups: this.heelGroups,
            toeUnits: this.toeUnits,
            irises: this.irises,
            pupils: this.pupils,
            eyes: this.eyes,
            eyelids: this.eyelids,
            rightFingers: this.rightFingers,
            rightThumb: this.rightThumb,
            leftFingers: this.leftFingers,
            leftThumb: this.leftThumb,
            buttockCheeks: this.buttockCheeks,
            upperLip: this.upperLip,
            lowerLip: this.lowerLip,
        });
        this.hairSimulation = new HairSimulation();
    }

    update(dt: number, velocity: THREE.Vector3) {
        this.hairSimulation.update(dt, velocity, this.parts.head);
    }

    updateHeldItem(itemName: string | null) {
        this.equipmentManager.updateHeldItem(itemName);
    }

    updateEquipment(config: PlayerConfig) {
        this.equipmentManager.updateEquipment(config);
    }

    private updateHeadDebug(enabled: boolean) {
        const headGroup = this.parts.head as THREE.Group;
        if (!headGroup) return;
        headGroup.traverse((obj) => {
             if (obj instanceof THREE.Mesh) {
                 if (this.debugHeadMaterials[obj.name]) {
                     obj.material = enabled ? this.debugHeadMaterials[obj.name] : this.materials.skin;
                 }
             }
        });
    }

    sync(config: PlayerConfig, isCombatStance: boolean = false) {
        this.materials.sync(config);
        if (config.debugHead !== this.lastDebugHead) {
            this.updateHeadDebug(config.debugHead);
            this.lastDebugHead = config.debugHead;
        }
        
        this.bodyMorpher.morph(config, isCombatStance);
        this.equipmentManager.updateEquipment(config);
        this.equipmentManager.updateHeldItem(config.selectedItem);
        this.equipmentManager.positionEquipment(config);
    }
}
