import { Unit } from '../types';

// Simple sprite mapping based on unit name for now
const SPRITE_MAP: Record<string, string> = {
  'Warrior': '🗡️',
  'Archer': '🏹',
  'Mage': '🧙',
  'Knight': '🛡️',
  'Assassin': '🥷',
  'Priest': '✨',
  'Orc': '👹',
  'Elf': '🧝',
  'Human': '🧑',
  'Undead': '💀',
  'Demon': '👿',
  'Dragon': '🐉',
};

export function UnitPiece({ unit }: { unit: Unit }) {
  const isEnemy = unit.owner === 'enemy';
  const isCasting = unit.castTimer && unit.castTimer > 0;
  const isDead = unit.isDead;
  const hasBuff = unit.armor > 20 || unit.ad > 20; // Simple check for buff
  
  const getStarColor = (level: number) => {
    switch (level) {
      case 3: return 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]'; // Gold
      case 2: return 'text-slate-300 drop-shadow-[0_0_5px_rgba(203,213,225,0.8)]'; // Silver
      default: return 'text-amber-700'; // Bronze
    }
  };

  const stars = Array(unit.starLevel).fill('★').join('');
  
  // Calculate segments for health bar (e.g., 1 segment per 100 HP)
  const hpSegments = Math.max(1, Math.floor(unit.maxHp / 100));
  const hpPercent = Math.max(0, (unit.hp / unit.maxHp) * 100);

  return (
    <div 
      className={`w-full h-full bg-neutral-800/80 rounded-lg border-2 flex flex-col items-center justify-center relative overflow-hidden shadow-lg cursor-grab active:cursor-grabbing transition-all duration-100 hover:brightness-125 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] ${isEnemy ? 'border-red-500/50' : 'border-blue-500/50'} ${isCasting ? 'scale-110 brightness-150 shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10' : ''} ${isDead ? 'opacity-0 scale-50 filter blur-sm transition-all duration-500' : ''}`}
      style={{ transform: `scaleX(${unit.facing || 1})` }}
    >
      {hasBuff && (
        <div className="absolute inset-0 bg-blue-500/20 animate-pulse pointer-events-none" />
      )}
      {/* Reverse flip for text so it doesn't render backwards */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ transform: `scaleX(${unit.facing === -1 ? -1 : 1})` }}>
        <div className="absolute top-0 left-0 w-full flex justify-center -mt-0.5">
          <span className={`text-[10px] tracking-widest ${getStarColor(unit.starLevel)}`}>
            {stars}
          </span>
        </div>
        <div className="text-3xl mb-1 drop-shadow-md">
          {SPRITE_MAP[unit.name] || '❓'}
        </div>
        <div className="text-[10px] font-bold text-center w-full px-1 bg-black/40 backdrop-blur-sm">
          <div className="text-neutral-200 truncate">{unit.name}</div>
        </div>
      </div>

      {/* Health and Mana bars (not flipped) */}
      <div className="absolute bottom-1 left-1 right-1 flex flex-col gap-[2px]">
        {/* HP Bar */}
        <div className="w-full h-1.5 bg-red-950/80 rounded-sm overflow-hidden relative border border-black/50">
          <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200 ease-out" style={{ width: `${hpPercent}%` }} />
          {/* Segments */}
          <div className="absolute inset-0 flex justify-between pointer-events-none">
            {Array.from({ length: hpSegments - 1 }).map((_, i) => (
              <div key={i} className="h-full w-[1px] bg-black/50" style={{ left: `${((i + 1) / hpSegments) * 100}%`, position: 'absolute' }} />
            ))}
          </div>
        </div>
        
        {/* Mana Bar */}
        {unit.maxMana > 0 && (
          <div className="w-full h-1 bg-blue-950/80 rounded-sm overflow-hidden border border-black/50">
            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-200 ease-out" style={{ width: `${Math.max(0, (unit.mana / unit.maxMana) * 100)}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
