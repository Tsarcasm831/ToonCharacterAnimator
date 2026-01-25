import React, { useState, useEffect } from 'react';
import { MenuBackground } from '../menus/MenuBackground';
import { useIsIphoneLayout } from '../../../hooks/useIsIphoneLayout';

interface MerchItem {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
}

export const Shop: React.FC = () => {
    const isIphoneLayout = useIsIphoneLayout();
    const [merchItems] = useState<MerchItem[]>([
        {
            id: 'mug',
            name: 'Custom Mug',
            price: 14.99,
            image: '/assets/images/merch/mug.jpg',
            description: 'Personalized ceramic mug with custom design'
        },
        {
            id: 'hoody',
            name: 'Premium Hoodie',
            price: 49.99,
            image: '/assets/images/merch/hoody.jpg',
            description: 'Comfortable cotton hoodie with personalized print'
        },
        {
            id: 'cd-case',
            name: 'CD Jewel Case',
            price: 9.99,
            image: '/assets/images/merch/cd-jewel-case.jpg',
            description: 'Custom CD case with artwork and labels'
        }
    ]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-start relative">
            <div className="w-full flex-1 bg-black border-x border-t border-white/10 shadow-2xl overflow-hidden relative group">
                <MenuBackground />
                {isIphoneLayout ? (
                    <div
                        className="absolute inset-0 z-10 flex flex-col items-center justify-between text-white px-6 pt-12 pb-10 text-center"
                        style={{ paddingTop: 'env(safe-area-inset-top)' }}
                    >
                        <div className="space-y-3">
                            <p className="text-[10px] text-slate-400 uppercase tracking-[0.5em]">Merchandise Store</p>
                            <h1 className="text-4xl font-black tracking-tight">SHOP</h1>
                            <p className="text-xs text-slate-400 uppercase tracking-[0.3em]">Exclusive personalized items</p>
                        </div>
                        <div className="w-full bg-red-600 border border-red-700 rounded-lg p-3">
                            <p className="text-xs font-bold text-white uppercase tracking-widest text-center">TESTING ONLY - PRICES AND ITEMS ARE MOCKUPS</p>
                        </div>
                        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4">
                            <p className="text-xs text-slate-300 uppercase tracking-[0.3em]">Store Status</p>
                            <p className="mt-2 text-sm font-bold text-white">Open • Ready to order</p>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-start text-white p-8 z-10 pt-16">
                        <h1 className="text-6xl font-black mb-4">SHOP</h1>
                        <p className="text-slate-400 uppercase tracking-[0.3em] mb-4">Personalized Merchandise</p>
                        
                        <div className="w-full max-w-4xl bg-red-600 border border-red-700 rounded-lg p-3 mb-8">
                            <p className="text-xs font-bold text-white uppercase tracking-widest text-center">TESTING ONLY - PRICES AND ITEMS ARE MOCKUPS</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
                            {merchItems.map((item) => (
                                <div key={item.id} className="bg-white/10 border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                                    <div className="aspect-square bg-black/30 overflow-hidden">
                                        <img 
                                            src={item.image} 
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23374151"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-family="sans-serif" font-size="12"%3EImage%3C/text%3E%3C/svg%3E';
                                            }}
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                                        <p className="text-xs text-slate-400 mb-3">{item.description}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl font-bold text-green-400">${item.price}</span>
                                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-black uppercase tracking-widest transition-colors">
                                                Order Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-8 text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-widest">All items are made to order • 2-3 week delivery</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
