import React, { useEffect } from 'react';
import { ALL_LANDS } from '../../../data/lands/index';
import { CITIES } from '../../../data/lands/cities';
import { isPointInPolygon } from '../../../game/environment/landTerrain';

interface LandSelectionModalProps {
  isOpen: boolean;
  onSelect: (land: any) => void;
}

export const LandSelectionModal: React.FC<LandSelectionModalProps> = ({ isOpen, onSelect }) => {
  useEffect(() => {
    console.log("LandSelectionModal mounted, isOpen:", isOpen);
  }, [isOpen]);

  if (!isOpen) return null;

  const landsWithCities = ALL_LANDS.filter((land) =>
    land.points && CITIES.some((city) => city.type !== 'poi' && isPointInPolygon(city.x, city.y, land.points))
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">Select Destination</h2>
          <p className="text-slate-400 text-sm mt-1">Choose a location to travel to</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {landsWithCities.map((land) => (
            <button
              key={land.id}
              onClick={() => onSelect(land)}
              className="group relative flex flex-col items-start p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-200 text-left"
            >
              <div className="w-full aspect-video mb-3 rounded-lg bg-black/40 overflow-hidden relative">
                {/* Mini map preview could go here using the points */}
                <div className="absolute inset-0 flex items-center justify-center text-white/20 group-hover:text-blue-400/40 transition-colors">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">{land.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-300">
                  {land.id.split('_')[0]}
                </span>
                {land.points && (
                  <span className="text-[10px] text-slate-500">
                    {land.points.length} points
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
