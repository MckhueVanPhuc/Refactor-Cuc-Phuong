// Public entry của mascot Mila cho M01/M02 (specs/005 research R-02). Module chỉ import từ file này.
export { emitMascotEvent, holdMascotSignal, type CtaId, type MascotEvent } from './events';
export { isMascotEnabled } from './flag';
export { MascotFigure } from './MascotFigure';
export { MascotMotionToggle } from './MascotMotionToggle';
export { MascotSlot } from './MascotSlot';
export type { Mode, PoseId } from './types';
