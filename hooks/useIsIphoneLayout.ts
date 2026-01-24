import { useEffect, useState } from 'react';

export const useIsIphoneLayout = (): boolean => {
    const [isIphoneLayout, setIsIphoneLayout] = useState(false);

    useEffect(() => {
        const checkViewport = () => {
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
            const smallViewport = window.matchMedia('(max-width: 430px)').matches;
            setIsIphoneLayout(hasTouch && coarsePointer && smallViewport);
        };

        checkViewport();
        window.addEventListener('resize', checkViewport);
        return () => window.removeEventListener('resize', checkViewport);
    }, []);

    return isIphoneLayout;
};
