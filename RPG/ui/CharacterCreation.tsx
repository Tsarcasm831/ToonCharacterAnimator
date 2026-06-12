import React, { useMemo, useState } from 'react';
import type { PlayerConfig } from '../../types';
import { DEFAULT_CONFIG } from '../../types';
import { BODY_PRESETS, OUTFIT_PRESETS } from '../../data/constants';
import { PlayerPreview } from '../../components/ui/previews/PlayerPreview';
import { RandomizationPresets } from '../../standalone_cc/src/utils/RandomizationPresets';
import type { RPGClassId } from '../types';
import { CLASS_LIST } from '../data/classes';
import { ItemSlot } from './common';
import { WORLD_NAME } from '../data/worldLayout';

// ============================================================================
// Full-screen character creation: live 3D preview on the left, a tabbed
// Identity / Appearance / Class panel on the right.
// ============================================================================

export interface CharacterCreationProps {
  onComplete: (name: string, classId: RPGClassId, config: PlayerConfig) => void;
}

type TabId = 'identity' | 'appearance' | 'class';

const TABS: { id: TabId; label: string }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'class', label: 'Class' },
];

const BODY_VARIANTS = ['average', 'muscular', 'slim', 'heavy'] as const;
const VARIANT_LABELS: Record<(typeof BODY_VARIANTS)[number], string> = {
  average: 'Average',
  muscular: 'Muscular',
  slim: 'Slim',
  heavy: 'Heavy',
};

const SKIN_TONES = ['#f6d7b8', '#eec39a', '#e0ac69', '#c68642', '#a0673f', '#8d5524', '#6b4226', '#4a2f1d'];
const HAIR_TONES = ['#1f1a14', '#3a2c1d', '#5a3825', '#7a4a21', '#a56b2c', '#c98a3d', '#8c2f1b', '#b8b8b8'];
const EYE_TONES = ['#3b6ea5', '#2e7d52', '#6b4a2b', '#444', '#7c5cbf', '#9a3b3b'];
const SHIRT_TONES = ['#8d6e63', '#6b3026', '#4a5d3a', '#3d6e8f', '#5d5a7a', '#a33b2e', '#8a7a5c', '#54616e'];
const PANTS_TONES = ['#5d4037', '#37474f', '#3f3a33', '#46618a', '#2e2a26', '#6b4226', '#54483c', '#37312a'];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeInitialConfig(): PlayerConfig {
  return {
    ...DEFAULT_CONFIG,
    ...BODY_PRESETS.average,
    ...OUTFIT_PRESETS.peasant,
    equipment: {
      ...DEFAULT_CONFIG.equipment,
      ...(BODY_PRESETS.average.equipment ?? {}),
      ...(OUTFIT_PRESETS.peasant.equipment ?? {}),
    },
    bodyVariant: 'average',
    skinColor: SKIN_TONES[1],
    hairColor: HAIR_TONES[1],
    eyeColor: EYE_TONES[0],
    shirtColor: SHIRT_TONES[0],
    pantsColor: PANTS_TONES[0],
    hairStyle: 'crew',
    selectedItem: null,
  };
}

const SwatchRow: React.FC<{
  label: string;
  colors: string[];
  value: string;
  onPick: (color: string) => void;
}> = ({ label, colors, value, onPick }) => (
  <div>
    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">{label}</div>
    <div className="flex flex-wrap gap-2.5">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          aria-label={`${label} ${c}`}
          className={`w-8 h-8 rounded-full border border-black/40 transition-all duration-150 hover:scale-110 ${
            value.toLowerCase() === c.toLowerCase()
              ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-110'
              : ''
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  </div>
);

export const CharacterCreation: React.FC<CharacterCreationProps> = ({ onComplete }) => {
  const [tab, setTab] = useState<TabId>('identity');
  const [name, setName] = useState('');
  const [classId, setClassId] = useState<RPGClassId>('warrior');
  const [config, setConfig] = useState<PlayerConfig>(() => makeInitialConfig());

  const patch = (p: Partial<PlayerConfig>) => setConfig((c) => ({ ...c, ...p }));

  const applyVariant = (variant: (typeof BODY_VARIANTS)[number]) => {
    setConfig((c) => ({
      ...c,
      ...BODY_PRESETS[variant],
      equipment: { ...c.equipment, ...(BODY_PRESETS[variant].equipment ?? {}) },
      bodyVariant: variant,
    }));
  };

  const randomize = () => {
    setConfig((c) => {
      // Themed randomizer for proportions/face, then constrained to the
      // medieval palettes so the result always fits the vale.
      const rolled = RandomizationPresets.generateRandomCharacter(
        c as unknown as Parameters<typeof RandomizationPresets.generateRandomCharacter>[0],
        'random',
        { includeBody: true, includeFace: true, includeColors: false, includeOutfit: false },
      ) as unknown as PlayerConfig;
      return {
        ...rolled,
        equipment: { ...c.equipment },
        outfit: c.outfit,
        skinColor: pick(SKIN_TONES),
        hairColor: pick(HAIR_TONES),
        eyeColor: pick(EYE_TONES),
        shirtColor: pick(SHIRT_TONES),
        pantsColor: pick(PANTS_TONES),
        hairStyle: Math.random() < 0.75 ? 'crew' : 'bald',
        selectedItem: null,
      };
    });
  };

  const selectedClass = useMemo(() => CLASS_LIST.find((c) => c.id === classId) ?? CLASS_LIST[0], [classId]);
  const canBegin = name.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-[150] flex"
      style={{
        background: 'radial-gradient(ellipse at center, rgb(15 23 42) 0%, rgb(2 6 23) 70%, rgb(0 0 0) 100%)',
      }}
    >
      {/* Left: live preview */}
      <div className="relative w-1/2 h-full flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(251,191,36,0.05),transparent_60%)]" />
        <div className="absolute top-8 left-8">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em]">{WORLD_NAME}</div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mt-1">Forge Your Hunter</h1>
        </div>
        <div className="w-full h-full max-h-[85vh] flex items-center justify-center">
          <PlayerPreview config={config} />
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
          Drag to rotate · Scroll to zoom
        </div>
      </div>

      {/* Right: tabbed panel */}
      <div className="w-1/2 h-full flex items-center justify-center p-8">
        <div className="w-full max-w-xl h-full max-h-[88vh] bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex gap-1.5 px-6 pt-5 pb-4 border-b border-slate-700/80 shrink-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full text-xs font-black uppercase tracking-widest px-4 py-2 transition-all duration-150 ${
                  tab === t.id
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-900/30'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
            <button
              type="button"
              onClick={randomize}
              className="ml-auto rounded-full text-xs font-black uppercase tracking-widest px-4 py-2 bg-slate-800/70 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 hover:scale-105 transition-all duration-150"
            >
              🎲 Randomize
            </button>
          </div>

          {/* Tab body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-7">
            {tab === 'identity' && (
              <>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Name</div>
                  <input
                    type="text"
                    value={name}
                    maxLength={16}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="What do they call you?"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder:text-slate-600 placeholder:font-medium focus:outline-none focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/20 transition-all duration-150"
                  />
                  <div className="text-slate-600 text-[9px] font-bold uppercase tracking-widest mt-1.5 text-right">
                    {name.length}/16
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Body Type</div>
                  <div className="flex gap-2">
                    {(['male', 'female'] as const).map((bt) => (
                      <button
                        key={bt}
                        type="button"
                        onClick={() => patch({ bodyType: bt })}
                        className={`flex-1 rounded-full text-xs font-black uppercase tracking-widest px-4 py-2 transition-all duration-150 ${
                          config.bodyType === bt
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {bt === 'male' ? 'Male' : 'Female'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Build</div>
                  <div className="grid grid-cols-2 gap-2">
                    {BODY_VARIANTS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => applyVariant(v)}
                        className={`rounded-xl border px-4 py-3 text-left transition-all duration-150 ${
                          config.bodyVariant === v
                            ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        <div className={`text-sm font-black uppercase tracking-tight ${config.bodyVariant === v ? 'text-amber-300' : 'text-white'}`}>
                          {VARIANT_LABELS[v]}
                        </div>
                        <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                          {v === 'average' && 'Balanced frame'}
                          {v === 'muscular' && 'Broad & strong'}
                          {v === 'slim' && 'Light on their feet'}
                          {v === 'heavy' && 'Hard to knock down'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Hair</div>
                  <div className="flex gap-2">
                    {(['bald', 'crew'] as const).map((hs) => (
                      <button
                        key={hs}
                        type="button"
                        onClick={() => patch({ hairStyle: hs })}
                        className={`flex-1 rounded-full text-xs font-black uppercase tracking-widest px-4 py-2 transition-all duration-150 ${
                          config.hairStyle === hs
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {hs === 'bald' ? 'Bald' : 'Crew Cut'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {tab === 'appearance' && (
              <>
                <SwatchRow label="Skin" colors={SKIN_TONES} value={config.skinColor} onPick={(c) => patch({ skinColor: c })} />
                <SwatchRow label="Hair" colors={HAIR_TONES} value={config.hairColor} onPick={(c) => patch({ hairColor: c })} />
                <SwatchRow label="Eyes" colors={EYE_TONES} value={config.eyeColor} onPick={(c) => patch({ eyeColor: c })} />
                <SwatchRow label="Shirt" colors={SHIRT_TONES} value={config.shirtColor} onPick={(c) => patch({ shirtColor: c })} />
                <SwatchRow label="Pants" colors={PANTS_TONES} value={config.pantsColor} onPick={(c) => patch({ pantsColor: c })} />
              </>
            )}

            {tab === 'class' && (
              <div className="space-y-3">
                {CLASS_LIST.map((cls) => {
                  const selected = classId === cls.id;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => setClassId(cls.id)}
                      className={`w-full text-left rounded-2xl border p-5 transition-all duration-150 ${
                        selected
                          ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className={`text-lg font-black uppercase tracking-tight ${selected ? 'text-amber-300' : 'text-white'}`}>
                          {cls.name}
                        </span>
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                          {cls.tagline}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed mt-2">{cls.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="bg-red-950/50 border border-red-500/30 text-red-300 rounded-full px-2.5 py-1 text-[10px] font-black">
                          ❤ {cls.baseMaxHp} HP
                        </span>
                        <span className="bg-slate-950/60 border border-white/10 text-slate-200 rounded-full px-2.5 py-1 text-[10px] font-black">
                          ⚔ +{cls.classDamageBonus} dmg
                        </span>
                        <span className="bg-yellow-950/50 border border-yellow-500/30 text-yellow-300 rounded-full px-2.5 py-1 text-[10px] font-black font-mono">
                          🪙 {cls.startingGold}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mr-1">Gear</span>
                        {cls.startingItems.map((it) => (
                          <ItemSlot key={it.name} item={{ name: it.name, count: it.count }} size="sm" />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="px-6 py-4 border-t border-slate-700/80 shrink-0 flex items-center justify-between gap-4">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              {selectedClass.name} · {name.trim() || 'Unnamed'}
            </div>
            <button
              type="button"
              disabled={!canBegin}
              onClick={() => canBegin && onComplete(name.trim(), classId, config)}
              className={`rounded-full text-sm font-black uppercase tracking-widest px-8 py-3 transition-all duration-150 ${
                canBegin
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 hover:scale-[1.04] shadow-lg shadow-amber-900/40 cursor-pointer'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              Begin Adventure →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
