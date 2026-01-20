import React, { useMemo, useState } from 'react';
import { ALL_LANDS, ALL_ISLANDS, SPECIAL_LOCATIONS, CITIES } from '../data/lands';

interface WorldSceneProps {
  onCityClick?: (city: any) => void;
  onLandClick?: (land: any) => void;
  playerPos?: { x: number; y: number };
}

export const WorldScene: React.FC<WorldSceneProps> = ({ 
  onCityClick, 
  onLandClick,
  playerPos 
}) => {
  const [hoveredLand, setHoveredLand] = useState<string | null>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  // Calculate bounds
  const bounds = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const processPoints = (points: number[][]) => {
      points.forEach(([x, y]) => {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
    };

    [...ALL_LANDS, ...ALL_ISLANDS, ...SPECIAL_LOCATIONS].forEach(land => {
      processPoints(land.points);
    });

    CITIES.forEach(city => {
      if (city.x < minX) minX = city.x;
      if (city.x > maxX) maxX = city.x;
      if (city.y < minY) minY = city.y;
      if (city.y > maxY) maxY = city.y;
    });

    // Add padding
    const padding = 5;
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding,
      width: (maxX - minX) + (padding * 2),
      height: (maxY - minY) + (padding * 2)
    };
  }, []);

  const getPointsString = (points: number[][]) => {
    return points.map(p => `${p[0]},${p[1]}`).join(' ');
  };

  return (
    <div className="w-full h-full bg-[#1a365d] relative overflow-hidden flex items-center justify-center">
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-white mb-2">World Map</h1>
        <div className="text-sm text-gray-300">
          {hoveredLand && <div className="text-emerald-400">{hoveredLand}</div>}
          {hoveredCity && <div className="text-yellow-400">{hoveredCity}</div>}
        </div>
      </div>

      <svg 
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
        className="w-full h-full max-h-screen"
        preserveAspectRatio="xMidYMid meet"
        style={{ background: '#1e3a8a' }} // Ocean color
      >
        {/* Render Lands */}
        {[...ALL_LANDS, ...SPECIAL_LOCATIONS].map((land) => (
          <polygon
            key={land.id}
            points={getPointsString(land.points)}
            fill={land.color || '#2d5a27'}
            stroke="#1a2e1a"
            strokeWidth="0.2"
            className="transition-all duration-300 cursor-pointer hover:brightness-110"
            onMouseEnter={() => setHoveredLand(land.name)}
            onMouseLeave={() => setHoveredLand(null)}
            onClick={() => onLandClick?.(land)}
            style={{ vectorEffect: 'non-scaling-stroke' }}
          />
        ))}

        {/* Render Islands */}
        {ALL_ISLANDS.map((island) => (
          <polygon
            key={island.id}
            points={getPointsString(island.points)}
            fill={island.color || '#4ade80'}
            stroke="#166534"
            strokeWidth="0.2"
            className="transition-all duration-300 cursor-pointer hover:brightness-110"
            onMouseEnter={() => setHoveredLand(island.name)}
            onMouseLeave={() => setHoveredLand(null)}
            onClick={() => onLandClick?.(island)}
            style={{ vectorEffect: 'non-scaling-stroke' }}
          />
        ))}

        {/* Render Cities */}
        {CITIES.map((city) => (
          <g 
            key={city.id}
            transform={`translate(${city.x}, ${city.y})`}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredCity(city.name || city.id)}
            onMouseLeave={() => setHoveredCity(null)}
            onClick={() => onCityClick?.(city)}
          >
            {city.type === 'hidden-village' ? (
              <circle r="1" fill="#ef4444" stroke="white" strokeWidth="0.2" />
            ) : city.type === 'poi' ? (
              <rect x="-0.5" y="-0.5" width="1" height="1" fill="#a855f7" stroke="white" strokeWidth="0.2" transform="rotate(45)" />
            ) : (
              <circle r="0.6" fill="#fbbf24" stroke="black" strokeWidth="0.1" />
            )}
            
            {/* City Label (only visible on hover or if major) */}
            {(city.type === 'hidden-village' || hoveredCity === city.name) && (
              <text 
                y="-1.5" 
                textAnchor="middle" 
                fontSize="1" 
                fill="white" 
                stroke="black" 
                strokeWidth="0.1"
                paintOrder="stroke"
                className="pointer-events-none font-bold"
              >
                {city.name}
              </text>
            )}
          </g>
        ))}

        {/* Player Position */}
        {playerPos && (
          <g transform={`translate(${playerPos.x}, ${playerPos.y})`}>
            <circle r="0.8" fill="#3b82f6" stroke="white" strokeWidth="0.2" className="animate-pulse" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default WorldScene;
