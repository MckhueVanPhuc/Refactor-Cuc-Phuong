// Ảnh mã QR để in (tasks T090; admin-ui-flow §4; BR-M03-B02, B04, B05; research R-13).
// `qrcode` chỉ nạp lazy ở màn này. Ảnh in là tệp tải xuống, không phải giao diện: đen trên trắng để in rõ.
import { env, IS_PRODUCTION_BUILD } from '../../../../shared/config/env';
import type { ConnectivityMode } from '../../contracts/adminDtos';
import { QR_PRINT_ERROR_CORRECTION, QR_PRINT_PNG_MIN_PX, QR_PRINT_QUIET_ZONE_MODULES } from '../../config/limits';
import { qrSuffix } from '../../messages/format';

export const OFFLINE_LINE =
  'Khu vực không có sóng — hãy tải dữ liệu tuyến trước khi đến / No signal here — download the route data before you come';
export const TEST_STAMP = 'BẢN THỬ — KHÔNG DÁN RA THỰC ĐỊA';

export type QrPrintInput = { qrIdentifier: string; connectivityMode?: ConnectivityMode | undefined };
export type QrPrintOptions = { baseUrl?: string; isProductionBuild?: boolean };

const INK = '#000000';
const PAPER = '#ffffff';
const FONT_FAMILY = 'Arial, Helvetica, sans-serif';

/** Link công khai của mã: đúng `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}`, không có tham số nào khác (BR-M03-B04) */
export function qrPublicLink(qrIdentifier: string, baseUrl: string = env.qrPublicBaseUrl): string {
  return `${baseUrl}/q/${qrIdentifier}`;
}

/** Các dòng chữ dưới mã (BR-M03-B05) */
export function printLabelLines(input: QrPrintInput, isProductionBuild: boolean = IS_PRODUCTION_BUILD): string[] {
  return [
    `Mã …${qrSuffix(input.qrIdentifier)}`,
    ...(input.connectivityMode === 'OFFLINE_REQUIRED' ? [OFFLINE_LINE] : []),
    ...(isProductionBuild ? [] : [TEST_STAMP]),
  ];
}

/** Bố cục chung cho SVG và PNG: mã vuông ở trên, các dòng chữ xếp dưới */
function layout(lines: readonly string[]) {
  const size = QR_PRINT_PNG_MIN_PX;
  const fontSize = Math.round(size / 28);
  const lineHeight = Math.round(fontSize * 1.5);
  const padding = Math.round(size / 32);
  // Dòng cảnh báo dài được tách tại " / " thành hai dòng để vừa khổ mã
  const rendered = lines.flatMap((line) => (line === OFFLINE_LINE ? line.split(' / ') : [line]));
  const height = size + padding + rendered.length * lineHeight + padding;
  return { size, fontSize, lineHeight, padding, rendered, height };
}

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function loadQrcode() {
  return (await import('qrcode')).default;
}

export async function renderQrSvg(input: QrPrintInput, options: QrPrintOptions = {}): Promise<string> {
  const QRCode = await loadQrcode();
  const code = await QRCode.toString(qrPublicLink(input.qrIdentifier, options.baseUrl), {
    type: 'svg',
    errorCorrectionLevel: QR_PRINT_ERROR_CORRECTION,
    margin: QR_PRINT_QUIET_ZONE_MODULES,
  });
  const { size, fontSize, lineHeight, padding, rendered, height } = layout(printLabelLines(input, options.isProductionBuild));
  // Lồng SVG của mã vào khung lớn hơn, đặt kích thước để mã chiếm đúng ô vuông phía trên
  const nested = code.replace(/^<svg /, `<svg x="0" y="0" width="${size}" height="${size}" `);
  const text = rendered
    .map(
      (line, index) =>
        `<text x="${size / 2}" y="${size + padding + (index + 0.75) * lineHeight}" font-family="${FONT_FAMILY}" font-size="${fontSize}" text-anchor="middle" fill="${INK}">${escapeXml(line)}</text>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${height}" viewBox="0 0 ${size} ${height}"><rect width="100%" height="100%" fill="${PAPER}"/>${nested}${text}</svg>`;
}

export async function renderQrPng(input: QrPrintInput, options: QrPrintOptions = {}): Promise<Blob> {
  const QRCode = await loadQrcode();
  const { size, fontSize, lineHeight, padding, rendered, height } = layout(printLabelLines(input, options.isProductionBuild));
  const code = document.createElement('canvas');
  code.width = size;
  code.height = size;
  await QRCode.toCanvas(code, qrPublicLink(input.qrIdentifier, options.baseUrl), {
    errorCorrectionLevel: QR_PRINT_ERROR_CORRECTION,
    margin: QR_PRINT_QUIET_ZONE_MODULES,
    width: size,
  });

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không vẽ được ảnh PNG');
  context.fillStyle = PAPER;
  context.fillRect(0, 0, size, height);
  context.drawImage(code, 0, 0, size, size);
  context.fillStyle = INK;
  context.font = `${fontSize}px ${FONT_FAMILY}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  rendered.forEach((line, index) => context.fillText(line, size / 2, size + padding + (index + 0.5) * lineHeight));

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Không tạo được ảnh PNG'))), 'image/png');
  });
}

/** Tải một tệp xuống máy (ảnh in) */
export function downloadFile(content: Blob | string, fileName: string, type = 'image/svg+xml'): void {
  const blob = typeof content === 'string' ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
