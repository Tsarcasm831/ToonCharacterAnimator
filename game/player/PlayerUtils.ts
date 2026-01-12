
import * as THREE from 'three';
import { PlayerConfig } from '../../types';

export class PlayerUtils {
    // Matching constants from Environment.ts to calculate pond depth mathematically
    static POND_X = 8;
    static POND_Z = 6;
    static POND_RADIUS = 4.5;
    static POND_DEPTH = 1.8;

    // World size expanded from 60 to 100 for 5x5 biomes (200x200 total)
    static WORLD_LIMIT = 1000;

    static getHitboxBounds(position: THREE.Vector3, config: PlayerConfig): THREE.Box3 {
        const { legScale, torsoHeight, torsoWidth, headScale } = config;
        
        // Height Calculation derived from model structure
        const hipHeight = 0.94 * legScale;
        const torsoStack = 1.01 * torsoHeight;
        const headRadius = 0.21 * headScale;
        const totalHeight = hipHeight + torsoStack + headRadius;
        
        // Width & Depth Calculation
        const width = 0.6 * torsoWidth;
        const depth = width * 0.7; // Thinner profile
        
        const rX = width / 2;
        const rZ = depth / 2;
        
        const box = new THREE.Box3();
        // Lift collision bottom slightly to smooth out step climbing
        // Increased to 0.5 to allow stepping onto foundations (0.4m high)
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
        // Base ground height comes from terrain math (supports negative/pond)
        let highest = this.getTerrainHeight(pos.x, pos.z);
        
        const width = 0.6 * config.torsoWidth;
        const depth = width * 0.7;
        
        // Cast check from high up (column check)
        const pBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(pos.x, 5, pos.z), // Start high
            new THREE.Vector3(width, 10, depth)
        );

        for (const obs of obstacles) {
            // IMPORTANT: Skip soft decorative items AND creatures (Wolves, Bears, Owls)
            // We only want to stand on 'hard' static objects like foundations, rocks, or logs.
            if (obs.userData.type === 'soft' || obs.userData.type === 'creature') continue; 
            
            const obsBox = new THREE.Box3().setFromObject(obs);
            if (pBox.min.x < obsBox.max.x && pBox.max.x > obsBox.min.x &&
                pBox.min.z < obsBox.max.z && pBox.max.z > obsBox.min.z) {
                // If we hit an obstacle, use its top surface
                highest = Math.max(highest, obsBox.max.y);
            }
        }
        return highest;
    }

    /**
     * Specialized version of getGroundHeight for Physics.
     * Ignores obstacles that are too high above the player (like doorway lintels).
     */
    static getLandingHeight(pos: THREE.Vector3, config: PlayerConfig, obstacles: THREE.Object3D[]): number {
        let highest = this.getTerrainHeight(pos.x, pos.z);
        
        const width = 0.6 * config.torsoWidth;
        const depth = width * 0.7;
        
        // Use a tighter column that starts from the player's current feet + step limit
        // We shouldn't snap to things higher than our step limit.
        const stepLimit = 0.6; // Slightly more than stepOffset (0.5)
        const searchCeiling = pos.y + stepLimit;

        // Bounding box for horizontal overlap check
        const pBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(pos.x, pos.y, pos.z), 
            new THREE.Vector3(width, 1, depth) // Height doesn't matter much here, we check Y manually
        );

        for (const obs of obstacles) {
            if (obs.userData.type === 'soft' || obs.userData.type === 'creature') continue; 
            
            const obsBox = new THREE.Box3().setFromObject(obs);
            
            // horizontal intersection
            if (pBox.min.x < obsBox.max.x && pBox.max.x > obsBox.min.x &&
                pBox.min.z < obsBox.max.z && pBox.max.z > obsBox.min.z) {
                
                // Vertical Check:
                // The surface must be below our step limit.
                if (obsBox.max.y <= searchCeiling) {
                    highest = Math.max(highest, obsBox.max.y);
                }
            }
        }
        return highest;
    }
}
