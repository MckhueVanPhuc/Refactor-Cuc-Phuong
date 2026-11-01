// Khoảng ngày của báo cáo (tasks T152; BR-M03-J05; research R-17): mặc định 30 ngày lịch kết thúc hôm nay tại
// Asia/Ho_Chi_Minh; hai ngày phải có cùng nhau; fromDate ≤ toDate; tối đa REPORT_MAX_SPAN_DAYS ngày; dd/mm/yyyy → YYYY-MM-DD.
import { describe, expect, it } from 'vitest';
import { REPORT_MAX_SPAN_DAYS } from '../config/limits';
import { defaultReportDates, resolveReportDates, vietnamToday } from './reportInput';

// 18:00 UTC ngày 01/11 là 01:00 ngày 02/11 ở Việt Nam
const NOW = new Date('2026-11-01T18:00:00Z');

describe('khoảng ngày báo cáo (BR-M03-J05)', () => {
  it('hôm nay tính theo giờ Việt Nam, không theo máy', () => {
    expect(vietnamToday(NOW)).toBe('2026-11-02');
    expect(vietnamToday(new Date('2026-11-01T16:59:00Z'))).toBe('2026-11-01');
  });

  it('mặc định 30 ngày lịch kết thúc hôm nay, tính cả hai đầu', () => {
    expect(defaultReportDates(NOW)).toEqual({ fromDate: '2026-10-04', toDate: '2026-11-02' });
  });

  it('không nhập ngày nào → dùng mặc định', () => {
    expect(resolveReportDates({ fromText: '', toText: '  ' }, NOW)).toEqual({ ok: true, fromDate: '2026-10-04', toDate: '2026-11-02' });
  });

  it('nhập dd/mm/yyyy → YYYY-MM-DD', () => {
    expect(resolveReportDates({ fromText: '01/10/2026', toText: '31/10/2026' }, NOW)).toEqual({ ok: true, fromDate: '2026-10-01', toDate: '2026-10-31' });
    expect(resolveReportDates({ fromText: '5/3/2026', toText: '5/3/2026' }, NOW)).toEqual({ ok: true, fromDate: '2026-03-05', toDate: '2026-03-05' });
  });

  it('chỉ một ngày, ngày sai dạng hoặc không có thật → MSG-REPORT-DATES-INVALID', () => {
    const invalid = { ok: false, messageKey: 'MSG-REPORT-DATES-INVALID' };
    expect(resolveReportDates({ fromText: '01/10/2026', toText: '' }, NOW)).toEqual(invalid);
    expect(resolveReportDates({ fromText: '', toText: '31/10/2026' }, NOW)).toEqual(invalid);
    expect(resolveReportDates({ fromText: '2026-10-01', toText: '31/10/2026' }, NOW)).toEqual(invalid);
    expect(resolveReportDates({ fromText: '31/02/2026', toText: '31/10/2026' }, NOW)).toEqual(invalid);
  });

  it('fromDate > toDate bị từ chối', () => {
    expect(resolveReportDates({ fromText: '02/10/2026', toText: '01/10/2026' }, NOW)).toEqual({ ok: false, messageKey: 'MSG-REPORT-DATES-INVALID' });
  });

  it(`tối đa ${REPORT_MAX_SPAN_DAYS} ngày tính cả hai đầu; ${REPORT_MAX_SPAN_DAYS + 1} ngày → MSG-REPORT-SPAN`, () => {
    expect(resolveReportDates({ fromText: '01/01/2026', toText: '01/01/2027' }, NOW)).toEqual({ ok: true, fromDate: '2026-01-01', toDate: '2027-01-01' });
    expect(resolveReportDates({ fromText: '01/01/2026', toText: '02/01/2027' }, NOW)).toEqual({ ok: false, messageKey: 'MSG-REPORT-SPAN' });
  });
});
