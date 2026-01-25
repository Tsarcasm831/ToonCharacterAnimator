import { TurnPhase } from '../../types';
import { CombatUnit } from './CombatTypes';

export class TurnManager {
    private turnQueue: CombatUnit[] = [];
    private waitedQueue: CombatUnit[] = [];
    private currentUnit: CombatUnit | null = null;
    private allUnits: CombatUnit[] = [];
    private hasRolledInitiative: boolean = false;
    private _currentPhase: TurnPhase = TurnPhase.INITIATIVE_ROLL;
    private roundNumber: number = 1;

    // Events
    public onTurnStart?: (unit: CombatUnit) => void;
    public onTurnEnd?: (unit: CombatUnit) => void;
    public onPhaseChange?: (phase: TurnPhase) => void;
    public onRoundStart?: (round: number) => void;
    public onQueueUpdate?: (queue: CombatUnit[]) => void;

    constructor() {}

    public startCombat(units: CombatUnit[]) {
        this.roundNumber = 1;
        this.currentUnit = null;
        this.turnQueue = [];
        this.waitedQueue = [];
        this.allUnits = units;
        this.hasRolledInitiative = false;
        this.startRound();
    }

    private startRound() {
        const aliveUnits = this.getAliveUnits();
        if (aliveUnits.length === 0) {
            this.setPhase(TurnPhase.TURN_END);
            return;
        }

        this.setPhase(TurnPhase.INITIATIVE_ROLL);

        // 1. Roll Initiative for all units (once per combat)
        if (!this.hasRolledInitiative) {
            this.rollInitiative(aliveUnits);
            this.hasRolledInitiative = true;
        }

        // 2. Sort into turn queue
        this.turnQueue = [...aliveUnits].sort((a, b) => {
            // Higher initiative goes first
            if (b.currentInitiative !== a.currentInitiative) {
                return b.currentInitiative - a.currentInitiative;
            }
            // Tie breaker: Player friendly units go first? Or random?
            // Let's favor friendly for now as a hidden bonus, or just random.
            return 0.5 - Math.random();
        });

        this.waitedQueue = [];
        this.currentUnit = null;
        this.onRoundStart?.(this.roundNumber);
        
        // 3. Start first turn
        this.nextTurn();
    }

    private rollInitiative(units: CombatUnit[]) {
        units.forEach(unit => {
            // D20 + Initiative Modifier (Dexterity based usually)
            const baseInit = unit.stats.initiative || unit.stats.dexterity || 10;
            const roll = Math.floor(Math.random() * 20) + 1;
            unit.currentInitiative = baseInit + roll;
        });
    }

    public nextTurn() {
        // If current unit exists, trigger end turn cleanup
        if (this.currentUnit) {
            this.onTurnEnd?.(this.currentUnit);
        }

        this.turnQueue = this.turnQueue.filter(unit => unit.isAlive);
        this.waitedQueue = this.waitedQueue.filter(unit => unit.isAlive);

        // Check if queue is empty
        if (this.turnQueue.length === 0) {
            if (this.waitedQueue.length > 0) {
                // Process waited queue
                this.turnQueue = [...this.waitedQueue];
                this.waitedQueue = [];
                // Sort waited queue by initiative again just in case? 
                // Usually they just go at end of round.
            } else {
                // End of Round
                this.endRound();
                return;
            }
        }

        // Get next unit
        let nextUnit = this.turnQueue.shift();
        while (nextUnit && !nextUnit.isAlive) {
            nextUnit = this.turnQueue.shift();
        }
        if (nextUnit) {
            this.currentUnit = nextUnit;
            this.startTurn(nextUnit);
        } else {
            this.endRound();
        }
    }

    private startTurn(unit: CombatUnit) {
        // Reset per-turn stats at the START of turn
        unit.stats.hasActedThisTurn = false;
        unit.stats.hasMovedThisTurn = false;
        unit.stats.currentMovement = unit.stats.movementPoints || 5; // Default 5 movement
        
        // Reset defense to base value (clear defend bonus)
        unit.stats.defense = unit.baseDefense;
        
        // Set unit state to ready for input
        unit.state = 'IDLE';

        this.onQueueUpdate?.(this.getCurrentQueue()); // Update UI
        this.onTurnStart?.(unit);

        // Determine Phase based on Unit Type
        if (unit.isFriendly) {
            this.setPhase(TurnPhase.PLAYER_TURN);
        } else {
            this.setPhase(TurnPhase.AI_TURN);
        }
    }

    private endRound() {
        this.roundNumber++;
        // Gather all units again?
        // In a real system, we'd keep a master list of units in CombatSystem
        // and re-feed them to startRound.
        // For now, we assume the caller will handle "next round" logic or we need a reference to all units.
        // BUT, TurnManager shouldn't hold the master list state if CombatSystem does.
        // Let's emit an event that round ended.
        this.setPhase(TurnPhase.TURN_END);
        this.startRound();
    }

    public waitCurrentTurn() {
        if (!this.currentUnit) return;
        
        this.waitedQueue.push(this.currentUnit);
        this.nextTurn();
    }

    public getCurrentUnit(): CombatUnit | null {
        return this.currentUnit;
    }

    public getPhase(): TurnPhase {
        return this._currentPhase;
    }

    private setPhase(phase: TurnPhase) {
        this._currentPhase = phase;
        this.onPhaseChange?.(phase);
    }

    public getCurrentQueue(): CombatUnit[] {
        const list: CombatUnit[] = [];
        if (this.currentUnit) list.push(this.currentUnit);
        list.push(...this.turnQueue);
        list.push(...this.waitedQueue);
        return list;
    }

    private getAliveUnits(): CombatUnit[] {
        return this.allUnits.filter(unit => unit.isAlive);
    }

    public reset() {
        this.turnQueue = [];
        this.waitedQueue = [];
        this.currentUnit = null;
        this.allUnits = [];
        this.hasRolledInitiative = false;
        this._currentPhase = TurnPhase.INITIATIVE_ROLL;
        this.roundNumber = 1;
    }
}
