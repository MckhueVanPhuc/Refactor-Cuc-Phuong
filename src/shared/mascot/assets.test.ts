// Registry ảnh Mila với ảnh thật trong assets/mascot/web (specs/005 tasks T070; Asset spec §3–§4).
import { describe, expect, it } from 'vitest';
import { poseAsset } from './assets';

describe('poseAsset', () => {
  it('9 tư thế đợt 1 có ảnh 240/480; avatar dùng 96/192', () => {
    const poses = ['wave', 'map', 'backpack', 'binoculars', 'thumbsUp', 'cheer', 'confused', 'rest'] as const;
    for (const pose of poses) {
      const asset = poseAsset(pose);
      expect(asset?.src240, pose).toMatch(/ma-\d\d-[a-z-]+-240\.webp$/);
      expect(asset?.src480, pose).toMatch(/ma-\d\d-[a-z-]+-480\.webp$/);
    }
    expect(poseAsset('avatar')).toEqual({ src240: expect.stringMatching(/ma-11-avatar-96\.webp$/), src480: expect.stringMatching(/ma-11-avatar-192\.webp$/) });
  });

  it('đợt 2 (2026-11-23): think, magnifier, point có ảnh 240/480', () => {
    for (const pose of ['think', 'magnifier', 'point'] as const) {
      expect(poseAsset(pose)?.src240, pose).toMatch(/ma-\d\d-[a-z-]+-240\.webp$/);
      expect(poseAsset(pose)?.src480, pose).toMatch(/ma-\d\d-[a-z-]+-480\.webp$/);
    }
  });
});
