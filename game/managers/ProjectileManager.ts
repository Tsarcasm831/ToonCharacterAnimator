import * as THREE from 'three';
import { ParticleManager } from './ParticleManager';

export interface Projectile {
    mesh: THREE.Object3D;
    velocity: THREE.Vector3;
    life: number;
    startPos: THREE.Vector3;
    type: 'arrow' | 'fireball' | 'heal';
    owner?: any; 
}

export class ProjectileManager {
    static activeProjectiles: Projectile[] = [];
    private static _tempBox1 = new THREE.Box3();
    private static _tempBox2 = new THREE.Box3();
    private static readonly _tempVec1 = new THREE.Vector3();
    private static readonly _tempVec2 = new THREE.Vector3();
    private static readonly _tempQuat = new THREE.Quaternion();

    static spawnProjectile(
        scene: THREE.Scene,
        startPos: THREE.Vector3,
        direction: THREE.Vector3,
        type: 'arrow' | 'fireball' | 'heal',
        owner?: any
    ) {
        const spawnPos = startPos.clone();
        
        let mesh: THREE.Object3D;
        let speed = 20.0;
        let life = 3.0;

        if (type === 'fireball') {
            const geo = new THREE.SphereGeometry(0.2, 16, 16);
            const mat = new THREE.MeshStandardMaterial({
                color: 0xff4400,
                emissive: 0xff8800,
                emissiveIntensity: 5.0,
                transparent: true,
                opacity: 0.9
            });
            mesh = new THREE.Mesh(geo, mat);
            speed = 25.0;
            life = 2.0;
        } else if (type === 'heal') {
            const geo = new THREE.SphereGeometry(0.2, 16, 16);
            const mat = new THREE.MeshStandardMaterial({
                color: 0x00ff00,
                emissive: 0x44ff44,
                emissiveIntensity: 2.0,
                transparent: true,
                opacity: 0.8
            });
            mesh = new THREE.Mesh(geo, mat);
            speed = 15.0;
            life = 2.0;
        } else {
            // Arrow
            // Import ArrowBuilder dynamically to avoid circular dependency
            import('../model/equipment/weapons/ArrowBuilder').then(({ ArrowBuilder }) => {
                const arrowMesh = ArrowBuilder.buildArrow();
                mesh.copy(arrowMesh);
                if (owner && owner.model && owner.model.group) {
                    mesh.quaternion.copy(owner.model.group.quaternion);
                }
            }).catch(err => {
                console.error('Failed to load ArrowBuilder:', err);
                // Fallback to basic arrow
                const geo = new THREE.ConeGeometry(0.02, 0.3, 8);
                const mat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
                mesh = new THREE.Mesh(geo, mat);
                if (owner && owner.model && owner.model.group) {
                    mesh.quaternion.copy(owner.model.group.quaternion);
                }
            });
            return; // Return early for async arrow creation
        }

        mesh.position.copy(spawnPos);
        scene.add(mesh);

        const velocity = direction.clone().normalize().multiplyScalar(speed);
        
        ProjectileManager.activeProjectiles.push({
            mesh,
            velocity,
            life,
            startPos: spawnPos,
            type,
            owner
        });
    }

    static updateProjectiles(dt: number, environment: any, particleManager: ParticleManager, entities: any[]) {
        for (let i = ProjectileManager.activeProjectiles.length - 1; i >= 0; i--) {
            const p = ProjectileManager.activeProjectiles[i];
            
            // Move
            this._tempVec1.copy(p.velocity).multiplyScalar(dt);
            p.mesh.position.add(this._tempVec1);
            
            // Fireball visuals
            if (p.type === 'fireball') {
                p.mesh.rotation.y += dt * 10;
                p.mesh.rotation.z += dt * 5;
                const scale = 1.0 + Math.sin(Date.now() * 0.01) * 0.1;
                p.mesh.scale.setScalar(scale);
                
                // Trail
                if (Math.random() > 0.4) {
                    particleManager.emit(p.mesh.position, 1, 'spark');
                }
            }

            // Check Collision
            if (ProjectileManager.checkProjectileCollision(p, environment, particleManager, entities)) {
                if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
                ProjectileManager.activeProjectiles.splice(i, 1);
                continue;
            }

            // Check Max Distance
            if (p.mesh.position.distanceTo(p.startPos) > 40.0) {
                 if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
                 ProjectileManager.activeProjectiles.splice(i, 1);
                 continue;
            }

            p.life -= dt;
            if (p.life <= 0) {
                if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
                ProjectileManager.activeProjectiles.splice(i, 1);
            }
        }
    }

    private static checkProjectileCollision(p: Projectile, environment: any, particleManager: ParticleManager, entities: any[]): boolean {
        const pos = p.mesh.position;
        // 1. Check Obstacles
        for (const obs of environment.obstacles) {
            obs.getWorldPosition(this._tempVec1);
            
            const dist = pos.distanceTo(this._tempVec1);
            if (dist < 1.5) {
                const matType = obs.userData.type === 'hard' ? 'stone' : 'wood';
                if (p.type === 'fireball') {
                    particleManager.emit(pos, 15, 'spark');
                    environment.damageObstacle(obs, 2);
                } else {
                    particleManager.emit(pos, 5, matType === 'stone' ? 'spark' : 'wood');
                }
                return true;
            }
        }

        // 2. Check Entities
        for (const ent of entities) {
            if (ent && !ent.isDead) {
                if (p.owner === ent) continue; // Don't hit self

                let hitboxParts: THREE.Object3D[] = [];
                if (typeof ent.getHitboxParts === 'function') {
                    hitboxParts = ent.getHitboxParts();
                } else if (ent.hitbox) {
                    hitboxParts = ent.hitbox.children;
                }

                const projectilePoint = pos;
                let hit = false;
                
                for (const part of hitboxParts) {
                    if (part instanceof THREE.Mesh || part instanceof THREE.Group) {
                        // For Groups, setFromObject calculates AABB of all children
                        // For Meshes, it calculates AABB of geometry transformed by world matrix
                        // updateMatrixWorld should be called to ensure accuracy
                        // Note: Calling updateMatrixWorld on every frame for every part might be expensive, 
                        // but usually the scene update handles it. We force it just in case.
                        // part.updateMatrixWorld(true); 
                        
                        ProjectileManager._tempBox1.setFromObject(part);
                        if (ProjectileManager._tempBox1.containsPoint(projectilePoint)) {
                            hit = true;
                            break;
                        }
                    }
                }

                if (hit) {
                    const damage = p.type === 'fireball' ? 15 : 5;
                    ent.takeDamage(damage); 
                    if (p.type === 'fireball') {
                        particleManager.emit(pos, 20, 'spark');
                    } else {
                        particleManager.emit(pos, 8, 'wood');
                    }
                    return true;
                }
            }
        }

        return false;
    }
}
