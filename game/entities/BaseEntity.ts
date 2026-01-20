import * as THREE from 'three';
import { EntityStats, PlayerConfig, UnitState } from '../../types';
import { Environment } from '../environment/Environment';

export abstract class BaseEntity {
    public uuid: string;
    public group: THREE.Group;
    public scene: THREE.Scene;
    public position: THREE.Vector3;
    public rotationY: number = 0;
    public isDead: boolean = false;
    public stats?: EntityStats;
    public config?: PlayerConfig;
    
    // External Control (Auto-Battler)
    public externalControl: boolean = false;
    public combatState: UnitState = 'IDLE';

    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        this.scene = scene;
        this.uuid = THREE.MathUtils.generateUUID();
        this.position = initialPos.clone();
        this.group = new THREE.Group();
        this.group.position.copy(this.position);
        scene.add(this.group);
    }

    abstract update(dt: number, ...args: any[]): void;

    public dispose() {
        if (this.group.parent) {
            this.group.parent.remove(this.group);
        }
    }
}
