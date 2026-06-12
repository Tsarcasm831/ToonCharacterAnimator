import { create } from 'zustand';
import type { InventoryItem, PlayerConfig } from '../../types';
import { DEFAULT_CONFIG } from '../../types';
import {
  CONTAINERS,
  INITIAL_TIME_OF_DAY,
  SPAWN_CAMP,
  TIME_SPEED,
  TOWN_RESPAWN,
  terrainHeightAt,
} from '../data/worldLayout';
import { HP_PER_LEVEL, RPG_CLASSES, XP_PER_WOLF, levelDamageBonus, xpToNext } from '../data/classes';
import { getItemDef, getMaxStack, getBuyPrice, getSellPrice, getItemIcon } from '../data/items';
import { getNpcDef } from '../data/npcs';
import type {
  ContainerState,
  DialogueChoice,
  EquipSlotId,
  InteractionPrompt,
  RPGCharacter,
  RPGPhase,
  RPGProgress,
  RPGSaveData,
  RPGToast,
  RPGUIPanel,
} from '../types';
import { INVENTORY_SIZE, RPG_SAVE_VERSION } from '../types';

// ============================================================================
// The single shared state between the three.js engine (RPGGame reads via
// useRPGStore.getState()/subscribe) and the React UI (hook selectors).
// All gameplay mutations live here so saving is one snapshot.
// ============================================================================

/** Equipment-flag keys any RPG item may toggle; cleared before re-applying. */
const MANAGED_EQUIPMENT_FLAGS = [
  'leatherArmor',
  'plateMail',
  'leatherPants',
  'helm',
  'hood',
  'shield',
] as const;

let toastCounter = 1;

function emptyInventory(): (InventoryItem | null)[] {
  return new Array(INVENTORY_SIZE).fill(null);
}

function emptyEquipment(): Record<EquipSlotId, string | null> {
  return { weapon: null, offhand: null, head: null, torso: null, legs: null, feet: null };
}

function initialContainers(): Record<string, ContainerState> {
  const out: Record<string, ContainerState> = {};
  for (const def of CONTAINERS) {
    out[def.id] = {
      looted: false,
      items:
        def.mode === 'storage'
          ? new Array(def.capacity ?? 24).fill(null)
          : (def.loot ?? []).map((l) => ({ name: l.name, count: l.count })),
      gold: def.lootGold ?? 0,
    };
  }
  return out;
}

function defaultProgress(maxHp: number, gold: number): RPGProgress {
  return {
    level: 1,
    xp: 0,
    xpToNext: xpToNext(1),
    gold,
    hp: maxHp,
    maxHp,
    kills: 0,
    deaths: 0,
    playTimeSec: 0,
  };
}

/** Pure inventory add. Returns leftover count that did not fit. */
function addToSlots(
  slots: (InventoryItem | null)[],
  name: string,
  count: number,
): { slots: (InventoryItem | null)[]; leftover: number } {
  const next = slots.slice();
  const maxStack = getMaxStack(name);
  let remaining = count;
  for (let i = 0; i < next.length && remaining > 0; i++) {
    const it = next[i];
    if (it && it.name === name && it.count < maxStack) {
      const take = Math.min(maxStack - it.count, remaining);
      next[i] = { name, count: it.count + take };
      remaining -= take;
    }
  }
  for (let i = 0; i < next.length && remaining > 0; i++) {
    if (!next[i]) {
      const take = Math.min(maxStack, remaining);
      next[i] = { name, count: take };
      remaining -= take;
    }
  }
  return { slots: next, leftover: remaining };
}

function countItem(slots: (InventoryItem | null)[], name: string): number {
  return slots.reduce((sum, it) => (it && it.name === name ? sum + it.count : sum), 0);
}

export interface RPGStoreState {
  phase: RPGPhase;
  character: RPGCharacter | null;
  progress: RPGProgress;
  inventory: (InventoryItem | null)[];
  equipment: Record<EquipSlotId, string | null>;
  containers: Record<string, ContainerState>;
  flags: Record<string, boolean>;
  timeOfDay: number;
  /** Last known player world position (for saves). */
  playerPosition: [number, number, number] | null;
  respawnAtTown: boolean;

  // UI
  activePanel: RPGUIPanel;
  dialogueNpcId: string | null;
  dialogueNodeId: string | null;
  tradeNpcId: string | null;
  containerId: string | null;
  interaction: InteractionPrompt;
  toasts: RPGToast[];
  /** Monotonic counter; engine flashes the damage vignette when it changes. */
  damageEventSeq: number;
  /** Bumped whenever character.config (appearance/equipment) changes. */
  configRevision: number;
  /** Bumped whenever `inventory` changes from the React/store side. */
  inventoryRevision: number;
  lastSavedAt: number | null;
  saveFileLinked: boolean;

  // -- lifecycle ------------------------------------------------------------
  setPhase: (phase: RPGPhase) => void;
  beginCreation: () => void;
  startNewGame: (name: string, classId: keyof typeof RPG_CLASSES, config: PlayerConfig) => void;
  hydrate: (save: RPGSaveData) => void;
  buildSave: () => RPGSaveData | null;
  markSaved: (when: number) => void;
  setSaveFileLinked: (linked: boolean) => void;

  // -- engine sync ------------------------------------------------------------
  setInventoryFromEngine: (items: (InventoryItem | null)[]) => void;
  setPlayerPosition: (x: number, y: number, z: number) => void;
  setTimeOfDay: (t: number) => void;
  tickPlaytime: (sec: number) => void;
  setInteraction: (label: string | null, progress?: number | null) => void;

  // -- combat / vitals -----------------------------------------------------------
  damagePlayer: (amount: number, source?: string) => void;
  healPlayer: (amount: number) => void;
  registerWolfKill: () => void;
  respawn: () => void;
  /** Total flat damage bonus (class + level + weapon). Engine feeds this to wolves. */
  getDamageBonus: () => number;
  getDefense: () => number;

  // -- inventory / equipment ---------------------------------------------------------
  addItem: (name: string, count?: number, opts?: { silent?: boolean }) => number;
  removeItemAt: (index: number, count?: number) => void;
  moveItem: (from: number, to: number) => void;
  useItemAt: (index: number) => void;
  equipItemAt: (index: number) => void;
  unequipSlot: (slot: EquipSlotId) => void;

  // -- economy ----------------------------------------------------------------------
  addGold: (amount: number, opts?: { silent?: boolean }) => void;
  buyItem: (itemName: string) => void;
  sellItemAt: (index: number, count?: number) => void;

  // -- dialogue / panels ---------------------------------------------------------------
  openPanel: (panel: RPGUIPanel) => void;
  closePanel: () => void;
  openDialogue: (npcId: string) => void;
  chooseDialogue: (choice: DialogueChoice) => void;
  openTradeWith: (npcId: string) => void;

  // -- containers -------------------------------------------------------------------------
  openContainer: (id: string) => void;
  takeContainerItem: (slotIndex: number) => void;
  takeAllFromContainer: () => void;
  depositToContainer: (invIndex: number) => void;

  // -- toasts ------------------------------------------------------------------------------
  pushToast: (text: string, tone?: RPGToast['tone'], icon?: string) => void;
  dismissToast: (id: number) => void;
}

export const useRPGStore = create<RPGStoreState>((set, get) => {
  /** Recompute config.equipment flags + selectedItem + maxHp from equipment. */
  const applyEquipmentEffects = (state: Pick<RPGStoreState, 'character' | 'equipment' | 'progress'>) => {
    const { character, equipment, progress } = state;
    if (!character) return {};
    const cls = RPG_CLASSES[character.classId];
    const config = { ...character.config };
    const equipFlags = { ...config.equipment };
    for (const flag of MANAGED_EQUIPMENT_FLAGS) (equipFlags as any)[flag] = false;
    let heldItem: string | null = null;
    let bonusHp = 0;
    for (const slot of Object.keys(equipment) as EquipSlotId[]) {
      const itemName = equipment[slot];
      if (!itemName) continue;
      const def = getItemDef(itemName);
      if (!def?.equip) continue;
      for (const flag of def.equip.equipmentFlags ?? []) (equipFlags as any)[flag] = true;
      if (def.equip.heldItem && slot === 'weapon') heldItem = def.equip.heldItem;
      bonusHp += def.equip.bonus?.maxHp ?? 0;
    }
    config.equipment = equipFlags;
    config.selectedItem = heldItem;
    const maxHp = cls.baseMaxHp + (progress.level - 1) * HP_PER_LEVEL + bonusHp;
    return {
      character: { ...character, config },
      progress: { ...progress, maxHp, hp: Math.min(progress.hp, maxHp) },
      configRevision: get().configRevision + 1,
    };
  };

  return {
    phase: 'boot',
    character: null,
    progress: defaultProgress(100, 0),
    inventory: emptyInventory(),
    equipment: emptyEquipment(),
    containers: initialContainers(),
    flags: {},
    timeOfDay: INITIAL_TIME_OF_DAY,
    playerPosition: null,
    respawnAtTown: false,

    activePanel: 'none',
    dialogueNpcId: null,
    dialogueNodeId: null,
    tradeNpcId: null,
    containerId: null,
    interaction: { label: null, progress: null },
    toasts: [],
    damageEventSeq: 0,
    configRevision: 0,
    inventoryRevision: 0,
    lastSavedAt: null,
    saveFileLinked: false,

    setPhase: (phase) => set({ phase }),
    beginCreation: () => set({ phase: 'creation' }),

    startNewGame: (name, classId, config) => {
      const cls = RPG_CLASSES[classId];
      let slots = emptyInventory();
      for (const it of cls.startingItems) {
        slots = addToSlots(slots, it.name, it.count).slots;
      }
      const equipment = emptyEquipment();
      for (const itemName of cls.startingEquipped) {
        const def = getItemDef(itemName);
        if (!def?.equip) continue;
        // remove one from inventory, place in slot
        const idx = slots.findIndex((s) => s?.name === itemName);
        if (idx >= 0) {
          const it = slots[idx]!;
          slots[idx] = it.count > 1 ? { ...it, count: it.count - 1 } : null;
          equipment[def.equip.slot] = itemName;
        }
      }
      const character: RPGCharacter = {
        name,
        classId,
        config: {
          ...DEFAULT_CONFIG,
          ...config,
          ...cls.configOverrides,
          equipment: { ...DEFAULT_CONFIG.equipment, ...config.equipment },
          // Never inherit creator world-state pollution.
          timeOfDay: INITIAL_TIME_OF_DAY,
          timeSpeed: TIME_SPEED,
          isAutoTime: true,
          showNPC: true,
        },
      };
      const base = {
        character,
        equipment,
        inventory: slots,
        progress: defaultProgress(cls.baseMaxHp, cls.startingGold),
        containers: initialContainers(),
        flags: {},
        timeOfDay: INITIAL_TIME_OF_DAY,
        playerPosition: null,
        respawnAtTown: false,
        phase: 'playing' as RPGPhase,
        inventoryRevision: get().inventoryRevision + 1,
      };
      set({ ...base, ...applyEquipmentEffects(base as any) });
    },

    hydrate: (save) => {
      const character: RPGCharacter = {
        ...save.character,
        config: {
          ...DEFAULT_CONFIG,
          ...save.character.config,
          equipment: { ...DEFAULT_CONFIG.equipment, ...save.character.config.equipment },
          timeSpeed: TIME_SPEED,
          isAutoTime: true,
          showNPC: true,
        },
      };
      const containers = initialContainers();
      for (const [id, st] of Object.entries(save.containers ?? {})) {
        if (containers[id]) containers[id] = st;
      }
      // A quicksave can land while dead (hp 0); loading it revives at the
      // respawn cost having already been paid.
      const progress = { ...save.progress };
      if (progress.hp <= 0) progress.hp = progress.maxHp;
      const base = {
        character,
        progress,
        inventory: save.inventory.slice(0, INVENTORY_SIZE),
        equipment: { ...emptyEquipment(), ...save.equipment },
        containers,
        flags: { ...save.flags },
        timeOfDay: save.world?.timeOfDay ?? INITIAL_TIME_OF_DAY,
        playerPosition: save.position ?? null,
        phase: 'playing' as RPGPhase,
        inventoryRevision: get().inventoryRevision + 1,
      };
      while (base.inventory.length < INVENTORY_SIZE) base.inventory.push(null);
      set({ ...base, ...applyEquipmentEffects(base as any) });
    },

    buildSave: () => {
      const s = get();
      if (!s.character) return null;
      return {
        version: RPG_SAVE_VERSION,
        savedAt: Date.now(),
        character: s.character,
        progress: s.progress,
        inventory: s.inventory,
        equipment: s.equipment,
        containers: s.containers,
        flags: s.flags,
        world: { timeOfDay: s.timeOfDay },
        position: s.playerPosition,
      };
    },

    markSaved: (when) => set({ lastSavedAt: when }),
    setSaveFileLinked: (linked) => set({ saveFileLinked: linked }),

    setInventoryFromEngine: (items) => {
      const next = items.slice(0, INVENTORY_SIZE);
      while (next.length < INVENTORY_SIZE) next.push(null);
      // No revision bump: this is the engine->store direction.
      set({ inventory: next });
    },
    setPlayerPosition: (x, y, z) => set({ playerPosition: [x, y, z] }),
    setTimeOfDay: (t) => set({ timeOfDay: t }),
    tickPlaytime: (sec) =>
      set((s) => ({ progress: { ...s.progress, playTimeSec: s.progress.playTimeSec + sec } })),
    setInteraction: (label, progress = null) => {
      const cur = get().interaction;
      if (cur.label === label && cur.progress === progress) return;
      set({ interaction: { label, progress } });
    },

    damagePlayer: (amount, source) => {
      const s = get();
      if (s.phase !== 'playing') return;
      const reduced = Math.max(2, Math.round(amount - s.getDefense()));
      const hp = Math.max(0, s.progress.hp - reduced);
      const dead = hp <= 0;
      set({
        progress: { ...s.progress, hp, deaths: s.progress.deaths + (dead ? 1 : 0) },
        damageEventSeq: s.damageEventSeq + 1,
        ...(dead ? { phase: 'dead' as RPGPhase, activePanel: 'none' as RPGUIPanel } : {}),
      });
      if (dead && source) get().pushToast(`Slain by ${source}`, 'danger', '💀');
    },

    healPlayer: (amount) =>
      set((s) => ({
        progress: { ...s.progress, hp: Math.min(s.progress.maxHp, s.progress.hp + amount) },
      })),

    registerWolfKill: () => {
      const s = get();
      let { xp, level, xpToNext: next, maxHp, hp } = s.progress;
      xp += XP_PER_WOLF;
      let leveled = false;
      while (xp >= next) {
        xp -= next;
        level += 1;
        next = xpToNext(level);
        maxHp += HP_PER_LEVEL;
        hp = maxHp;
        leveled = true;
      }
      set({
        progress: { ...s.progress, xp, level, xpToNext: next, maxHp, hp, kills: s.progress.kills + 1 },
      });
      get().pushToast(`+${XP_PER_WOLF} XP`, 'info', '⚔️');
      if (leveled) get().pushToast(`Level ${level}! Max HP +${HP_PER_LEVEL}`, 'success', '✨');
    },

    respawn: () => {
      const s = get();
      if (!s.character) return;
      const goldLoss = Math.floor(s.progress.gold * 0.1);
      const at = s.respawnAtTown ? TOWN_RESPAWN : SPAWN_CAMP;
      set({
        phase: 'playing',
        progress: { ...s.progress, hp: s.progress.maxHp, gold: s.progress.gold - goldLoss },
        playerPosition: [at[0], terrainHeightAt(at[0], at[1]), at[1]],
      });
      if (goldLoss > 0) get().pushToast(`Lost ${goldLoss} gold`, 'danger', '🪙');
    },

    getDamageBonus: () => {
      const s = get();
      if (!s.character) return 0;
      const cls = RPG_CLASSES[s.character.classId];
      let bonus = cls.classDamageBonus + levelDamageBonus(s.progress.level);
      for (const itemName of Object.values(s.equipment)) {
        if (!itemName) continue;
        bonus += getItemDef(itemName)?.equip?.bonus?.damage ?? 0;
      }
      return bonus;
    },

    getDefense: () => {
      const s = get();
      let def = 0;
      for (const itemName of Object.values(s.equipment)) {
        if (!itemName) continue;
        def += getItemDef(itemName)?.equip?.bonus?.defense ?? 0;
      }
      return def;
    },

    addItem: (name, count = 1, opts) => {
      const { slots, leftover } = addToSlots(get().inventory, name, count);
      set((s) => ({ inventory: slots, inventoryRevision: s.inventoryRevision + 1 }));
      const added = count - leftover;
      if (added > 0 && !opts?.silent) {
        const icon = getItemIcon(name);
        get().pushToast(`+${added} ${name}`, 'loot', icon.emoji);
      }
      if (leftover > 0) get().pushToast('Inventory full!', 'danger', '🎒');
      return leftover;
    },

    removeItemAt: (index, count = Infinity) => {
      set((s) => {
        const inv = s.inventory.slice();
        const it = inv[index];
        if (!it) return {};
        const take = Math.min(it.count, count);
        inv[index] = it.count - take > 0 ? { ...it, count: it.count - take } : null;
        return { inventory: inv, inventoryRevision: s.inventoryRevision + 1 };
      });
    },

    moveItem: (from, to) => {
      if (from === to) return;
      set((s) => {
        const inv = s.inventory.slice();
        const a = inv[from];
        const b = inv[to];
        if (!a) return {};
        if (b && b.name === a.name) {
          const maxStack = getMaxStack(a.name);
          const take = Math.min(maxStack - b.count, a.count);
          if (take > 0) {
            inv[to] = { ...b, count: b.count + take };
            inv[from] = a.count - take > 0 ? { ...a, count: a.count - take } : null;
          } else {
            inv[from] = b;
            inv[to] = a;
          }
        } else {
          inv[from] = b ?? null;
          inv[to] = a;
        }
        return { inventory: inv, inventoryRevision: s.inventoryRevision + 1 };
      });
    },

    useItemAt: (index) => {
      const s = get();
      const it = s.inventory[index];
      if (!it) return;
      const def = getItemDef(it.name);
      if (def?.consume) {
        if (s.progress.hp >= s.progress.maxHp && def.consume.heal) {
          get().pushToast('Already at full health', 'info', '❤️');
          return;
        }
        if (def.consume.heal) get().healPlayer(def.consume.heal);
        get().removeItemAt(index, 1);
        get().pushToast(`${it.name} — ${def.consume.effectLabel}`, 'success', '🧪');
      } else if (def?.equip) {
        get().equipItemAt(index);
      }
    },

    equipItemAt: (index) => {
      const s = get();
      const it = s.inventory[index];
      if (!it || !s.character) return;
      const def = getItemDef(it.name);
      if (!def?.equip) return;
      const slot = def.equip.slot;
      const inv = s.inventory.slice();
      const previously = s.equipment[slot];
      inv[index] = it.count > 1 ? { ...it, count: it.count - 1 } : null;
      let next = inv;
      if (previously) {
        const res = addToSlots(next, previously, 1);
        if (res.leftover > 0) {
          get().pushToast('No room to unequip current item', 'danger', '🎒');
          return;
        }
        next = res.slots;
      }
      const equipment = { ...s.equipment, [slot]: it.name };
      const base = { character: s.character, equipment, progress: s.progress };
      set({
        inventory: next,
        equipment,
        inventoryRevision: s.inventoryRevision + 1,
        ...applyEquipmentEffects(base),
      });
      get().pushToast(`Equipped ${it.name}`, 'info', '🛡️');
    },

    unequipSlot: (slot) => {
      const s = get();
      const itemName = s.equipment[slot];
      if (!itemName || !s.character) return;
      const res = addToSlots(s.inventory, itemName, 1);
      if (res.leftover > 0) {
        get().pushToast('Inventory full!', 'danger', '🎒');
        return;
      }
      const equipment = { ...s.equipment, [slot]: null };
      const base = { character: s.character, equipment, progress: s.progress };
      set({
        inventory: res.slots,
        equipment,
        inventoryRevision: s.inventoryRevision + 1,
        ...applyEquipmentEffects(base),
      });
    },

    addGold: (amount, opts) => {
      set((s) => ({ progress: { ...s.progress, gold: Math.max(0, s.progress.gold + amount) } }));
      if (amount > 0 && !opts?.silent) get().pushToast(`+${amount} gold`, 'gold', '🪙');
    },

    buyItem: (itemName) => {
      const s = get();
      const price = getBuyPrice(itemName);
      if (s.progress.gold < price) {
        get().pushToast('Not enough gold', 'danger', '🪙');
        return;
      }
      const { slots, leftover } = addToSlots(s.inventory, itemName, 1);
      if (leftover > 0) {
        get().pushToast('Inventory full!', 'danger', '🎒');
        return;
      }
      set((st) => ({
        inventory: slots,
        inventoryRevision: st.inventoryRevision + 1,
        progress: { ...st.progress, gold: st.progress.gold - price },
      }));
      get().pushToast(`Bought ${itemName} (−${price}g)`, 'gold', '🪙');
    },

    sellItemAt: (index, count = 1) => {
      const s = get();
      const it = s.inventory[index];
      if (!it) return;
      const npc = s.tradeNpcId ? getNpcDef(s.tradeNpcId) : undefined;
      const mul = npc?.shop?.buyMultipliers?.[it.name] ?? 1;
      const each = getSellPrice(it.name, mul);
      const sellCount = Math.min(count, it.count);
      const total = each * sellCount;
      get().removeItemAt(index, sellCount);
      set((st) => ({ progress: { ...st.progress, gold: st.progress.gold + total } }));
      get().pushToast(`Sold ${sellCount}× ${it.name} (+${total}g)`, 'gold', '🪙');
    },

    openPanel: (panel) => set({ activePanel: panel }),
    closePanel: () =>
      set({
        activePanel: 'none',
        dialogueNpcId: null,
        dialogueNodeId: null,
        tradeNpcId: null,
        containerId: null,
      }),

    openDialogue: (npcId) => {
      const npc = getNpcDef(npcId);
      if (!npc?.dialogue) return;
      set({ activePanel: 'dialogue', dialogueNpcId: npcId, dialogueNodeId: 'start' });
    },

    chooseDialogue: (choice) => {
      const s = get();
      const npc = s.dialogueNpcId ? getNpcDef(s.dialogueNpcId) : undefined;
      const action = choice.action;
      if (action) {
        switch (action.type) {
          case 'openTrade': {
            if (npc?.shop) set({ activePanel: 'trade', tradeNpcId: npc.id });
            return;
          }
          case 'close':
            get().closePanel();
            return;
          case 'rest': {
            if (s.progress.gold >= action.cost) {
              set((st) => ({
                progress: {
                  ...st.progress,
                  gold: st.progress.gold - action.cost,
                  hp: st.progress.maxHp,
                },
              }));
              get().pushToast('You feel rested. HP restored!', 'success', '🛏️');
              set({ dialogueNodeId: 'rested' });
            } else {
              set({ dialogueNodeId: 'broke' });
            }
            return;
          }
          case 'giveItem': {
            if (!s.flags[action.onceFlag]) {
              get().addItem(action.item, action.count);
              set((st) => ({ flags: { ...st.flags, [action.onceFlag]: true } }));
            }
            break;
          }
          case 'giveGold': {
            if (!s.flags[action.onceFlag]) {
              get().addGold(action.amount);
              set((st) => ({ flags: { ...st.flags, [action.onceFlag]: true } }));
            }
            break;
          }
          case 'setFlag':
            set((st) => ({ flags: { ...st.flags, [action.flag]: true } }));
            break;
        }
      }
      if (choice.next) set({ dialogueNodeId: choice.next });
      else if (!action) get().closePanel();
    },

    openTradeWith: (npcId) => {
      const npc = getNpcDef(npcId);
      if (!npc?.shop) return;
      set({ activePanel: 'trade', tradeNpcId: npcId });
    },

    openContainer: (id) => {
      const state = get().containers[id];
      if (!state) return;
      set({ activePanel: 'container', containerId: id });
    },

    takeContainerItem: (slotIndex) => {
      const s = get();
      const id = s.containerId;
      if (!id) return;
      const c = s.containers[id];
      const it = c?.items[slotIndex];
      if (!it) return;
      const leftover = get().addItem(it.name, it.count);
      const items = c.items.slice();
      items[slotIndex] = leftover > 0 ? { ...it, count: leftover } : null;
      const def = CONTAINERS.find((d) => d.id === id);
      const emptied = items.every((x) => !x);
      set((st) => ({
        containers: {
          ...st.containers,
          [id]: { ...c, items, looted: def?.mode === 'loot' && emptied && c.gold === 0 },
        },
      }));
    },

    takeAllFromContainer: () => {
      const s = get();
      const id = s.containerId;
      if (!id) return;
      const c = s.containers[id];
      if (!c) return;
      let items = c.items.slice();
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it) continue;
        const leftover = get().addItem(it.name, it.count);
        items[i] = leftover > 0 ? { ...it, count: leftover } : null;
        if (leftover > 0) break;
      }
      if (c.gold > 0) get().addGold(c.gold);
      const def = CONTAINERS.find((d) => d.id === id);
      const emptied = items.every((x) => !x);
      set((st) => ({
        containers: {
          ...st.containers,
          [id]: { ...c, items, gold: 0, looted: def?.mode === 'loot' && emptied },
        },
        ...(def?.mode === 'loot' && emptied ? { activePanel: 'none' as RPGUIPanel, containerId: null } : {}),
      }));
    },

    depositToContainer: (invIndex) => {
      const s = get();
      const id = s.containerId;
      if (!id) return;
      const def = CONTAINERS.find((d) => d.id === id);
      if (def?.mode !== 'storage') return;
      const c = s.containers[id];
      const it = s.inventory[invIndex];
      if (!c || !it) return;
      const res = addToSlots(c.items, it.name, it.count);
      if (res.leftover === it.count) {
        get().pushToast('Stash is full', 'danger', '📦');
        return;
      }
      const inv = s.inventory.slice();
      inv[invIndex] = res.leftover > 0 ? { ...it, count: res.leftover } : null;
      set((st) => ({
        inventory: inv,
        inventoryRevision: st.inventoryRevision + 1,
        containers: { ...st.containers, [id]: { ...c, items: res.slots } },
      }));
    },

    pushToast: (text, tone = 'info', icon) => {
      const toast: RPGToast = { id: toastCounter++, text, tone, icon };
      set((s) => ({ toasts: [...s.toasts.slice(-4), toast] }));
      setTimeout(() => get().dismissToast(toast.id), 3500);
    },

    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  };
});

/** Convenience for non-React engine code. */
export const rpgStore = useRPGStore;

export { countItem };
