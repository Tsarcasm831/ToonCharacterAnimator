import { useDroppable } from '@dnd-kit/core';
import { useGameStore } from '../store/useGameStore';
import { DraggableUnit } from './DraggableUnit';
import { BOARD_SIZE } from '../constants';
import { Unit, Projectile } from '../types';
import { FloatingText } from '../hooks/useCombat';
import { motion, AnimatePresence } from 'motion/react';

export function Board({ overrideBoard, floatingTexts = [], projectiles = [], screenShake = 0 }: { overrideBoard?: (Unit | null)[][], floatingTexts?: FloatingText[], projectiles?: Projectile[], screenShake?: number }) {
  const storeBoard = useGameStore(state => state.board);
  const currentPhase = useGameStore(state => state.currentPhase);
  
  const board = overrideBoard || storeBoard;

  return (
    <div 
      className="relative"
      style={{
        transform: screenShake > 0 ? `translate(${Math.random() * screenShake - screenShake/2}px, ${Math.random() * screenShake - screenShake/2}px)` : 'none',
        transition: screenShake > 0 ? 'none' : 'transform 0.1s ease-out'
      }}
    >
      <div className="grid grid-cols-8 gap-1 bg-neutral-900 p-2 rounded-xl border border-neutral-800 shadow-2xl relative overflow-hidden">
        {/* Board Texture/Grid Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff05 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff05 1px, transparent 1px)
          `,
          backgroundSize: '68px 68px',
          backgroundPosition: '8px 8px'
        }} />
        
        {board.map((row, y) => (
          row.map((unit, x) => (
            <BoardCell key={`${x}-${y}`} x={x} y={y} unit={unit} isPlayerSide={y >= BOARD_SIZE.rows / 2} currentPhase={currentPhase} />
          ))
        ))}
      </div>
      
      {/* Projectiles */}
      {currentPhase === 'COMBAT' && projectiles.map(p => (
        <motion.div
          key={p.id}
          className={`absolute w-3 h-3 rounded-full ${p.color} z-40 shadow-lg shadow-${p.color.replace('bg-', '')}/50`}
          initial={{ x: p.x * 68 + 32 + 8, y: p.y * 68 + 32 + 8, scale: 0 }}
          animate={{ x: p.x * 68 + 32 + 8, y: p.y * 68 + 32 + 8, scale: 1 }}
          transition={{ duration: 0.1 }}
          style={{
            marginLeft: '-6px',
            marginTop: '-6px',
          }}
        />
      ))}

      {floatingTexts.map(ft => (
        <motion.div
          key={ft.id}
          initial={{ opacity: 1, y: 0, scale: ft.isCrit ? 1.5 : 0.5, x: '-50%' }}
          animate={{ opacity: 0, y: -40, scale: ft.isCrit ? 2 : 1.5, x: '-50%' }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`absolute font-black pointer-events-none z-50 ${ft.color} drop-shadow-[0_2px_2px_rgba(0,0,0,1)] ${ft.isCrit ? 'text-3xl' : 'text-xl'}`}
          style={{
            left: `calc(8px + ${ft.x} * 68px + 32px)`,
            top: `calc(8px + ${ft.y} * 68px + 16px)`,
          }}
        >
          {ft.text}
          {ft.isCrit && <span className="text-yellow-400 text-sm ml-1">!</span>}
        </motion.div>
      ))}
    </div>
  );
}

import { memo } from 'react';

const BoardCell = memo(function BoardCell({ x, y, unit, isPlayerSide, currentPhase }: { x: number, y: number, unit: Unit | null, isPlayerSide: boolean, currentPhase: string }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `board-${x}-${y}`,
    disabled: currentPhase !== 'PREP' || !isPlayerSide,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`w-16 h-16 rounded-md border-2 flex items-center justify-center relative transition-colors ${
        isPlayerSide ? 'bg-blue-900/10 border-blue-900/30' : 'bg-red-900/10 border-red-900/30'
      } ${isOver ? 'bg-blue-500/30 border-blue-400' : ''}`}
    >
      <AnimatePresence mode="popLayout">
        {unit && <DraggableUnit key={unit.id} unit={unit} />}
      </AnimatePresence>
      {!unit && (
        <div className="text-[10px] text-neutral-600 font-mono opacity-0 hover:opacity-100 transition-opacity">
          {x},{y}
        </div>
      )}
    </div>
  );
});
