import React from 'react';
import { useRPGStore } from '../state/rpgStore';
import { TOWN_NAME } from '../data/worldLayout';

// ============================================================================
// The 'YOU DIED' screen with respawn choice.
// ============================================================================

const DEATH_KEYFRAMES = `
@keyframes rpg-died-in { 0% { opacity: 0; letter-spacing: 0.6em; } 100% { opacity: 1; letter-spacing: 0.25em; } }
@keyframes rpg-death-fade { 0% { opacity: 0; } 100% { opacity: 1; } }
`;

export const DeathOverlay: React.FC = () => {
  const phase = useRPGStore((s) => s.phase);
  const respawn = useRPGStore((s) => s.respawn);
  const gold = useRPGStore((s) => s.progress.gold);

  if (phase !== 'dead') return null;

  const toll = Math.floor(gold * 0.1);

  const wake = (atTown: boolean) => {
    useRPGStore.setState({ respawnAtTown: atTown });
    respawn();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/90"
      style={{ animation: 'rpg-death-fade 600ms ease-out both' }}
    >
      <style>{DEATH_KEYFRAMES}</style>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(127,29,29,0.35) 0%, rgba(69,10,10,0.25) 45%, rgba(0,0,0,0.9) 100%)',
        }}
      />

      <div className="relative flex flex-col items-center text-center px-6">
        <h1
          className="font-serif text-7xl md:text-8xl font-bold text-red-600 tracking-[0.25em] drop-shadow-[0_0_40px_rgba(185,28,28,0.5)]"
          style={{ animation: 'rpg-died-in 1400ms ease-out both' }}
        >
          YOU&nbsp;DIED
        </h1>
        <p
          className="text-red-200/60 text-sm font-serif italic tracking-widest mt-5"
          style={{ animation: 'rpg-death-fade 900ms ease-out 700ms both' }}
        >
          The vale claims another hunter.
        </p>

        <div
          className="flex flex-col sm:flex-row items-center gap-3 mt-12"
          style={{ animation: 'rpg-death-fade 700ms ease-out 1200ms both' }}
        >
          <button
            type="button"
            onClick={() => wake(false)}
            className="rounded-full text-xs font-black uppercase tracking-widest px-7 py-3 bg-slate-800/80 border border-slate-600 text-white hover:bg-slate-700 hover:scale-105 transition-all duration-150"
          >
            🏕 Wake at Camp
          </button>
          <button
            type="button"
            onClick={() => wake(true)}
            className="rounded-full text-xs font-black uppercase tracking-widest px-7 py-3 bg-slate-800/80 border border-slate-600 text-white hover:bg-slate-700 hover:scale-105 transition-all duration-150"
          >
            🏘 Wake in {TOWN_NAME}
          </button>
        </div>

        <p
          className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-6"
          style={{ animation: 'rpg-death-fade 700ms ease-out 1500ms both' }}
        >
          Death takes its toll: 10% of your gold{toll > 0 ? ` (−${toll} 🪙)` : ''}
        </p>
      </div>
    </div>
  );
};
