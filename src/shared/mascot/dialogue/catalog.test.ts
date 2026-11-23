// Catalog lời thoại của Mila (specs/005 tasks T009; spec-Mascot §5.6; MAS-TC-050…052).
import { describe, expect, it } from 'vitest';
import { en as m01En } from '../../../modules/m01/i18n/en';
import { vi as m01Vi } from '../../../modules/m01/i18n/vi';
import { en as m02En } from '../../../modules/m02/i18n/en';
import { vi as m02Vi } from '../../../modules/m02/i18n/vi';
import { MESSAGE_IDS, MESSAGE_META, labelsFor, messageText } from './catalog';
import { en } from './en';
import { vi } from './vi';

const FORBIDDEN = [/đã đến/i, /tới nơi/i, /có mặt/i, /arriv/i, /you're at/i, /made it to/i, /bắt buộc/i, /\bmust\b/i];
const longest = (items: readonly string[]) => items.reduce((a, b) => (b.length > a.length ? b : a), '');

describe('catalog Mila', () => {
  // v1.1 (2026-11-23): + 012, 033, 043, 065, 085 (Phase 10, 14); 058, 063 thêm ở Phase 15 → 48
  it('đủ 46 câu của spec-Mascot §5.6 (v1.1, trước Phase 15), cùng bộ khóa ở hai ngôn ngữ và trong metadata', () => {
    expect(MESSAGE_IDS).toHaveLength(46);
    expect(Object.keys(en.messages).sort()).toEqual(Object.keys(vi.messages).sort());
    expect(Object.keys(MESSAGE_META).sort()).toEqual([...MESSAGE_IDS].sort());
  });

  for (const language of ['vi', 'en'] as const) {
    const cheers = (language === 'vi' ? vi : en).cheers;
    const cheer = cheers.indexOf(longest(cheers));
    const params = { k: 99, n: 99, count: 99, cheer };

    it(`${language}: mọi câu ≤ 90 ký tự với tham số dài nhất, không rỗng, tên là Mila`, () => {
      for (const id of MESSAGE_IDS) {
        const text = messageText(language, id, params);
        expect(text.length, `${id}: ${text}`).toBeGreaterThan(0);
        expect(text.length, `${id}: ${text}`).toBeLessThanOrEqual(90);
        expect(text).not.toMatch(/\{\w+\}/);
      }
      expect(messageText(language, 'MSG-MAS-001')).toContain('Mila');
    });

    it(`${language}: không câu nào chứa từ cấm (SC-M02-013; BR-MAS-04)`, () => {
      for (const id of MESSAGE_IDS) {
        const text = messageText(language, id, params);
        for (const re of FORBIDDEN) expect(text, `${id}`).not.toMatch(re);
      }
    });
  }

  it('tiếng Anh có dạng số ít cho 1 tuyến và 1 điểm', () => {
    expect(messageText('en', 'MSG-MAS-011', { count: 1 })).toBe("1 route matches what you're after!");
    expect(messageText('en', 'MSG-MAS-011', { count: 3 })).toBe("3 routes match what you're after!");
    expect(messageText('en', 'MSG-MAS-062', { k: 1 })).toBe('We scanned 1 stop together today. What a trip!');
  });

  it('nhãn nút trùng đúng chuỗi i18n hiện có của M01/M02', () => {
    expect(labelsFor('vi').ctaRecommend).toBe(m01Vi.nav.recommend);
    expect(labelsFor('en').ctaRecommend).toBe(m01En.nav.recommend);
    expect(labelsFor('vi').ctaSeeAll).toBe(m01Vi.recommend.seeAllRoutes);
    expect(labelsFor('en').ctaSeeAll).toBe(m01En.recommend.seeAllRoutes);
    expect(labelsFor('vi').ctaCloseCamera).toBe(m02Vi.scanner.close);
    expect(labelsFor('en').ctaCloseCamera).toBe(m02En.scanner.close);
    expect(labelsFor('vi')).toMatchObject({ ask: 'Hỏi Mila', dismiss: 'Đóng lời nhắn', notNow: 'Chưa' });
    expect(labelsFor('en')).toMatchObject({ ask: 'Ask Mila', dismiss: 'Dismiss message', notNow: 'Not now' });
  });

  it('metadata: P0–P7, CTA chỉ trên câu không tự ẩn', () => {
    for (const id of MESSAGE_IDS) {
      const meta = MESSAGE_META[id];
      expect(meta.priority).toBeGreaterThanOrEqual(0);
      expect(meta.priority).toBeLessThanOrEqual(7);
      if (meta.cta?.length) expect(meta.autoHide, id).toBe(false);
    }
  });
});
