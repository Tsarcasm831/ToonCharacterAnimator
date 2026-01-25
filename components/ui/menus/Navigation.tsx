import React, { useState, useEffect } from 'react';
import { Home, Music, Gamepad2, Info, ShoppingBag } from 'lucide-react';

export type PageType = 'home' | 'game' | 'music' | 'about' | 'shop';

interface NavigationProps {
    activePage: PageType;
    onPageChange: (page: PageType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activePage, onPageChange }) => {
    const [showShop, setShowShop] = useState(false);

    useEffect(() => {
        const handleShopUnlock = () => {
            console.log('Navigation received shopUnlocked event!');
            setShowShop(true);
        };
        
        window.addEventListener('shopUnlocked', handleShopUnlock);
        return () => window.removeEventListener('shopUnlocked', handleShopUnlock);
    }, []);

    const navItems = [
        { id: 'home' as PageType, label: 'Home', icon: Home },
        { id: 'game' as PageType, label: 'Game', icon: Gamepad2 },
        { id: 'music' as PageType, label: 'Music', icon: Music },
        { id: 'about' as PageType, label: 'About', icon: Info },
    ];

    // Add shop button if unlocked
    if (showShop) {
        navItems.push({ id: 'shop' as PageType, label: 'Shop', icon: ShoppingBag });
    }

    return (
        <header className="w-full h-16 md:h-20 bg-slate-900 border-b border-white/10 flex justify-center items-center shrink-0 z-[100] px-2">
            <nav className="flex items-center gap-1 md:gap-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onPageChange(item.id)}
                            className={`
                                flex items-center gap-2 px-3 md:px-6 py-2 md:py-3 rounded-xl transition-all duration-300 group
                                ${isActive 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                    : item.id === 'shop' 
                                        ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-600/20 border border-purple-500/30' 
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            <Icon className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${!isActive ? 'hidden md:block' : 'block'}`}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </header>
    );
};
