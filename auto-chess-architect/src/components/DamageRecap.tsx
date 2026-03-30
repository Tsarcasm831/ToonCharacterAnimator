import { memo } from 'react';
import { Unit } from '../types';
import { X, Swords, Shield, Heart } from 'lucide-react';

export const DamageRecap = memo(function DamageRecap({ 
  isOpen, 
  onClose, 
  combatBoard 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  combatBoard: (Unit | null)[][];
}) {
  if (!isOpen) return null;

  // Flatten and filter units
  const units = combatBoard.flat().filter((u): u is Unit => u !== null);
  
  // Find max values for bars
  const maxDamage = Math.max(1, ...units.map(u => u.damageDealt || 0));
  const maxTaken = Math.max(1, ...units.map(u => u.damageTaken || 0));
  const maxHealing = Math.max(1, ...units.map(u => u.healingDone || 0));

  // Separate by team
  const playerUnits = units.filter(u => u.owner === 'player').sort((a, b) => (b.damageDealt || 0) - (a.damageDealt || 0));
  const enemyUnits = units.filter(u => u.owner === 'enemy').sort((a, b) => (b.damageDealt || 0) - (a.damageDealt || 0));

  return (
    <aside className="fixed right-0 top-16 bottom-0 w-80 bg-neutral-950/95 backdrop-blur-xl border-l border-neutral-800 z-50 flex flex-col shadow-2xl">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
        <h2 className="font-bold text-neutral-200">Combat Recap</h2>
        <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div>
          <h3 className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-3">Your Team</h3>
          <div className="flex flex-col gap-3">
            {playerUnits.map(unit => (
              <UnitStatRow key={unit.id} unit={unit} maxDamage={maxDamage} maxTaken={maxTaken} maxHealing={maxHealing} />
            ))}
            {playerUnits.length === 0 && <div className="text-neutral-600 text-sm">No units deployed.</div>}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-mono text-red-400 uppercase tracking-widest mb-3">Enemy Team</h3>
          <div className="flex flex-col gap-3">
            {enemyUnits.map(unit => (
              <UnitStatRow key={unit.id} unit={unit} maxDamage={maxDamage} maxTaken={maxTaken} maxHealing={maxHealing} />
            ))}
            {enemyUnits.length === 0 && <div className="text-neutral-600 text-sm">No enemies.</div>}
          </div>
        </div>
      </div>
    </aside>
  );
});

function UnitStatRow({ unit, maxDamage, maxTaken, maxHealing }: { unit: Unit, maxDamage: number, maxTaken: number, maxHealing: number }) {
  const dmg = unit.damageDealt || 0;
  const taken = unit.damageTaken || 0;
  const heal = unit.healingDone || 0;

  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex justify-between text-neutral-300 font-bold">
        <span>{unit.name} <span className="text-neutral-500 font-normal">★{unit.starLevel}</span></span>
      </div>
      
      {/* Damage Dealt */}
      <div className="flex items-center gap-2">
        <Swords className="w-3 h-3 text-red-400" />
        <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-500" style={{ width: `${(dmg / maxDamage) * 100}%` }} />
        </div>
        <span className="w-8 text-right font-mono text-neutral-400">{Math.round(dmg)}</span>
      </div>

      {/* Damage Taken */}
      <div className="flex items-center gap-2">
        <Shield className="w-3 h-3 text-slate-400" />
        <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-slate-400" style={{ width: `${(taken / maxTaken) * 100}%` }} />
        </div>
        <span className="w-8 text-right font-mono text-neutral-400">{Math.round(taken)}</span>
      </div>

      {/* Healing Done */}
      {heal > 0 && (
        <div className="flex items-center gap-2">
          <Heart className="w-3 h-3 text-green-400" />
          <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${(heal / maxHealing) * 100}%` }} />
          </div>
          <span className="w-8 text-right font-mono text-neutral-400">{Math.round(heal)}</span>
        </div>
      )}
    </div>
  );
}
