
import React from 'react';
import { LayoutGrid, Home, Users, Sword, Music, Gamepad2 } from 'lucide-react';

export type PageType = 'home' | 'game' | 'units' | 'mission' | 'music';

interface NavigationProps {
    activePage: PageType;
    onPageChange: (page: PageType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activePage, onPageChange }) => {
    const navItems = [
        { id: 'home' as PageType, label: 'Home', icon: Home },
        { id: 'game' as PageType, label: 'Game', icon: Gamepad2 },
        { id: 'units' as PageType, label: 'Units', icon: Users },
        { id: 'mission' as PageType, label: 'Mission', icon: Sword },
        { id: 'music' as PageType, label: 'Music', icon: Music },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none">
            <nav className="mt-4 flex items-center gap-2 px-4 py-3 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onPageChange(item.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 group
                                ${isActive 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105' 
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
