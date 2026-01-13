
import * as THREE from 'three';
import { PlayerConfig } from '../../types';

export class PlayerUtils {
    // Matching constants from Environment.ts to calculate pond depth mathematically
    static POND_X = 8;
    static POND_Z = 6;
    static POND_RADIUS = 4.5;
    static POND_DEPTH = 1.8;

    // World size
    static WORLD_LIMIT = 1000;

    static getHitboxBounds(position: THREE.Vector3, config: PlayerConfig): THREE.Box3 {
        const { legScale, torsoHeight, torsoWidth, headScale } = config;
        
        const hipHeight = 0.94 * legScale;
        const torsoStack = 1.01 * torsoHeight;
        const headRadius = 0.21 * headScale;
        const totalHeight = hipHeight + torsoStack + headRadius;
        
        const width = 0.6 * torsoWidth;
        const depth = width * 0.7; 
        
        const rX = width / 2;
        const rZ = depth / 2;
        
        const box = new THREE.Box3();
        const stepOffset = 0.5; 
        
        box.min.set(position.x - rX, position.y + stepOffset, position.z - rZ);
        box.max.set(position.x + rX, position.y + totalHeight, position.z + rZ);
        
        return box;
    }

    static checkCollision(pos: THREE.Vector3, config: PlayerConfig, obstacles: THREE.Object3D[]): boolean {
        const playerBox = this.getHitboxBounds(pos, config);
        for (const obs of obstacles) {
            if (obs.userData.type === 'soft') continue;
            const obsBox = new THREE.Box3().setFromObject(obs);
            if (obsBox.intersectsBox(playerBox)) return true;
        }
        return false;
    }

    /**
     * Generic collision check for any box size.
     */
    static checkBoxCollision(pos: THREE.Vector3, size: THREE.Vector3, obstacles: THREE.Object3D[]): boolean {
        const halfX = size.x / 2;
        const halfZ = size.z / 2;
        const box = new THREE.Box3(
            new THREE.Vector3(pos.x - halfX, pos.y + 0.1, pos.z - halfZ),
            new THREE.Vector3(pos.x + halfX, pos.y + size.y, pos.z + halfZ)
        );

        for (const obs of obstacles) {
            if (obs.userData.type === 'soft' || obs.userData.type === 'creature') continue;
            const obsBox = new THREE.Box3().setFromObject(obs);
            if (obsBox.intersectsBox(box)) return true;
        }
        return false;
    }

    static isWithinBounds(pos: THREE.Vector3, margin: number = 0.5): boolean {
        const limit = this.WORLD_LIMIT - margin;
        return pos.x >= -limit && pos.x <= limit && pos.z >= -limit && pos.z <= limit;
    }

    static getTerrainHeight(x: number, z: number): number {
        const dx = x - this.POND_X;
        const dz = z - this.POND_Z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        
        if (dist < this.POND_RADIUS) {
            const normDist = dist / this.POND_RADIUS;
            return -this.POND_DEPTH * (1 - normDist * normDist);
        }
        return 0;
    }

    static getGroundHeight(pos: THREE.Vector3, config: PlayerConfig, obstacles: THREE.Object3D[]): number {
        let highest = this.getTerrainHeight(pos.x, pos.z);
        
        const width = (config as any).torsoWidth ? 0.6 * config.torsoWidth : 0.6;
        const depth = width * 0.7;
        
        const pBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(pos.x, 5, pos.z), 
            new THREE.Vector3(width, 10, depth)
        );

        for (const obs of obstacles) {
            if (obs.userData.type === 'soft' || obs.userData.type === 'creature') continue; 
            const obsBox = new THREE.Box3().setFromObject(obs);
            if (pBox.min.x < obsBox.max.x && pBox.max.x > obsBox.min.x &&
                pBox.min.z < obsBox.max.z && pBox.max.z > obsBox.min.z) {
                highest = Math.max(highest, obsBox.max.y);
            }
        }
        return highest;
    }

    static getLandingHeight(pos: THREE.Vector3, config: PlayerConfig, obstacles: THREE.Object3D[]): number {
        let highest = this.getTerrainHeight(pos.x, pos.z);
        const width = (config as any).torsoWidth ? 0.6 * config.torsoWidth : 0.6;
        const depth = width * 0.7;
        const stepLimit = 0.6; 
        const searchCeiling = pos.y + stepLimit;

        const pBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(pos.x, pos.y, pos.z), 
            new THREE.Vector3(width, 1, depth)
        );

        for (const obs of obstacles) {
            if (obs.userData.type === 'soft' || obs.userData.type === 'creature') continue; 
            const obsBox = new THREE.Box3().setFromObject(obs);
            if (pBox.min.x < obsBox.max.x && pBox.max.x > obsBox.min.x &&
                pBox.min.z < obsBox.max.z && pBox.max.z > obsBox.min.z) {
                if (obsBox.max.y <= searchCeiling) {
                    highest = Math.max(highest, obsBox.max.y);
                }
            }
        }
        return highest;
    }
}
