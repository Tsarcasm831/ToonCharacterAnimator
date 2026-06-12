import React, { useRef, useState } from 'react';
import { useRPGStore } from '../state/rpgStore';
import {
  exportSaveDownload,
  importSaveFromFile,
  isFileSaveSupported,
  linkSaveFile,
  saveNow,
  unlinkSaveFile,
} from '../state/saveSystem';
import { PanelShell, relativeTime } from './common';

// ============================================================================
// Pause menu: resume, saving (manual / linked file / export / import).
// ============================================================================

const CONTROLS: { keys: string; action: string }[] = [
  { keys: 'WASD', action: 'Move' },
  { keys: 'Shift', action: 'Run' },
  { keys: 'Space', action: 'Jump' },
  { keys: 'E', action: 'Interact' },
  { keys: 'F', action: 'Pick up / skin' },
  { keys: 'I', action: 'Inventory' },
  { keys: 'P', action: 'Profile' },
  { keys: 'Esc', action: 'Pause' },
  { keys: '1-8', action: 'Hotbar' },
];

export const PauseMenu: React.FC = () => {
  const activePanel = useRPGStore((s) => s.activePanel);
  const lastSavedAt = useRPGStore((s) => s.lastSavedAt);
  const saveFileLinked = useRPGStore((s) => s.saveFileLinked);
  const closePanel = useRPGStore((s) => s.closePanel);
  const pushToast = useRPGStore((s) => s.pushToast);

  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  if (activePanel !== 'pause') return null;

  const handleSaveNow = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveNow();
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async (file: File) => {
    const ok = await importSaveFromFile(file);
    if (ok) {
      pushToast('Save imported', 'success', '💾');
      closePanel();
    } else {
      pushToast('Could not read that save file', 'danger', '⚠️');
    }
  };

  const buttonBase =
    'w-full rounded-full text-xs font-black uppercase tracking-widest px-4 py-3 transition-all duration-150';

  return (
    <PanelShell title="Paused" subtitle="The vale holds its breath" onClose={closePanel} width="w-[460px]">
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={closePanel}
          className={`${buttonBase} bg-amber-500 text-slate-950 hover:bg-amber-400 hover:scale-[1.02] shadow-lg shadow-amber-900/30`}
        >
          Resume
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={handleSaveNow}
          className={`${buttonBase} ${
            saving
              ? 'bg-slate-800 text-slate-500 cursor-wait'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-[1.02]'
          }`}
        >
          {saving ? 'Saving…' : '💾 Save Now'}
        </button>

        {isFileSaveSupported() && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            {saveFileLinked ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-emerald-400 text-xs font-black uppercase tracking-widest">Linked ✓</div>
                  <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                    Rewrites every 10 min
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void unlinkSaveFile()}
                  className="rounded-full text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 bg-slate-800 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-150"
                >
                  Unlink
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void linkSaveFile()}
                  className={`${buttonBase} bg-sky-600 text-white hover:bg-sky-500 hover:scale-[1.02]`}
                >
                  🔗 Link Save File
                </button>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-2.5 text-center leading-relaxed">
                  Pick a .json file; the game rewrites it every 10 minutes
                </p>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={exportSaveDownload}
          className={`${buttonBase} bg-slate-800/80 border border-slate-600 text-white hover:bg-slate-700 hover:scale-[1.02]`}
        >
          ⬇ Export Save
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`${buttonBase} bg-slate-800/80 border border-slate-600 text-white hover:bg-slate-700 hover:scale-[1.02]`}
        >
          ⬆ Import Save
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
            e.target.value = '';
          }}
        />
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <div className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">
          {lastSavedAt ? `Last saved ${relativeTime(lastSavedAt)}` : 'Not saved yet'}
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2.5">Controls</div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
            {CONTROLS.map((c) => (
              <div key={c.keys} className="flex items-center gap-1.5 min-w-0">
                <span className="bg-slate-800 border border-slate-700 rounded px-1.5 py-px text-[9px] font-mono font-bold text-slate-200 shrink-0">
                  {c.keys}
                </span>
                <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wide truncate">
                  {c.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PanelShell>
  );
};
