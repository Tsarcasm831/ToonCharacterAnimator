import * as THREE from 'three';
import { CombatSystem } from './CombatSystem';
import { CombatUnit } from './CombatTypes';
import { CombatEnvironment } from '../environment/CombatEnvironment';

export class AIController {
    private combatSystem: CombatSystem;
    private activeInterval: NodeJS.Timeout | null = null;

    constructor(combatSystem: CombatSystem) {
        this.combatSystem = combatSystem;
    }

    public onTurnStart(unit: CombatUnit, environment: CombatEnvironment) {
        if (unit.isFriendly) return; // AI only controls enemies

        console.log(`[AI] Starting turn for ${unit.entity.constructor.name}`);

        // Simulate thinking time
        setTimeout(() => {
            if (!unit.isAlive) return;
            this.decideAndExecute(unit, environment);
        }, 1000);
    }

    private decideAndExecute(unit: CombatUnit, environment: CombatEnvironment) {
        // 1. Find best target
        const target = this.findBestTarget(unit);
        if (!target) {
            console.log('[AI] No valid targets found. Ending turn.');
            this.combatSystem.endTurn();
            return;
        }

        // 2. Check if in range to attack
        const dist = this.getDistance(unit, target);
        const range = unit.stats.range || 1.5;
        
        if (dist <= range) {
            // Attack immediately
            console.log(`[AI] Attacking ${target.entity.constructor.name}`);
            this.combatSystem.executeAttack(unit, target);
            
            // End turn after attack animation delay
            setTimeout(() => this.combatSystem.endTurn(), 1500);
        } else {
            // 3. Move towards target with strategic positioning
            console.log(`[AI] Moving towards ${target.entity.constructor.name}`);
            
            // Try to find optimal position that minimizes distance while maintaining tactical advantage
            const path = this.calculateOptimalPath(unit, target, environment);
            
            if (path.length > 0) {
                // Trim path to movement points
                const maxSteps = unit.stats.currentMovement || 0;
                const movePath = path.slice(0, maxSteps);
                
                if (movePath.length > 0) {
                    this.combatSystem.executeMove(unit, movePath);

                    // Wait for movement to finish
                    this.activeInterval = setInterval(() => {
                        if (unit.state !== 'MOVING') {
                            if (this.activeInterval) {
                                clearInterval(this.activeInterval);
                                this.activeInterval = null;
                            }
                            
                            // Check range again after movement
                            const newDist = this.getDistance(unit, target);
                            if (newDist <= range) {
                                this.combatSystem.executeAttack(unit, target);
                                setTimeout(() => this.combatSystem.endTurn(), 1500);
                            } else {
                                // Consider if we should wait or end turn
                                this.combatSystem.endTurn();
                            }
                        }
                    }, 100);
                } else {
                     // Path exists but MP is 0 or path blocked immediately
                     this.combatSystem.endTurn();
                }
            } else {
                // No path or stuck
                console.log('[AI] No path to target. Ending turn.');
                this.combatSystem.endTurn();
            }
        }
    }

    private findBestTarget(unit: CombatUnit): CombatUnit | null {
        let bestTarget: CombatUnit | null = null;
        let bestScore = -Infinity;

        const allUnits = this.combatSystem.getAllUnits();
        
        for (const other of allUnits) {
            if (other.isFriendly === unit.isFriendly || !other.isAlive) continue;

            const dist = this.getDistance(unit, other);
            
            // Normalize all factors to 0-1 range
            const healthFactor = 1 - (other.stats.health / other.stats.maxHealth); // Lower health = higher priority (0-1)
            const damageFactor = Math.min(1, (other.stats.damage || 10) / 20); // Normalize damage (assuming max 20)
            const distanceFactor = Math.max(0, 1 - (dist / 15)); // Closer targets (0-1, assuming 15 max range)
            
            // Calculate final score with weights (total weight = 100)
            let score = (healthFactor * 30) + (damageFactor * 20) + (distanceFactor * 50);
            
            // Bonus if we can kill this turn
            const potentialDamage = unit.stats.damage || 10;
            if (potentialDamage >= other.stats.health) {
                score += 40; // Significant bonus for lethal targets
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestTarget = other;
            }
        }
        
        return bestTarget;
    }

    private calculateOptimalPath(unit: CombatUnit, target: CombatUnit, environment: CombatEnvironment): {r: number, c: number}[] {
        // For now, use the direct path. In the future, this can be enhanced with:
        // - Flanking maneuvers
        // - Avoiding other enemy units' attack ranges
        // - Seeking cover or high ground
        // - Grouping with allied units
        
        const unitPos = this.getUnitPosition(unit);
        const targetPos = this.getUnitPosition(target);
        
        if (!unitPos || !targetPos) return [];

        const path = environment.getPath(unitPos, targetPos);
        
        // Remove target cell from path (since it's occupied by target)
        if (path.length > 0) {
            const last = path[path.length - 1];
            if (target.gridPos && last.r === target.gridPos.r && last.c === target.gridPos.c) {
                path.pop();
            }
        }
        
        return path;
    }

    private calculatePathToTarget(unit: CombatUnit, target: CombatUnit, environment: CombatEnvironment): {r: number, c: number}[] {
        const unitPos = this.getUnitPosition(unit);
        const targetPos = this.getUnitPosition(target);
        
        if (!unitPos || !targetPos) return [];

        const path = environment.getPath(unitPos, targetPos);
        
        // Remove target cell from path (since it's occupied by target)
        if (path.length > 0) {
            const last = path[path.length - 1];
            if (target.gridPos && last.r === target.gridPos.r && last.c === target.gridPos.c) {
                path.pop();
            }
        }
        
        return path;
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

    public cleanup() {
        if (this.activeInterval) {
            clearInterval(this.activeInterval);
            this.activeInterval = null;
        }
    }
}
