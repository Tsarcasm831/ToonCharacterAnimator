import React from 'react';
import type { DialogueContent } from '../../../game/core/Game';

interface DialogueOverlayProps {
  dialogue: string | DialogueContent | null;
  onClose: () => void;
  onSelectChoice?: (choiceId: string) => void;
}

export const DialogueOverlay: React.FC<DialogueOverlayProps> = ({ dialogue, onClose, onSelectChoice }) => {
  if (!dialogue) return null;

  const text = typeof dialogue === 'string' ? dialogue : dialogue.text;
  const choices = typeof dialogue === 'string' ? [] : (dialogue.choices ?? []);

  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">NPC Dialogue</span>
            <button 
              onClick={onClose}
              className="text-white/20 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-white text-lg font-medium leading-relaxed italic">
            "{text}"
          </p>
          {choices.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              {choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => onSelectChoice?.(choice.id)}
                  className="px-4 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider transition-colors"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
