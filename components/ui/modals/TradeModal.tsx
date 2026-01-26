
import React from 'react';
import { InventoryItem } from '../../../types';
import { ITEM_ICONS } from '../../../data/constants';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    inventory: (InventoryItem | null)[];
    onBuy: (item: string, price: number) => void;
    onSell: (index: number, price: number) => void;
    coins: number;
}

const MERCHANT_ITEMS = [
    { name: 'Sword', price: 450 },
    { name: 'Steel Axe', price: 300, icon: '🪓' },
    { name: 'Halberd', price: 600 },
    { name: 'Plate Mail', price: 1200 },
    { name: 'RingMail', price: 800 },
    { name: 'Quilted Armor', price: 200 },
    { name: 'Shield', price: 350 },
    { name: 'Mask', price: 50 },
    { name: 'Hood', price: 75 },
    { name: 'Shoes', price: 120 },
];

const ITEM_VALUE_MAP: Record<string, number> = {
    'Sword': 150,
    'Axe': 100,
    'Steel Axe': 180,
    'Pickaxe': 80,
    'Halberd': 250,
    'Fur': 15,
    'Knife': 40,
    'Fishing Pole': 50,
    'Shirt': 20,
    'Pants': 20,
    'Shoes': 30,
    'Mask': 10,
    'Hood': 15,
    'Quilted Armor': 60,
    'Leather Armor': 100,
    'Heavy Leather Armor': 200,
    'RingMail': 300,
    'Plate Mail': 500,
    'Wood': 2,
    'Coal': 12
};

export const TradeModal: React.FC<TradeModalProps> = ({ 
    isOpen, onClose, inventory, onBuy, onSell, coins 
}) => {
    if (!isOpen) return null;

    const renderMerchantSlot = (item: typeof MERCHANT_ITEMS[0], index: number) => {
        const canAfford = coins >= item.price;
        return (
            <div 
                key={index}
                onClick={() => canAfford ? onBuy(item.name, item.price) : null}
                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center relative group cursor-pointer transition-all ${
                    canAfford 
                    ? 'bg-slate-700 border-slate-500 hover:border-yellow-400 hover:bg-slate-600' 
                    : 'bg-slate-800/50 border-red-900/30 opacity-60 cursor-not-allowed'
                }`}
            >
                <span className="text-2xl drop-shadow-md group-hover:scale-110 transition-transform">
                    {item.icon || ITEM_ICONS[item.name] || '📦'}
                </span>
                <div className="mt-1 flex items-center gap-1">
                    <span className="text-[10px] font-bold text-yellow-400">🪙</span>
                    <span className={`text-[10px] font-black ${canAfford ? 'text-white' : 'text-red-400'}`}>{item.price}</span>
                </div>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] bg-yellow-600 text-white px-1 rounded font-black uppercase">Buy</span>
                </div>
            </div>
        );
    };

    const renderPlayerSlot = (item: InventoryItem | null, index: number) => {
        const value = item ? (ITEM_VALUE_MAP[item.name] || 5) : 0;
        return (
            <div 
                key={index}
                onContextMenu={(e) => { e.preventDefault(); if(item) onSell(index, value); }}
                onClick={() => { if(item) onSell(index, value); }}
                className={`aspect-square rounded-lg border-2 flex items-center justify-center relative group cursor-pointer transition-all ${
                    item 
                    ? 'bg-slate-700 border-slate-500 hover:border-emerald-400 hover:bg-slate-600' 
                    : 'bg-slate-800/50 border-slate-700 border-dashed opacity-30'
                }`}
            >
                {item && (
                    <>
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-2xl drop-shadow-md group-hover:scale-110 transition-transform">
                                {ITEM_ICONS[item.name] || '📦'}
                            </span>
                            {item.count > 1 && (
                                <div className="absolute top-1 right-1 bg-black/60 rounded px-1 text-[10px] font-black text-white">{item.count}</div>
                            )}
                        </div>
                        <div className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/40 px-1 rounded">
                             <span className="text-[8px] font-bold text-emerald-400">+{value * item.count}</span>
                        </div>
                        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] bg-emerald-600 text-white px-1 rounded font-black uppercase">Sell All</span>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="flex w-[900px] h-[600px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="w-1/2 bg-slate-800/50 border-r border-slate-700 flex flex-col">
                    <div className="p-6 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Blacksmith's Wares</h2>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Master-crafted equipment</p>
                        </div>
                        <div className="flex items-center gap-2 bg-yellow-950/30 border border-yellow-500/20 px-3 py-1 rounded-full">
                            <span className="text-yellow-400 text-sm">🪙</span>
                            <span className="text-white font-mono font-bold">{coins}</span>
                        </div>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-900/30">
                        <div className="grid grid-cols-4 gap-3">
                            {MERCHANT_ITEMS.map((item, i) => renderMerchantSlot(item, i))}
                        </div>
                    </div>
                </div>
                <div className="w-1/2 flex flex-col bg-slate-900/95">
                    <div className="p-6 border-b border-slate-700 bg-slate-900">
                        <h2 className="text-xl font-black text-blue-400 uppercase tracking-tighter">Your Belongings</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Click to sell for gold</p>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-900/50">
                        <div className="grid grid-cols-4 gap-3">
                            {inventory.map((item, i) => renderPlayerSlot(item, i))}
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-700 bg-slate-800 text-center">
                        <div className="text-[10px] text-slate-500 font-medium tracking-tight uppercase">Click shop items to buy • Click your items to sell</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
