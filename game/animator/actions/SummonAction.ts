
import * as THREE from 'three';
import { playerModelResetFeet } from '../AnimationUtils';

export class SummonAction {
    // Static reference to the summoning circle effect
    private static summonCircle: THREE.Group | null = null;
    private static pentagram: THREE.Mesh | null = null;
    
    static animate(player: any, parts: any, dt: number, damp: number) {
        const combat = player.combat ?? player;
        const t = combat.summonTimer ?? 0;
        const lerp = THREE.MathUtils.lerp;
        const sin = Math.sin;
        const cos = Math.cos;

        // Total Duration: 6.0s (slowed down)
        // 0.0 - 1.5: Gathering Energy (slower)
        // 1.5 - 2.0: Windup
        // 2.0 - 2.5: Slam (Impact)
        // 2.5 - 5.5: Hold Crouch (3 seconds with magic circle)
        // 5.5 - 6.0: Recovery

        // Safe damping helper to prevent overshoots (teleporting)
        const safeDamp = (val: number) => Math.min(val, 1.0);

        if (t < 1.5) {
            // === PHASE 1: GATHERING ENERGY (slower) ===
            const p = t / 1.5;
            const circleSpeed = 5.0; // Slower circle motion
            const radius = 0.2;
            
            const handX = sin(t * circleSpeed) * radius;
            const handY = cos(t * circleSpeed) * radius;

            const gatherDamp = safeDamp(damp * 4);

            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -0.8 + handY, gatherDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.5 + handX, gatherDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.5, gatherDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -1.8, gatherDamp);

            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -0.8 - handY, gatherDamp);
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, -0.5 + handX, gatherDamp);
            parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0.5, gatherDamp);
            parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -1.8, gatherDamp);

            parts.rightHand.rotation.z = lerp(parts.rightHand.rotation.z, 0, gatherDamp);
            parts.leftHand.rotation.z = lerp(parts.leftHand.rotation.z, 0, gatherDamp);

            parts.neck.rotation.x = lerp(parts.neck.rotation.x, 0.3, damp * 2);
            parts.head.rotation.x = lerp(parts.head.rotation.x, 0.2, damp * 2);

            // Remove circle if it exists from previous cast
            this.removeSummonCircle(player);

        } else if (t < 2.0) {
            // === PHASE 2: WINDUP ===
            const windupDamp = safeDamp(damp * 10);

            const baseHeight = 0.89 * player.config.legScale;
            parts.hips.position.y = lerp(parts.hips.position.y, baseHeight - 0.2, windupDamp);

            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, -2.8, windupDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, 0.2, windupDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0.0, windupDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.5, windupDamp);

            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, -0.5, windupDamp);
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, -0.5, windupDamp);

            parts.head.rotation.x = lerp(parts.head.rotation.x, -0.5, windupDamp);

        } else if (t < 2.5) {
            // === PHASE 3: IMPACT ===
            const slamDamp = safeDamp(damp * 15); 

            const baseHeight = 0.89 * player.config.legScale;
            const crouchHeight = baseHeight * 0.4;
            
            parts.hips.position.y = lerp(parts.hips.position.y, crouchHeight, slamDamp);
            parts.hips.rotation.x = lerp(parts.hips.rotation.x, 0.4, slamDamp);

            parts.leftThigh.rotation.x = lerp(parts.leftThigh.rotation.x, -2.0, slamDamp);
            parts.rightThigh.rotation.x = lerp(parts.rightThigh.rotation.x, -2.0, slamDamp);
            parts.leftShin.rotation.x = lerp(parts.leftShin.rotation.x, 2.3, slamDamp);
            parts.rightShin.rotation.x = lerp(parts.rightShin.rotation.x, 2.3, slamDamp);

            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 0.8, slamDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.5, slamDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.2, slamDamp);
            
            parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, slamDamp);
            parts.rightHand.rotation.z = lerp(parts.rightHand.rotation.z, -0.2, slamDamp);

            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, 0.5, slamDamp);
            parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -1.5, slamDamp);

            parts.neck.rotation.x = lerp(parts.neck.rotation.x, 0.5, slamDamp);

            // Create summon circle on impact
            this.createSummonCircle(player);

        } else if (t < 5.5) {
            // === PHASE 4: HOLD CROUCH (3 seconds) ===
            // Stay in crouched position while magic circle is active
            const holdDamp = safeDamp(damp * 3);
            const baseHeight = 0.89 * player.config.legScale;
            const crouchHeight = baseHeight * 0.4;
            
            // Maintain crouch pose
            parts.hips.position.y = lerp(parts.hips.position.y, crouchHeight, holdDamp);
            parts.hips.rotation.x = lerp(parts.hips.rotation.x, 0.4, holdDamp);

            parts.leftThigh.rotation.x = lerp(parts.leftThigh.rotation.x, -2.0, holdDamp);
            parts.rightThigh.rotation.x = lerp(parts.rightThigh.rotation.x, -2.0, holdDamp);
            parts.leftShin.rotation.x = lerp(parts.leftShin.rotation.x, 2.3, holdDamp);
            parts.rightShin.rotation.x = lerp(parts.rightShin.rotation.x, 2.3, holdDamp);

            // Arms spread out channeling energy
            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 0.3, holdDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.8, holdDamp);
            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, 0.3, holdDamp);
            parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0.8, holdDamp);

            parts.neck.rotation.x = lerp(parts.neck.rotation.x, 0.3, holdDamp);

            // Update/animate the summon circle
            this.updateSummonCircle(player, dt, t - 2.5);

        } else {
            // === PHASE 5: RECOVERY ===
            const recoverDamp = safeDamp(damp * 3);
            const baseHeight = 0.89 * player.config.legScale;

            parts.hips.position.y = lerp(parts.hips.position.y, baseHeight, recoverDamp);
            parts.hips.rotation.x = lerp(parts.hips.rotation.x, 0, recoverDamp);
            
            parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, 0, recoverDamp);
            parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, 0, recoverDamp);

            parts.leftThigh.rotation.x = lerp(parts.leftThigh.rotation.x, 0, recoverDamp);
            parts.rightThigh.rotation.x = lerp(parts.rightThigh.rotation.x, 0, recoverDamp);
            parts.leftShin.rotation.x = lerp(parts.leftShin.rotation.x, 0, recoverDamp);
            parts.rightShin.rotation.x = lerp(parts.rightShin.rotation.x, 0, recoverDamp);

            parts.rightArm.rotation.x = lerp(parts.rightArm.rotation.x, 0, recoverDamp);
            parts.rightArm.rotation.z = lerp(parts.rightArm.rotation.z, -0.1, recoverDamp);
            parts.rightArm.rotation.y = lerp(parts.rightArm.rotation.y, 0, recoverDamp);
            parts.rightForeArm.rotation.x = lerp(parts.rightForeArm.rotation.x, -0.1, recoverDamp);
            
            parts.leftArm.rotation.x = lerp(parts.leftArm.rotation.x, 0, recoverDamp);
            parts.leftArm.rotation.z = lerp(parts.leftArm.rotation.z, 0.1, recoverDamp);
            parts.leftArm.rotation.y = lerp(parts.leftArm.rotation.y, 0, recoverDamp);
            parts.leftForeArm.rotation.x = lerp(parts.leftForeArm.rotation.x, -0.1, recoverDamp);

            parts.neck.rotation.x = lerp(parts.neck.rotation.x, 0, recoverDamp);
            parts.head.rotation.x = lerp(parts.head.rotation.x, 0, recoverDamp);

            // Fade out and remove circle
            this.removeSummonCircle(player);
        }

        playerModelResetFeet(parts, damp);
    }

    private static createSummonCircle(player: any) {
        if (this.summonCircle) return; // Already exists

        const scene = player.scene;
        if (!scene) return;

        this.summonCircle = new THREE.Group();
        const circleRadius = 1.5;

        // Blue glowing circle
        const circleGeo = new THREE.RingGeometry(circleRadius - 0.05, circleRadius, 64);
        const circleMat = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const circle = new THREE.Mesh(circleGeo, circleMat);
        circle.rotation.x = -Math.PI / 2;
        this.summonCircle.add(circle);

        // Inner circle
        const innerGeo = new THREE.RingGeometry(circleRadius * 0.7 - 0.03, circleRadius * 0.7, 64);
        const inner = new THREE.Mesh(innerGeo, circleMat.clone());
        inner.rotation.x = -Math.PI / 2;
        inner.position.y = 0.01;
        this.summonCircle.add(inner);

        // Pentagram (5-pointed star)
        const pentagramGeo = this.createPentagramGeometry(circleRadius * 0.65);
        const pentagramMat = new THREE.MeshBasicMaterial({
            color: 0x00ddff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        this.pentagram = new THREE.Mesh(pentagramGeo, pentagramMat);
        this.pentagram.rotation.x = -Math.PI / 2;
        this.pentagram.position.y = 0.02;
        this.summonCircle.add(this.pentagram);

        // Random runes around the circle
        const runeSymbols = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛈ', 'ᛇ', 'ᛉ', 'ᛊ'];
        const numRunes = 12;
        
        for (let i = 0; i < numRunes; i++) {
            const angle = (i / numRunes) * Math.PI * 2;
            const runeRadius = circleRadius * 0.85;
            const x = Math.cos(angle) * runeRadius;
            const z = Math.sin(angle) * runeRadius;
            
            const runeSprite = this.createRuneSprite(runeSymbols[Math.floor(Math.random() * runeSymbols.length)]);
            runeSprite.position.set(x, 0.03, z);
            runeSprite.scale.set(0.2, 0.2, 1);
            this.summonCircle.add(runeSprite);
        }

        // Position at player's feet
        const playerPos = player.mesh.position;
        this.summonCircle.position.set(playerPos.x, playerPos.y + 0.05, playerPos.z);
        
        scene.add(this.summonCircle);
    }

    private static createPentagramGeometry(radius: number): THREE.BufferGeometry {
        const points: THREE.Vector2[] = [];
        const innerRadius = radius * 0.38;
        
        // Create 5-pointed star by alternating between outer and inner points
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 === 0 ? radius : innerRadius;
            points.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r));
        }
        
        const shape = new THREE.Shape(points);
        return new THREE.ShapeGeometry(shape);
    }

    private static createRuneSprite(rune: string): THREE.Sprite {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            ctx.fillStyle = '#00ddff';
            ctx.font = 'bold 48px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rune, 32, 32);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        
        return new THREE.Sprite(material);
    }

    private static updateSummonCircle(player: any, dt: number, holdTime: number) {
        if (!this.summonCircle) return;

        // Rotate the pentagram
        if (this.pentagram) {
            this.pentagram.rotation.z += dt * 0.8; // Rotate around Y (since it's flat on ground)
        }

        // Pulse the circle opacity
        const pulse = 0.7 + Math.sin(holdTime * 4) * 0.3;
        this.summonCircle.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
                child.material.opacity = pulse;
            }
        });

        // Keep circle at player position
        const playerPos = player.mesh.position;
        this.summonCircle.position.set(playerPos.x, playerPos.y + 0.05, playerPos.z);
    }

    private static removeSummonCircle(player: any) {
        if (!this.summonCircle) return;
        
        const scene = player.scene;
        if (scene) {
            scene.remove(this.summonCircle);
        }
        
        // Dispose of geometries and materials
        this.summonCircle.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
                obj.geometry?.dispose();
                if (obj.material instanceof THREE.Material) {
                    obj.material.dispose();
                }
            }
            if (obj instanceof THREE.Sprite) {
                obj.material.map?.dispose();
                obj.material.dispose();
            }
        });
        
        this.summonCircle = null;
        this.pentagram = null;
    }
}
