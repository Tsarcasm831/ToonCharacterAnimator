import React from 'react';

interface DialogueOverlayProps {
  dialogue: string | null;
  onClose: () => void;
}

export const DialogueOverlay: React.FC<DialogueOverlayProps> = ({ dialogue, onClose }) => {
  if (!dialogue) return null;

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
            "{dialogue}"
          </p>
        </div>
      </div>
    </div>
  );
};
