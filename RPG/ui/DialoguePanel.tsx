import React, { useEffect } from 'react';
import { useRPGStore } from '../state/rpgStore';
import { getNpcDef } from '../data/npcs';

// ============================================================================
// Bottom-centered cinematic dialogue panel.
// ============================================================================

export const DialoguePanel: React.FC = () => {
  const activePanel = useRPGStore((s) => s.activePanel);
  const dialogueNpcId = useRPGStore((s) => s.dialogueNpcId);
  const dialogueNodeId = useRPGStore((s) => s.dialogueNodeId);
  const flags = useRPGStore((s) => s.flags);
  const character = useRPGStore((s) => s.character);
  const chooseDialogue = useRPGStore((s) => s.chooseDialogue);
  const closePanel = useRPGStore((s) => s.closePanel);

  const open = activePanel === 'dialogue' && !!dialogueNpcId && !!dialogueNodeId;
  const npc = open ? getNpcDef(dialogueNpcId!) : undefined;
  const node = npc?.dialogue?.[dialogueNodeId!];

  // Defensive: a missing node means the conversation is over.
  useEffect(() => {
    if (open && !node) closePanel();
  }, [open, node, closePanel]);

  if (!open || !npc || !node) return null;

  const playerName = character?.name ?? 'Traveler';
  const text = node.text.split('{name}').join(playerName);
  const choices = node.choices.filter((c) => !(c.hideIfFlag && flags[c.hideIfFlag]));
  const ringColor = npc.appearance.robeColor ?? npc.appearance.shirtColor ?? '#f59e0b';

  return (
    <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-[220] w-full max-w-2xl px-4 pointer-events-auto">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: ringColor }} />

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-full bg-slate-800 ring-2 ring-offset-2 ring-offset-slate-900 flex items-center justify-center text-lg font-black text-white shrink-0"
            style={{ ['--tw-ring-color' as never]: ringColor }}
          >
            {npc.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-white text-sm font-black uppercase tracking-tighter">{npc.name}</div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{npc.role}</div>
          </div>
          <button
            type="button"
            onClick={closePanel}
            aria-label="Close"
            className="ml-auto text-slate-600 hover:text-white transition-colors duration-150"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-slate-100 text-base font-medium leading-relaxed italic">“{text}”</p>

        <div className="flex flex-col gap-1.5 mt-5">
          {choices.map((choice, i) => (
            <button
              key={`${choice.label}-${i}`}
              type="button"
              onClick={() => chooseDialogue(choice)}
              className="w-full text-left rounded-xl border border-slate-700/70 bg-slate-800/40 px-4 py-2.5 text-slate-300 text-xs font-bold hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-200 hover:translate-x-0.5 transition-all duration-150"
            >
              <span className="text-amber-500/70 mr-2">▸</span>
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
