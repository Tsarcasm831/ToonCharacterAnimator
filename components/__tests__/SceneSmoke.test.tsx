import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DevScene from '../DevScene';
import WorldScene from '../WorldScene';
import TownScene from '../TownScene';
import Town2Scene from '../Town2Scene';
import CombatScene from '../CombatScene';
import { GlobalProvider } from '../../contexts/GlobalContext';
import { MusicProvider } from '../../contexts/MusicContext';
import { UIProvider } from '../../contexts/UIContext';
import { DEFAULT_CONFIG } from '../../types';

vi.mock('../../hooks/useGame', () => ({
  useGame: vi.fn(() => ({
    gameRef: {
      current: {
        combatManager: {
          selectedUnit: undefined
        }
      }
    },
    endTurn: vi.fn(),
    waitTurn: vi.fn(),
    defend: vi.fn(),
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

  it('renders DevScene without crashing', () => {
    const { container } = render(
      <TestProviders>
        <DevScene {...baseSceneProps} />
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

  it('renders Town2Scene without crashing', () => {
    const { container } = render(
      <TestProviders>
        <Town2Scene {...baseSceneProps} activeScene="town2" />
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
