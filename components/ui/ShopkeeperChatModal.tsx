import React from 'react';

interface ShopkeeperChatModalProps {
    isOpen: boolean;
    onTrade: () => void;
    onCancel: () => void;
}

export const ShopkeeperChatModal: React.FC<ShopkeeperChatModalProps> = ({
    isOpen,
    onTrade,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-purple-300">Shopkeeper</h3>
                </div>
                <div className="px-6 py-6">
                    <p className="text-slate-100 text-lg leading-relaxed italic">
                        "Looking for something special? Take a look at my wares."
                    </p>
                </div>
                <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-slate-700 text-slate-200 hover:bg-slate-600 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onTrade}
                        className="px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-purple-500 text-white hover:bg-purple-400 transition-all shadow-lg"
                    >
                        Trade
                    </button>
                </div>
            </div>
        </div>
    );
};
