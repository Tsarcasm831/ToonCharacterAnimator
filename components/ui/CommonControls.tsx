
import React from 'react';

export const ColorPicker: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between group">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-200 transition-colors">{label}</label>
        <div className="relative w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden shadow-lg hover:scale-110 transition-transform">
            <input 
                type="color" 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                className="absolute inset-0 w-full h-full scale-[2] cursor-pointer" 
            />
        </div>
    </div>
);

export const Slider: React.FC<{ label: string, value: number, min: number, max: number, step: number, onChange: (val: number) => void }> = ({ label, value, min, max, step, onChange }) => {
  const decimals = Math.max(0, (step.toString().split('.')[1] || '').length);
  const formatted = value.toFixed(decimals).replace(/\.?0+$/, '');

  return (
    <div className="flex flex-col gap-2 group">
      <div className="flex justify-between items-end">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{label}</span>
          <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{formatted}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))} 
        className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all" 
      />
    </div>
  );
};
