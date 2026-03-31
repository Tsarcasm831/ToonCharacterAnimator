/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { useCombat } from './hooks/useCombat';
import { Coins, Heart, Trophy, User, BarChart2, X } from 'lucide-react';
import { Shop } from './components/Shop';
import { Board } from './components/Board';
import { Bench } from './components/Bench';
import { SellZone } from './components/SellZone';
import { UnitPiece } from './components/UnitPiece';
import { SynergyList } from './components/SynergyList';
import { DamageRecap } from './components/DamageRecap';
import { XP_TO_LEVEL } from './constants';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { Unit } from './types';

export default function App() {
  const {
    playerGold,
    playerLevel,
    playerXP,
    playerHealth,
    currentPhase,
    roundNumber,
    gameOver,
    rerollShop,
    setPhase,
    moveUnitToBoard,
    moveUnitToBench,
    sellUnit,
    resetGame
  } = useGameStore();

  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [prepTimeLeft, setPrepTimeLeft] = useState(30);
  const [showRecap, setShowRecap] = useState(false);
  const { combatBoard, startCombat, endCombat, floatingTexts, projectiles, screenShake } = useCombat();

  // Prep Phase Timer
  useEffect(() => {
    if (currentPhase === 'PREP' && !gameOver) {
      setPrepTimeLeft(30);
      const timer = setInterval(() => {
        setPrepTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            startCombat();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentPhase, gameOver, startCombat]);

  // Initial shop roll
  useEffect(() => {
    if (!gameOver) rerollShop();
  }, [gameOver]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveUnit(active.data.current?.unit as Unit);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveUnit(null);
    const { active, over } = event;
    if (!over) return;

    if (over.id === 'sell-zone') {
      sellUnit(active.id as string);
      return;
    }

    const overId = String(over.id);
    if (overId.startsWith('board-')) {
      const [, x, y] = overId.split('-');
      moveUnitToBoard(active.id as string, parseInt(x), parseInt(y));
    } else if (overId.startsWith('bench-')) {
      const [, index] = overId.split('-');
      moveUnitToBench(active.id as string, parseInt(index));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-orange-500/30">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        {/* Top HUD */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-mono uppercase tracking-widest opacity-50">Round</span>
              <span className="text-xl font-bold">{roundNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-xl font-bold">{playerHealth}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-tighter border ${
              currentPhase === 'PREP' ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-red-500/50 text-red-400 bg-red-500/10'
            }`}>
              {currentPhase} PHASE {currentPhase === 'PREP' && `- ${prepTimeLeft}s`}
            </div>
            <button 
              onClick={() => {
                if (currentPhase === 'PREP') {
                  startCombat();
                } else {
                  const survivingEnemies = combatBoard
                    .flat()
                    .filter((unit) => unit && unit.owner === 'enemy' && !unit.isDead).length;
                  endCombat(false, survivingEnemies); // Surrender or force end
                }
              }}
              className="px-6 py-2 bg-neutral-100 text-neutral-950 rounded-lg font-bold hover:bg-neutral-200 transition-colors"
            >
              {currentPhase === 'PREP' ? 'Start Combat' : 'End Combat'}
            </button>
          </div>

          <div className="flex items-center gap-8">
            <button 
              onClick={() => setShowRecap(!showRecap)}
              className={`p-2 rounded-lg transition-colors ${showRecap ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-neutral-800 text-neutral-400'}`}
              title="Damage Recap"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-mono uppercase tracking-widest opacity-50">Level</span>
              <span className="text-xl font-bold">{playerLevel}</span>
              <div className="w-24 h-2 bg-neutral-800 rounded-full overflow-hidden ml-2 relative">
                <div className="h-full bg-blue-500" style={{ width: `${(playerXP / (XP_TO_LEVEL[playerLevel] || 1)) * 100}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-md">
                  {playerXP} / {XP_TO_LEVEL[playerLevel] || 'MAX'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-400">{playerGold}</span>
            </div>
          </div>
        </header>

        <SynergyList />

        <main className="pt-24 pb-24 pl-80 pr-6 flex flex-col items-center gap-8">
          <Board overrideBoard={currentPhase === 'COMBAT' ? combatBoard : undefined} floatingTexts={floatingTexts} projectiles={projectiles} screenShake={screenShake} />
          <Bench />
        </main>

        <SellZone active={!!activeUnit} />
        
        <DragOverlay dropAnimation={null}>
          {activeUnit ? (
            <div className="w-16 h-16 opacity-90 scale-110">
              <UnitPiece unit={activeUnit} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Shop />
      <DamageRecap isOpen={showRecap} onClose={() => setShowRecap(false)} combatBoard={combatBoard} />

      {gameOver && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center">
          <div className="bg-neutral-900 border border-neutral-800 p-12 rounded-3xl flex flex-col items-center gap-8 max-w-lg w-full shadow-2xl">
            <Trophy className="w-24 h-24 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
            <div className="text-center">
              <h1 className="text-5xl font-black text-white mb-2 tracking-tight">GAME OVER</h1>
              <p className="text-xl text-neutral-400">You reached Round <span className="text-white font-bold">{roundNumber}</span></p>
            </div>
            
            <div className="w-full bg-neutral-950 rounded-xl p-6 border border-neutral-800">
              <h3 className="text-sm font-mono text-neutral-500 uppercase tracking-widest mb-4">Final Stats</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-neutral-300">Total Gold Earned</span>
                <span className="text-yellow-400 font-mono font-bold">{playerGold}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-300">Highest Level</span>
                <span className="text-blue-400 font-mono font-bold">{playerLevel}</span>
              </div>
            </div>

            <button 
              onClick={resetGame}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors text-lg"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
