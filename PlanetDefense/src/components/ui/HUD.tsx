import { useGameStore } from '../../store/useGameStore';
import { Target, AlertTriangle, Zap, Play, MapPin } from 'lucide-react';
import { useEffect } from 'react';

export function HUD() {
  const status = useGameStore(s => s.status);
  const health = useGameStore(s => s.health);
  const maxHealth = useGameStore(s => s.maxHealth);
  const score = useGameStore(s => s.score);
  const wave = useGameStore(s => s.wave);
  const missilesReady = useGameStore(s => s.missilesReady);
  const maxMissiles = useGameStore(s => s.maxMissiles);
  const missileRechargeProgress = useGameStore(s => s.missileRechargeProgress);
  const startGame = useGameStore(s => s.startGame);
  const fireMissile = useGameStore(s => s.fireMissile);
  const selectedNation = useGameStore(s => s.selectedNation);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        fireMissile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fireMissile]);

  if (status === 'menu') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white font-mono z-50">
        <h1 className="text-6xl font-bold tracking-widest text-cyan-400 mb-2 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          APEX CORE
        </h1>
        <p className="text-gray-400 mb-12 tracking-wider">ORBITAL DEFENSE COMMAND</p>
        
        <button 
          onClick={startGame}
          className="group relative px-8 py-4 bg-cyan-950/50 border border-cyan-500 rounded hover:bg-cyan-900/80 transition-all overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <span className="flex items-center gap-3 text-cyan-300 font-bold tracking-widest group-hover:text-white">
            <Play size={20} /> INITIALIZE DEFENSE
          </span>
        </button>
      </div>
    );
  }

  if (status === 'gameover') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 text-white font-mono z-50">
        <AlertTriangle size={64} className="text-red-500 mb-6 animate-pulse" />
        <h1 className="text-5xl font-bold tracking-tight text-red-500 mb-4">CORE COMPROMISED</h1>
        <p className="text-2xl text-red-200 mb-2">WAVES SURVIVED: {wave}</p>
        <p className="text-xl text-red-300 mb-12">THREATS ELIMINATED: {Math.floor(score / 25)}</p>
        
        <button 
          onClick={startGame}
          className="px-8 py-4 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-colors uppercase tracking-widest font-bold"
        >
          Reboot Systems
        </button>
      </div>
    );
  }

  const healthPct = (health / maxHealth) * 100;
  const healthColor = healthPct > 50 ? 'bg-cyan-400' : healthPct > 25 ? 'bg-orange-400' : 'bg-red-500';

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between font-mono text-cyan-500 select-none z-40">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        {/* Integrity & Selection */}
        <div className="flex flex-col gap-4 w-64">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm tracking-widest">
              <span className="flex items-center gap-2"><Target size={16}/> CORE INTEGRITY</span>
              <span className={healthPct < 25 ? 'text-red-500 animate-pulse' : ''}>{Math.ceil(healthPct)}%</span>
            </div>
            <div className="h-2 w-full bg-cyan-950 border border-cyan-900 rounded overflow-hidden">
              <div 
                className={`h-full ${healthColor} transition-all duration-300`}
                style={{ width: `${healthPct}%` }}
              />
            </div>
          </div>
          
          {selectedNation && (
             <div className="bg-cyan-950/40 border border-cyan-500/50 p-3 rounded backdrop-blur-sm animate-in fade-in zoom-in duration-300">
               <div className="text-xs text-cyan-600 mb-1 tracking-widest uppercase flex items-center gap-2">
                 <MapPin size={12} /> GLOBAL SECTOR
               </div>
               <div className="text-lg font-bold text-white tracking-wider truncate drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                  {selectedNation}
               </div>
             </div>
          )}
        </div>

        {/* Wave & Score */}
        <div className="flex flex-col items-end gap-1">
          <div className="text-3xl font-bold tracking-widest text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.5)]">
            WAVE {wave}
          </div>
          <div className="text-sm tracking-widest text-cyan-700">
            SCORE {score.toString().padStart(6, '0')}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex justify-between items-end">
        {/* Controls Hint */}
        <div className="text-xs text-cyan-800 tracking-widest">
          [SPACE] MANUAL OVERRIDE (FIRE MISSILE)<br/>
          *AUTO-TARGETING ACTIVE
        </div>

        {/* Missile Inventory */}
        <div className="flex flex-col items-end gap-3">
          <div className="text-sm tracking-widest flex items-center gap-2">
            <Zap size={16} /> ORDNANCE
          </div>
          <div className="flex gap-1">
            {Array.from({ length: maxMissiles }).map((_, i) => {
              const state = i < missilesReady ? 'ready' : i === missilesReady ? 'charging' : 'empty';
              return (
                <div 
                  key={i} 
                  className={
                    'w-3 h-8 border transition-all ' + 
                    (state === 'ready' ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 
                     state === 'charging' ? 'bg-cyan-900/50 border-cyan-700 relative overflow-hidden' : 
                     'bg-transparent border-cyan-900/50')
                  }
                >
                  {state === 'charging' && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-cyan-600 transition-all"
                      style={{ height: `${missileRechargeProgress * 100}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
