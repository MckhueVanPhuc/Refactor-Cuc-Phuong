import { describe, expect, it } from 'vitest';
import * as limits from './limits';

const MB = 1_048_576;

// Bảng chép từ spec-M03 §5.3 (provisional). Đổi giá trị ở spec thì đổi cả bảng này và limits.ts.
const SPEC_5_3: Record<string, unknown> = {
  NAME_MAX_CHARS: 100,
  ROUTE_SHORT_DESC_MAX_CHARS: 160,
  ROUTE_DESC_MAX_CHARS: 2000,
  ROUTE_START_MAX_CHARS: 500,
  ROUTE_PARTICIPATION_MAX_CHARS: 300,
  ROUTE_PREPARATION_MAX_CHARS: 500,
  ROUTE_BEST_TIME_MAX_CHARS: 200,
  ROUTE_SAFETY_WARNING_MAX_CHARS: 500,
  ROUTE_HIGHLIGHTS_MAX_ITEMS: 5,
  ROUTE_HIGHLIGHT_MAX_CHARS: 80,
  CAPTION_MAX_CHARS: 200,
  NOTE_MAX_CHARS: 300,
  QR_INTRO_MIN_CHARS: 30,
  QR_INTRO_MAX_CHARS: 2000,
  ROUTE_GALLERY_MAX_IMAGES: 8,
  ROUTE_DISTANCE_MAX_KM: 100,
  ROUTE_DURATION_MAX_MIN: 1440,
  ROUTE_CHECKPOINTS_MAX_ITEMS: 30,
  CHECKPOINT_QR_MAX_ITEMS: 20,
  REPORT_MAX_SPAN_DAYS: 366,
  QR_MAX_IMAGES: 5,
  QR_MAX_AV_FILES: 3,
  IMAGE_MAX_MB: 2,
  AUDIO_MAX_MB: 5,
  VIDEO_MAX_MB: 30,
  OFFLINE_PACKAGE_MAX_MB: 50,
  EMAIL_MAX_CHARS: 254,
  QR_CODE_DISPLAY_SUFFIX_CHARS: 6,
  QR_PRINT_ERROR_CORRECTION: 'Q',
  QR_PRINT_PNG_MIN_PX: 1024,
  QR_PRINT_QUIET_ZONE_MODULES: 4,
  QR_PRINT_MIN_SIZE_CM: 3,
};

describe('giới hạn provisional (spec-M03 §5.3)', () => {
  it.each(Object.entries(SPEC_5_3))('%s', (name, value) => {
    expect((limits as Record<string, unknown>)[name]).toBe(value);
  });

  it('1 MB = 1 048 576 byte', () => {
    expect(limits.BYTES_PER_MB).toBe(MB);
    expect(limits.megabytesToBytes(limits.IMAGE_MAX_MB)).toBe(2 * MB);
    expect(limits.MAX_FILE_BYTES).toEqual({ IMAGE: 2 * MB, AUDIO: 5 * MB, VIDEO: 30 * MB });
    expect(limits.OFFLINE_PACKAGE_MAX_BYTES).toBe(50 * MB);
  });

  it('MIME hỗ trợ theo loại media', () => {
    expect(limits.SUPPORTED_MIME_TYPES).toEqual({
      IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
      AUDIO: ['audio/mpeg', 'audio/mp4'],
      VIDEO: ['video/mp4'],
    });
  });

  it('báo cáo mặc định 30 ngày, không phải mức tối đa', () => {
    expect(limits.REPORT_DEFAULT_SPAN_DAYS).toBe(30);
  });
});
