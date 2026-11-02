// Bản sao schema của Edge `session-intake` phải giống hệt nguồn ngoài các dòng import (tasks M03 T195):
// Edge chỉ import được code trong supabase/functions, nên schema và phần dùng chung được chép sang _shared.
// Đổi schema thì sửa ở đây trước, rồi chép lại sang supabase/functions/_shared.
import { describe, expect, it } from 'vitest';
import commonSource from './common.ts?raw';
import recordSource from './sessionSyncRecord.ts?raw';
import commonCopy from '../../../supabase/functions/_shared/common.ts?raw';
import recordCopy from '../../../supabase/functions/_shared/sessionSyncRecord.ts?raw';

const withoutImports = (text: string) =>
  text
    .split(/\r?\n/)
    .filter((line) => !line.startsWith('import '))
    .join('\n');

describe('schema của Edge session-intake (bản sao)', () => {
  it('sessionSyncRecord.ts giống hệt nguồn ngoài dòng import', () => {
    expect(withoutImports(recordCopy)).toBe(withoutImports(recordSource));
  });

  it('common.ts giống hệt nguồn ngoài dòng import', () => {
    expect(withoutImports(commonCopy)).toBe(withoutImports(commonSource));
  });

  it('bản sao import zod qua import map và common.ts có đuôi .ts (Deno)', () => {
    expect(recordCopy).toContain("import { z } from 'zod';");
    expect(recordCopy).toContain("from './common.ts';");
  });
});
