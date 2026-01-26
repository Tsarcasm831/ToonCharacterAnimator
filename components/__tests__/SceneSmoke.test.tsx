import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Scene from '../Scene';
import WorldScene from '../WorldScene';
import TownScene from '../TownScene';
import CombatScene from '../CombatScene';
import { GlobalProvider } from '../../contexts/GlobalContext';
import { MusicProvider } from '../../contexts/MusicContext';
import { UIProvider } from '../../contexts/UIContext';
import { DEFAULT_CONFIG } from '../../types';

vi.mock('../../hooks/useGame', () => ({
  useGame: vi.fn(() => ({
    current: {
      combatManager: {
        selectedUnit: undefined
      }
    }
  }))
}));

vi.mock('three', () => ({
  Vector3: class Vector3 {}
}));

const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GlobalProvider>
    <MusicProvider>
      <UIProvider>{children}</UIProvider>
    </MusicProvider>
  </GlobalProvider>
);

const baseSceneProps = {
  activeScene: 'land' as const,
  config: DEFAULT_CONFIG,
  manualInput: {},
  initialInventory: []
};

const baseCombatProps = {
  config: DEFAULT_CONFIG,
  manualInput: {},
  bench: [],
  isCombatActive: false,
  setIsCombatActive: vi.fn(),
  combatLog: [],
  showGrid: false,
  setShowGrid: vi.fn()
};

describe('Scene smoke tests', () => {
  beforeEach(() => {
    class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0)) as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = ((id: number) => window.clearTimeout(id)) as typeof cancelAnimationFrame;
  });

  it('renders Scene without crashing', () => {
    const { container } = render(
      <TestProviders>
        <Scene {...baseSceneProps} />
      </TestProviders>
    );

    expect(container.querySelector('div.w-full.h-full')).toBeTruthy();
  });

  it('renders WorldScene without crashing', () => {
    const { container } = render(
      <TestProviders>
        <WorldScene />
      </TestProviders>
    );

    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders TownScene without crashing', () => {
    const { container } = render(
      <TestProviders>
        <TownScene {...baseSceneProps} />
      </TestProviders>
    );

    expect(container.querySelector('div.w-full.h-full')).toBeTruthy();
  });

  it('renders CombatScene without crashing', () => {
    render(
      <TestProviders>
        <CombatScene {...baseCombatProps} />
      </TestProviders>
    );

    expect(screen.getByRole('button', { name: /start combat/i })).toBeTruthy();
  });
});
