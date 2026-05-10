import React, { useEffect, useState } from 'react';
import { Navigation } from './components/ui/menus/Navigation';
import { Home } from './components/ui/pages/Home';
import { MusicView as Music } from './components/ui/audio/Music';
import { Game } from './components/ui/pages/Game';
import { About } from './components/ui/pages/About';
import { Shop } from './components/ui/pages/Shop';
import { GlobalModals } from './components/ui/modals/GlobalModals';
import { LandMapModal } from './components/ui/modals/LandMapModal';
import { MusicProvider } from './contexts/MusicContext';
import { precacheAllAssets, hasPrecachedThisSession, markPrecachedThisSession } from './utils/imageCache';

import { useGlobalState } from './contexts/GlobalContext';

const App: React.FC = () => {
  const { 
    gameState: gameStateContext,
    uiState,
    environmentState
  } = useGlobalState();

  const { activePage, setActivePage, setGameState } = gameStateContext;
  const { isLandMapOpen, setIsLandMapOpen } = uiState;
  const { playerPosForMap, setIsEnvironmentBuilt, setIsVisualLoadingDone } = environmentState;

  // Asset precache state
  const [isPrecaching, setIsPrecaching] = useState(!hasPrecachedThisSession());
  const [precacheProgress, setPrecacheProgress] = useState({ loaded: 0, total: 1 });

  const scheduleVisualLoadingDone = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          setIsVisualLoadingDone(true);
        }, 800);
      });
    });
  };

  const handleSingleBiomeEnvironmentReady = () => {
    console.log("[App.tsx] SingleBiome environment ready signal received from land selection");
    setIsEnvironmentBuilt(true);
    scheduleVisualLoadingDone();
  };

  // Force Game component to remount when navigating away and back
  // This ensures cleanup of 3D scenes and fresh state on return
  const gameKey = activePage === 'game' ? 'game-active' : 'game-unmounted';

  // Reset game state when navigating away from game page
  useEffect(() => {
    if (activePage !== 'game') {
      // Reset game state to MENU when not on game page
      setGameState('MENU');
    }
  }, [activePage, setGameState]);

  // Precache all images on first load
  useEffect(() => {
    if (!hasPrecachedThisSession()) {
      setIsPrecaching(true);
      precacheAllAssets((loaded, total) => {
        setPrecacheProgress({ loaded, total });
      }).then(() => {
        markPrecachedThisSession();
        setIsPrecaching(false);
      });
    }
  }, []);

  // Show precache loading screen
  if (isPrecaching) {
    const percent = Math.round((precacheProgress.loaded / precacheProgress.total) * 100);
    return (
      <div className="w-screen h-dvh bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-64 space-y-4">
          <div className="flex justify-between text-xs uppercase tracking-widest text-slate-400">
            <span>Loading Assets</span>
            <span>{percent}%</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <MusicProvider>
      <div className="w-screen h-dvh min-h-0 relative bg-slate-950 overflow-hidden font-sans text-slate-50 flex flex-col">
        <Navigation activePage={activePage} onPageChange={setActivePage} />

        <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
          <div className="absolute inset-0 z-0 min-h-0 overflow-hidden">
            {activePage === 'home' && <Home />}
            {activePage === 'music' && <Music />}
            {activePage === 'about' && <About />}
            {activePage === 'shop' && <Shop />}
            
            {activePage === 'game' && (
              <Game key={gameKey} />
            )}
          </div>
          <GlobalModals onEnvironmentReady={handleSingleBiomeEnvironmentReady} />
          <LandMapModal 
            isOpen={isLandMapOpen}
            onClose={() => setIsLandMapOpen(false)}
            playerPos={playerPosForMap}
          />
        </div>
      </div>
    </MusicProvider>
  );
};

export default App;
