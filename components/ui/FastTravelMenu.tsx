import React from 'react';

interface FastTravelMenuProps {
  activeScene: 'dev' | 'world' | 'combat';
  onTravel: (scene: 'dev' | 'world' | 'combat') => void;
  onClose: () => void;
}

export const FastTravelMenu: React.FC<FastTravelMenuProps> = ({ activeScene, onTravel, onClose }) => {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-2 animate-in zoom-in-95 duration-200">
      <div className="px-4 py-3 border-b border-white/5 mb-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Fast Travel</span>
      </div>
      <button 
        onClick={() => onTravel('dev')} 
        className={`w-full px-4 py-4 rounded-2xl text-left text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between group ${activeScene === 'dev' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
      >
        <span>Dev Scene</span>
        {activeScene === 'dev' ? (
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-white/30" />
        )}
      </button>
      <button 
        onClick={() => onTravel('land')} 
        className={`w-full px-4 py-4 rounded-2xl text-left text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between group mt-1 ${activeScene === 'land' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
      >
        <span>Land Scene</span>
        {activeScene === 'land' ? (
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-white/30" />
        )}
      </button>
      <button 
        onClick={() => onTravel('combat')} 
        className={`w-full px-4 py-4 rounded-2xl text-left text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between group mt-1 ${activeScene === 'combat' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
      >
        <span>Combat Arena</span>
        {activeScene === 'combat' ? (
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-white/30" />
        )}
      </button>
      <button 
        onClick={onClose} 
        className="w-full mt-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};
