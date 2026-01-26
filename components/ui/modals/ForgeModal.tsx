
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ITEM_ICONS } from '../../../data/constants';
import { InventoryItem } from '../../../types';

interface ForgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    inventory: (InventoryItem | null)[];
    onInventoryChange: (items: (InventoryItem | null)[]) => void;
}

interface Recipe {
    result: string;
    required: number;
}

const SMELT_RECIPES: Record<string, Recipe> = {
    'Copper Ore': { result: 'Sword', required: 1 }, 
    'Fur': { result: 'Leather Armor', required: 1 },
    'Wood': { result: 'Coal', required: 4 }
};

export const ForgeModal: React.FC<ForgeModalProps> = ({ 
    isOpen, onClose, inventory, onInventoryChange 
}) => {
    const [inputItem, setInputItem] = useState<InventoryItem | null>(null);
    const [outputItem, setOutputItem] = useState<InventoryItem | null>(null);
    const [isForging, setIsForging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    
    // Use refs to avoid stale closures in the interval
    const inputRef = useRef<InventoryItem | null>(null);
    const outputRef = useRef<InventoryItem | null>(null);
    const isForgingRef = useRef(false);
    const intervalRef = useRef<number | null>(null);
    const forgeStartTimeRef = useRef<number>(0);

    const DURATION = 4000; // 4 seconds per production cycle

    // Keep refs in sync with state for the logic loop
    useEffect(() => { inputRef.current = inputItem; }, [inputItem]);
    useEffect(() => { outputRef.current = outputItem; }, [outputItem]);
    useEffect(() => { isForgingRef.current = isForging; }, [isForging]);

    const stopForging = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsForging(false);
        setProgress(0);
    }, []);

    const startForge = useCallback(() => {
        if (!inputRef.current || isForgingRef.current) return;
        
        const recipe = SMELT_RECIPES[inputRef.current.name] || { result: 'Iron Bar', required: 1 };
        
        if (inputRef.current.count < recipe.required) {
            alert(`Need at least ${recipe.required} ${inputRef.current.name} to smelt.`);
            return;
        }

        if (outputRef.current && outputRef.current.name !== recipe.result) {
            alert("Clear output slot first!");
            return;
        }

        setIsForging(true);
        setProgress(0);
        forgeStartTimeRef.current = Date.now();

        intervalRef.current = window.setInterval(() => {
            const now = Date.now();
            const elapsed = now - forgeStartTimeRef.current;
            const p = Math.min(elapsed / DURATION, 1.0);
            
            setProgress(p);

            if (p >= 1.0) {
                // Perform Smelt logic using current Ref values
                const currentInput = inputRef.current;
                const currentOutput = outputRef.current;
                
                if (!currentInput) {
                    stopForging();
                    return;
                }

                const currentRecipe = SMELT_RECIPES[currentInput.name] || { result: 'Iron Bar', required: 1 };

                // 1. Double check resources
                if (currentInput.count < currentRecipe.required) {
                    stopForging();
                    return;
                }

                // 2. Perform transformation
                const nextInputCount = currentInput.count - currentRecipe.required;
                const nextInput = nextInputCount > 0 ? { ...currentInput, count: nextInputCount } : null;
                
                const nextOutput = (currentOutput && currentOutput.name === currentRecipe.result)
                    ? { ...currentOutput, count: currentOutput.count + 1 }
                    : { name: currentRecipe.result, count: 1 };

                // Update state (for UI)
                setInputItem(nextInput);
                setOutputItem(nextOutput);
                
                // Update refs immediately so next tick sees them
                inputRef.current = nextInput;
                outputRef.current = nextOutput;

                // 3. Decide if we continue
                if (nextInput && nextInput.count >= currentRecipe.required) {
                    // Reset progress for next item in stack
                    setProgress(0);
                    forgeStartTimeRef.current = now;
                } else {
                    stopForging();
                }
            }
        }, 32);
    }, [stopForging]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    if (!isOpen) return null;

    const handleInventoryItemClick = (item: InventoryItem, index: number) => {
        if (isForging) return;
        const newInv = [...inventory];
        
        if (inputItem) {
            if (inputItem.name === item.name) {
                setInputItem({ ...inputItem, count: inputItem.count + item.count });
                newInv[index] = null;
                onInventoryChange(newInv);
                return;
            }
            const emptyIdx = newInv.findIndex(s => s === null);
            if (emptyIdx !== -1) {
                newInv[emptyIdx] = { ...inputItem };
                newInv[index] = null;
                onInventoryChange(newInv);
                setInputItem({ ...item });
            } else {
                const prevInput = { ...inputItem };
                newInv[index] = prevInput;
                setInputItem({ ...item });
                onInventoryChange(newInv);
            }
        } else {
            newInv[index] = null;
            onInventoryChange(newInv);
            setInputItem({ ...item });
        }
    };

    const handleInputClick = () => {
        if (isForging || !inputItem) return;
        const newInv = [...inventory];
        const emptyIdx = newInv.findIndex(s => s === null);
        if (emptyIdx !== -1) {
            newInv[emptyIdx] = { ...inputItem };
            onInventoryChange(newInv);
            setInputItem(null);
        }
    };

    const handleOutputClick = () => {
        if (isForging || !outputItem) return;
        const newInv = [...inventory];
        let found = false;
        for (let i = 0; i < newInv.length; i++) {
            const slot = newInv[i];
            if (slot && slot.name === outputItem.name) {
                slot.count += outputItem.count;
                found = true;
                break;
            }
        }
        if (!found) {
            const emptySlot = newInv.findIndex(s => s === null);
            if (emptySlot !== -1) {
                newInv[emptySlot] = { ...outputItem };
                found = true;
            }
        }
        if (found) {
            onInventoryChange(newInv);
            setOutputItem(null);
        } else {
            alert("Inventory Full!");
        }
    };

    const currentRecipe = inputItem ? SMELT_RECIPES[inputItem.name] : null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="flex w-[850px] h-[550px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="w-1/2 bg-slate-800/40 border-r border-slate-700 flex flex-col items-center justify-center p-8">
                    <h2 className="text-2xl font-black text-orange-500 uppercase tracking-tighter mb-8">Blacksmith's Forge</h2>
                    
                    {currentRecipe && (
                        <div className="mb-6 px-4 py-1.5 bg-orange-950/40 border border-orange-500/30 rounded-full">
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
                                Recipe: {currentRecipe.required}x {inputItem?.name} → 1x {currentRecipe.result}
                            </p>
                        </div>
                    )}

                    <div className="flex items-center gap-12 relative">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Input</span>
                            <div 
                                onClick={handleInputClick} 
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (draggedIndex !== null) {
                                        const item = inventory[draggedIndex];
                                        if (item) handleInventoryItemClick(item, draggedIndex);
                                        setDraggedIndex(null);
                                    }
                                }}
                                className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center transition-all ${inputItem ? 'bg-slate-700 border-orange-500/50 cursor-pointer hover:scale-105' : 'bg-slate-900/50 border-slate-700 border-dashed hover:bg-slate-800'}`}
                            >
                                {inputItem ? (
                                    <div className="relative">
                                        <span className="text-4xl drop-shadow-lg">{ITEM_ICONS[inputItem.name] || '📦'}</span>
                                        <div className="absolute -bottom-2 -right-2 bg-black/80 rounded px-1 text-[10px] font-black text-white border border-white/10">{inputItem.count}</div>
                                    </div>
                                ) : (
                                    <span className="text-slate-700 text-xs font-bold uppercase text-center px-2">Drag Items Here</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 w-24">
                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                                <div className="h-full bg-orange-500 transition-all duration-75" style={{ width: `${progress * 100}%` }} />
                            </div>
                            <svg className={`w-8 h-8 ${isForging ? 'text-orange-500 animate-pulse' : 'text-slate-700'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Output</span>
                            <div onClick={handleOutputClick} className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center transition-all ${outputItem ? 'bg-slate-700 border-green-500/50 cursor-pointer hover:scale-105 animate-bounce shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-slate-900/50 border-slate-700 border-dashed'}`}>
                                {outputItem ? (
                                    <div className="relative">
                                        <span className="text-4xl drop-shadow-lg">{ITEM_ICONS[outputItem.name] || '📦'}</span>
                                        <div className="absolute -bottom-2 -right-2 bg-black/80 rounded px-1 text-[10px] font-black text-white border border-white/10">{outputItem.count}</div>
                                    </div>
                                ) : (
                                    <span className="text-slate-700 text-xs font-bold uppercase text-center px-2">Ready</span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={isForging ? stopForging : startForge} 
                        disabled={(!inputItem && !isForging) || (currentRecipe && inputItem && inputItem.count < currentRecipe.required && !isForging)} 
                        className={`mt-12 px-10 py-3 rounded-full font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-95 ${((!inputItem && !isForging) || (currentRecipe && inputItem && inputItem.count < currentRecipe.required && !isForging)) ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-500 hover:shadow-orange-500/20'}`}
                    >
                        {isForging ? 'Stop Processing' : 'Start Smelting'}
                    </button>
                    
                    <p className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center max-w-[200px]">Processes stack at 4 logs per coal every 4s</p>
                </div>
                <div className="w-1/2 flex flex-col bg-slate-900/95">
                    <div className="p-6 border-b border-slate-700 bg-slate-900">
                        <h2 className="text-xl font-black text-blue-400 uppercase tracking-tighter">Backpack</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Drag or right-click to add items</p>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-900/50">
                        <div className="grid grid-cols-4 gap-3">
                            {inventory.map((item, i) => (
                                <div 
                                    key={i} 
                                    draggable={!!item}
                                    onDragStart={() => setDraggedIndex(i)}
                                    onClick={() => item && handleInventoryItemClick(item, i)}
                                    onContextMenu={(e) => { e.preventDefault(); if (item) handleInventoryItemClick(item, i); }}
                                    className={`aspect-square rounded-lg border-2 flex items-center justify-center relative group transition-all ${item ? 'bg-slate-700 border-slate-500 hover:border-blue-400 hover:bg-slate-600 cursor-grab active:cursor-grabbing' : 'bg-slate-800/50 border-slate-700 border-dashed opacity-30'}`}
                                >
                                    {item && (
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="text-2xl drop-shadow-md group-hover:scale-110 transition-transform">{ITEM_ICONS[item.name] || '📦'}</span>
                                            {item.count > 1 && <div className="absolute top-1 right-1 bg-black/60 rounded px-1 text-[10px] font-black text-white border border-white/10">{item.count}</div>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-700 bg-slate-800 text-center">
                        <div className="text-[10px] text-slate-500 font-medium tracking-tight uppercase">Wood stack Smelting: 4 logs {'->'} 1 coal</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
