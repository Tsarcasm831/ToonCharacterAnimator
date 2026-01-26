import React, { createContext, useContext, ReactNode } from 'react';
import { useUIState } from '../hooks/useUIState';

// Return type of useUIState
type UIState = ReturnType<typeof useUIState>;

const UIContext = createContext<UIState | null>(null);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const uiState = useUIState();

  return (
    <UIContext.Provider value={uiState}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
