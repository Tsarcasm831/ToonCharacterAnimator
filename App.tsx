import React, { useEffect } from 'react';
import { Navigation } from './components/ui/Navigation';
import { Home } from './components/ui/Home';
import { Units } from './components/ui/Units';
import { Mission } from './components/ui/Mission';
import { MusicView as Music } from './components/ui/Music';
import { Game } from './components/ui/Game';
import { Map } from './components/ui/Map';
import { GlobalModals } from './components/ui/GlobalModals';
import { LandMapModal } from './components/ui/LandMapModal';
import { MusicProvider } from './contexts/MusicContext';
import { MusicFooter } from './components/ui/MusicFooter';

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
  const { isLandMapOpen, setIsLandMapOpen } = uiState;
  const { playerPosForMap } = environmentState;

  return (
    <MusicProvider>
      <div className="w-screen h-screen relative bg-slate-950 overflow-hidden font-sans text-slate-50 flex flex-col">
        <Navigation activePage={activePage} onPageChange={setActivePage} />
        
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <div className="absolute inset-0 z-0">
            {activePage === 'home' && <Home />}
            {activePage === 'units' && <Units />}
            {activePage === 'mission' && <Mission quests={quests} config={config} />}
            {activePage === 'music' && <Music />}
            {activePage === 'map' && <Map />}
            
            {activePage === 'game' && (
              <Game />
            )}
          </div>
          <GlobalModals />
          <LandMapModal 
            isOpen={isLandMapOpen}
            onClose={() => setIsLandMapOpen(false)}
            playerPos={playerPosForMap}
          />
        </div>

        <MusicFooter activePage={activePage} />
      </div>
    </MusicProvider>
  );
};

export default App;
