import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Unit } from '../types';
import { UnitPiece } from './UnitPiece';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'motion/react';

export function DraggableUnit({ unit }: { unit: Unit }) {
  const currentPhase = useGameStore(state => state.currentPhase);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: unit.id,
    data: { unit },
    disabled: currentPhase !== 'PREP' && unit.position !== null,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 50 : (unit.position ? unit.position.y : 1),
  };

  return (
    <motion.div 
      layoutId={`unit-${unit.id}`}
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes} 
      className="w-full h-full absolute inset-0 p-0.5"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: isDragging ? 0 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, filter: 'brightness(2) blur(4px)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <UnitPiece unit={unit} />
    </motion.div>
  );
}
