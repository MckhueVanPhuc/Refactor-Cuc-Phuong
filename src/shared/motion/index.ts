// Public entry của chuyển động dùng chung (specs/006 contracts/motion-ui-contract.md §2). Không import src/modules, src/app.
export { getMotion, setMotion, subscribeMotion, useMotion } from './store';
export { MotionSwitch } from './MotionSwitch';
export { readMotionLevel, useMotionAttributes, useMotionLevel, type MotionLevel } from './level';
