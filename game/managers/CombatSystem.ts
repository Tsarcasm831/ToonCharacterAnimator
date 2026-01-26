import * as THREE from 'three';
import { EntityStats, UnitState, TurnPhase } from '../../types';
import { CombatEnvironment } from '../environment/CombatEnvironment';
import { CombatUnit } from './CombatTypes';
import { TurnManager } from './TurnManager';
import { AIController } from './AIController';

export class CombatSystem {
    private units: CombatUnit[] = [];
    private combatEnded: boolean = false;
    public turnManager: TurnManager;
    private aiController: AIController;
    private currentEnvironment: CombatEnvironment | null = null;
    
    public onCombatLog?: (message: string, type: 'info' | 'damage' | 'heal' | 'death') => void;
    public onCombatEnd?: (playerWon: boolean) => void;
    public onUnitAttack?: (attacker: any, defender: any) => void;
    public onUnitDeath?: (unit: any) => void;
    public onTurnChanged?: (unit: CombatUnit) => void;

    constructor() {
        this.aiController = new AIController(this);
        this.turnManager = new TurnManager();
        this.turnManager.onTurnStart = (unit) => {
            this.onCombatLog?.(`${this.getUnitName(unit)}'s Turn`, 'info');
            this.onTurnChanged?.(unit);

            // Trigger AI if needed
            if (!unit.isFriendly && this.currentEnvironment) {
                this.aiController.onTurnStart(unit, this.currentEnvironment);
            }
        };
    }

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
        
        // Start Turn-Based System
        this.turnManager.startCombat(this.units);
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
        
        // Initialize Turn Stats
        fullStats.movementPoints = fullStats.movementPoints || 5;
        fullStats.currentMovement = fullStats.movementPoints;
        fullStats.hasActedThisTurn = false;
        fullStats.hasMovedThisTurn = false;
        fullStats.initiative = fullStats.dexterity || 10;

        this.units.push({
            id: THREE.MathUtils.generateUUID(),
            entity,
            stats: fullStats,
            isFriendly,
            gridPos: null, 
            isAlive: true,
            currentInitiative: 0,
            baseDefense: fullStats.defense || 10, // Store original defense
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
            mana: 0, maxMana: 100, xp: 0, maxXp: 1000,
            strength: 10, dexterity: 10, defense: 10, evasion: 10, damage: 10, soak: 2,
            attackSpeed: 1.0, range: 1.5
        };
    }

    public update(dt: number, environment: CombatEnvironment) {
        if (this.combatEnded) return;
        
        this.currentEnvironment = environment;

        // Sync grid positions first (always important)
        for (const unit of this.units) {
            if (unit.isAlive) {
                // Update Entity Combat State
                if (unit.entity.combatState !== undefined) {
                    unit.entity.combatState = unit.state;
                }

                const pos = this.getUnitPosition(unit);
                if (pos) {
                    unit.gridPos = environment.getGridPosition(pos);
                    // Occupancy is handled by environment.setCellOccupied usually
                    // But we should strictly enforce it based on gridPos
                    if (unit.gridPos) {
                        environment.setCellOccupied(unit.gridPos.r, unit.gridPos.c, true);
                    }
                }
            }
        }

        // Handle Visuals / Animations for the active unit or moving units
        for (const unit of this.units) {
            if (!unit.isAlive) continue;
            this.updateUnitVisuals(unit, dt, environment);
        }

        // Check Victory Conditions
        const activeFriendly = this.getAliveFriendlyCount();
        const activeEnemy = this.getAliveEnemyCount();

        if (activeFriendly === 0 || activeEnemy === 0) {
            this.endCombat(activeFriendly > 0);
        }
    }

    private updateUnitVisuals(unit: CombatUnit, dt: number, environment: CombatEnvironment) {
        // If unit is moving, handle interpolation
        if (unit.state === 'MOVING') {
             this.handleVisualMovement(unit, dt, environment);
        }
    }

    private handleVisualMovement(unit: CombatUnit, dt: number, environment: CombatEnvironment) {
        const unitPos = this.getUnitPosition(unit);
        
        if (!unitPos) return;

        // If no target pos, get next from path
        if (!unit.nextMovePos) {
             if (unit.path.length > 0) {
                const nextCell = unit.path[0];
                unit.nextMovePos = environment.getWorldPosition(nextCell.r, nextCell.c);
             } else {
                 // Path finished
                 unit.state = 'IDLE';
                 unit.nextMovePos = null;
                 return;
             }
        }

        // Move towards nextMovePos with smooth interpolation
        if (unit.nextMovePos) {
            const dir = new THREE.Vector3().subVectors(unit.nextMovePos, unitPos).normalize();
            const moveSpeed = 6.0; // Increased speed for smoother feel
            const moveDist = moveSpeed * dt;
            
            // Look at direction
            const angle = Math.atan2(dir.x, dir.z);
            if (unit.entity.rotationY !== undefined) {
                // Smooth rotation
                const currentRotation = unit.entity.rotationY;
                let rotationDiff = angle - currentRotation;
                
                // Normalize rotation difference to [-PI, PI]
                while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
                while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;
                
                const rotationSpeed = 8.0 * dt;
                unit.entity.rotationY += rotationDiff * Math.min(1, rotationSpeed);
            }
            if (unit.entity.model?.group) unit.entity.model.group.rotation.y = angle;

            // Apply movement
            if (unit.entity.position) {
                unit.entity.position.addScaledVector(dir, moveDist);
            } else if (unit.entity.mesh?.position) {
                unit.entity.mesh.position.addScaledVector(dir, moveDist);
            }

            // Check if reached (small threshold)
            if (unitPos.distanceTo(unit.nextMovePos) < 0.05) {
                // Snap to exact pos
                if (unit.entity.position) unit.entity.position.copy(unit.nextMovePos);
                
                unit.path.shift();
                unit.nextMovePos = null;
                
                if (unit.path.length === 0) {
                    unit.state = 'IDLE';
                }
            }
        }
    }

    // --- Actions ---

    public canMove(unit: CombatUnit, pathLength: number): boolean {
        // pathLength includes start? usually path finding returns list of cells.
        // If path is [start, step1, step2], steps = length - 1. 
        // If path is just [step1, step2], steps = length.
        // Assuming path excludes start cell for movement cost.
        return (unit.stats.currentMovement || 0) >= pathLength;
    }

    public executeMove(unit: CombatUnit, path: { r: number, c: number }[]) {
        if (!unit.isAlive) return;
        if (unit.state !== 'IDLE') return; // Already doing something
        if (unit.stats.hasMovedThisTurn) {
            this.onCombatLog?.(`${this.getUnitName(unit)} has already moved this turn!`, 'info');
            return;
        }
        
        // Setup movement
        unit.path = [...path]; // Copy path
        
        // Remove start node if it matches current position (common in pathfinding results)
        if (unit.gridPos && unit.path.length > 0) {
            if (unit.path[0].r === unit.gridPos.r && unit.path[0].c === unit.gridPos.c) {
                unit.path.shift();
            }
        }

        const cost = unit.path.length;
        if (cost > (unit.stats.currentMovement || 0)) {
            console.warn("Attempted move with insufficient MP");
        }

        unit.stats.currentMovement = Math.max(0, (unit.stats.currentMovement || 0) - cost);
        unit.stats.hasMovedThisTurn = true;
        unit.state = 'MOVING';
    }

    public executeAttack(attacker: CombatUnit, defender: CombatUnit) {
        if (!attacker.isAlive || !defender.isAlive) return;
        if (attacker.state !== 'IDLE') {
            this.onCombatLog?.(`${this.getUnitName(attacker)} cannot attack while moving!`, 'info');
            return;
        }
        if (attacker.stats.hasActedThisTurn) {
            this.onCombatLog?.(`${this.getUnitName(attacker)} has already acted this turn!`, 'info');
            return;
        }

        attacker.state = 'ATTACKING';
        
        // Face target
        const unitPos = this.getUnitPosition(attacker);
        const targetPos = this.getUnitPosition(defender);
        if (unitPos && targetPos) {
            const angle = Math.atan2(targetPos.x - unitPos.x, targetPos.z - unitPos.z);
            if (attacker.entity.model?.group) attacker.entity.model.group.rotation.y = angle;
            if (attacker.entity.rotationY !== undefined) attacker.entity.rotationY = angle;
        }

        // Trigger animation
        if (attacker.entity.setAnimation) {
             attacker.entity.setAnimation('attack', false); // Trigger one-shot attack
        }

        // Apply Damage (immediate for now, could be delayed by animation event)
        this.performDamageCalc(attacker, defender);

        attacker.stats.hasActedThisTurn = true;
        
        // After attack, brief delay then return to IDLE?
        // For turn based, we stay in 'ATTACKING' visually until anim is done? 
        // Simulating simple timer for now.
        setTimeout(() => {
            if (attacker.isAlive) attacker.state = 'IDLE';
        }, 1000);
    }

    private performDamageCalc(attacker: CombatUnit, defender: CombatUnit) {
        const rawDamage = attacker.stats.damage; 
        const mitigation = defender.stats.defense * 0.5; 
        const damage = Math.max(1, rawDamage - mitigation);

        defender.stats.health -= damage;
        
        this.onCombatLog?.(`${this.getUnitName(attacker)} hits ${this.getUnitName(defender)} for ${Math.floor(damage)}`, 'damage');
        this.onUnitAttack?.(attacker.entity, defender.entity);

        // Sync Health to Entity
        if (defender.entity.status?.setHealth) {
            defender.entity.status.setHealth(defender.stats.health);
        } else if (defender.entity.stats) {
            defender.entity.stats.health = defender.stats.health;
        }

        if (defender.stats.health <= 0) {
            this.killUnit(defender);
        }
    }

    private killUnit(unit: CombatUnit) {
        unit.isAlive = false;
        unit.state = 'DEAD';
        this.onCombatLog?.(`${this.getUnitName(unit)} died!`, 'death');
        this.onUnitDeath?.(unit.entity);
        
        // Visual cleanup
        if (unit.entity.model?.group) unit.entity.model.group.visible = false;
        else if (unit.entity.mesh) unit.entity.mesh.visible = false;
    }

    public endTurn() {
        this.turnManager.nextTurn();
    }

    public waitTurn() {
        this.turnManager.waitCurrentTurn();
    }

    public defend(unit: CombatUnit) {
        if (!unit.isAlive) return;
        if (unit.state !== 'IDLE') return;
        
        // Defend action: grants temporary defense bonus but ends turn
        unit.stats.defense = Math.floor(unit.baseDefense * 1.5);
        unit.state = 'DEFENDING';
        unit.stats.hasActedThisTurn = true; // Prevent further actions this turn
        
        this.onCombatLog?.(`${this.getUnitName(unit)} is defending! Defense increased!`, 'info');
        
        // End turn after defending
        setTimeout(() => this.endTurn(), 1000);
    }

    // --- Helpers ---

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
    
    public getUnitByEntity(entity: any): CombatUnit | undefined {
        return this.units.find(u => u.entity === entity);
    }

    public getAllUnits(): CombatUnit[] {
        return this.units;
    }

    public getActiveUnit(): CombatUnit | null {
        return this.turnManager.getCurrentUnit();
    }

    public reset() {
        this.units = [];
        this.combatEnded = false;
        this.currentEnvironment = null;
        this.turnManager.reset();
    }
}
