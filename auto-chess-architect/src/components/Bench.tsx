import { useDroppable } from '@dnd-kit/core';
import { useGameStore } from '../store/useGameStore';
import { DraggableUnit } from './DraggableUnit';
import { Unit } from '../types';
import { memo } from 'react';

export const Bench = memo(function Bench() {
  const bench = useGameStore(state => state.bench);

  return (
    <div className="flex gap-2 p-2 bg-neutral-900 rounded-xl border border-neutral-800">
      {bench.map((unit, i) => (
        <BenchSlot key={`bench-${i}`} index={i} unit={unit} />
      ))}
    </div>
  );
});

function BenchSlot({ index, unit }: { index: number, unit: Unit | null }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `bench-${index}`,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`w-16 h-16 rounded-md border-2 flex items-center justify-center relative transition-colors ${
        isOver ? 'bg-blue-500/30 border-blue-400' : 'bg-neutral-800/50 border-neutral-700/30'
      }`}
    >
      {unit && <DraggableUnit unit={unit} />}
      {!unit && <div className="text-[10px] text-neutral-600 font-mono">B{index}</div>}
    </div>
  );
}
