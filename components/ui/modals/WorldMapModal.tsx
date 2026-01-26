import React from 'react';
import WorldScene from '../../WorldScene';

interface WorldMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] h-[90vh] bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white/70 hover:text-white transition-colors"
          aria-label="Close world map"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <WorldScene />
      </div>
    </div>
  );
};
