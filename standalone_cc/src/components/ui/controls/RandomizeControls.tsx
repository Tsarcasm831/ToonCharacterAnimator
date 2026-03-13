import React, { useState } from 'react';
import { PlayerConfig } from '../../../types';
import RandomizationPresets, { PresetTheme } from '../../../utils/RandomizationPresets';

interface RandomizeControlsProps {
  config: PlayerConfig;
  setConfig: React.Dispatch<React.SetStateAction<PlayerConfig>>;
}

const RandomizeControls: React.FC<RandomizeControlsProps> = ({ config, setConfig }) => {
  const [selectedTheme, setSelectedTheme] = useState<PresetTheme>('random');
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const themes = RandomizationPresets.getAvailableThemes();

  const handleRandomizeAll = () => {
    const randomized = RandomizationPresets.generateThemedPreset(selectedTheme, config);
    setConfig(randomized);
  };

  const handleRandomizeBody = () => {
    const randomized = RandomizationPresets.randomizeBody(config);
    setConfig(randomized);
  };

  const handleRandomizeFace = () => {
    const randomized = RandomizationPresets.randomizeFace(config);
    setConfig(randomized);
  };

  const handleRandomizeColors = () => {
    const randomized = RandomizationPresets.randomizeColors(config, selectedTheme);
    setConfig(randomized);
  };

  const currentTheme = themes.find(t => t.id === selectedTheme);

  return (
    <div className="bg-neutral-800 rounded-lg p-4 border border-purple-500/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-purple-300 flex items-center gap-2">
          <span className="text-2xl">🎲</span>
          Randomization Presets
        </h3>
      </div>

      {/* Theme Selector */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-neutral-300 mb-2">
          Theme
        </label>
        <button
          type="button"
          onClick={() => setShowThemeSelector(!showThemeSelector)}
          className="w-full px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentTheme?.icon}</span>
            <div className="text-left">
              <div className="font-bold">{currentTheme?.name}</div>
              <div className="text-xs text-neutral-400">{currentTheme?.description}</div>
            </div>
          </div>
          <svg
            className={`w-5 h-5 transition-transform ${showThemeSelector ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showThemeSelector && (
          <div className="mt-2 bg-neutral-700 rounded border border-neutral-600 max-h-64 overflow-y-auto">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  setSelectedTheme(theme.id);
                  setShowThemeSelector(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-neutral-600 transition-colors flex items-center gap-3 border-b border-neutral-600 last:border-b-0 ${
                  selectedTheme === theme.id ? 'bg-purple-600/30' : ''
                }`}
              >
                <span className="text-2xl">{theme.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-white">{theme.name}</div>
                  <div className="text-xs text-neutral-400">{theme.description}</div>
                </div>
                {selectedTheme === theme.id && (
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Randomize Buttons */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleRandomizeAll}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50"
        >
          <span className="text-xl">🎲</span>
          Randomize Everything
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleRandomizeBody}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded transition-colors flex flex-col items-center justify-center gap-1"
          >
            <span className="text-lg">💪</span>
            <span className="text-xs">Body</span>
          </button>

          <button
            type="button"
            onClick={handleRandomizeFace}
            className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded transition-colors flex flex-col items-center justify-center gap-1"
          >
            <span className="text-lg">😊</span>
            <span className="text-xs">Face</span>
          </button>

          <button
            type="button"
            onClick={handleRandomizeColors}
            className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded transition-colors flex flex-col items-center justify-center gap-1"
          >
            <span className="text-lg">🎨</span>
            <span className="text-xs">Colors</span>
          </button>
        </div>
      </div>

      {/* Info Text */}
      <div className="mt-4 p-3 bg-neutral-700/50 rounded text-xs text-neutral-400">
        <p className="mb-1">
          <strong className="text-neutral-300">Quick tip:</strong> Select a theme to influence the randomization style.
        </p>
        <p>
          Use "Randomize Everything" for a complete new character, or pick individual sections to refine your look.
        </p>
      </div>
    </div>
  );
};

export default RandomizeControls;
