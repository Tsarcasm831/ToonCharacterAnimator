import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Unit, Position, Projectile } from '../types';
import { BOARD_SIZE, TRAIT_EFFECTS, UNITS_DATABASE } from '../constants';

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  isCrit?: boolean;
}

// Helper to calculate distance (Euclidean)
const getDistance = (p1: Position, p2: Position) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export function useCombat() {
  const { board, currentPhase, setPhase, activeSynergies } = useGameStore();
  const [combatBoard, setCombatBoard] = useState<(Unit | null)[][]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [screenShake, setScreenShake] = useState(0);
  const combatLoopRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const projectilesRef = useRef<Projectile[]>([]);

  const addFloatingText = useCallback((x: number, y: number, text: string, color: string, isCrit: boolean = false) => {
    const id = Math.random().toString(36).substr(2, 9);
    setFloatingTexts(prev => [...prev, { id, x, y, text, color, isCrit }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
    }, 1000);
  }, []);

  // Initialize combat
  const startCombat = useCallback(() => {
    // 1. Deep copy the board to avoid mutating the prep board
    const newBoard: (Unit | null)[][] = useGameStore.getState().board.map(row => row.map(u => u ? { ...u } : null));

    // 2. Apply synergies
    let enemyArmorDebuff = 0;
    const traitBuffs: Record<string, Partial<Unit>> = {};
    const activeSynergies = useGameStore.getState().activeSynergies;

    activeSynergies.forEach(syn => {
      if (syn.activeThreshold !== null) {
        const effectDef = TRAIT_EFFECTS[syn.trait];
        const threshold = effectDef.thresholds.find(t => t.count === syn.activeThreshold);
        
        if (threshold && threshold.stats) {
          traitBuffs[syn.trait] = threshold.stats;
        }
        
        // Special case for Undead (enemy debuff)
        if (syn.trait === 'Undead') {
          if (syn.activeThreshold === 2) enemyArmorDebuff += 4;
          if (syn.activeThreshold === 4) enemyArmorDebuff += 10;
        }
      }
    });

    // Apply buffs to player units and init stats
    newBoard.forEach(row => {
      row.forEach(unit => {
        if (unit) {
          unit.damageDealt = 0;
          unit.damageTaken = 0;
          unit.healingDone = 0;
          unit.facing = unit.owner === 'player' ? 1 : -1;
          
          if (unit.owner === 'player') {
            unit.traits.forEach(trait => {
              const buffs = traitBuffs[trait];
              if (buffs) {
                Object.entries(buffs).forEach(([key, value]) => {
                  const k = key as keyof Unit;
                  if (typeof value === 'number') {
                    if ((unit as any)[k] === undefined) {
                      (unit as any)[k] = 0;
                    }
                    (unit as any)[k] += value;
                  }
                });
              }
            });
          }
        }
      });
    });

    // 3. Spawn enemies (simple random spawn for now)
    const numEnemies = 3;
    for (let i = 0; i < numEnemies; i++) {
      const randomUnit = UNITS_DATABASE[Math.floor(Math.random() * UNITS_DATABASE.length)];
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        const x = Math.floor(Math.random() * BOARD_SIZE.cols);
        const y = Math.floor(Math.random() * (BOARD_SIZE.rows / 2)); // Top half
        if (!newBoard[y][x]) {
          newBoard[y][x] = {
            ...randomUnit,
            id: `enemy-${Math.random().toString(36).substr(2, 9)}`,
            owner: 'enemy',
            position: { x, y },
            benchIndex: null,
            armor: (randomUnit.armor || 0) - enemyArmorDebuff, // Apply undead debuff
            damageDealt: 0,
            damageTaken: 0,
            healingDone: 0,
            facing: -1,
          } as Unit;
          placed = true;
        }
        attempts++;
      }
    }

    setCombatBoard(newBoard);
    projectilesRef.current = [];
    setProjectiles([]);
    setScreenShake(0);
    useGameStore.getState().setPhase('COMBAT');
    lastTickRef.current = performance.now();
    combatLoopRef.current = requestAnimationFrame(combatTick);
  }, []);

  const combatTick = (timestamp: number) => {
    const TICK_RATE_MS = 100;
    const elapsed = timestamp - lastTickRef.current;
    
    if (elapsed < TICK_RATE_MS) {
      if (useGameStore.getState().currentPhase === 'COMBAT') {
        combatLoopRef.current = requestAnimationFrame(combatTick);
      }
      return;
    }
    
    // Keep exact timing by subtracting remainder
    lastTickRef.current = timestamp - (elapsed % TICK_RATE_MS);
    const deltaTime = 0.1; // Fixed 100ms delta for calculations

    let combatEnded = false;
    let playerWon = false;

    setCombatBoard(prevBoard => {
      let newBoard = prevBoard.map(row => row.map(u => u ? { ...u } : null));
      let playerAlive = false;
      let enemyAlive = false;

      // 1. Process Projectiles
      const currentProjectiles = projectilesRef.current;
      const nextProjectiles: Projectile[] = [];

      currentProjectiles.forEach(p => {
        // Find target
        let target: Unit | null = null;
        for (let y = 0; y < BOARD_SIZE.rows; y++) {
          for (let x = 0; x < BOARD_SIZE.cols; x++) {
            if (newBoard[y][x]?.id === p.targetId) {
              target = newBoard[y][x];
              break;
            }
          }
          if (target) break;
        }

        const tx = target ? target.position!.x : p.targetX;
        const ty = target ? target.position!.y : p.targetY;

        const dist = getDistance({ x: p.x, y: p.y }, { x: tx, y: ty });
        
        if (dist < p.speed * deltaTime) {
          // Hit!
          if (target && !target.isDead) {
            if (p.abilityType === 'aoe') {
              const radius = p.radius || 1;
              for (let ey = 0; ey < BOARD_SIZE.rows; ey++) {
                for (let ex = 0; ex < BOARD_SIZE.cols; ex++) {
                  const aoeTarget = newBoard[ey][ex];
                  if (aoeTarget && aoeTarget.owner === target.owner && !aoeTarget.isDead) {
                    const aoeDist = Math.max(Math.abs(aoeTarget.position!.x - tx), Math.abs(aoeTarget.position!.y - ty));
                    if (aoeDist <= radius) {
                      const actualDamage = Math.max(0, p.damage - aoeTarget.armor);
                      aoeTarget.hp -= actualDamage;
                      aoeTarget.damageTaken = (aoeTarget.damageTaken || 0) + actualDamage;
                      
                      // Find source to credit damage
                      let sourceUnit: Unit | null = null;
                      newBoard.forEach(r => r.forEach(u => { if (u?.id === p.sourceId) sourceUnit = u; }));
                      if (sourceUnit) sourceUnit.damageDealt = (sourceUnit.damageDealt || 0) + actualDamage;

                      addFloatingText(aoeTarget.position!.x, aoeTarget.position!.y, `-${Math.round(actualDamage)}`, 'text-purple-400');
                      if (aoeTarget.maxMana > 0) aoeTarget.mana = Math.min(aoeTarget.maxMana, aoeTarget.mana + 5);
                      if (aoeTarget.hp <= 0 && !aoeTarget.isDead) {
                        aoeTarget.isDead = true;
                        // Don't remove immediately, let the UI handle the death animation
                        setTimeout(() => {
                          setCombatBoard(b => {
                            const nb = b.map(r => [...r]);
                            if (nb[aoeTarget.position!.y][aoeTarget.position!.x]?.id === aoeTarget.id) {
                              nb[aoeTarget.position!.y][aoeTarget.position!.x] = null;
                            }
                            return nb;
                          });
                        }, 500);
                      }
                    }
                  }
                }
              }
            } else {
              // Single target hit
              const actualDamage = Math.max(0, p.damage - target.armor);
              target.hp -= actualDamage;
              target.damageTaken = (target.damageTaken || 0) + actualDamage;

              let sourceUnit: Unit | null = null;
              newBoard.forEach(r => r.forEach(u => { if (u?.id === p.sourceId) sourceUnit = u; }));
              if (sourceUnit) sourceUnit.damageDealt = (sourceUnit.damageDealt || 0) + actualDamage;

              const isCrit = p.color === 'bg-yellow-400';
              addFloatingText(target.position!.x, target.position!.y, `-${Math.round(actualDamage)}`, p.type === 'ability' ? 'text-purple-400' : (isCrit ? 'text-yellow-400' : 'text-red-400'), isCrit);
              if (target.maxMana > 0) target.mana = Math.min(target.maxMana, target.mana + 5);
              if (target.hp <= 0 && !target.isDead) {
                target.isDead = true;
                setTimeout(() => {
                  setCombatBoard(b => {
                    const nb = b.map(r => [...r]);
                    if (nb[target.position!.y][target.position!.x]?.id === target.id) {
                      nb[target.position!.y][target.position!.x] = null;
                    }
                    return nb;
                  });
                }, 500);
              }
            }
          }
        } else {
          // Move projectile
          const dx = tx - p.x;
          const dy = ty - p.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          nextProjectiles.push({
            ...p,
            x: p.x + (dx / length) * p.speed * deltaTime,
            y: p.y + (dy / length) * p.speed * deltaTime,
            targetX: tx,
            targetY: ty,
          });
        }
      });

      // Track unit actions to prevent multiple movements in one tick
      const actedUnits = new Set<string>();
      let didHitStop = false;

      // Iterate through all units
      for (let y = 0; y < BOARD_SIZE.rows; y++) {
        for (let x = 0; x < BOARD_SIZE.cols; x++) {
          const unit = newBoard[y][x];
          if (!unit || actedUnits.has(unit.id)) continue;

          if (unit.castTimer && unit.castTimer > 0) {
            unit.castTimer--;
            if (unit.castTimer > 0) continue; // Hit-stop: skip logic if still in cast/hit animation
          }

          if (unit.owner === 'player' && !unit.isDead) playerAlive = true;
          if (unit.owner === 'enemy' && !unit.isDead) enemyAlive = true;

          if (unit.isDead) continue; // Skip logic for dead units

          // Find nearest enemy
          let nearestEnemy: Unit | null = null;
          let minDistance = Infinity;

          for (let ey = 0; ey < BOARD_SIZE.rows; ey++) {
            for (let ex = 0; ex < BOARD_SIZE.cols; ex++) {
              const target = newBoard[ey][ex];
              if (target && target.owner !== unit.owner) {
                const dist = getDistance({ x, y }, { x: ex, y: ey });
                if (dist < minDistance) {
                  minDistance = dist;
                  nearestEnemy = target;
                }
              }
            }
          }

          if (nearestEnemy && nearestEnemy.position) {
            // Update facing
            unit.facing = nearestEnemy.position.x < unit.position!.x ? -1 : 1;

            if (minDistance <= unit.range) {
              // Attack or Spell
              if (unit.maxMana > 0 && unit.mana >= unit.maxMana && unit.ability) {
                // Cast ability
                unit.mana = 0;
                unit.castTimer = 5; // 5 ticks = 500ms visual feedback

                const ability = unit.ability;
                const spellPowerMult = unit.spellPower / 100;

                if (ability.type === 'projectile' || ability.type === 'aoe') {
                  const damage = (ability.damage || 0) * spellPowerMult;
                  
                  if (ability.type === 'aoe' && damage > 300) {
                    setScreenShake(prev => prev + 5); // Big spell screen shake
                  }

                  nextProjectiles.push({
                    id: `proj-${Math.random().toString(36).substr(2, 9)}`,
                    sourceId: unit.id,
                    targetId: nearestEnemy.id,
                    x: unit.position!.x,
                    y: unit.position!.y,
                    targetX: nearestEnemy.position!.x,
                    targetY: nearestEnemy.position!.y,
                    speed: 8, // tiles per second
                    damage: damage,
                    type: 'ability',
                    abilityType: ability.type,
                    radius: ability.radius,
                    color: 'bg-purple-500',
                  });
                } else if (ability.type === 'heal') {
                  const healAmount = (ability.heal || 0) * spellPowerMult;
                  // Find lowest HP ally
                  let lowestAlly: Unit | null = null;
                  let lowestHpPct = 1;
                  for (let ey = 0; ey < BOARD_SIZE.rows; ey++) {
                    for (let ex = 0; ex < BOARD_SIZE.cols; ex++) {
                      const ally = newBoard[ey][ex];
                      if (ally && ally.owner === unit.owner && !ally.isDead) {
                        const hpPct = ally.hp / ally.maxHp;
                        if (hpPct < lowestHpPct) {
                          lowestHpPct = hpPct;
                          lowestAlly = ally;
                        }
                      }
                    }
                  }
                  if (lowestAlly) {
                    lowestAlly.hp = Math.min(lowestAlly.maxHp, lowestAlly.hp + healAmount);
                    unit.healingDone = (unit.healingDone || 0) + healAmount;
                    addFloatingText(lowestAlly.position!.x, lowestAlly.position!.y, `+${Math.round(healAmount)}`, 'text-green-400');
                  } else {
                    unit.hp = Math.min(unit.maxHp, unit.hp + healAmount);
                    unit.healingDone = (unit.healingDone || 0) + healAmount;
                    addFloatingText(unit.position!.x, unit.position!.y, `+${Math.round(healAmount)}`, 'text-green-400');
                  }
                } else if (ability.type === 'buff') {
                  // Simple self buff for now
                  unit.armor += 20;
                  unit.ad += 20;
                  addFloatingText(unit.position!.x, unit.position!.y, `BUFF`, 'text-blue-400');
                }
              } else {
                // Auto attack
                const attackChance = unit.attackSpeed * deltaTime;
                if (Math.random() < attackChance) {
                  // Calculate damage
                  let isCrit = Math.random() < 0.25; // 25% crit chance
                  let damage = Math.max(0, unit.ad - nearestEnemy.armor);
                  if (isCrit) damage *= 1.5;
                  
                  if (unit.range > 1) {
                    // Ranged attack -> Projectile
                    nextProjectiles.push({
                      id: `proj-${Math.random().toString(36).substr(2, 9)}`,
                      sourceId: unit.id,
                      targetId: nearestEnemy.id,
                      x: unit.position!.x,
                      y: unit.position!.y,
                      targetX: nearestEnemy.position!.x,
                      targetY: nearestEnemy.position!.y,
                      speed: 12,
                      damage: damage,
                      type: 'attack',
                      color: isCrit ? 'bg-yellow-400' : 'bg-gray-300',
                    });
                  } else {
                    // Melee attack -> Instant
                    unit.castTimer = 2; // Hit-stop for melee
                    didHitStop = true;
                    
                    nearestEnemy.hp -= damage;
                    nearestEnemy.damageTaken = (nearestEnemy.damageTaken || 0) + damage;
                    unit.damageDealt = (unit.damageDealt || 0) + damage;
                    addFloatingText(nearestEnemy.position!.x, nearestEnemy.position!.y, `-${Math.round(damage)}`, isCrit ? 'text-yellow-400' : 'text-red-400', isCrit);
                    
                    if (nearestEnemy.maxMana > 0) {
                      nearestEnemy.mana = Math.min(nearestEnemy.maxMana, nearestEnemy.mana + 5);
                    }
                    if (nearestEnemy.hp <= 0 && !nearestEnemy.isDead) {
                      nearestEnemy.isDead = true;
                      setTimeout(() => {
                        setCombatBoard(b => {
                          const nb = b.map(r => [...r]);
                          if (nb[nearestEnemy.position!.y][nearestEnemy.position!.x]?.id === nearestEnemy.id) {
                            nb[nearestEnemy.position!.y][nearestEnemy.position!.x] = null;
                          }
                          return nb;
                        });
                      }, 500);
                    }
                  }
                  
                  // Mana gain for attacker
                  if (unit.maxMana > 0) {
                    unit.mana = Math.min(unit.maxMana, unit.mana + 10);
                  }
                }
              }
            } else {
              // Move towards target
              // Step logic: move one tile toward target per tick if unoccupied
              const dx = Math.sign(nearestEnemy.position.x - x);
              const dy = Math.sign(nearestEnemy.position.y - y);
              
              let nx = x + dx;
              let ny = y + dy;

              // Try diagonal first, then straight lines if blocked
              if (newBoard[ny]?.[nx] === null) {
                // Move
                newBoard[y][x] = null;
                unit.position = { x: nx, y: ny };
                newBoard[ny][nx] = unit;
              } else if (dx !== 0 && newBoard[y]?.[nx] === null) {
                newBoard[y][x] = null;
                unit.position = { x: nx, y };
                newBoard[y][nx] = unit;
              } else if (dy !== 0 && newBoard[ny]?.[x] === null) {
                newBoard[y][x] = null;
                unit.position = { x, y: ny };
                newBoard[ny][x] = unit;
              }
            }
          }
          
          actedUnits.add(unit.id);
        }
      }

      // Check win/loss
      if (!playerAlive || !enemyAlive) {
        combatEnded = true;
        playerWon = !enemyAlive;
        
        let survivingEnemies = 0;
        newBoard.forEach(row => row.forEach(u => {
          if (u && u.owner === 'enemy' && !u.isDead) survivingEnemies++;
        }));
        
        setTimeout(() => endCombat(playerWon, survivingEnemies), 1000);
        projectilesRef.current = nextProjectiles;
        return newBoard; // Return newBoard to show final state
      }

      projectilesRef.current = nextProjectiles;
      return newBoard;
    });

    setProjectiles([...projectilesRef.current]);
    setScreenShake(prev => Math.max(0, prev - 1)); // Decay screen shake

    if (!combatEnded && useGameStore.getState().currentPhase === 'COMBAT') {
      combatLoopRef.current = requestAnimationFrame(combatTick);
    }
  };

  const endCombat = useCallback((playerWon: boolean, survivingEnemies: number) => {
    if (useGameStore.getState().currentPhase !== 'COMBAT') return;

    if (combatLoopRef.current) {
      cancelAnimationFrame(combatLoopRef.current);
    }
    
    // Update game state (gold, health, round)
    useGameStore.setState(state => {
      const damage = playerWon ? 0 : 2 + survivingEnemies;
      const newHealth = state.playerHealth - damage;
      
      if (newHealth <= 0) {
        // Handle game over state properly
        return {
          currentPhase: 'PREP',
          playerHealth: 0,
          gameOver: true,
        };
      }
      
      const interest = Math.min(5, Math.floor(state.playerGold / 10));
      const baseIncome = 5;
      const winBonus = playerWon ? 1 : 0;
      const totalIncome = baseIncome + interest + winBonus;

      return {
        currentPhase: 'PREP',
        roundNumber: state.roundNumber + 1,
        playerGold: state.playerGold + totalIncome,
        playerHealth: newHealth,
      };
    });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (combatLoopRef.current) {
        cancelAnimationFrame(combatLoopRef.current);
      }
    };
  }, []);

  return {
    combatBoard,
    startCombat,
    endCombat,
    floatingTexts,
    projectiles,
    screenShake
  };
}
