
import React, { useState } from 'react';
import { Quest } from '../../types';

interface QuestLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: Quest[];
}

export const QuestLogModal: React.FC<QuestLogModalProps> = ({ isOpen, onClose, quests }) => {
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(quests[0]?.id || null);

  if (!isOpen) return null;

  const selectedQuest = quests.find(q => q.id === selectedQuestId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[500px]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Quest Log</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Your journey's record</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* List Sidebar */}
          <div className="w-1/3 border-r border-white/5 overflow-y-auto custom-scrollbar bg-slate-900/50">
            {quests.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-bold uppercase">No quests found</div>
            ) : (
              quests.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuestId(q.id)}
                  className={`w-full text-left p-4 border-b border-white/5 transition-all hover:bg-white/5 ${selectedQuestId === q.id ? 'bg-blue-600/20 border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${q.status === 'completed' ? 'text-green-400' : 'text-blue-400'}`}>
                      {q.status}
                    </span>
                  </div>
                  <h3 className="text-white text-sm font-bold truncate">{q.title}</h3>
                </button>
              ))
            )}
          </div>

          {/* Details Main Area */}
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-slate-800/20">
            {selectedQuest ? (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{selectedQuest.title}</h2>
                  <p className="text-slate-300 mt-4 text-sm leading-relaxed">{selectedQuest.description}</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Objectives</h3>
                  {selectedQuest.objectives.map((obj, i) => (
                    <div key={i} className="bg-black/20 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                      <span className="text-white text-xs font-bold">{obj.label}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-500" 
                            style={{ width: `${(obj.current / obj.target) * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">{obj.current}/{obj.target}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h3 className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Reward</h3>
                  <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20 text-yellow-200 text-xs font-bold flex items-center gap-2">
                    <span>🎁</span> {selectedQuest.reward}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm font-bold uppercase tracking-widest italic opacity-30">
                Select a quest to view details
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-slate-800/30 flex justify-center">
          <button 
            onClick={onClose}
            className="px-8 py-2 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-blue-400 hover:text-white transition-all shadow-lg active:scale-95"
          >
            Close Log
          </button>
        </div>
      </div>
    </div>
  );
};
