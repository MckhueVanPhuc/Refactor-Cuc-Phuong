// tasks M03 T210; CHG-M03-2026-11-05-01 §6.
import { describe, expect, it } from 'vitest';
import { redactEvent } from './redactEvent';

const ORIGIN = 'https://quest.example';
const redacted = (path: string) => redactEvent({ url: `${ORIGIN}${path}`, type: 'pageview' });

describe('redactEvent', () => {
  it.each(['/admin', '/admin/', '/admin/invitation#access_token=x', '/admin/recovery?code=x', '/ADMIN/login'])(
    '%s → không gửi',
    (path) => {
      expect(redacted(path)).toBeNull();
    },
  );

  it.each(['/q/qr-a1-1', '/q/qr-a1-1/', '/q/qr-a1-1?utm=x#top'])('%s → /q/[id]', (path) => {
    expect(redacted(path)?.url).toBe(`${ORIGIN}/q/[id]`);
  });

  it('đường dẫn khác: bỏ query và hash, giữ đường dẫn và các trường còn lại', () => {
    expect(redacted('/routes/route-a?ref=x#y')).toEqual({ url: `${ORIGIN}/routes/route-a`, type: 'pageview' });
    expect(redacted('/')?.url).toBe(`${ORIGIN}/`);
  });

  it('không nhầm đường dẫn chỉ có cùng tiền tố', () => {
    expect(redacted('/administrator')?.url).toBe(`${ORIGIN}/administrator`);
    expect(redacted('/q/a/b')?.url).toBe(`${ORIGIN}/q/a/b`);
  });
});
