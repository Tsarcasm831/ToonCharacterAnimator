import React from 'react';
import { MenuBackground } from '../menus/MenuBackground';
import WorldScene from '../../WorldScene';

export const Map: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-start relative">
            <div className="w-full flex-1 bg-black border-x border-t border-white/10 shadow-2xl overflow-hidden relative group">
                <MenuBackground />
                <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
                    <div className="w-full h-full max-w-7xl max-h-[80vh] bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <WorldScene />
                    </div>
                </div>
            </div>
        </div>
    );
};
