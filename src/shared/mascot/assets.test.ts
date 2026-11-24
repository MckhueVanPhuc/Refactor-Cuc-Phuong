// Registry ảnh Mila với ảnh thật trong assets/mascot/web (specs/005 tasks T070; Asset spec §3–§4).
import { describe, expect, it } from 'vitest';
import { blinkAsset, POSE_FALLBACK, poseAsset } from './assets';

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

describe('đợt 4 (specs/006 T040; spec-Mascot v1.4)', () => {
  it('sorry, amazed, walk, peek, proud có ảnh 240/480 của chính tư thế', () => {
    const files = { sorry: 'ma-12-sorry', amazed: 'ma-14-amazed', walk: 'ma-15-walk', peek: 'ma-16-peek', proud: 'ma-17-proud' } as const;
    for (const [pose, file] of Object.entries(files)) {
      const asset = poseAsset(pose as keyof typeof files);
      expect(asset?.src240, pose).toMatch(new RegExp(`${file}-240\.webp$`));
      expect(asset?.src480, pose).toMatch(new RegExp(`${file}-480\.webp$`));
    }
  });

  it('thiếu ảnh thì dùng tư thế cũ gần nhất (contracts §5)', () => {
    expect(POSE_FALLBACK).toEqual({ sorry: 'confused', amazed: 'thumbsUp', walk: 'map', peek: 'rest', proud: 'cheer' });
    for (const fallback of Object.values(POSE_FALLBACK)) expect(poseAsset(fallback!)).not.toBeNull();
  });
});

describe('blinkAsset (MA-20, AN-BLINK; research R-24; MAS-TC-122)', () => {
  it('5 tư thế DOCK có ảnh mắt nhắm 240/480', () => {
    const files = { map: 'map', binoculars: 'binoculars', thumbsUp: 'thumbs-up', backpack: 'backpack', rest: 'rest' } as const;
    for (const [pose, file] of Object.entries(files)) {
      const asset = blinkAsset(pose as keyof typeof files);
      expect(asset?.src240, pose).toMatch(new RegExp(`ma-20-${file}-blink-240\.webp$`));
      expect(asset?.src480, pose).toMatch(new RegExp(`ma-20-${file}-blink-480\.webp$`));
    }
  });

  it('tư thế không có ảnh mắt nhắm → null (cheer đã nhắm mắt; avatar không chớp)', () => {
    for (const pose of ['cheer', 'wave', 'avatar', 'think', 'confused'] as const) expect(blinkAsset(pose), pose).toBeNull();
  });
});
