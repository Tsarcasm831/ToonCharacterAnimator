
import React, { useEffect, useRef, useState } from 'react';
import nipplejs from 'nipplejs';
import { Game } from '../../../game/core/Game';

interface MobileControlsProps {
    game: Game | null;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ game }) => {
    const leftRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);
    const joystickLeft = useRef<any>(null);
    const joystickRight = useRef<any>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Robust mobile/touch detection
        const checkMobile = () => {
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
            setIsMobile(hasTouch && coarsePointer);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!isMobile || !leftRef.current || !rightRef.current || !game) return;

        // --- Left Joystick: Movement ---
        joystickLeft.current = nipplejs.create({
            zone: leftRef.current,
            mode: 'static',
            position: { left: '80px', bottom: '80px' },
            color: 'white',
            size: 120
        });

        joystickLeft.current.on('move', (evt: any, data: any) => {
            if (data.vector) {
                const x = data.vector.x;
                const y = data.vector.y;
                game['inputManager'].setJoystickMove(x, y);
            }
        });

        joystickLeft.current.on('end', () => {
            game['inputManager'].setJoystickMove(0, 0);
        });

        // --- Right Joystick: Camera ---
        joystickRight.current = nipplejs.create({
            zone: rightRef.current,
            mode: 'static',
            position: { right: '80px', bottom: '80px' },
            color: 'white',
            size: 120
        });

        joystickRight.current.on('move', (evt: any, data: any) => {
            if (data.vector) {
                game['inputManager'].setJoystickLook(data.vector.x, data.vector.y);
            }
        });

        joystickRight.current.on('end', () => {
            game['inputManager'].setJoystickLook(0, 0);
        });

        return () => {
            joystickLeft.current?.destroy();
            joystickRight.current?.destroy();
        };
    }, [game, isMobile]);

    if (!isMobile) return null;

    return (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden select-none">
            {/* Containers for joysticks */}
            <div ref={leftRef} className="absolute bottom-0 left-0 w-1/2 h-1/2 pointer-events-auto no-capture" />
            <div ref={rightRef} className="absolute bottom-0 right-0 w-1/2 h-1/2 pointer-events-auto no-capture" />
            
            {/* Visual labels */}
            <div className="absolute bottom-4 left-20 text-[10px] font-black text-white/20 uppercase tracking-widest">Move</div>
            <div className="absolute bottom-4 right-20 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Look</div>
        </div>
    );
};
