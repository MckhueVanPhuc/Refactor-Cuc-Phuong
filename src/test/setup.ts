import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// findBy*/waitFor chờ tối đa 3 s thay vì 1 s: chunk lazy và render chậm hơn khi cả bộ test chạy song song
// (validation-report D-74). Ca qua vẫn xong ngay khi điều kiện đúng; chỉ ca sai mới chờ lâu hơn.
configure({ asyncUtilTimeout: 3_000 });

afterEach(() => {
  cleanup();
});

// jsdom chưa có matchMedia; component dùng media query cần bản tối thiểu này
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
