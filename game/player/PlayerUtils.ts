import * as THREE from 'three';
import { PlayerConfig } from '../../types';
import { getLandHeightAt } from '../environment/landTerrain';

export class PlayerUtils {
    // Matching constants from Environment.ts to calculate pond depth mathematically
    static POND_X = 8;
    static POND_Z = 6;
    static POND_RADIUS = 4.5;
    static POND_DEPTH = 1.8;

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
        if (this.useLandTerrain) {
            const h = getLandHeightAt(x, z);
            return h;
        }
        const dx = x - this.POND_X;
        const dz = z - this.POND_Z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        
        if (dist < this.POND_RADIUS) {
            const normDist = dist / this.POND_RADIUS;
            return -this.POND_DEPTH * (1 - normDist * normDist);
        }
        return 0;
    }

    static getGroundHeight(pos: THREE.Vector3, config: PlayerConfig, obstacles: THREE.Object3D[] | undefined | null): number {
        let highest = this.getTerrainHeight(pos.x, pos.z);
        
        // Safety check - if obstacles is not iterable, return terrain height
        if (!obstacles || !Array.isArray(obstacles)) {
            return highest;
        }
        
        const width = (config as any).torsoWidth ? 0.6 * config.torsoWidth : 0.6;
        const depth = width * 0.7;
        
        const pBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(pos.x, 50, pos.z), 
            new THREE.Vector3(width, 100, depth)
        );

        for (const obs of obstacles) {
            if (obs.userData.type === 'soft' || obs.userData.type === 'creature') continue; 
            
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
        const stepLimit = 2.0; 
        const searchCeiling = pos.y + stepLimit;

        const pBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(pos.x, pos.y + stepLimit/2, pos.z), 
            new THREE.Vector3(width, stepLimit, depth)
        );

        for (const obs of obstacles) {
            if (obs.userData.type === 'soft' || obs.userData.type === 'creature') continue; 
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
