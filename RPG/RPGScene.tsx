import React, { useEffect, useRef, useState } from 'react';
import { RPGGame } from './game/RPGGame';
import { useRPGStore } from './state/rpgStore';
import {
  importSaveFromFile,
  loadFromLocalStorage,
  saveToLocalStorage,
  startAutosave,
  stopAutosave,
} from './state/saveSystem';
import {
  BootMenu,
  CharacterCreation,
  RPGHud,
  InventoryPanel,
  CharacterProfile,
  TradePanel,
  DialoguePanel,
  ContainerPanel,
  DeathOverlay,
  PauseMenu,
} from './ui';

// ============================================================================
// RPGScene — the React shell for the Thornwood Vale RPG (Defense.tsx pattern).
// Owns the boot flow (continue / new game / import), mounts the RPGGame engine
// in a single effect keyed on whether gameplay is active, and composes every
// UI overlay (each panel self-gates on store state).
// ============================================================================

const RPGScene: React.FC<{ onReady?: () => void }> = ({ onReady }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<RPGGame | null>(null);
  const onReadyRef = useRef(onReady);

  const phase = useRPGStore((s) => s.phase);
  // The engine stays alive across playing <-> dead transitions.
  const engineActive = phase === 'playing' || phase === 'dead';

  // Read the save once on mount; the boot menu is only shown before hydrate.
  const [save] = useState(() => loadFromLocalStorage());

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onReadyRef.current?.();
  }, []);

  // Engine lifecycle. StrictMode-safe: the instance is created in the effect
  // body and fully disposed in its cleanup — never in module scope.
  useEffect(() => {
    if (!engineActive) return;
    const container = containerRef.current;
    if (!container) return;

    const game = new RPGGame(container);
    gameRef.current = game;
    game.start();
    startAutosave();

    const onResize = () => game.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      stopAutosave();
      saveToLocalStorage();
      game.dispose();
      if (gameRef.current === game) gameRef.current = null;
    };
  }, [engineActive]);

  // Overlay keys. The engine's InputManager is blocked while a panel is open,
  // so panel-closing keys (Escape / P / I) must be handled here.
  useEffect(() => {
    if (!engineActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest?.('input, textarea, select')) return;
      const s = useRPGStore.getState();
      if (e.code === 'Escape') {
        if (s.activePanel !== 'none') s.closePanel();
        else if (s.phase === 'playing') s.openPanel('pause');
      } else if (e.code === 'KeyP') {
        if (s.activePanel === 'profile') s.closePanel();
        else if (s.activePanel === 'none' && s.phase === 'playing') s.openPanel('profile');
      } else if (e.code === 'KeyI') {
        // Sole owner of the inventory toggle (the engine's InputManager
        // deliberately does NOT bind this — see RPGGame input setup).
        if (s.activePanel === 'inventory') s.closePanel();
        else if (s.activePanel === 'none' && s.phase === 'playing') s.openPanel('inventory');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [engineActive]);

  return (
    <div className="relative w-full h-full bg-slate-950">
      <div ref={containerRef} className="absolute inset-0" />

      <RPGHud />
      <InventoryPanel />
      <CharacterProfile />
      <TradePanel />
      <DialoguePanel />
      <ContainerPanel />
      <DeathOverlay />
      <PauseMenu />

      {phase === 'boot' && (
        <BootMenu
          hasSave={!!save}
          saveMeta={
            save
              ? { name: save.character.name, level: save.progress.level, savedAt: save.savedAt }
              : null
          }
          onContinue={() => {
            if (save) useRPGStore.getState().hydrate(save);
          }}
          onNewGame={() => useRPGStore.getState().beginCreation()}
          onImport={(file) => {
            void importSaveFromFile(file);
          }}
        />
      )}

      {phase === 'creation' && (
        <CharacterCreation
          onComplete={(name, classId, config) =>
            useRPGStore.getState().startNewGame(name, classId, config)
          }
        />
      )}
    </div>
  );
};

export default RPGScene;
