import { useDroppable } from '@dnd-kit/core';
import { Coins } from 'lucide-react';

export function SellZone({ active }: { active: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'sell-zone',
  });

  if (!active) return null;

  return (
    <div 
      ref={setNodeRef}
      className={`fixed bottom-40 left-1/2 -translate-x-1/2 px-12 py-6 rounded-2xl border-2 flex items-center gap-3 transition-all z-50 shadow-2xl ${
        isOver ? 'bg-red-500/90 border-red-400 scale-110' : 'bg-neutral-900/90 border-red-900/50 scale-100'
      }`}
    >
      <Coins className={`w-6 h-6 ${isOver ? 'text-white' : 'text-yellow-500'}`} />
      <span className={`font-bold text-lg ${isOver ? 'text-white' : 'text-red-400'}`}>
        {isOver ? 'Release to Sell' : 'Drag here to Sell'}
      </span>
    </div>
  );
}
