import { useState, useEffect, useCallback } from 'react';
import { PageType } from '../components/ui/menus/Navigation';

export type GameState = 'MENU' | 'LOADING' | 'READY' | 'PLAYING';
export type ActiveScene = 'dev' | 'starter' | 'land' | 'combat' | 'mp' | 'singleBiome' | 'town' | 'town2' | 'tdgame' | 'roguelike' | 'gameLoop' | 'darkest' | 'loop';

const validPages: PageType[] = ['home', 'game', 'music', 'about', 'shop'];
const validScenes: ActiveScene[] = ['dev', 'starter', 'land', 'combat', 'mp', 'singleBiome', 'town', 'town2', 'tdgame', 'roguelike', 'gameLoop', 'darkest', 'loop'];
const defaultScene: ActiveScene = 'starter';

function parseHashState(): { page: PageType; scene: ActiveScene } {
  const hash = window.location.hash.replace(/^#/, '');
  const [rawPage = '', rawScene = ''] = hash.split('/');
  const page = validPages.includes(rawPage as PageType) ? (rawPage as PageType) : 'home';
  const scene = validScenes.includes(rawScene as ActiveScene) ? (rawScene as ActiveScene) : defaultScene;

  return { page, scene };
}

function buildHash(page: PageType, scene: ActiveScene): string {
  return page === 'game' ? `#game/${scene}` : `#${page}`;
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [activePage, setActivePage] = useState<PageType>(() => parseHashState().page);
  const [activeScene, setActiveScene] = useState<ActiveScene>(() => parseHashState().scene);
  const [isTravelOpen, setIsTravelOpen] = useState(false);

  const setActivePageWithHash = useCallback((page: PageType) => {
    setActivePage(page);
    window.history.pushState(null, '', buildHash(page, activeScene));
  }, [activeScene]);

  const setActiveSceneWithHash = useCallback((scene: ActiveScene) => {
    setActiveScene(scene);
    if (activePage === 'game') {
      window.history.replaceState(null, '', buildHash(activePage, scene));
    }
  }, [activePage]);

  useEffect(() => {
    const onHashChange = () => {
      const { page, scene } = parseHashState();
      setActivePage(page);
      setActiveScene(scene);
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, []);

  // Set initial hash if none present
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#home');
    }
  }, []);

  return {
    gameState,
    setGameState,
    activePage,
    setActivePage: setActivePageWithHash,
    activeScene,
    setActiveScene: setActiveSceneWithHash,
    isTravelOpen,
    setIsTravelOpen
  };
}
