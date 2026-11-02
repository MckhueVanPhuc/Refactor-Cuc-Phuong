import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ACTION_NAMES, actionName, changeLine, subjectLabel } from './auditFormat';

describe('auditFormat (BR-M03-F08, L10, L11)', () => {
  it('mọi giá trị action của admin-command §5 có tên hiển thị', () => {
    const contract = readFileSync(join(process.cwd(), 'specs/003-m03-operations-content-administration/contracts/admin-command-contract.md'), 'utf8');
    const section = contract.slice(contract.indexOf('**Giá trị `audit_records.action`**'));
    const listed = [...section.slice(0, section.indexOf('\n')).matchAll(/`([A-Z_]+)`/g)].map((m) => m[1]!).filter((code) => code !== 'audit_records');
    expect(listed.length).toBeGreaterThan(20);
    expect(listed.filter((code) => !Object.hasOwn(ACTION_NAMES, code))).toEqual([]);
  });

  it('action lạ vẫn hiện bằng chữ, không hiện mã', () => {
    expect(actionName('PUBLISHED')).toBe('Xuất bản');
    expect(actionName('SOMETHING_NEW')).toBe('Thao tác quản trị');
  });

  it('dòng trước/sau và tên mục', () => {
    expect(changeLine({ fieldLabel: 'Quãng đường (km)', before: '4,5', after: '6' })).toBe('Quãng đường (km): 4,5 → 6');
    expect(changeLine({ fieldLabel: 'Cảnh báo an toàn (tiếng Việt)', before: '', after: 'Dốc trơn' })).toBe('Cảnh báo an toàn (tiếng Việt): — → Dốc trơn');
    expect(subjectLabel({ subjectType: 'ROUTE', subjectName: 'Tuyến A' })).toBe('Tuyến: Tuyến A');
    expect(subjectLabel({ subjectType: 'ACCOUNT' })).toBe('Tài khoản');
  });
});
