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

  it('tư thế đợt 2 chưa có ảnh → null (component dùng hình giữ chỗ)', () => {
    expect(poseAsset('think')).toBeNull();
    expect(poseAsset('magnifier')).toBeNull();
    expect(poseAsset('point')).toBeNull();
  });
});
