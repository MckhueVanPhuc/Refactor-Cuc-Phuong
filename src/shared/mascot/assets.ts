// Registry ảnh Mila (specs/005 research R-08; Asset spec §3–§4). Ảnh do người dùng cung cấp, agent xuất WebP vào
// assets/mascot/web/. Thiếu tệp → `null`, component dùng hình giữ chỗ (không phải nhân vật).
import type { PoseId } from './types';

const files = import.meta.glob<string>('../../../assets/mascot/web/*.webp', { eager: true, query: '?url', import: 'default' });

const byName: ReadonlyMap<string, string> = new Map(
  Object.entries(files).map(([path, url]) => [path.replace(/^.*\//, '').replace(/\.webp$/, ''), url]),
);

const POSE_FILE: Record<PoseId, string> = {
  wave: 'ma-01-wave',
  map: 'ma-02-map',
  think: 'ma-03-think',
  backpack: 'ma-04-backpack',
  binoculars: 'ma-05-binoculars',
  magnifier: 'ma-06-magnifier',
  thumbsUp: 'ma-07-thumbs-up',
  cheer: 'ma-08-cheer',
  confused: 'ma-09-confused',
  rest: 'ma-10-rest',
  avatar: 'ma-11-avatar',
  point: 'ma-13-point',
};

export type PoseAsset = { src240: string; src480: string };

/** Tên tư thế trong tên tệp: `ma-07-thumbs-up` → `thumbs-up` */
const poseName = (pose: PoseId) => POSE_FILE[pose].replace(/^ma-\d\d-/, '');

/** Cỡ nhỏ (240, avatar 96) luôn vào precache; cỡ lớn (480, avatar 192) chỉ cho INTRO/CELEBRATE. */
export function poseAsset(pose: PoseId): PoseAsset | null {
  const base = POSE_FILE[pose];
  const [small, large] = pose === 'avatar' ? ['96', '192'] : ['240', '480'];
  const src240 = byName.get(`${base}-${small}`);
  if (!src240) return null;
  return { src240, src480: byName.get(`${base}-${large}`) ?? src240 };
}

/** Ảnh mắt nhắm MA-20 của tư thế (AN-BLINK; research R-24). Không có → `null`, bỏ cử chỉ chớp mắt. */
export function blinkAsset(pose: PoseId): PoseAsset | null {
  if (pose === 'avatar') return null;
  const base = `ma-20-${poseName(pose)}-blink`;
  const src240 = byName.get(`${base}-240`);
  if (!src240) return null;
  return { src240, src480: byName.get(`${base}-480`) ?? src240 };
}
