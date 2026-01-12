import React from 'react';
import * as THREE from 'three';
import { WORLD_SHAPE_POINTS } from '../../data/worldShape';

interface WorldMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerPos: THREE.Vector3;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({ isOpen, onClose, playerPos }) => {
  if (!isOpen) return null;

  // Match WorldEnvironment scaling
  const worldScale = 50.0;
  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  WORLD_SHAPE_POINTS.forEach(p => {
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minZ) minZ = p[1];
    if (p[1] > maxZ) maxZ = p[1];
  });

  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  // World transformed points
  const worldPoints = WORLD_SHAPE_POINTS.map(p => ({
    x: (p[0] - centerX) * worldScale,
    z: (p[1] - centerZ) * worldScale
  }));

  const worldXs = worldPoints.map(p => p.x);
  const worldZs = worldPoints.map(p => p.z);
  const minWorldX = Math.min(...worldXs);
  const maxWorldX = Math.max(...worldXs);
  const minWorldZ = Math.min(...worldZs);
  const maxWorldZ = Math.max(...worldZs);

  // Calculate map scale to fit in viewBox
  const viewBoxSize = 400;
  const padding = 20;
  const maxExtent = Math.max(Math.abs(minWorldX), Math.abs(maxWorldX), Math.abs(minWorldZ), Math.abs(maxWorldZ));
  const mapScale = (viewBoxSize - padding * 2) / (2 * maxExtent);

  // Scale points for SVG (centered)
  const scaledPoints = worldPoints.map(p => ({
    x: p.x * mapScale + viewBoxSize / 2,
    z: p.z * mapScale + viewBoxSize / 2
  }));

  // Path string
  const pathData = scaledPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.z}`).join(' ') + ' Z';

  // Scale player position (same transform)
  const scaledPlayerX = playerPos.x * mapScale + viewBoxSize / 2;
  const scaledPlayerZ = playerPos.z * mapScale + viewBoxSize / 2;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-blue-400 font-black uppercase tracking-[0.2em] text-sm">World Map</h2>
            <button 
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex justify-center">
            <svg width={viewBoxSize} height={viewBoxSize} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="border border-white/10 rounded-lg">
              <path 
                d={pathData} 
                fill="#4ade80" 
                stroke="#16a34a" 
                strokeWidth="2" 
                opacity="0.8"
              />
              <circle 
                cx={scaledPlayerX} 
                cy={scaledPlayerZ} 
                r="5" 
                fill="#ef4444" 
                stroke="#dc2626" 
                strokeWidth="2"
              />
            </svg>
          </div>
          
          <div className="mt-4 text-center text-white/60 text-xs">
            Red dot shows your current location
          </div>
        </div>
      </div>
    </div>
  );
};
