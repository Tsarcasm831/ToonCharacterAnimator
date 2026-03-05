import { useEffect, useRef, useCallback } from 'react';
import { PlayerConfig } from '../types';
import { UndoRedoManager } from '../utils/UndoRedoManager';

interface UseUndoRedoReturn {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pushState: (config: PlayerConfig) => void;
  getHistoryInfo: () => { size: number; index: number; canUndo: boolean; canRedo: boolean };
}

/**
 * Custom hook for managing undo/redo functionality with keyboard shortcuts
 * @param config - Current player configuration
 * @param setConfig - State setter for player configuration
 * @returns Object with undo/redo functions and state
 */
export const useUndoRedo = (
  config: PlayerConfig,
  setConfig: React.Dispatch<React.SetStateAction<PlayerConfig>>
): UseUndoRedoReturn => {
  const managerRef = useRef<UndoRedoManager>(new UndoRedoManager());
  const isUndoRedoActionRef = useRef<boolean>(false);

  // Initialize history with the initial config
  useEffect(() => {
    managerRef.current.initialize(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Push state to history whenever config changes (but not during undo/redo)
  useEffect(() => {
    if (!isUndoRedoActionRef.current) {
      managerRef.current.pushState(config);
    }
    isUndoRedoActionRef.current = false;
  }, [config]);

  // Undo function
  const undo = useCallback(() => {
    const previousState = managerRef.current.undo();
    if (previousState) {
      isUndoRedoActionRef.current = true;
      setConfig(previousState);
    }
  }, [setConfig]);

  // Redo function
  const redo = useCallback(() => {
    const nextState = managerRef.current.redo();
    if (nextState) {
      isUndoRedoActionRef.current = true;
      setConfig(nextState);
    }
  }, [setConfig]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }
      // Ctrl+Y or Cmd+Shift+Z for redo
      else if (
        ((event.ctrlKey || event.metaKey) && event.key === 'y') ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')
      ) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    undo,
    redo,
    canUndo: managerRef.current.canUndo(),
    canRedo: managerRef.current.canRedo(),
    pushState: (cfg: PlayerConfig) => managerRef.current.pushState(cfg),
    getHistoryInfo: () => managerRef.current.getHistoryInfo()
  };
};

export default useUndoRedo;
