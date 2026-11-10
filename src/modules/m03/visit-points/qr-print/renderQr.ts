// Ảnh mã QR để in (tasks T090; admin-ui-flow §4; BR-M03-B02, B04, B05; research R-13).
// `qrcode` chỉ nạp lazy ở màn này. Ảnh in là tệp tải xuống, không phải giao diện: đen trên trắng để in rõ.
import { env, IS_PRODUCTION_BUILD } from '../../../../shared/config/env';
import type { ConnectivityMode } from '../../contracts/adminDtos';
import { QR_PRINT_ERROR_CORRECTION, QR_PRINT_PNG_MIN_PX, QR_PRINT_QUIET_ZONE_MODULES } from '../../config/limits';

export const OFFLINE_LINE =
  'Khu vực không có sóng — hãy tải dữ liệu tuyến trước khi đến / No signal here — download the route data before you come';
export const TEST_STAMP = 'BẢN THỬ — KHÔNG DÁN RA THỰC ĐỊA';

/** `name`: tên tiếng Việt đã lưu của điểm tham quan lúc tải ảnh; tem giữ bản chụp này, không lưu lại ở đâu */
export type QrPrintInput = { qrIdentifier: string; name: string; connectivityMode?: ConnectivityMode | undefined };
export type QrPrintOptions = { baseUrl?: string; isProductionBuild?: boolean };

const INK = '#000000';
const PAPER = '#ffffff';
const FONT_FAMILY = 'Arial, Helvetica, sans-serif';

/** Link công khai của mã: đúng `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}`, không có tham số nào khác (BR-M03-B04) */
export function qrPublicLink(qrIdentifier: string, baseUrl: string = env.qrPublicBaseUrl): string {
  return `${baseUrl}/q/${qrIdentifier}`;
}

/** Số ký tự tối đa mỗi dòng tên và số dòng tên trên tem (BR-M03-B05: tối đa 2 dòng, dài hơn thì cắt bằng "…") */
export const NAME_LINE_CHARS = 36;
export const NAME_MAX_LINES = 2;

/** Ngắt tên theo từ thành tối đa `maxLines` dòng; phần còn lại bị cắt, dòng cuối kết thúc bằng "…" */
export function wrapName(name: string, lineChars: number = NAME_LINE_CHARS, maxLines: number = NAME_MAX_LINES): string[] {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  let cut = false;
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= lineChars) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = '';
    if (lines.length === maxLines) {
      cut = true;
      break;
    }
    // Một từ dài hơn cả dòng: cắt cứng
    if (word.length > lineChars) {
      current = word.slice(0, lineChars);
      cut = true;
    } else {
      current = word;
    }
  }
  if (current) {
    if (lines.length < maxLines) lines.push(current);
    else cut = true;
  }
  if (cut && lines.length > 0) {
    let last = lines[lines.length - 1]!;
    // Chừa chỗ cho "…": bỏ từ cuối nếu dòng có nhiều từ, không thì cắt cứng
    if (last.length >= lineChars) {
      const space = last.lastIndexOf(' ');
      last = space > 0 ? last.slice(0, space) : last.slice(0, lineChars - 1);
    }
    lines[lines.length - 1] = `${last.trimEnd()}…`;
  }
  return lines;
}

/** Tên tệp tải về theo tên điểm tham quan, bỏ dấu: "Hồ Mạc" → "ma-qr-ho-mac" */
export function qrFileName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return `ma-qr-${slug || 'diem-tham-quan'}`;
}

/** Các dòng chữ dưới mã (BR-M03-B05): tên điểm tham quan, cảnh báo vùng không sóng, dấu bản thử */
export function printLabelLines(input: QrPrintInput, isProductionBuild: boolean = IS_PRODUCTION_BUILD): string[] {
  return [
    ...wrapName(input.name),
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
