
import * as THREE from 'three';
import { EntityStats } from '../../types';

export interface CombatUnit {
    entity: any;
    stats: EntityStats;
    isFriendly: boolean;
    gridPos: { r: number; c: number } | null;
    isAlive: boolean;
}

export interface CombatResult {
    attacker: CombatUnit;
    defender: CombatUnit;
    damage: number;
    wasEvaded: boolean;
    defenderDied: boolean;
}

export class CombatSystem {
    private friendlyUnits: CombatUnit[] = [];
    private enemyUnits: CombatUnit[] = [];
    private currentTurn: 'friendly' | 'enemy' = 'friendly';
    private turnIndex: number = 0;
    private isProcessingTurn: boolean = false;
    private combatEnded: boolean = false;
    
    public onCombatLog?: (message: string, type: 'info' | 'damage' | 'heal' | 'death') => void;
    public onCombatEnd?: (playerWon: boolean) => void;
    public onUnitAttack?: (attacker: any, defender: any) => void;
    public onUnitDeath?: (unit: any) => void;

    constructor() {}

    public initializeCombat(player: any, friendlyEntities: any[], enemyEntities: any[]) {
        this.friendlyUnits = [];
        this.enemyUnits = [];
        this.combatEnded = false;
        this.currentTurn = 'friendly';
        this.turnIndex = 0;

        // Add player as friendly unit
        if (player) {
            const playerStats = player.status?.getStats();
            this.friendlyUnits.push({
                entity: player,
                stats: playerStats ? { ...playerStats } : this.getDefaultStats(),
                isFriendly: true,
                gridPos: null,
                isAlive: true
            });
        }

        // Add friendly NPCs
        friendlyEntities.forEach(entity => {
            if (entity && entity.stats) {
                this.friendlyUnits.push({
                    entity,
                    stats: { ...entity.stats },
                    isFriendly: true,
                    gridPos: null,
                    isAlive: true
                });
            }
        });

        // Add enemy units
        enemyEntities.forEach(entity => {
            if (entity && entity.stats) {
                this.enemyUnits.push({
                    entity,
                    stats: { ...entity.stats },
                    isFriendly: false,
                    gridPos: null,
                    isAlive: true
                });
            }
        });

        this.onCombatLog?.(`Combat started! ${this.friendlyUnits.length} allies vs ${this.enemyUnits.length} enemies`, 'info');
    }

    private getDefaultStats(): EntityStats {
        return {
            health: 100, maxHealth: 100, chakra: 50, maxChakra: 50,
            strength: 10, dexterity: 10, defense: 10, evasion: 10, damage: 10, soak: 2
        };
    }

    public processTurn(): CombatResult | null {
        if (this.combatEnded || this.isProcessingTurn) return null;

        this.isProcessingTurn = true;

        const activeUnits = this.currentTurn === 'friendly' ? this.friendlyUnits : this.enemyUnits;
        const targetUnits = this.currentTurn === 'friendly' ? this.enemyUnits : this.friendlyUnits;

        // Get alive units
        const aliveActive = activeUnits.filter(u => u.isAlive);
        const aliveTargets = targetUnits.filter(u => u.isAlive);

        if (aliveActive.length === 0 || aliveTargets.length === 0) {
            this.checkCombatEnd();
            this.isProcessingTurn = false;
            return null;
        }

        // Get current unit
        const attacker = aliveActive[this.turnIndex % aliveActive.length];
        
        // Find closest target
        const defender = this.findClosestTarget(attacker, aliveTargets);
        if (!defender) {
            this.isProcessingTurn = false;
            return null;
        }

        // Calculate attack
        const result = this.calculateAttack(attacker, defender);

        // Apply damage
        if (!result.wasEvaded) {
            defender.stats.health = Math.max(0, defender.stats.health - result.damage);
            
            // Sync stats back to entity
            if (defender.entity.stats) {
                defender.entity.stats.health = defender.stats.health;
            }
            if (defender.entity.status?.setHealth) {
                defender.entity.status.setHealth(defender.stats.health);
            }

            const attackerName = this.getUnitName(attacker);
            const defenderName = this.getUnitName(defender);
            this.onCombatLog?.(`${attackerName} hits ${defenderName} for ${result.damage} damage!`, 'damage');

            if (defender.stats.health <= 0) {
                defender.isAlive = false;
                result.defenderDied = true;
                this.onCombatLog?.(`${defenderName} has been defeated!`, 'death');
                this.onUnitDeath?.(defender.entity);
                
                // Hide the unit
                if (defender.entity.model?.group) {
                    defender.entity.model.group.visible = false;
                } else if (defender.entity.mesh) {
                    defender.entity.mesh.visible = false;
                }
            }
        } else {
            const attackerName = this.getUnitName(attacker);
            const defenderName = this.getUnitName(defender);
            this.onCombatLog?.(`${attackerName}'s attack was evaded by ${defenderName}!`, 'info');
        }

        // Trigger attack animation callback
        this.onUnitAttack?.(attacker.entity, defender.entity);

        // Advance turn
        this.turnIndex++;
        if (this.turnIndex >= aliveActive.length) {
            this.turnIndex = 0;
            this.currentTurn = this.currentTurn === 'friendly' ? 'enemy' : 'friendly';
        }

        this.checkCombatEnd();
        this.isProcessingTurn = false;

        return result;
    }

    private calculateAttack(attacker: CombatUnit, defender: CombatUnit): CombatResult {
        const attackerStats = attacker.stats;
        const defenderStats = defender.stats;

        // Evasion check (dexterity vs evasion)
        const hitChance = 80 + (attackerStats.dexterity - defenderStats.evasion) * 2;
        const wasEvaded = Math.random() * 100 > hitChance;

        if (wasEvaded) {
            return { attacker, defender, damage: 0, wasEvaded: true, defenderDied: false };
        }

        // Damage calculation
        const baseDamage = attackerStats.damage + Math.floor(attackerStats.strength / 2);
        const mitigation = defenderStats.defense / 2 + defenderStats.soak;
        const finalDamage = Math.max(1, Math.floor(baseDamage - mitigation + (Math.random() * 6 - 3)));

        return { attacker, defender, damage: finalDamage, wasEvaded: false, defenderDied: false };
    }

    private findClosestTarget(attacker: CombatUnit, targets: CombatUnit[]): CombatUnit | null {
        if (targets.length === 0) return null;

        const attackerPos = this.getUnitPosition(attacker);
        if (!attackerPos) return targets[0];

        let closest = targets[0];
        let closestDist = Infinity;

        targets.forEach(target => {
            const targetPos = this.getUnitPosition(target);
            if (targetPos) {
                const dist = attackerPos.distanceTo(targetPos);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = target;
                }
            }
        });

        return closest;
    }

    private getUnitPosition(unit: CombatUnit): THREE.Vector3 | null {
        const entity = unit.entity;
        return entity?.position || entity?.mesh?.position || entity?.model?.group?.position || null;
    }

    private getUnitName(unit: CombatUnit): string {
        if (unit.entity.constructor.name === 'Player') return 'Hero';
        return unit.entity.constructor.name || 'Unknown';
    }

    private checkCombatEnd() {
        const aliveFriendly = this.friendlyUnits.filter(u => u.isAlive).length;
        const aliveEnemy = this.enemyUnits.filter(u => u.isAlive).length;

        if (aliveFriendly === 0) {
            this.combatEnded = true;
            this.onCombatLog?.('Defeat! All allies have fallen.', 'death');
            this.onCombatEnd?.(false);
        } else if (aliveEnemy === 0) {
            this.combatEnded = true;
            this.onCombatLog?.('Victory! All enemies have been defeated!', 'info');
            this.onCombatEnd?.(true);
        }
    }

    public isCombatOver(): boolean {
        return this.combatEnded;
    }

    public getAliveFriendlyCount(): number {
        return this.friendlyUnits.filter(u => u.isAlive).length;
    }

    public getAliveEnemyCount(): number {
        return this.enemyUnits.filter(u => u.isAlive).length;
    }

    public getCurrentTurn(): 'friendly' | 'enemy' {
        return this.currentTurn;
    }
}
