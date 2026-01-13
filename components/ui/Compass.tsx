
import React from 'react';

interface CompassProps {
    rotation: number;
}

export const Compass: React.FC<CompassProps> = ({ rotation }) => {
    // In Three.js, rotation.y increases counter-clockwise.
    // User requested 180 degree flip from previous orientation.
    // New Mapping for Camera Heading:
    // rotation = Math.PI (facing -Z) -> North (0°)
    // rotation = 0 (facing +Z)       -> South (180°)
    
    // Calculation: Negate rotation to make degrees increase clockwise, add 180 to flip axis
    const headingDeg = (-rotation * 180 / Math.PI) + 180;
    const heading = (headingDeg + 3600) % 360; // Add large multiple of 360 to handle negative wrap

    const items = [
        { label: 'N', angle: 0 },
        { label: 'NE', angle: 45 },
        { label: 'E', angle: 90 },
        { label: 'SE', angle: 135 },
        { label: 'S', angle: 180 },
        { label: 'SW', angle: 225 },
        { label: 'W', angle: 270 },
        { label: 'NW', angle: 315 },
    ];

    // Landmarks markers recalibrated for the world orientation
    const landmarks = [
        { label: 'Timber Wharf', angle: 45 }, 
        { label: 'Foundry', angle: 135 },      
        { label: 'Dunes', angle: 270 },         
        { label: 'Meadows', angle: 0 },        
    ];

    return (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-64 md:w-96 z-40">
            <div className="relative h-10 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
                {/* Center Indicator */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-blue-500 z-10 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                
                {/* Rotating Strip */}
                <div 
                    className="absolute whitespace-nowrap flex items-center"
                    style={{ transform: `translateX(${-heading}px)` }}
                >
                    {/* Create multiple instances to allow wrapping (3 loops for coverage) */}
                    {[-1, 0, 1].map((loop) => (
                        <div key={loop} className="flex items-center relative" style={{ width: '360px' }}>
                            {items.map((item) => (
                                <div 
                                    key={`${loop}-${item.label}`} 
                                    className="absolute flex flex-col items-center"
                                    style={{ left: `${item.angle}px` }}
                                >
                                    <span className={`text-[10px] font-black tracking-tighter ${item.label.length === 1 ? 'text-white' : 'text-slate-400'}`}>
                                        {item.label}
                                    </span>
                                    <div className={`w-[1px] h-1.5 mt-1 ${item.label.length === 1 ? 'bg-white' : 'bg-slate-600'}`} />
                                </div>
                            ))}
                            {/* Landmarks */}
                            {landmarks.map((mark) => (
                                <div 
                                    key={`${loop}-${mark.label}`}
                                    className="absolute flex flex-col items-center"
                                    style={{ left: `${mark.angle}px` }}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.8)] -mt-6" />
                                    <span className="absolute -top-10 text-[7px] font-bold text-blue-300 uppercase whitespace-nowrap opacity-60">
                                        {mark.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Degrees Label Overlay */}
                <div className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-500 font-bold">
                    {Math.round(heading)}°
                </div>
            </div>
            
            {/* Subtle Gradient Fade at Edges */}
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-900/40 to-transparent pointer-events-none rounded-l-lg" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-900/40 to-transparent pointer-events-none rounded-r-lg" />
        </div>
    );
};
