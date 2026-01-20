import * as THREE from 'three';
import { EntityStats, UnitState } from '../../types';
import { CombatEnvironment } from '../environment/CombatEnvironment';

export interface CombatUnit {
    id: string;
    entity: any;
    stats: EntityStats;
    isFriendly: boolean;
    gridPos: { r: number; c: number } | null;
    isAlive: boolean;
    
    // Auto-Battler State
    state: UnitState;
    attackTimer: number;
    target: CombatUnit | null;
    path: { r: number; c: number }[];
    nextMovePos: THREE.Vector3 | null;
}

export class CombatSystem {
    private units: CombatUnit[] = [];
    private combatEnded: boolean = false;
    
    public onCombatLog?: (message: string, type: 'info' | 'damage' | 'heal' | 'death') => void;
    public onCombatEnd?: (playerWon: boolean) => void;
    public onUnitAttack?: (attacker: any, defender: any) => void;
    public onUnitDeath?: (unit: any) => void;

    constructor() {}

    public initializeCombat(player: any, friendlyEntities: any[], enemyEntities: any[]) {
        this.units = [];
        this.combatEnded = false;

        // Add player
        if (player) {
            this.addUnit(player, true);
        }

        // Add friendlies
        friendlyEntities.forEach(entity => this.addUnit(entity, true));

        // Add enemies
        enemyEntities.forEach(entity => this.addUnit(entity, false));

        this.onCombatLog?.(`Combat started! ${this.getAliveFriendlyCount()} allies vs ${this.getAliveEnemyCount()} enemies`, 'info');
    }

    private addUnit(entity: any, isFriendly: boolean) {
        if (!entity) return;
        
        // Enable external control on the entity
        if (entity.externalControl !== undefined) {
            entity.externalControl = true;
        }

        const stats = entity.stats || (entity.status?.getStats ? entity.status.getStats() : this.getDefaultStats());
        // Ensure stats has defaults if missing
        const fullStats = { ...this.getDefaultStats(), ...stats };

        this.units.push({
            id: THREE.MathUtils.generateUUID(),
            entity,
            stats: fullStats,
            isFriendly,
            gridPos: null, 
            isAlive: true,
            state: 'IDLE',
            attackTimer: 0,
            target: null,
            path: [],
            nextMovePos: null
        });
    }

    private getDefaultStats(): EntityStats {
        return {
            health: 100, maxHealth: 100, chakra: 50, maxChakra: 50,
            mana: 0, maxMana: 100,
            strength: 10, dexterity: 10, defense: 10, evasion: 10, damage: 10, soak: 2,
            attackSpeed: 1.0, range: 1.5
        };
    }

    public update(dt: number, environment: CombatEnvironment) {
        if (this.combatEnded) return;

        // Sync grid positions first
        for (const unit of this.units) {
            if (unit.isAlive) {
                // Update Entity Combat State
                if (unit.entity.combatState !== undefined) {
                    unit.entity.combatState = unit.state;
                }

                const pos = this.getUnitPosition(unit);
                if (pos) {
                    unit.gridPos = environment.getGridPosition(pos);
                    if (unit.gridPos) {
                        environment.setCellOccupied(unit.gridPos.r, unit.gridPos.c, true);
                    }
                }
            }
        }

        let activeFriendly = 0;
        let activeEnemy = 0;

        for (const unit of this.units) {
            if (!unit.isAlive) {
                // Clear occupation if dead
                if (unit.gridPos) environment.setCellOccupied(unit.gridPos.r, unit.gridPos.c, false);
                continue;
            }

            if (unit.isFriendly) activeFriendly++;
            else activeEnemy++;

            this.updateUnit(unit, dt, environment);
        }

        if (activeFriendly === 0 || activeEnemy === 0) {
            this.endCombat(activeFriendly > 0);
        }
    }

    private updateUnit(unit: CombatUnit, dt: number, environment: CombatEnvironment) {
        if (unit.state === 'DEAD' || unit.state === 'STUNNED') return;

        // 1. Target Acquisition
        if (!unit.target || !unit.target.isAlive) {
            unit.target = this.findClosestTarget(unit);
            if (!unit.target) {
                unit.state = 'IDLE';
                return;
            }
        }

        const dist = this.getDistance(unit, unit.target);
        
        // 2. State Logic
        if (dist <= unit.stats.range) {
            unit.state = 'ATTACKING';
            unit.path = [];
            unit.nextMovePos = null;
        } else {
            unit.state = 'MOVING';
        }

        // 3. Action Execution
        if (unit.state === 'ATTACKING') {
            // Face target
            const unitPos = this.getUnitPosition(unit);
            const targetPos = this.getUnitPosition(unit.target);
            if (unitPos && targetPos) {
                const angle = Math.atan2(targetPos.x - unitPos.x, targetPos.z - unitPos.z);
                if (unit.entity.model?.group) unit.entity.model.group.rotation.y = angle;
                if (unit.entity.rotationY !== undefined) unit.entity.rotationY = angle;
            }

            unit.attackTimer += dt;
            const attackInterval = 1.0 / (unit.stats.attackSpeed || 1.0);
            
            if (unit.attackTimer >= attackInterval) {
                this.performAttack(unit, unit.target);
                unit.attackTimer = 0;
            }
        } else if (unit.state === 'MOVING') {
            this.handleMovement(unit, dt, environment);
        }
    }

    private handleMovement(unit: CombatUnit, dt: number, environment: CombatEnvironment) {
        if (!unit.target) return;

        const unitPos = this.getUnitPosition(unit);
        const targetPos = this.getUnitPosition(unit.target);
        
        if (!unitPos || !targetPos) return;

        // Calculate path if needed
        if (!unit.nextMovePos || unit.path.length === 0) {
            // Pathfind to target
            // Use environment to get path from unit.gridPos to target.gridPos
            // Note: getPath should handle occupied cells
            unit.path = environment.getPath(unitPos, targetPos);
            
            // Remove first step if it is current pos
            if (unit.path.length > 0 && unit.gridPos && unit.path[0].r === unit.gridPos.r && unit.path[0].c === unit.gridPos.c) {
                unit.path.shift();
            }

            if (unit.path.length > 0) {
                const nextCell = unit.path[0];
                unit.nextMovePos = environment.getWorldPosition(nextCell.r, nextCell.c);
            }
        }

        // Move towards nextMovePos
        if (unit.nextMovePos) {
            const dir = new THREE.Vector3().subVectors(unit.nextMovePos, unitPos).normalize();
            const moveSpeed = 4.0; // Standardize move speed or get from stats
            const moveDist = moveSpeed * dt;
            
            // Look at direction
            const angle = Math.atan2(dir.x, dir.z);
            if (unit.entity.rotationY !== undefined) unit.entity.rotationY = angle;
            if (unit.entity.model?.group) unit.entity.model.group.rotation.y = angle;

            // Apply movement
            if (unit.entity.position) {
                unit.entity.position.addScaledVector(dir, moveDist);
            } else if (unit.entity.mesh?.position) {
                unit.entity.mesh.position.addScaledVector(dir, moveDist);
            }

            // Check if reached
            if (unitPos.distanceTo(unit.nextMovePos) < 0.1) {
                unit.path.shift();
                if (unit.path.length > 0) {
                    const nextCell = unit.path[0];
                    unit.nextMovePos = environment.getWorldPosition(nextCell.r, nextCell.c);
                } else {
                    unit.nextMovePos = null;
                }
            }
        }
    }

    private performAttack(attacker: CombatUnit, defender: CombatUnit) {
        // Damage calculation
        const rawDamage = attacker.stats.damage; 
        const mitigation = defender.stats.defense * 0.5; 
        const damage = Math.max(1, rawDamage - mitigation);

        defender.stats.health -= damage;
        
        // Mana Generation
        attacker.stats.mana = Math.min(attacker.stats.maxMana, (attacker.stats.mana || 0) + 10);
        defender.stats.mana = Math.min(defender.stats.maxMana, (defender.stats.mana || 0) + 5);

        this.onCombatLog?.(`${this.getUnitName(attacker)} hits ${this.getUnitName(defender)} for ${Math.floor(damage)}`, 'damage');
        this.onUnitAttack?.(attacker.entity, defender.entity);

        // Sync Health to Entity
        if (defender.entity.status?.setHealth) {
            defender.entity.status.setHealth(defender.stats.health);
        } else if (defender.entity.stats) {
            defender.entity.stats.health = defender.stats.health;
        }

        if (defender.stats.health <= 0) {
            defender.isAlive = false;
            defender.state = 'DEAD';
            this.onCombatLog?.(`${this.getUnitName(defender)} died!`, 'death');
            this.onUnitDeath?.(defender.entity);
            
            // Visual cleanup
            if (defender.entity.model?.group) defender.entity.model.group.visible = false;
            else if (defender.entity.mesh) defender.entity.mesh.visible = false;
            
            // Clear occupancy
            if (defender.gridPos) {
                // We need access to environment to clear, but update loop handles it next frame
            }
        }
    }

    private findClosestTarget(unit: CombatUnit): CombatUnit | null {
        let closest: CombatUnit | null = null;
        let minDist = Infinity;

        for (const other of this.units) {
            if (other.isFriendly === unit.isFriendly || !other.isAlive) continue;

            const d = this.getDistance(unit, other);
            if (d < minDist) {
                minDist = d;
                closest = other;
            }
        }
        return closest;
    }

    private getDistance(u1: CombatUnit, u2: CombatUnit): number {
        const p1 = this.getUnitPosition(u1);
        const p2 = this.getUnitPosition(u2);
        if (!p1 || !p2) return Infinity;
        return p1.distanceTo(p2);
    }

    private getUnitPosition(unit: CombatUnit): THREE.Vector3 | null {
        return unit.entity?.position || unit.entity?.mesh?.position || unit.entity?.model?.group?.position || null;
    }

    private getUnitName(unit: CombatUnit): string {
        return unit.entity.constructor.name === 'Player' ? 'Hero' : (unit.entity.constructor.name || 'Unit');
    }

    private endCombat(playerWon: boolean) {
        this.combatEnded = true;
        this.onCombatLog?.(playerWon ? 'Victory!' : 'Defeat!', 'info');
        this.onCombatEnd?.(playerWon);
        
        // Release control
        this.units.forEach(u => {
            if (u.entity && u.entity.externalControl !== undefined) {
                u.entity.externalControl = false;
            }
        });
    }

    // Public Getters
    public getAliveFriendlyCount() { return this.units.filter(u => u.isFriendly && u.isAlive).length; }
    public getAliveEnemyCount() { return this.units.filter(u => !u.isFriendly && u.isAlive).length; }
    public isCombatOver() { return this.combatEnded; }
    
    // Helper to get CombatUnit from Entity
    public getUnitByEntity(entity: any): CombatUnit | undefined {
        return this.units.find(u => u.entity === entity);
    }
}
