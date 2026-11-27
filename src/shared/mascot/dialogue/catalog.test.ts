// Catalog lời thoại của Mila (specs/005 tasks T009; spec-Mascot §5.6; MAS-TC-050…052).
import { describe, expect, it } from 'vitest';
import { en as m01En } from '../../../modules/m01/i18n/en';
import { vi as m01Vi } from '../../../modules/m01/i18n/vi';
import { en as m02En } from '../../../modules/m02/i18n/en';
import { vi as m02Vi } from '../../../modules/m02/i18n/vi';
import { MESSAGE_IDS, MESSAGE_META, labelsFor, messageText } from './catalog';
import { en } from './en';
import { vi } from './vi';

const FORBIDDEN = [/đã đến/i, /tới nơi/i, /đến nơi/i, /có mặt/i, /arriv/i, /you're at/i, /made it to/i, /bắt buộc/i, /\bmust\b/i];
const longest = (items: readonly string[]) => items.reduce((a, b) => (b.length > a.length ? b : a), '');

describe('catalog Mila', () => {
  // v1.1 (2026-11-23): + 012, 033, 043, 065, 085 (Phase 10, 14); + 058, 063 (Phase 15); v1.3: − 002 (gộp vào 001);
  // v1.6: + 015…019 (câu chạm theo màn M01)
  it('đủ 52 câu của spec-Mascot §5.6 (v1.6), cùng bộ khóa ở hai ngôn ngữ và trong metadata', () => {
    expect(MESSAGE_IDS).toHaveLength(52);
    expect(MESSAGE_IDS).not.toContain('MSG-MAS-002');
    expect(Object.keys(en.messages).sort()).toEqual(Object.keys(vi.messages).sort());
    expect(Object.keys(MESSAGE_META).sort()).toEqual([...MESSAGE_IDS].sort());
  });

  for (const language of ['vi', 'en'] as const) {
    const cheers = (language === 'vi' ? vi : en).cheers;
    const cheer = cheers.indexOf(longest(cheers));
    // v1.7: tên điểm tiếp theo dài cỡ tên thật dài nhất của fixture (câu tự rút gọn khi quá 90 ký tự)
    const params = { k: 99, n: 99, count: 99, cheer, next: { vi: 'Rừng nguyên sinh cây Đăng ngàn năm', en: 'Primary forest of the thousand-year Dang tree' } };

    it(`${language}: mọi câu ≤ 90 ký tự với tham số dài nhất, không rỗng, tên là Mila`, () => {
      for (const id of MESSAGE_IDS) {
        const text = messageText(language, id, params);
        expect(text.length, `${id}: ${text}`).toBeGreaterThan(0);
        // v1.3: câu 001 của lớp phủ giới thiệu dài hơn theo quyết định 2026-11-23 (spec-Mascot §5.4)
        if (id !== 'MSG-MAS-001') expect(text.length, `${id}: ${text}`).toBeLessThanOrEqual(90);
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

  // v1.2: 011 không còn đếm số tuyến (danh sách đã hiện số kết quả)
  it('tiếng Anh có dạng số ít cho 1 điểm; 011 không đếm, 063 có {n}', () => {
    expect(messageText('en', 'MSG-MAS-011', { count: 3 })).toBe('Here are the routes that suit you!');
    expect(messageText('vi', 'MSG-MAS-063', { n: 5 })).toBe('Bạn đã quét đủ 5 điểm của tuyến. Tuyệt vời!');
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

  it('v1.3: câu giới thiệu một bong bóng, chờ chạm; câu 056 mới; nhãn lớp phủ và công tắc', () => {
    expect(messageText('vi', 'MSG-MAS-001')).toBe(
      'Chào bạn! Mình là Mila, rái cá thám hiểm của Cúc Phương. Mình sẽ đồng hành cùng bạn trong suốt chuyến tham quan này. Cùng chọn một tuyến nhé!',
    );
    expect(messageText('en', 'MSG-MAS-001')).toBe("Hi! I'm Mila, Cúc Phương's otter explorer. I'll be with you throughout this visit. Let's pick a route!");
    expect(MESSAGE_META['MSG-MAS-001'].autoHide).toBe(false);
    // v1.7: câu 056 nói điểm tiếp theo (CHG-MASCOT-2026-11-27-07)
    const next = { vi: 'Động Người Xưa', en: 'Prehistoric Man Cave' };
    expect(messageText('vi', 'MSG-MAS-056', { next })).toBe('Điểm tiếp theo: Động Người Xưa. Tham quan xong thì đi tiếp và quét mã nhé!');
    expect(messageText('en', 'MSG-MAS-056', { next })).toBe('Next stop: Prehistoric Man Cave. Take your time here, then scan there.');
    expect(labelsFor('vi')).toMatchObject({ introHint: 'Chạm để bắt đầu', motion: 'Hiệu ứng chuyển động', motionHint: 'Tắt để Mila và hiệu ứng trang trí đứng yên.' });
    expect(labelsFor('en')).toMatchObject({ introHint: 'Tap to start', motion: 'Motion effects', motionHint: 'Turn off to keep Mila and decorations still.' });
  });
});
