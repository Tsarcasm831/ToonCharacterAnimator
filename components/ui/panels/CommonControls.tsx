
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

export const Button: React.FC<{ 
    onClick: () => void, 
    children: React.ReactNode, 
    className?: string, 
    disabled?: boolean,
    variant?: 'primary' | 'secondary' | 'danger' | 'success'
}> = ({ onClick, children, className = '', disabled = false, variant = 'secondary' }) => {
    const baseStyles = "p-2 rounded-lg font-bold text-xs border transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-lg",
        secondary: "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300",
        danger: "bg-red-50 border-red-200 text-red-600 hover:bg-red-100",
        success: "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
    };

    return (
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

export const ToggleButton: React.FC<{
    label: string,
    isActive: boolean,
    onClick: () => void,
    activeColor?: 'blue' | 'red' | 'green' | 'orange' | 'purple' | 'pink',
    className?: string
}> = ({ label, isActive, onClick, activeColor = 'blue', className = '' }) => {
    const activeStyles = {
        blue: "bg-blue-100 border-blue-500 text-blue-700",
        red: "bg-red-100 border-red-500 text-red-700",
        green: "bg-emerald-100 border-emerald-500 text-emerald-700",
        orange: "bg-orange-100 border-orange-500 text-orange-700",
        purple: "bg-purple-100 border-purple-500 text-purple-700",
        pink: "bg-pink-100 border-pink-500 text-pink-700"
    };

    return (
        <button 
            onClick={onClick} 
            className={`p-2 rounded-lg font-bold text-[10px] uppercase tracking-wider border transition-all active:scale-95 ${
                isActive 
                ? activeStyles[activeColor] 
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            } ${className}`}
        >
            {label}
        </button>
    );
};

