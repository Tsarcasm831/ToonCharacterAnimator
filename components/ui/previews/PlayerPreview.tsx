import React from 'react';
import type { PlayerConfig, PlayerInput } from '../../../types';
import { PlayerPreview as StandalonePlayerPreview } from '../../../standalone_cc/src/components/ui/previews/PlayerPreview';
import {
    DEFAULT_CONFIG as STANDALONE_DEFAULT_CONFIG,
    type PlayerConfig as StandalonePlayerConfig,
    type PlayerInput as StandalonePlayerInput
} from '../../../standalone_cc/src/types';

interface PlayerPreviewProps {
    config: PlayerConfig;
    manualInput?: Partial<PlayerInput>;
    onZoomChange?: (zoom: number) => void;
}

export const PlayerPreview: React.FC<PlayerPreviewProps> = ({ config, manualInput, onZoomChange }) => {
    const normalizedConfig = React.useMemo<StandalonePlayerConfig>(() => ({
        ...STANDALONE_DEFAULT_CONFIG,
        ...(config as unknown as Partial<StandalonePlayerConfig>),
        equipment: {
            ...STANDALONE_DEFAULT_CONFIG.equipment,
            ...((config as unknown as Partial<StandalonePlayerConfig>)?.equipment ?? {})
        }
    }), [config]);

    const normalizedInput = React.useMemo<Partial<StandalonePlayerInput>>(() => ({
        ...(manualInput as unknown as Partial<StandalonePlayerInput>)
    }), [manualInput]);

    return (
        <StandalonePlayerPreview
            config={normalizedConfig}
            manualInput={normalizedInput}
            onZoomChange={onZoomChange}
        />
    );
};
