import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { AIUtils } from '../AIUtils';
import { PlayerUtils } from '../../player/PlayerUtils';

describe('AIUtils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(PlayerUtils, 'isWithinBounds').mockReturnValue(true);
  });

  it('normalizes angle differences across the -π/π boundary', () => {
    const currentRotation = Math.PI - 0.1;
    const targetRotation = -Math.PI + 0.1;
    const targetPos = new THREE.Vector3(Math.sin(targetRotation), 0, Math.cos(targetRotation));
    const currentPos = new THREE.Vector3(0, 0, 0);

    const result = AIUtils.smoothLookAt(currentRotation, targetPos, currentPos, 1, 1);

    expect(result - currentRotation).toBeCloseTo(0.2, 5);
  });

  it('returns the forward direction when no collision is detected', () => {
    vi.spyOn(PlayerUtils, 'checkBoxCollision').mockReturnValue(false);
    const rotationY = 0;

    const result = AIUtils.getAdvancedAvoidanceSteering(
      new THREE.Vector3(0, 0, 0),
      rotationY,
      new THREE.Vector3(1, 1, 1),
      []
    );

    expect(result).toBeCloseTo(rotationY, 5);
  });

  it('steers to the nearest open side when forward is blocked', () => {
    vi.spyOn(PlayerUtils, 'checkBoxCollision').mockImplementation((pos) => {
      return Math.abs(pos.x) < 0.01 && pos.z > 2.9;
    });

    const rotationY = 0;
    const result = AIUtils.getAdvancedAvoidanceSteering(
      new THREE.Vector3(0, 0, 0),
      rotationY,
      new THREE.Vector3(1, 1, 1),
      []
    );

    expect(result).toBeCloseTo(rotationY + Math.PI / 6, 5);
  });

  it('slides along the X axis when forward motion is blocked', () => {
    vi.spyOn(PlayerUtils, 'checkBoxCollision').mockImplementation((pos) => {
      const isFullMove = pos.x > 0.7 && pos.z > 0.7;
      const isXSlide = pos.x > 0.7 && Math.abs(pos.z) < 0.01;
      if (isFullMove) return true;
      if (isXSlide) return false;
      return true;
    });

    const currentPos = new THREE.Vector3(0, 0, 0);
    const rotationY = Math.PI / 4;
    const nextPos = AIUtils.getNextPosition(
      currentPos,
      rotationY,
      1,
      1,
      new THREE.Vector3(1, 1, 1),
      []
    );

    expect(nextPos.x).toBeCloseTo(Math.sin(rotationY), 5);
    expect(nextPos.z).toBeCloseTo(0, 5);
  });

  it('slides along the Z axis when forward and X movement are blocked', () => {
    vi.spyOn(PlayerUtils, 'checkBoxCollision').mockImplementation((pos) => {
      const isFullMove = pos.x > 0.7 && pos.z > 0.7;
      const isXSlide = pos.x > 0.7 && Math.abs(pos.z) < 0.01;
      const isZSlide = Math.abs(pos.x) < 0.01 && pos.z > 0.7;
      if (isFullMove) return true;
      if (isXSlide) return true;
      if (isZSlide) return false;
      return true;
    });

    const currentPos = new THREE.Vector3(0, 0, 0);
    const rotationY = Math.PI / 4;
    const nextPos = AIUtils.getNextPosition(
      currentPos,
      rotationY,
      1,
      1,
      new THREE.Vector3(1, 1, 1),
      []
    );

    expect(nextPos.x).toBeCloseTo(0, 5);
    expect(nextPos.z).toBeCloseTo(Math.cos(rotationY), 5);
  });
});
