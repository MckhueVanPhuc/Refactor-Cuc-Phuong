// Đoạn văn nhiều dòng do tác giả gõ trong M03 phải giữ dấu xuống dòng ở mọi màn du khách (validation-report M02 §9, P-1):
// jsdom không áp CSS nên kiểm thẳng quy tắc trong file CSS module.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Thân của khối CSS có đúng bộ chọn `selector` (bỏ comment) */
function rule(cssPath: string, selector: string): string {
  const css = readFileSync(join(process.cwd(), cssPath), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const block of css.split('}')) {
    const [head, body] = block.split('{');
    if (body !== undefined && head!.split(',').some((part) => part.trim() === selector)) return body;
  }
  throw new Error(`Không thấy ${selector} trong ${cssPath}`);
}

describe('giữ dấu xuống dòng của tác giả', () => {
  it.each([
    ['src/modules/m02/content/ScanContent.module.css', '.introduction'],
    ['src/modules/m03/visit-points/preview/VisitorPreview.module.css', '.intro'],
    ['src/modules/m01/route-detail/RouteDetailPage.module.css', '.text'],
  ])('%s %s có white-space: pre-line', (cssPath, selector) => {
    expect(rule(cssPath, selector)).toMatch(/white-space:\s*pre-line/);
  });
});
