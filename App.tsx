import React, { useEffect } from 'react';
import { Navigation } from './components/ui/Navigation';
import { HomeView, UnitsView, MissionView, MusicView } from './components/ui/PageViews';

import { GameScreen } from './components/ui/GameScreen';
import { GlobalModals } from './components/ui/GlobalModals';
import { LandMapModal } from './components/ui/LandMapModal';

import { useGlobalState } from './contexts/GlobalContext';

const App: React.FC = () => {
  const { 
    gameState: gameStateContext,
    playerState,
    uiState,
    questState,
    environmentState
  } = useGlobalState();

  const { activePage, setActivePage } = gameStateContext;
  const { config } = playerState;
  const { quests } = questState;
  const { notification, setNotification, isLandMapOpen, setIsLandMapOpen } = uiState;
  const { playerPosForMap } = environmentState;

  // Effects
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification, setNotification]);

  return (
    <div className="w-screen h-screen relative bg-slate-950 overflow-hidden font-sans text-slate-50">
      <div className="absolute inset-0 z-0">
        {activePage === 'home' && <HomeView />}
        {activePage === 'units' && <UnitsView />}
        {activePage === 'mission' && <MissionView quests={quests} config={config} />}
        {activePage === 'music' && <MusicView />}
        
        {activePage === 'game' && (
          <GameScreen />
        )}
      </div>

      <Navigation activePage={activePage} onPageChange={setActivePage} />

      <GlobalModals />

      <LandMapModal 
        isOpen={isLandMapOpen}
        onClose={() => setIsLandMapOpen(false)}
        playerPos={playerPosForMap}
      />

      {notification && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4">
              <div className="bg-blue-600 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl border border-blue-400/50">
                  {notification}
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
