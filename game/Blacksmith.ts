import * as THREE from 'three';
import { PlayerConfig, DEFAULT_CONFIG } from '../types';
import { PlayerModel } from './PlayerModel';
import { PlayerAnimator } from './PlayerAnimator';
import { Environment } from './Environment';
import { PlayerUtils } from './player/PlayerUtils';

export class Blacksmith {
    scene: THREE.Scene;
    model: PlayerModel;
    animator: PlayerAnimator;
    config: PlayerConfig;
