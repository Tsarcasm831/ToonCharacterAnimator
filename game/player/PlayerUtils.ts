import * as THREE from 'three';
import { PlayerConfig } from '../../types';
import { getLandHeightAt, isWorldPointInLand } from '../environment/landTerrain';
import { ENV_CONSTANTS } from '../environment/EnvironmentTypes';

export class PlayerUtils {
    private static readonly _tempRayOrigin = new THREE.Vector3();
    private static readonly _tempRayDir = new THREE.Vector3(0, -1, 0);
    private static readonly _tempBox = new THREE.Box3();
    private static readonly _tempBox2 = new THREE.Box3();
    private static readonly _tempVec1 = new THREE.Vector3();
    private static readonly _tempVec2 = new THREE.Vector3();
    private static readonly _raycaster = new THREE.Raycaster();

    // Matching constants from Environment.ts to calculate pond depth mathematically
    static POND_X = ENV_CONSTANTS.POND_X;
    static POND_Z = ENV_CONSTANTS.POND_Z;
    static POND_RADIUS = ENV_CONSTANTS.POND_RADIUS;
    static POND_DEPTH = ENV_CONSTANTS.POND_DEPTH;

    // World size
    static WORLD_LIMIT = 1000;
    static useLandTerrain = false;

    static setUseLandTerrain(useLand: boolean) {
        this.useLandTerrain = useLand;
    }

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
        
        this._tempBox.min.set(position.x - rX, position.y + 0.5, position.z - rZ);
        this._tempBox.max.set(position.x + rX, position.y + totalHeight, position.z + rZ);
        
        return this._tempBox;
    }

    static checkCollision(pos: THREE.Vector3, config: PlayerConfig, obstacles: THREE.Object3D[]): boolean {
        const playerBox = this.getHitboxBounds(pos, config);
        for (const obs of obstacles) {
            if (obs.userData.type === 'soft' || obs.userData.type === 'ground') continue;
            this._tempBox2.setFromObject(obs);
            if (this._tempBox2.intersectsBox(playerBox)) return true;
        }
        return false;
    }

    /**
     * Generic collision check for any box size.
     */
    static checkBoxCollision(pos: THREE.Vector3, size: THREE.Vector3, obstacles: THREE.Object3D[]): boolean {
        const halfX = size.x / 2;
        const halfZ = size.z / 2;
        this._tempBox.min.set(pos.x - halfX, pos.y + 0.1, pos.z - halfZ);
        this._tempBox.max.set(pos.x + halfX, pos.y + size.y, pos.z + halfZ);

        for (const obs of obstacles) {
            if (obs.userData.type === 'soft' || obs.userData.type === 'creature' || obs.userData.type === 'ground') continue;
            // obsBox was reusing _tempVec1 which is fine, but we need a box
            // Using _tempBox2 for obstacle
            this._tempBox2.setFromObject(obs);
            if (this._tempBox2.intersectsBox(this._tempBox)) return true;
        }
        return false;
    }

    static isWithinBounds(pos: THREE.Vector3, margin: number = 0.5): boolean {
        if (this.useLandTerrain) {
            return isWorldPointInLand(pos.x, pos.z);
        }
        const limit = this.WORLD_LIMIT - margin;
        return pos.x >= -limit && pos.x <= limit && pos.z >= -limit && pos.z <= limit;
    }

    static getTerrainHeight(x: number, z: number): number {
        if (this.useLandTerrain) {
            const h = getLandHeightAt(x, z);
            return h;
        }
        let maxDepth = 0;
        for (const pond of ENV_CONSTANTS.PONDS) {
            const dx = x - pond.x;
            const dz = z - pond.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < pond.radius) {
                const normDist = dist / pond.radius;
                const depth = -pond.depth * (1 - normDist * normDist);
                maxDepth = Math.min(maxDepth, depth);
            }
        }
        return maxDepth;
    }

    static getGroundHeight(pos: THREE.Vector3, config: PlayerConfig, obstacles: THREE.Object3D[] | undefined | null): number {
        let highest = this.getTerrainHeight(pos.x, pos.z);
        
        // Safety check - if obstacles is not iterable, return terrain height
        if (!obstacles || !Array.isArray(obstacles)) {
            return highest;
        }

        // 1. Raycast against Ground Meshes for exact visual height matching
        // This handles slopes and the transition from land to sea floor correctly
        const groundMeshes = obstacles.filter(o => o.userData.type === 'ground');
        if (groundMeshes.length > 0) {
            // Cast from high up downwards
            this._tempRayOrigin.set(pos.x, 200, pos.z);
            this._raycaster.set(this._tempRayOrigin, this._tempRayDir);
            this._raycaster.far = 300;
            
            const intersects = this._raycaster.intersectObjects(groundMeshes);
            if (intersects.length > 0) {
                // Use the highest hit point directly, overriding the mathematical fallback
                highest = intersects[0].point.y;
            }
        }
        
        const width = (config as any).torsoWidth ? 0.6 * config.torsoWidth : 0.6;
        const depth = width * 0.7;
        
        this._tempVec1.set(width, 100, depth);
        this._tempVec2.set(pos.x, 50, pos.z);
        this._tempBox.setFromCenterAndSize(this._tempVec2, this._tempVec1);

        for (const obs of obstacles) {
            if (obs.userData.type === 'soft' || obs.userData.type === 'creature' || obs.userData.type === 'ground') continue; 
            
            // Special handling for round foundations which use CylinderGeometry
            if (obs.userData.structureType === 'round_foundation') {
                const dx = pos.x - obs.position.x;
                const dz = pos.z - obs.position.z;
                const distSq = dx * dx + dz * dz;
                
                // radius is 2.5 as defined in BuildingParts.ts
                const radius = 2.5;
                if (distSq <= radius * radius) {
                    const topY = obs.position.y + 0.2; // foundation is 0.4 thick, centered at y=0.2
                    highest = Math.max(highest, topY);
                }
                continue;
            }

            const obsBox = new THREE.Box3().setFromObject(obs);
            if (this._tempBox.min.x < obsBox.max.x && this._tempBox.max.x > obsBox.min.x &&
                this._tempBox.min.z < obsBox.max.z && this._tempBox.max.z > obsBox.min.z) {
                highest = Math.max(highest, obsBox.max.y);
            }
        }
        return highest;
    }

    static getLandingHeight(pos: THREE.Vector3, config: PlayerConfig, obstacles: THREE.Object3D[]): number {
        let highest = this.getTerrainHeight(pos.x, pos.z);
        
        // 1. Raycast against Ground Meshes (Terrain) to handle slopes/edges correctly
        // We do this unconditionally for 'ground' type because it defines the base world
        if (obstacles && Array.isArray(obstacles)) {
            const groundMeshes = obstacles.filter(o => o.userData.type === 'ground');
            if (groundMeshes.length > 0) {
                const rayOrigin = new THREE.Vector3(pos.x, 200, pos.z);
                const rayDir = new THREE.Vector3(0, -1, 0);
                const raycaster = new THREE.Raycaster(rayOrigin, rayDir, 0, 300);
                
                const intersects = raycaster.intersectObjects(groundMeshes);
                if (intersects.length > 0) {
                    // Use the highest hit point directly, overriding the mathematical fallback
                    highest = intersects[0].point.y;
                }
            }
        }

        const width = (config as any).torsoWidth ? 0.6 * config.torsoWidth : 0.6;
        const depth = width * 0.7;
        const stepLimit = 2.0; 
        const searchCeiling = pos.y + stepLimit;

        const pBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(pos.x, pos.y + stepLimit/2, pos.z), 
            new THREE.Vector3(width, stepLimit, depth)
        );

        for (const obs of obstacles) {
            if (obs.userData.type === 'soft' || obs.userData.type === 'creature' || obs.userData.type === 'ground') continue; 
            const obsBox = new THREE.Box3().setFromObject(obs);
            if (pBox.intersectsBox(obsBox)) {
                if (obsBox.max.y <= searchCeiling) {
                    highest = Math.max(highest, obsBox.max.y);
                }
            }
        }
        return highest;
    }

    /**
     * Finds a valid, empty position 1-4 meters away from the given origin.
     * Used for teleporting stuck entities.
     */
    static findUnstuckPosition(origin: THREE.Vector3, obstacles: THREE.Object3D[]): THREE.Vector3 | null {
        // Try 8 different random positions
        for(let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 1.0 + Math.random() * 3.0; // 1m to 4m
            
            const candidate = new THREE.Vector3(
                origin.x + Math.cos(angle) * dist,
                origin.y + 0.5, // Start slightly up
                origin.z + Math.sin(angle) * dist
            );

            // Basic bounds check
            if (!this.isWithinBounds(candidate)) continue;

            // Check if position is inside an obstacle
            // We use a small generic box size for AI (0.6 width, 2.0 height)
            const collisionSize = new THREE.Vector3(0.6, 2.0, 0.6);
            if (this.checkBoxCollision(candidate, collisionSize, obstacles)) continue;

            // Find valid ground height
            const groundY = this.getGroundHeight(candidate, { torsoWidth: 1.0 } as any, obstacles);
            candidate.y = groundY;
            
            return candidate;
        }
        return null;
    }

    // --- UI Helpers ---

    static createTextTexture(text: string, color: string = 'white', bgColor: string | null = null, fontSize: number = 40): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            if (bgColor) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.fillStyle = color;
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        }
        return new THREE.CanvasTexture(canvas);
    }

    static createIconTexture(colorHex: number, letter: string): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Circle Background
            const color = '#' + new THREE.Color(colorHex).getHexString();
            ctx.beginPath();
            ctx.arc(64, 64, 60, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'white';
            ctx.stroke();

            // Letter
            ctx.fillStyle = 'white';
            ctx.font = 'bold 80px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter.charAt(0).toUpperCase(), 64, 68);
        }
        return new THREE.CanvasTexture(canvas);
    }

    static createHealthBar(parent: THREE.Group, maxHealth: number, color: number, name: string): any {
        // Container for bar
        const container = new THREE.Group();
        parent.add(container);

        // 1. Background Bar
        const bgGeo = new THREE.PlaneGeometry(1.0, 0.15);
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x330000, side: THREE.DoubleSide });
        const bgMesh = new THREE.Mesh(bgGeo, bgMat);
        container.add(bgMesh);

        // 2. Foreground Bar (Green)
        const fgGeo = new THREE.PlaneGeometry(0.96, 0.11);
        fgGeo.translate(0.48, 0, 0); // Pivot left
        const fgMat = new THREE.MeshBasicMaterial({ color: 0x33ff33, side: THREE.DoubleSide });
        const fgMesh = new THREE.Mesh(fgGeo, fgMat);
        fgMesh.position.set(-0.48, 0, 0.01);
        container.add(fgMesh);

        // 3. Text Value (e.g., "100/100")
        const textTex = this.createTextTexture(`${maxHealth}/${maxHealth}`);
        const textMat = new THREE.SpriteMaterial({ map: textTex });
        const textSprite = new THREE.Sprite(textMat);
        textSprite.scale.set(1.5, 0.375, 1);
        textSprite.position.set(0, 0.25, 0); // Above bar
        container.add(textSprite);

        // 4. Icon Preview (Left)
        const iconTex = this.createIconTexture(color, name);
        const iconMat = new THREE.SpriteMaterial({ map: iconTex });
        const iconSprite = new THREE.Sprite(iconMat);
        iconSprite.scale.set(0.4, 0.4, 1);
        iconSprite.position.set(-0.7, 0, 0); // Left of bar
        container.add(iconSprite);

        // 5. Stack Count (Below Icon)
        const stackTex = this.createTextTexture("x1", "#cccccc", null, 30);
        const stackMat = new THREE.SpriteMaterial({ map: stackTex });
        const stackSprite = new THREE.Sprite(stackMat);
        stackSprite.scale.set(0.8, 0.2, 1);
        stackSprite.position.set(-0.7, -0.25, 0);
        container.add(stackSprite);

        return { fgMesh, textSprite, stackSprite };
    }

    static updateHealthBar(refs: any, current: number, max: number, stackCount: number = 1) {
        if (!refs) return;
        
        // Update Bar
        const pct = Math.max(0, current / max);
        if (refs.fgMesh) refs.fgMesh.scale.x = pct;

        // Update Text
        if (refs.textSprite) {
            const newTex = this.createTextTexture(`${Math.ceil(current)}/${max}`);
            const oldTex = refs.textSprite.material.map;
            refs.textSprite.material.map = newTex;
            if (oldTex) oldTex.dispose();
        }

        // Update Stack
        if (refs.stackSprite) {
            const stackStr = `x${stackCount}`;
            // Optimization: Only update texture if number changed? 
            // For now, simple regeneration is fine for low frequency updates.
            const newStackTex = this.createTextTexture(stackStr, "#cccccc", null, 30);
            const oldStackTex = refs.stackSprite.material.map;
            refs.stackSprite.material.map = newStackTex;
            if (oldStackTex) oldStackTex.dispose();
        }
    }
}
