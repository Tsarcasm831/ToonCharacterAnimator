
import React from 'react';
import { LayoutGrid, Home, Users, Music, Gamepad2, Map } from 'lucide-react';

export type PageType = 'home' | 'game' | 'units' | 'music' | 'map';

interface NavigationProps {
    activePage: PageType;
    onPageChange: (page: PageType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activePage, onPageChange }) => {
    const navItems = [
        { id: 'home' as PageType, label: 'Home', icon: Home },
        { id: 'game' as PageType, label: 'Game', icon: Gamepad2 },
        { id: 'units' as PageType, label: 'Units', icon: Users },
        { id: 'music' as PageType, label: 'Music', icon: Music },
        { id: 'map' as PageType, label: 'Map', icon: Map },
    ];

    return (
        <header className="w-full h-20 bg-slate-900 border-b border-white/10 flex justify-center items-center shrink-0 z-[100]">
            <nav className="flex items-center gap-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onPageChange(item.id)}
                            className={`
                                flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 group
                                ${isActive 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </header>
    );
}
;
