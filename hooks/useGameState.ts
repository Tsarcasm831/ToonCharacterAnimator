import { useState } from 'react';
import { PageType } from '../components/ui/menus/Navigation';

export type GameState = 'MENU' | 'LOADING' | 'READY' | 'PLAYING';
export type ActiveScene = 'dev' | 'land' | 'combat' | 'mp' | 'singleBiome' | 'town';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [activePage, setActivePage] = useState<PageType>('home');
  const [activeScene, setActiveScene] = useState<ActiveScene>('dev');
  const [isTravelOpen, setIsTravelOpen] = useState(false);

  return {
    gameState,
    setGameState,
    activePage,
    setActivePage,
    activeScene,
    setActiveScene,
    isTravelOpen,
    setIsTravelOpen
  };
}
