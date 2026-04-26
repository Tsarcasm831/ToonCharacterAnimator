export type BoneRotationMap = Record<string, [number, number, number]>;
export type BonePositionMap = Record<string, [number, number, number]>;

export interface AnimationFrame {
    index: number;
    time: number;
    rotations: BoneRotationMap;
    positions?: BonePositionMap;
}

export interface AnimationClip {
    action: string;
    fps: number;
    frameCount: number;
    duration: number;
    loop: boolean;
    bones: string[];
    frames: AnimationFrame[];
}

const clipCache = new Map<string, AnimationClip>();

function validateAnimationClip(value: unknown): AnimationClip {
    const clip = value as Partial<AnimationClip>;

    if (!clip || typeof clip !== 'object') {
        throw new Error('Animation clip payload must be an object.');
    }

    if (!clip.action || typeof clip.action !== 'string') {
        throw new Error('Animation clip is missing a valid action name.');
    }

    if (typeof clip.fps !== 'number') {
        throw new Error(`Animation clip "${clip.action}" is missing a numeric fps.`);
    }

    if (!Array.isArray(clip.frames)) {
        throw new Error(`Animation clip "${clip.action}" is missing a frames array.`);
    }

    return {
        action: clip.action,
        fps: clip.fps,
        frameCount: typeof clip.frameCount === 'number' ? clip.frameCount : clip.frames.length,
        duration: typeof clip.duration === 'number' ? clip.duration : clip.frames.length / clip.fps,
        loop: clip.loop ?? true,
        bones: Array.isArray(clip.bones) ? clip.bones : [],
        frames: clip.frames,
    };
}

export async function loadAnimationClip(name: string, url?: string): Promise<AnimationClip> {
    const cached = clipCache.get(name);
    if (cached) return cached;

    const clipUrl = url ?? `/animations/${name}.json`;
    const response = await fetch(clipUrl);

    if (!response.ok) {
        throw new Error(`Failed to load animation clip "${name}" from ${clipUrl}: ${response.status}`);
    }

    const clip = validateAnimationClip(await response.json());
    clipCache.set(name, clip);
    return clip;
}

export function getCachedAnimationClip(name: string): AnimationClip | undefined {
    return clipCache.get(name);
}

export function sampleAnimationClip(clip: AnimationClip, normalizedTime: number): AnimationFrame {
    if (clip.frames.length === 0) {
        throw new Error(`Animation clip "${clip.action}" has no frames.`);
    }

    if (clip.frames.length === 1) {
        return clip.frames[0];
    }

    const clampedTime = Number.isFinite(normalizedTime) ? normalizedTime : 0;
    const wrappedTime = clip.loop
        ? ((clampedTime % 1) + 1) % 1
        : Math.min(Math.max(clampedTime, 0), 1);
    const frameIndex = Math.min(
        clip.frames.length - 1,
        Math.floor(wrappedTime * clip.frames.length)
    );

    return clip.frames[frameIndex];
}
