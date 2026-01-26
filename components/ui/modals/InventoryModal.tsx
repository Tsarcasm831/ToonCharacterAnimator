import React, { useState } from 'react';
import { PlayerConfig, InventoryItem, ItemData } from '../../../types';
import { ITEM_ICONS, ITEM_IMAGES, ITEM_DATA } from '../../../data/constants';
import { PlayerPreview } from '../previews/PlayerPreview';
import { ItemTooltip } from '../hud/ItemTooltip';

// --- Types & Constants ---

interface InventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: PlayerConfig;
    inventory: (InventoryItem | null)[];
    equipmentSlots: Record<string, string | null>;
    onEquip: (index: number) => void;
    onInventoryChange: (items: (InventoryItem | null)[]) => void;
    onEquipItem: (item: string, slotId: string) => void;
    onUnequipItem: (slotId: string) => void;
    coins: number;
    onUpdateSlotLayouts?: (layouts: Record<string, any>) => void;
    slotLayouts?: Record<string, any>;
}

const TABS = ['INVENTORY', 'COSMETICS', 'QUEST ITEMS'];

// --- Mapping Logic ---

const ITEM_TO_SLOT_MAP: Record<string, string> = {
    'Shirt': 'torso', 'Quilted Armor': 'torso', 'Leather Armor': 'torso', 
    'Heavy Leather Armor': 'torso', 'RingMail': 'torso', 'Plate Mail': 'torso',
    'Pants': 'legs', 'Shoes': 'boots', 'Mask': 'mask', 'Hood': 'hood', 'Helm': 'helm',
    'Sword': 'weapon', 'Axe': 'weapon', 'Pickaxe': 'weapon', 'Knife': 'weapon', 
    'Halberd': 'weapon', 'Staff': 'weapon', 'Fishing Pole': 'weapon', 'Bow': 'weapon',
    'Shield': 'focus', 'Gold Ring': 'ring1', 'Potion of Healing': 'hotbar', 'Mana Potion': 'hotbar'
};

const getStats = (cfg: PlayerConfig, eq: any) => {
    // Simplified logic for display purposes
    return {
        STR: 25,
        DEX: 14,
        INT: 10,
        DEF: (eq.torso ? 50 : 0) + (eq.helm ? 20 : 0) + 10,
        ATK: (eq.weapon ? 35 : 5)
    };
};

// Layout coordinates mimicking the "Paper Doll" reference image
// Using percentages to allow scaling within the container
const EQUIPMENT_SLOTS = [
    // Center Column
    { id: 'helm', icon: '⛑️', label: 'Helm', style: { top: '5%', left: '50%', width: '56px', height: '56px', transform: 'translateX(-50%)' } },
    { id: 'mask', icon: '😷', label: 'Mask', style: { top: '9.65%', left: '81.67%', width: '56px', height: '56px' } },
    { id: 'amulet', icon: '📿', label: 'Amulet', style: { top: '7%', left: '33.58%', width: '56px', height: '56px' } },
    
    { id: 'torso', icon: '👕', label: 'Torso', style: { top: '20.83%', left: '44.13%', width: '99.7px', height: '118.7px' } },
    { id: 'hood', icon: '🧥', label: 'Hood', style: { top: '26.29%', left: '80.37%', width: '78.95px', height: '108.05px' } },
    { id: 'legs', icon: '👖', label: 'Legs', style: { top: '61.03%', left: '45.21%', width: '83.91px', height: '89.8px' } },

    // Left Side
    { id: 'weapon', icon: '⚔️', label: 'Main Hand', style: { top: '23.86%', left: '32.52%', width: '72.08px', height: '116.59px' } },
    { id: 'ring1', icon: '💍', label: 'Ring', style: { top: '57.7%', left: '34.03%', width: '56px', height: '56px' } },
    { id: 'gloves', icon: '🧤', label: 'Gloves', style: { top: '77.85%', left: '34.62%', width: '56px', height: '56px' } },
    { id: 'boots', icon: '👢', label: 'Boots', style: { top: '76.94%', left: '58.91%', width: '66.13px', height: '63.78px' } },

    // Right Side
    { id: 'focus', icon: '🔮', label: 'Off Hand', style: { top: '24.22%', left: '58.71%', width: '76.56px', height: '119.58px' } },
    { id: 'ring2', icon: '💍', label: 'Ring', style: { top: '58.61%', left: '59.6%', width: '56px', height: '56px' } },
    { id: 'shoulder', icon: '🛡️', label: 'Shoulder', style: { top: '7%', left: '59.98%', width: '56px', height: '56px' } },
    { id: 'mount', icon: '🐎', label: 'Mount', style: { top: '73.73%', left: '80.89%', width: '80.38px', height: '85.92px' } },
];

export const InventoryModal: React.FC<InventoryModalProps> = ({
    isOpen, onClose, config, inventory, equipmentSlots, onEquip, onInventoryChange, onEquipItem, onUnequipItem, coins,
    onUpdateSlotLayouts, slotLayouts
}) => {
    const [activeTab, setActiveTab] = useState('INVENTORY');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [draggingSlot, setDraggingSlot] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizingSlot, setResizingSlot] = useState<string | null>(null);
    const [showLayoutModal, setShowLayoutModal] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<ItemData | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    if (!isOpen) return null;

    const stats = getStats(config, equipmentSlots);
    const hotbarItems = inventory.slice(0, 8);
    const mainInventoryItems = inventory.slice(8, 58); // Show first 50 main slots (increased from 40)

    // --- Handlers ---

    const handleDragStart = (e: React.DragEvent, index: number, item: InventoryItem, isHotbar: boolean) => {
        const actualIndex = isHotbar ? index : index + 8;
        setDraggedIndex(actualIndex);
        setDraggedItem(item);
        e.dataTransfer.setData('text/plain', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetDisplayIndex: number, isHotbar: boolean) => {
        e.preventDefault();
        const targetIndex = isHotbar ? targetDisplayIndex : targetDisplayIndex + 8;
        
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        const newInv = [...inventory];
        // Swap logic
        const temp = newInv[draggedIndex];
        newInv[draggedIndex] = newInv[targetIndex];
        newInv[targetIndex] = temp;

        onInventoryChange(newInv);
        setDraggedIndex(null);
        setDraggedItem(null);
    };

    const handleDropOnEquip = (e: React.DragEvent, slotId: string) => {
        e.preventDefault();
        if (isEditMode) return;
        if (!draggedItem) return;

        const validSlot = ITEM_TO_SLOT_MAP[draggedItem.name];
        // In a real app, map specific item types to slots. Here we simplify.
        if (validSlot === slotId || true) { 
            onEquipItem(draggedItem.name, slotId);
            // Remove from inventory if equipped
            if (draggedIndex !== null) {
                const newInv = [...inventory];
                if (newInv[draggedIndex]) {
                    newInv[draggedIndex]!.count--;
                    if (newInv[draggedIndex]!.count <= 0) newInv[draggedIndex] = null;
                }
                onInventoryChange(newInv);
            }
        }
        setDraggedIndex(null);
        setDraggedItem(null);
    };

    const handleSlotDragStart = (e: React.MouseEvent, slotId: string) => {
        if (!isEditMode) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDraggingSlot(slotId);
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        e.stopPropagation();
    };

    const handleSlotDrag = (e: React.MouseEvent) => {
        if (!isEditMode || !onUpdateSlotLayouts) return;
        const container = (e.currentTarget as HTMLElement).getBoundingClientRect();

        if (draggingSlot) {
            const x = ((e.clientX - container.left - dragOffset.x) / container.width) * 100;
            const y = ((e.clientY - container.top - dragOffset.y) / container.height) * 100;

            const newLayouts = {
                ...(slotLayouts || {}),
                [draggingSlot]: {
                    ...(slotLayouts?.[draggingSlot] || {}),
                    top: `${Math.max(0, Math.min(90, y))}%`,
                    left: `${Math.max(0, Math.min(90, x))}%`,
                    transform: 'none'
                }
            };
            onUpdateSlotLayouts(newLayouts);
        } else if (resizingSlot) {
            const slotRect = document.getElementById(`slot-${resizingSlot}`)?.getBoundingClientRect();
            if (slotRect) {
                const newWidth = Math.max(30, e.clientX - slotRect.left);
                const newHeight = Math.max(30, e.clientY - slotRect.top);
                
                const newLayouts = {
                    ...(slotLayouts || {}),
                    [resizingSlot]: {
                        ...(slotLayouts?.[resizingSlot] || {}),
                        width: `${newWidth}px`,
                        height: `${newHeight}px`
                    }
                };
                onUpdateSlotLayouts(newLayouts);
            }
        }
    };

    const handleSlotDragEnd = () => {
        setDraggingSlot(null);
        setResizingSlot(null);
    };

    const handleSlotDoubleClick = (slotId: string) => {
        if (!isEditMode) return;
        setResizingSlot(resizingSlot === slotId ? null : slotId);
    };

    const handleMouseEnter = (e: React.MouseEvent, itemName: string) => {
        if (isEditMode) return;
        const data = ITEM_DATA[itemName];
        if (data) {
            setHoveredItem(data);
            setMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (hoveredItem) {
            setMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseLeave = () => {
        setHoveredItem(null);
    };

    const handleResizeHandleMouseDown = (e: React.MouseEvent, slotId: string) => {
        e.stopPropagation();
        setResizingSlot(slotId);
    };

    const toggleEditMode = () => {
        if (isEditMode) {
            setShowLayoutModal(true);
        }
        setIsEditMode(!isEditMode);
    };

    // --- Render Helpers ---

    const renderGridSlot = (item: InventoryItem | null, index: number, isHotbar: boolean) => {
        const itemImage = item ? ITEM_IMAGES[item.name] : null;
        
        return (
            <div
                key={isHotbar ? `hb-${index}` : `inv-${index}`}
                draggable={!!item}
                onDragStart={(e) => item && handleDragStart(e, index, item, isHotbar)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, index, isHotbar)}
                onMouseEnter={(e) => item && handleMouseEnter(e, item.name)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className={`
                    relative flex items-center justify-center border transition-all cursor-pointer select-none overflow-hidden
                    ${isHotbar ? 'w-12 h-12' : 'aspect-square'}
                    ${item 
                        ? 'bg-stone-900 border-amber-900/60 hover:border-amber-500 shadow-inner' 
                        : 'bg-black/60 border-stone-800 border-opacity-50 hover:bg-stone-900/50'}
                `}
            >
                {item && (
                    <>
                        {itemImage ? (
                            <img src={itemImage} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl drop-shadow-md filter">{ITEM_ICONS[item.name] || '📦'}</span>
                        )}
                        {item.count > 1 && (
                            <span className="absolute top-0.5 left-0.5 text-[9px] font-bold text-white bg-black/80 px-1 rounded border border-stone-600 z-10">
                                {item.count}
                            </span>
                        )}
                    </>
                )}
                {isHotbar && <span className="absolute bottom-0.5 right-1 text-[8px] text-stone-500 font-mono z-10">{index + 1}</span>}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 pt-20">
            
            {/* Main Window Frame */}
            <div className="w-[850px] h-[90vh] bg-[#0c0a09] border-2 border-[#4a3b2a] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col font-serif">
                
                {/* Decorative Corners */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-600/50" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-600/50" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-600/50" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-600/50" />

                {/* --- Header --- */}
                <div className="h-14 bg-gradient-to-b from-[#1c1917] to-[#0c0a09] border-b border-[#4a3b2a] flex items-center justify-between px-6 shrink-0 relative">
                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />
                    
                    <h2 className="text-2xl text-amber-500 font-serif tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] pr-64">
                        INVENTORY
                    </h2>

                    {/* Right-aligned Tabs */}
                    <div className="flex gap-1 absolute right-4 top-4">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    px-3 py-1 text-[10px] font-bold tracking-wider transition-colors border border-b-0 rounded-t
                                    ${activeTab === tab 
                                        ? 'bg-[#0c0a09] text-amber-500 border-[#4a3b2a] -mb-[1px] pb-2' 
                                        : 'bg-[#1c1917] text-stone-600 border-transparent hover:text-stone-400 hover:bg-stone-900'}
                                `}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    
                    {/* Close Button */}
                    <button onClick={onClose} className="absolute top-2 right-2 text-stone-600 hover:text-amber-500 transition-colors z-10">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* --- Main Content Area --- */}
                <div className="flex-1 flex flex-col p-1 overflow-hidden">
                    
                    {/* Top Section: Equipment & Paper Doll */}
                    <div 
                        className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1c1917] to-[#0c0a09] border border-[#292524] m-1 mb-0 shadow-inner overflow-hidden min-h-[400px]"
                        onMouseMove={handleSlotDrag}
                        onMouseUp={handleSlotDragEnd}
                        onMouseLeave={handleSlotDragEnd}
                    >
                        
                        {/* Background Stats Panel (Left) */}
                        <div className="absolute top-4 left-4 z-10 w-32 bg-black/40 backdrop-blur-sm border border-stone-800 p-3 rounded text-stone-400 text-xs font-mono">
                            <div className="text-amber-700/80 font-bold mb-2 uppercase tracking-wider text-[10px]">Attributes</div>
                            <div className="flex justify-between mb-1"><span>STR</span><span className="text-white">{stats.STR}</span></div>
                            <div className="flex justify-between mb-1"><span>DEX</span><span className="text-white">{stats.DEX}</span></div>
                            <div className="flex justify-between mb-1"><span>INT</span><span className="text-white">{stats.INT}</span></div>
                            <div className="h-[1px] bg-stone-800 my-2" />
                            <div className="flex justify-between mb-1"><span>ATK</span><span className="text-red-400">{stats.ATK}</span></div>
                            <div className="flex justify-between"><span>DEF</span><span className="text-blue-400">{stats.DEF}</span></div>
                            
                            {/* {onUpdateSlotLayouts && (
                                <button 
                                    onClick={toggleEditMode}
                                    className={`mt-4 w-full py-1 text-[10px] font-bold border transition-colors ${isEditMode ? 'bg-amber-600 border-amber-400 text-white' : 'bg-stone-800 border-stone-600 text-stone-400 hover:text-amber-500'}`}
                                >
                                    {isEditMode ? '🔒 LOCK SLOTS' : '🔓 UNLOCK SLOTS'}
                                </button>
                            )} */}
                            {isEditMode && (
                                <button 
                                    onClick={() => onUpdateSlotLayouts({})}
                                    className="mt-1 w-full py-1 text-[10px] font-bold bg-red-900/40 border border-red-800/60 text-red-400 hover:bg-red-800/60 transition-colors"
                                >
                                    RESET
                                </button>
                            )}
                        </div>

                        {/* Central Paper Doll Visual */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-80 pointer-events-none grayscale sepia-[0.2]">
                             <div className="scale-125 transform translate-y-4">
                                <PlayerPreview config={config} />
                             </div>
                        </div>

                        {/* Equipment Slots */}
                        {EQUIPMENT_SLOTS.map((slot) => {
                            const equippedId = equipmentSlots[slot.id];
                            const isEquipped = !!equippedId;
                            const customStyle = slotLayouts?.[slot.id] || slot.style;
                            const equippedImage = equippedId ? ITEM_IMAGES[equippedId] : null;
                            
                            // Size classes
                            let sizeClass = 'w-14 h-14'; // default
                            if ((slot as any).size === 'sm') sizeClass = 'w-10 h-10';
                            if ((slot as any).size === 'lg') sizeClass = 'w-14 h-20';
                            if ((slot as any).size === 'xl') sizeClass = 'w-16 h-32';

                            return (
                                <div
                                    id={`slot-${slot.id}`}
                                    key={slot.id}
                                    style={customStyle}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDropOnEquip(e, slot.id)}
                                    onMouseDown={(e) => handleSlotDragStart(e, slot.id)}
                                    onMouseEnter={(e) => isEquipped && handleMouseEnter(e, equippedId)}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                    onDoubleClick={() => handleSlotDoubleClick(slot.id)}
                                    onClick={() => !isEditMode && equippedId ? onUnequipItem(slot.id) : null}
                                    className={`
                                        absolute ${customStyle.width ? '' : sizeClass}
                                        flex items-center justify-center
                                        bg-black/60 border transition-colors group overflow-hidden
                                        ${isEditMode ? 'cursor-move border-amber-500/50 bg-amber-900/20 z-30' : 'cursor-pointer'}
                                        ${isEquipped 
                                            ? 'border-amber-700/80 shadow-[0_0_10px_rgba(180,83,9,0.2)] bg-stone-900' 
                                            : 'border-stone-800 border-dashed hover:border-amber-900/50'}
                                    `}
                                >
                                    {isEquipped ? (
                                        equippedImage ? (
                                            <img src={equippedImage} alt={equippedId} className={`w-full h-full object-cover ${isEditMode ? 'opacity-50' : ''}`} />
                                        ) : (
                                            <span className={`text-2xl drop-shadow-lg filter contrast-125 ${isEditMode ? 'opacity-50' : ''}`}>
                                                {ITEM_ICONS[equippedId] || '⚔️'}
                                            </span>
                                        )
                                    ) : (
                                        <span className={`text-2xl opacity-20 grayscale ${isEditMode ? 'opacity-40' : ''}`}>{slot.icon}</span>
                                    )}
                                    {isEditMode && (
                                        <>
                                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-amber-500 rounded-full z-10" />
                                            {resizingSlot === slot.id && (
                                                <div 
                                                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 cursor-nwse-resize z-40 rounded-sm hover:scale-125 transition-transform"
                                                    onMouseDown={(e) => handleResizeHandleMouseDown(e, slot.id)}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Middle Section: "Belt" / Hotbar */}
                    <div className="h-16 bg-[#151413] border-x border-[#292524] flex items-center justify-center gap-2 px-4 relative z-20 shrink-0">
                         {/* Visual Separator */}
                         <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#4a3b2a] to-transparent" />
                         
                         {hotbarItems.map((item, i) => renderGridSlot(item, i, true))}
                         
                         <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#4a3b2a] to-transparent" />
                    </div>

                    {/* Bottom Section: Main Inventory Grid */}
                    <div className="bg-[#0f0e0d] p-4 flex-1 border border-[#292524] m-1 mt-0 relative overflow-y-auto custom-scrollbar shadow-inner">
                        {activeTab === 'INVENTORY' ? (
                            <div className="grid grid-cols-10 gap-1 place-content-start h-full">
                                {mainInventoryItems.map((item, i) => renderGridSlot(item, i, false))}
                                {Array.from({ length: 50 - mainInventoryItems.length }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square bg-black/20 border border-stone-800/30 border-dashed rounded-sm" />
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-stone-600 italic">
                                Nothing in {activeTab.toLowerCase()}...
                            </div>
                        )}
                    </div>

                    {/* Footer / Gold Display */}
                    <div className="h-10 bg-[#1c1917] border-t border-[#4a3b2a] flex items-center justify-between px-4 shrink-0">
                        <span className="text-[10px] text-stone-500">Right-click to Equip • Drag to Move</span>
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-stone-800">
                            <span className="text-amber-400 drop-shadow-md">🪙</span>
                            <span className="text-amber-100 font-mono text-sm tracking-widest">{coins.toLocaleString()}</span>
                        </div>
                    </div>

                </div>

                <ItemTooltip 
                    item={hoveredItem} 
                    x={mousePos.x} 
                    y={mousePos.y} 
                    visible={!!hoveredItem} 
                />

                {/* --- Layout Modal --- */}
                {showLayoutModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
                        <div className="w-[500px] bg-stone-900 border-2 border-amber-900/50 p-6 shadow-2xl font-serif">
                            <h3 className="text-xl text-amber-500 mb-4 tracking-widest text-center border-b border-amber-900/30 pb-2">FULL SLOT CONFIGURATION</h3>
                            <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {EQUIPMENT_SLOTS.map(slot => {
                                    const layout = slotLayouts?.[slot.id];
                                    const posStr = layout 
                                        ? `L: ${layout.left}, T: ${layout.top}` 
                                        : `L: ${slot.style.left}, T: ${slot.style.top}`;
                                    const sizeStr = layout?.width 
                                        ? `${layout.width} x ${layout.height}` 
                                        : (slot as any).size === 'sm' ? '40px x 40px' : 
                                          (slot as any).size === 'lg' ? '56px x 80px' :
                                          (slot as any).size === 'xl' ? '64px x 128px' : '56px x 56px';

                                    return (
                                        <div key={slot.id} className="flex justify-between items-center text-[11px] border-b border-stone-800/50 py-1.5 hover:bg-stone-800/30 px-2 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-amber-700/60 w-4 text-center">{slot.icon}</span>
                                                <span className="text-stone-200 font-bold w-20">{slot.label}</span>
                                            </div>
                                            <div className="flex gap-4 font-mono">
                                                <span className="text-stone-400">{posStr}</span>
                                                <span className="text-amber-500/80 w-24 text-right">{sizeStr}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <button 
                                onClick={() => setShowLayoutModal(false)}
                                className="mt-6 w-full py-2 bg-amber-900/40 border border-amber-700/50 text-amber-400 hover:bg-amber-800/60 transition-colors uppercase tracking-widest text-sm"
                            >
                                Close & Save
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
