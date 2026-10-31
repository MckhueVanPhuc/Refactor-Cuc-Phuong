import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { QR_PRINT_MIN_SIZE_CM, QR_PRINT_PNG_MIN_PX, QR_PRINT_QUIET_ZONE_MODULES } from '../../config/limits';
import { formatMessage } from '../../messages/catalog';
import { QrPrintPanel } from './QrPrintPanel';
import { OFFLINE_LINE, TEST_STAMP, printLabelLines, qrPublicLink, renderQrPng, renderQrSvg } from './renderQr';

const QR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" shape-rendering="crispEdges"><path d="M0 0h1v1H0z"/></svg>';

const qrcode = vi.hoisted(() => ({
  toString: vi.fn(async () => ''),
  toCanvas: vi.fn(async () => undefined),
}));
vi.mock('qrcode', () => ({ default: qrcode, ...qrcode }));

const ID = 'AbCdEfGhIjKlMnOpQr12';
const BASE = 'http://localhost:5174';

describe('ảnh mã QR để in (admin-ui-flow §4; BR-M03-B04, B05; SC-M03-036, 037)', () => {
  beforeEach(() => {
    qrcode.toString.mockResolvedValue(QR_SVG);
  });

  it('nội dung mã đúng {VITE_QR_PUBLIC_BASE_URL}/q/{qrIdentifier}, không có tham số khác', () => {
    expect(qrPublicLink(ID, BASE)).toBe(`${BASE}/q/${ID}`);
  });

  it('dòng chữ dưới mã: "Mã …{6 ký tự}"; cảnh báo song ngữ khi "Cần tải trước"; dấu bản thử ngoài Production', () => {
    expect(printLabelLines({ qrIdentifier: ID, connectivityMode: 'ONLINE_AVAILABLE' }, true)).toEqual([`Mã …${ID.slice(-6)}`]);
    expect(printLabelLines({ qrIdentifier: ID, connectivityMode: 'OFFLINE_REQUIRED' }, false)).toEqual([
      `Mã …${ID.slice(-6)}`,
      OFFLINE_LINE,
      TEST_STAMP,
    ]);
    expect(OFFLINE_LINE).toBe(
      'Khu vực không có sóng — hãy tải dữ liệu tuyến trước khi đến / No signal here — download the route data before you come',
    );
    expect(TEST_STAMP).toBe('BẢN THỬ — KHÔNG DÁN RA THỰC ĐỊA');
  });

  it('SVG: gọi qrcode với đúng link, mức sửa lỗi Q, lề 4 module; có các dòng chữ', async () => {
    const svg = await renderQrSvg({ qrIdentifier: ID, connectivityMode: 'OFFLINE_REQUIRED' }, { baseUrl: BASE, isProductionBuild: false });
    expect(qrcode.toString).toHaveBeenCalledWith(`${BASE}/q/${ID}`, {
      type: 'svg',
      errorCorrectionLevel: 'Q',
      margin: QR_PRINT_QUIET_ZONE_MODULES,
    });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain(`Mã …${ID.slice(-6)}`);
    expect(svg).toContain('Khu vực không có sóng');
    expect(svg).toContain(TEST_STAMP);
  });

  it('SVG ở build Production không có dấu bản thử', async () => {
    const svg = await renderQrSvg({ qrIdentifier: ID, connectivityMode: 'ONLINE_AVAILABLE' }, { baseUrl: BASE, isProductionBuild: true });
    expect(svg).not.toContain(TEST_STAMP);
    expect(svg).not.toContain('Khu vực không có sóng');
  });

  describe('PNG', () => {
    const contexts: { fillText: ReturnType<typeof vi.fn> }[] = [];
    let created: HTMLCanvasElement[] = [];

    beforeEach(() => {
      created = [];
      const originalCreate = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: ElementCreationOptions) => {
        const element = originalCreate(tag, options);
        if (tag === 'canvas') created.push(element as HTMLCanvasElement);
        return element;
      });
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
        const context = {
          fillStyle: '',
          font: '',
          textAlign: '',
          textBaseline: '',
          fillRect: vi.fn(),
          drawImage: vi.fn(),
          fillText: vi.fn(),
        };
        contexts.push(context);
        return context as unknown as CanvasRenderingContext2D;
      });
      vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback: BlobCallback) {
        callback(new Blob(['png'], { type: 'image/png' }));
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      contexts.length = 0;
    });

    it(`rộng ít nhất ${QR_PRINT_PNG_MIN_PX} px, mức Q, lề 4 module, vẽ đủ các dòng chữ`, async () => {
      const blob = await renderQrPng({ qrIdentifier: ID, connectivityMode: 'OFFLINE_REQUIRED' }, { baseUrl: BASE, isProductionBuild: false });
      expect(blob.type).toBe('image/png');
      expect(qrcode.toCanvas).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), `${BASE}/q/${ID}`, {
        errorCorrectionLevel: 'Q',
        margin: QR_PRINT_QUIET_ZONE_MODULES,
        width: QR_PRINT_PNG_MIN_PX,
      });
      expect(created.every((canvas) => canvas.width >= QR_PRINT_PNG_MIN_PX)).toBe(true);
      const drawn = contexts.flatMap((context) => context.fillText.mock.calls.map((call) => String(call[0])));
      expect(drawn).toContain(`Mã …${ID.slice(-6)}`);
      expect(drawn).toContain(TEST_STAMP);
      expect(drawn.join(' ')).toContain('Khu vực không có sóng');
    });
  });
});

describe('màn tải ảnh in (admin-ui-flow §4)', () => {
  it(`ghi độ rộng in tối thiểu ${QR_PRINT_MIN_SIZE_CM} cm; QR chưa hoạt động → MSG-QR-PRINT-UNPUBLISHED`, () => {
    render(createElement(QrPrintPanel, { qrIdentifier: ID, status: 'NHAP', connectivityMode: 'OFFLINE_REQUIRED', onReprint: () => {} }));
    expect(screen.getByText(`Khi in, mã phải rộng ít nhất ${QR_PRINT_MIN_SIZE_CM} cm.`)).toBeTruthy();
    expect(screen.getByText(formatMessage('MSG-QR-PRINT-UNPUBLISHED'))).toBeTruthy();
  });

  it('QR đang hoạt động: không có cảnh báo chưa xuất bản', () => {
    render(createElement(QrPrintPanel, { qrIdentifier: ID, status: 'HOAT_DONG', connectivityMode: 'ONLINE_AVAILABLE', onReprint: () => {} }));
    expect(screen.queryByText(formatMessage('MSG-QR-PRINT-UNPUBLISHED'))).toBeNull();
  });
});
