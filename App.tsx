import React from 'react';
import { Navigation } from './components/ui/menus/Navigation';
import { Home } from './components/ui/pages/Home';
import { MusicView as Music } from './components/ui/audio/Music';
import { Game } from './components/ui/pages/Game';
import { About } from './components/ui/pages/About';
import { GlobalModals } from './components/ui/modals/GlobalModals';
import { LandMapModal } from './components/ui/modals/LandMapModal';
import { MusicProvider } from './contexts/MusicContext';
import { MusicFooter } from './components/ui/audio/MusicFooter';

import { useGlobalState } from './contexts/GlobalContext';

const App: React.FC = () => {
  const { 
    gameState: gameStateContext,
    uiState,
    environmentState
  } = useGlobalState();

  const { activePage, setActivePage } = gameStateContext;
  const { isLandMapOpen, setIsLandMapOpen } = uiState;
  const { playerPosForMap } = environmentState;

  return (
    <MusicProvider>
      <div className="w-screen h-screen relative bg-slate-950 overflow-hidden font-sans text-slate-50 flex flex-col">
        <Navigation activePage={activePage} onPageChange={setActivePage} />
        
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <div className="absolute inset-0 z-0">
            {activePage === 'home' && <Home />}
            {activePage === 'music' && <Music />}
            {activePage === 'about' && <About />}
            
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
