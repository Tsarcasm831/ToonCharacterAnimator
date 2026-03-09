import { useState } from 'react';
import { PlayerPreview } from './components/ui/previews/PlayerPreview';
import { ControlPanel } from './components/ui/panels/ControlPanel';
import { BODY_PRESETS, OUTFIT_PRESETS } from './data/constants';
import { DEFAULT_CONFIG } from './types';
import type { PlayerConfig, PlayerInput } from './types';
import './index.css';

type MovementMode = 'idle' | 'walk' | 'run';

const DEFAULT_INPUT: Partial<PlayerInput> = {
    x: 0,
    y: 0,
    isRunning: false,
    jump: false,
    isDead: false,
    isPickingUp: false,
    attack1: false,
    attack2: false,
    interact: false,
    combat: false,
    toggleFirstPerson: false,
    wave: false,
    leftHandWave: false,
    summon: false,
    toggleBuilder: false,
    rotateGhost: false,
    fireball: false,
    crouch: false
};

const INITIAL_CONFIG: PlayerConfig = {
  ...DEFAULT_CONFIG,
  ...BODY_PRESETS.average,
  ...OUTFIT_PRESETS.peasant,
  bodyType: 'male',
  bodyVariant: 'average',
  hairStyle: 'crew',
  hairColor: '#2b1d16',
  skinColor: '#d8b89a',
  eyeColor: '#3c5e8f',
  scleraColor: '#f2f4f7',
  pupilColor: '#111111',
  lipColor: '#c79b84',
  shirtColor: '#6f4e37',
  shirtColor2: '#caa472',
  pantsColor: '#3b2d24',
  bootsColor: '#2a1b14',
  timeOfDay: 16.8,
  isAutoTime: false,
};

function App() {
  const [config, setConfig] = useState<PlayerConfig>(INITIAL_CONFIG);
  const [manualInput, setManualInput] = useState<Partial<PlayerInput>>(DEFAULT_INPUT);
  const [isDeadUI, setIsDeadUI] = useState(false);
  const [movementMode, setMovementMode] = useState<MovementMode>('idle');
  const [zoomLevel, setZoomLevel] = useState(50);

  const applyMovementMode = (mode: MovementMode) => {
    setMovementMode(mode);
    setManualInput(prev => ({
      ...prev,
      x: 0,
      y: mode === 'idle' ? 0 : -1,
      isRunning: mode === 'run',
    }));
  };

  const handleDeathToggle = () => {
      setManualInput(prev => ({ ...prev, isDead: !prev.isDead }));
      setIsDeadUI(prev => !prev);
  };

  const handleMovementToggle = () => {
    const nextMode: MovementMode =
      movementMode === 'idle' ? 'walk' : movementMode === 'walk' ? 'run' : 'idle';
    applyMovementMode(nextMode);
  };

  const triggerAction = (key: keyof PlayerInput) => {
      setManualInput(prev => ({ ...prev, [key]: true }));
      setTimeout(() => setManualInput(prev => ({ ...prev, [key]: false })), 100);
  };

  return (
    <div className="w-screen h-screen bg-slate-950 overflow-hidden text-slate-50 flex flex-col relative">
      <div className="absolute inset-0">
         <PlayerPreview config={config} manualInput={manualInput} onZoomChange={setZoomLevel} />
      </div>
      
      <ControlPanel
          config={config}
          manualInput={manualInput}
          isDeadUI={isDeadUI}
          setConfig={setConfig}
          setManualInput={setManualInput}
          handleDeathToggle={handleDeathToggle}
          movementMode={movementMode}
          handleMovementToggle={handleMovementToggle}
          triggerAction={triggerAction}
          onExport={() => console.log('Export model')}
          onUndo={() => console.log('Undo')}
          onRedo={() => console.log('Redo')}
          canUndo={false}
          canRedo={false}
          zoomLevel={zoomLevel}
      />
    </div>
  )
}

export default App;
