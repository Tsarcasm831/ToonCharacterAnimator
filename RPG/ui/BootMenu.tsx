import React, { useRef } from 'react';
import { relativeTime } from './common';
import { TOWN_NAME, WORLD_NAME } from '../data/worldLayout';

// ============================================================================
// Title screen: Continue / New Adventure / Import Save.
// ============================================================================

export interface BootMenuProps {
  hasSave: boolean;
  saveMeta: { name: string; level: number; savedAt: number } | null;
  onContinue: () => void;
  onNewGame: () => void;
  onImport: (file: File) => void;
}

export const BootMenu: React.FC<BootMenuProps> = ({ hasSave, saveMeta, onContinue, onNewGame, onImport }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse at center, rgb(15 23 42) 0%, rgb(2 6 23) 62%, rgb(0 0 0) 100%)',
      }}
    >
      {/* vignette accents */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.06),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.7),transparent_60%)]" />

      <div className="relative flex flex-col items-center text-center px-6">
        <div className="text-amber-500/80 text-[11px] font-bold uppercase tracking-[0.5em] mb-3">
          {TOWN_NAME} awaits
        </div>
        <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tighter bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(251,191,36,0.25)]">
          {WORLD_NAME.toUpperCase()}
        </h1>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.35em] mt-4">
          A Tale of {TOWN_NAME}
        </p>

        <div className="flex flex-col items-center gap-3 mt-12 w-72">
          {hasSave && (
            <button
              type="button"
              onClick={onContinue}
              className="w-full rounded-full text-xs font-black uppercase tracking-widest px-4 py-3 bg-amber-500 text-slate-950 hover:bg-amber-400 hover:scale-[1.03] transition-all duration-150 shadow-lg shadow-amber-900/40"
            >
              Continue
              {saveMeta && (
                <span className="block text-[9px] font-bold tracking-widest opacity-70 mt-0.5 normal-case">
                  {saveMeta.name} — Lv {saveMeta.level} · saved {relativeTime(saveMeta.savedAt)}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onNewGame}
            className={`w-full rounded-full text-xs font-black uppercase tracking-widest px-4 py-3 transition-all duration-150 ${
              hasSave
                ? 'bg-slate-800/80 border border-slate-600 text-white hover:bg-slate-700 hover:scale-[1.03]'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400 hover:scale-[1.03] shadow-lg shadow-amber-900/40'
            }`}
          >
            New Adventure
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-full text-xs font-black uppercase tracking-widest px-4 py-3 bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:scale-[1.03] transition-all duration-150"
          >
            Import Save
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      <div className="absolute bottom-8 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
        WASD move · E interact · F pick up · I inventory · P profile
      </div>
    </div>
  );
};
