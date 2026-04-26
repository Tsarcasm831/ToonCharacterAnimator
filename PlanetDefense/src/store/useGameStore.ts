import { create } from 'zustand';
import * as THREE from 'three';
import { getRandomSphericalCoordinate } from '../utils/math';

export interface Enemy {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  health: number;
  maxHealth: number;
  rotationAxis: THREE.Vector3;
  rotationSpeed: number;
  color: THREE.Color;
  variant: number;
}

export interface Missile {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetId: string | null;
  speed: number;
  trail: THREE.Vector3[];
}

export interface Particle {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
}

export interface Explosion {
  id: string;
  position: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
  hasShockwave: boolean;
}

export interface GameState {
  status: 'menu' | 'playing' | 'gameover';
  health: number;
  maxHealth: number;
  score: number;
  wave: number;
  gameTime: number;
  fireCooldown: number;
  
  missilesReady: number;
  maxMissiles: number;
  missileRechargeProgress: number; // 0 to 1
  missileRechargeRate: number; // per second
  
  enemies: Enemy[];
  missiles: Missile[];
  explosions: Explosion[];
  particles: Particle[];
  
  spawnRate: number; // per second
  spawnTimer: number;
  spawnRadius: number;
  coreRadius: number;
  selectedNation: string | null;

  startGame: () => void;
  update: (delta: number) => void;
  fireMissile: () => void;
  setSelectedNation: (nation: string | null) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'menu',
  health: 100,
  maxHealth: 100,
  score: 0,
  wave: 1,
  gameTime: 0,
  fireCooldown: 0,
  
  missilesReady: 5,
  maxMissiles: 10,
  missileRechargeProgress: 0,
  missileRechargeRate: 1.5,
  
  enemies: [],
  missiles: [],
  explosions: [],
  particles: [],
  
  spawnRate: 1,
  spawnTimer: 0,
  spawnRadius: 150,
  coreRadius: 6,
  selectedNation: null,
  
  startGame: () => set({
    status: 'playing',
    health: 100,
    score: 0,
    wave: 1,
    gameTime: 0,
    fireCooldown: 0,
    missilesReady: 5,
    missileRechargeProgress: 0,
    enemies: [],
    missiles: [],
    explosions: [],
    particles: [],
    spawnRate: 1,
    selectedNation: null,
  }),
  
  fireMissile: () => {
    set((state) => {
      if (state.status !== 'playing' || state.missilesReady <= 0 || state.enemies.length === 0 || state.fireCooldown > 0) {
        return state;
      }

      // Target selection logic
      const targetedCounts = state.missiles.reduce((acc, m) => {
        if (m.targetId) acc[m.targetId] = (acc[m.targetId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      let bestTarget: Enemy | null = null;
      let minScore = Infinity;

      for (const enemy of state.enemies) {
        const _d = enemy.position.lengthSq();
        const targeted = targetedCounts[enemy.id] || 0;
        // prioritize untargeted, then close
        const score = _d + targeted * 50000;
        if (score < minScore) {
          minScore = score;
          bestTarget = enemy;
        }
      }

      if (!bestTarget) return state;

      const newMissile: Missile = {
        id: Math.random().toString(36).substr(2, 9),
        position: new THREE.Vector3().copy(bestTarget.position).normalize().multiplyScalar(state.coreRadius),
        velocity: new THREE.Vector3().copy(bestTarget.position).normalize().multiplyScalar(10), // initial burst
        targetId: bestTarget.id,
        speed: 30, // Slower missiles
        trail: [],
      };

      return {
        missilesReady: state.missilesReady - 1,
        missiles: [...state.missiles, newMissile],
        fireCooldown: 10.0, // Hard 10 second cooldown
      };
    });
  },
  
  setSelectedNation: (nation: string | null) => set({ selectedNation: nation }),
  
  update: (delta) => {
    set((state) => {
      if (state.status !== 'playing') return state;

      let { health, score, wave, enemies, missiles, explosions, particles, spawnTimer, spawnRate, missilesReady, missileRechargeProgress, gameTime, fireCooldown } = state;
      
      gameTime += delta;
      fireCooldown = Math.max(0, fireCooldown - delta);
      
      // 3 minutes (180 seconds) per wave progression
      const targetWave = Math.floor(gameTime / 180) + 1;
      if (targetWave > wave) {
        wave = targetWave;
      }
      
      // Wave 1: starts at 1 asteroid every ~8s, ramps to 1 every ~4s by end of wave
      // Wave 2+: increases meaningfully each wave
      // spawnRate = asteroids per second
      const waveRampT = Math.min(1, (gameTime % 180) / 120); // 0→1 over first 2 min of each wave
      const baseSpawnRate = 0.08 + (wave - 1) * 0.06; // wave1=0.08, wave2=0.14, wave3=0.20...
      const rampedSpawnRate = baseSpawnRate + waveRampT * (0.10 + (wave - 1) * 0.05);
      spawnRate = Math.min(rampedSpawnRate, 0.5 + (wave - 1) * 0.15); // hard cap per wave
      const currentRechargeRate = 0.4 + (wave * 0.05); // missile recharge stays slower early on

      if (missilesReady < state.maxMissiles) {
        missileRechargeProgress += currentRechargeRate * delta;
        if (missileRechargeProgress >= 1) {
          missilesReady++;
          missileRechargeProgress -= 1;
        }
      } else {
        missileRechargeProgress = 0;
      }
      
      // Grace period: no spawns for first 5 seconds
      const maxEnemiesOnScreen = 3 + (wave - 1) * 2; // wave1=3, wave2=5, wave3=7...
      spawnTimer += delta;
      if (gameTime > 5 && spawnTimer >= 1 / spawnRate && enemies.length < maxEnemiesOnScreen) {
        spawnTimer = 0;
        const pos = getRandomSphericalCoordinate(state.spawnRadius);
        // Wave 1 speed: ~1.0-1.8 units/sec (150 radius → ~90-150s to reach core)
        const speed = 0.8 + (wave * 0.3) + Math.random() * 0.8;
        const startVel = pos.clone().negate().normalize().multiplyScalar(speed);
        
        // Reduce tangent drift: wave1 almost straight-in, later waves drift more
        const tangentScale = 1.0 + (wave - 1) * 1.5;
        const tangent = new THREE.Vector3().crossVectors(pos, new THREE.Vector3(0, 1, 0)).normalize();
        startVel.add(tangent.multiplyScalar((Math.random() - 0.5) * tangentScale));

        enemies = [...enemies, {
          id: Math.random().toString(36).substr(2, 9),
          position: pos,
          velocity: startVel,
          size: 1.0 + Math.random() * 1.5 + (wave > 3 && Math.random() > 0.9 ? 3 : 0),
          health: 8 + (wave * 5),
          maxHealth: 8 + (wave * 5),
          rotationAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
          rotationSpeed: Math.random() * 2,
          color: new THREE.Color().setHSL(0.0 + Math.random() * 0.1, 0.4, 0.2 + Math.random() * 0.2),
          variant: Math.floor(Math.random() * 3),
        }];
      }

      const nextEnemies: Enemy[] = [];
      const deadEnemies: Record<string, boolean> = {};

      for (const enemy of enemies) {
        enemy.position.addScaledVector(enemy.velocity, delta);
        
        if (enemy.position.length() < state.coreRadius + enemy.size) {
          health -= Math.max(1, Math.floor(enemy.size * 5));
          deadEnemies[enemy.id] = true;
          explosions.push({
            id: Math.random().toString(36).substr(2, 9),
            position: enemy.position.clone(),
            color: new THREE.Color(1, 0.3, 0.1),
            life: 0,
            maxLife: 0.6,
            size: enemy.size * 8,
            hasShockwave: true,
          });
        } else {
          nextEnemies.push(enemy);
        }
      }

      const nextMissiles: Missile[] = [];
      const nextExplosions: Explosion[] = [...explosions];
      const nextParticles: Particle[] = [...particles];

      for (const missile of missiles) {
        const target = nextEnemies.find(e => e.id === missile.targetId);
        
        if (target && !deadEnemies[target.id]) {
          const toTarget = target.position.clone().sub(missile.position);
          const dist = toTarget.length();
          
          if (dist < target.size + 1.5) {
            target.health -= 35 + wave * 2;
            deadEnemies[missile.id] = true;
            
            nextExplosions.push({
              id: Math.random().toString(36).substr(2, 9),
              position: missile.position.clone(),
              color: new THREE.Color(0.2, 0.8, 1.0),
              life: 0,
              maxLife: 0.3,
              size: target.size * 2,
              hasShockwave: false,
            });

            for(let i=0; i<8; i++) {
                nextParticles.push({
                    id: Math.random().toString(36).substr(2, 9),
                    position: missile.position.clone(),
                    velocity: new THREE.Vector3((Math.random()-0.5)*30, (Math.random()-0.5)*30, (Math.random()-0.5)*30),
                    color: new THREE.Color(0.2, 0.8, 1.0),
                    life: 0,
                    maxLife: 0.2 + Math.random() * 0.3,
                    size: 0.5 + Math.random() * 1.5
                });
            }

            if (target.health <= 0) {
              deadEnemies[target.id] = true;
              score += Math.floor(target.maxHealth);
              nextExplosions.push({
                id: Math.random().toString(36).substr(2, 9),
                position: target.position.clone(),
                color: new THREE.Color(1.0, 0.5, 0.1),
                life: 0,
                maxLife: 0.8,
                size: target.size * 4,
                hasShockwave: true
              });
              for(let i=0; i<15; i++) {
                nextParticles.push({
                    id: Math.random().toString(36).substr(2, 9),
                    position: target.position.clone(),
                    velocity: new THREE.Vector3((Math.random()-0.5)*20, (Math.random()-0.5)*20, (Math.random()-0.5)*20).add(target.velocity.clone().multiplyScalar(0.5)),
                    color: target.color.clone().addScalar(0.2),
                    life: 0,
                    maxLife: 0.5 + Math.random() * 0.8,
                    size: Math.random() * target.size * 1.2
                });
              }
            }
          } else {
            const desiredVelocity = toTarget.normalize().multiplyScalar(missile.speed);
            missile.velocity.lerp(desiredVelocity, delta * 6);
            missile.position.addScaledVector(missile.velocity, delta);
            missile.velocity.normalize().multiplyScalar(missile.speed);
            nextMissiles.push(missile);
          }
        } else {
            missile.position.addScaledVector(missile.velocity, delta);
            if (missile.position.length() > state.spawnRadius * 1.2) {
                // Ignore, it flew off
            } else {
                nextMissiles.push(missile);
            }
        }
      }

      const filteredExplosions = nextExplosions.filter(exp => {
        exp.life += delta;
        return exp.life < exp.maxLife;
      });

      const filteredParticles = nextParticles.filter(p => {
        p.life += delta;
        p.position.addScaledVector(p.velocity, delta);
        return p.life < p.maxLife;
      });

      return {
        health: Math.max(0, health),
        status: health <= 0 ? 'gameover' : state.status,
        score,
        wave,
        gameTime,
        fireCooldown,
        spawnRate,
        spawnTimer,
        missilesReady,
        missileRechargeProgress,
        enemies: nextEnemies.filter(e => !deadEnemies[e.id]),
        missiles: nextMissiles,
        explosions: filteredExplosions,
        particles: filteredParticles,
      };
    });
  }
}));
