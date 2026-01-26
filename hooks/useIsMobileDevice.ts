import { useEffect, useState } from 'react';

export const useIsMobileDevice = (): boolean => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
            setIsMobile(hasTouch && coarsePointer);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};
