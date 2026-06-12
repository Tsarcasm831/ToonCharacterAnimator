import { useRPGStore } from './rpgStore';
import type { RPGSaveData } from '../types';
import {
  AUTOSAVE_FILE_INTERVAL_MS,
  QUICKSAVE_DEBOUNCE_MS,
  RPG_SAVE_KEY,
  RPG_SAVE_VERSION,
} from '../types';

// ============================================================================
// Persistence. Two tiers:
//  1. localStorage quicksave — debounced after any meaningful change, plus on
//     page hide, so progress is never more than a few seconds stale.
//  2. Save-to-FILE every ~10 minutes — via the File System Access API when the
//     player links a save file (handle persisted in IndexedDB so it survives
//     reloads); manual export/import works everywhere as a fallback.
// ============================================================================

declare global {
  interface Window {
    showSaveFilePicker?: (opts?: any) => Promise<FileSystemFileHandle>;
  }
}

// -- localStorage ------------------------------------------------------------

export function saveToLocalStorage(): boolean {
  const data = useRPGStore.getState().buildSave();
  if (!data) return false;
  try {
    localStorage.setItem(RPG_SAVE_KEY, JSON.stringify(data));
    useRPGStore.getState().markSaved(Date.now());
    return true;
  } catch (e) {
    console.error('[RPG] localStorage save failed', e);
    return false;
  }
}

export function loadFromLocalStorage(): RPGSaveData | null {
  try {
    const raw = localStorage.getItem(RPG_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RPGSaveData;
    if (parsed?.version !== RPG_SAVE_VERSION || !parsed.character) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLocalSave(): void {
  try {
    localStorage.removeItem(RPG_SAVE_KEY);
  } catch {
    /* ignore */
  }
}

// -- IndexedDB persistence for the linked file handle --------------------------

const IDB_NAME = 'tca-rpg';
const IDB_STORE = 'handles';
const HANDLE_KEY = 'saveFile';

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await idbOpen();
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await idbOpen();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* ignore */
  }
}

async function idbDelete(key: string): Promise<void> {
  try {
    const db = await idbOpen();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* ignore */
  }
}

// -- Linked save file ------------------------------------------------------------

let fileHandle: FileSystemFileHandle | null = null;

export function isFileSaveSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function';
}

/** Ask the player to pick/create the save file; remembered across reloads. */
export async function linkSaveFile(): Promise<boolean> {
  if (!isFileSaveSupported()) return false;
  try {
    const name = useRPGStore.getState().character?.name ?? 'hero';
    fileHandle = await window.showSaveFilePicker!({
      suggestedName: `rpg-save-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`,
      types: [{ description: 'RPG Save', accept: { 'application/json': ['.json'] } }],
    });
    await idbSet(HANDLE_KEY, fileHandle);
    useRPGStore.getState().setSaveFileLinked(true);
    await writeToLinkedFile();
    return true;
  } catch {
    return false; // user cancelled
  }
}

export async function unlinkSaveFile(): Promise<void> {
  fileHandle = null;
  await idbDelete(HANDLE_KEY);
  useRPGStore.getState().setSaveFileLinked(false);
}

/** Restore a previously linked handle (verifies permission lazily). */
export async function restoreLinkedFile(): Promise<void> {
  if (!isFileSaveSupported()) return;
  const stored = await idbGet<FileSystemFileHandle>(HANDLE_KEY);
  if (!stored) return;
  fileHandle = stored;
  useRPGStore.getState().setSaveFileLinked(true);
}

export async function writeToLinkedFile(): Promise<boolean> {
  if (!fileHandle) return false;
  const data = useRPGStore.getState().buildSave();
  if (!data) return false;
  try {
    const perm = await (fileHandle as any).queryPermission?.({ mode: 'readwrite' });
    if (perm !== 'granted') {
      const req = await (fileHandle as any).requestPermission?.({ mode: 'readwrite' });
      if (req !== 'granted') return false;
    }
    const writable = await (fileHandle as any).createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return true;
  } catch (e) {
    console.warn('[RPG] linked-file save failed', e);
    return false;
  }
}

// -- Export / import (works in every browser) ----------------------------------------

export function exportSaveDownload(): void {
  const data = useRPGStore.getState().buildSave();
  if (!data) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date(data.savedAt).toISOString().slice(0, 10);
  a.href = url;
  a.download = `rpg-save-${data.character.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importSaveFromFile(file: File): Promise<boolean> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as RPGSaveData;
    if (parsed?.version !== RPG_SAVE_VERSION || !parsed.character?.config) return false;
    useRPGStore.getState().hydrate(parsed);
    saveToLocalStorage();
    return true;
  } catch {
    return false;
  }
}

// -- Autosave lifecycle ---------------------------------------------------------------

let quicksaveTimer: ReturnType<typeof setTimeout> | null = null;
let fileTimer: ReturnType<typeof setInterval> | null = null;
let unsubscribe: (() => void) | null = null;
let visListener: (() => void) | null = null;

/** Full save: localStorage always, linked file when available. */
export async function saveNow(): Promise<void> {
  const ok = saveToLocalStorage();
  const fileOk = await writeToLinkedFile();
  const st = useRPGStore.getState();
  if (ok) st.pushToast(fileOk ? 'Game saved to file' : 'Game saved', 'success', '💾');
}

export function startAutosave(): void {
  stopAutosave();
  void restoreLinkedFile();

  // Tier 1: debounced quicksave on meaningful state changes. The playtime
  // counter ticks every second, so progress is compared with playTimeSec
  // masked out — otherwise the trailing debounce would never fire.
  const progressSig = (p: ReturnType<typeof useRPGStore.getState>['progress']) =>
    `${p.level}|${p.xp}|${p.gold}|${p.hp}|${p.maxHp}|${p.kills}|${p.deaths}`;
  let last = useRPGStore.getState();
  let lastProgressSig = progressSig(last.progress);
  unsubscribe = useRPGStore.subscribe((state) => {
    if (state.phase !== 'playing' && state.phase !== 'dead') {
      last = state;
      lastProgressSig = progressSig(state.progress);
      return;
    }
    const sig = progressSig(state.progress);
    const meaningful =
      state.inventory !== last.inventory ||
      sig !== lastProgressSig ||
      state.equipment !== last.equipment ||
      state.containers !== last.containers ||
      state.flags !== last.flags;
    last = state;
    lastProgressSig = sig;
    if (!meaningful) return;
    if (quicksaveTimer) clearTimeout(quicksaveTimer);
    quicksaveTimer = setTimeout(() => saveToLocalStorage(), QUICKSAVE_DEBOUNCE_MS);
  });

  // Tier 2: the every-10-minutes full save (localStorage + linked file).
  fileTimer = setInterval(() => {
    if (useRPGStore.getState().phase === 'playing') void saveNow();
  }, AUTOSAVE_FILE_INTERVAL_MS);

  // Safety net: persist when the tab hides/closes.
  visListener = () => {
    if (document.visibilityState === 'hidden') saveToLocalStorage();
  };
  document.addEventListener('visibilitychange', visListener);
}

export function stopAutosave(): void {
  if (quicksaveTimer) clearTimeout(quicksaveTimer);
  if (fileTimer) clearInterval(fileTimer);
  if (unsubscribe) unsubscribe();
  if (visListener) document.removeEventListener('visibilitychange', visListener);
  quicksaveTimer = null;
  fileTimer = null;
  unsubscribe = null;
  visListener = null;
}
