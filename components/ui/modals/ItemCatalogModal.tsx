import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { ItemData } from '../../../types';
import { ITEM_DATA, ITEM_ICONS, ITEM_IMAGES } from '../../../data/constants';

interface ItemCatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ItemTypeFilter = 'all' | ItemData['type'];

const TYPE_LABELS: Record<ItemTypeFilter, string> = {
    all: 'All',
    weapon: 'Weapons',
    armor: 'Armor',
    consumable: 'Consumables',
    material: 'Materials',
    quest: 'Quest',
    accessory: 'Accessories'
};

const FILTERS = Object.keys(TYPE_LABELS) as ItemTypeFilter[];

const RARITY_CLASS: Record<ItemData['rarity'], string> = {
    common: 'text-slate-300 border-slate-700/70 bg-slate-900/70',
    uncommon: 'text-emerald-300 border-emerald-800/70 bg-emerald-950/30',
    rare: 'text-sky-300 border-sky-800/70 bg-sky-950/30',
    epic: 'text-violet-300 border-violet-800/70 bg-violet-950/30',
    legendary: 'text-amber-300 border-amber-800/70 bg-amber-950/30'
};

const catalogItems = Object.values(ITEM_DATA).sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.name.localeCompare(b.name);
});

export const ItemCatalogModal: React.FC<ItemCatalogModalProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<ItemTypeFilter>('all');

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const visibleItems = useMemo(() => {
        const search = query.trim().toLowerCase();
        return catalogItems.filter((item) => {
            const matchesType = filter === 'all' || item.type === filter;
            const matchesSearch =
                !search ||
                item.name.toLowerCase().includes(search) ||
                item.description.toLowerCase().includes(search);
            return matchesType && matchesSearch;
        });
    }, [filter, query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
            <div className="no-capture flex h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-amber-700/40 bg-[#0d0b09] shadow-2xl shadow-black/60">
                <div className="flex items-center justify-between border-b border-amber-800/40 bg-[#17120d] px-6 py-4">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-[0.18em] text-amber-300">Item Catalog</h2>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                            {visibleItems.length} of {catalogItems.length} entries
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-white/10 p-2 text-stone-400 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Close item catalog"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-col gap-3 border-b border-amber-800/25 bg-black/20 px-6 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:max-w-sm">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search items"
                            className="w-full rounded-lg border border-stone-700 bg-black/50 py-2 pl-9 pr-3 text-sm text-stone-100 outline-none transition-colors placeholder:text-stone-600 focus:border-amber-500"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                        {FILTERS.map((itemType) => (
                            <button
                                key={itemType}
                                type="button"
                                onClick={() => setFilter(itemType)}
                                className={`shrink-0 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                                    filter === itemType
                                        ? 'border-amber-500 bg-amber-500 text-black'
                                        : 'border-stone-700 bg-black/30 text-stone-400 hover:border-stone-500 hover:text-stone-100'
                                }`}
                            >
                                {TYPE_LABELS[itemType]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {visibleItems.map((item) => {
                            const stats = item.stats ? Object.entries(item.stats) : [];
                            const image = ITEM_IMAGES[item.name];
                            return (
                                <article
                                    key={item.name}
                                    className={`rounded-lg border p-4 transition-colors hover:border-amber-600/60 ${RARITY_CLASS[item.rarity]}`}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black/40 text-2xl">
                                            {image ? (
                                                <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
                                            ) : (
                                                <span>{ITEM_ICONS[item.name] ?? '?'}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="truncate text-sm font-black uppercase tracking-wider text-stone-100">{item.name}</h3>
                                                <span className="shrink-0 rounded border border-current/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
                                                    {item.rarity}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                                                {item.type}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-3 min-h-10 text-xs leading-relaxed text-stone-400">{item.description}</p>
                                    {stats.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {stats.map(([stat, value]) => (
                                                <span key={stat} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-bold text-stone-200">
                                                    {stat}: {value}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
