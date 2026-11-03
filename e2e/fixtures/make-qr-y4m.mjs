// Sinh video YUV4MPEG2 chứa ảnh QR synthetic cho camera giả của Chromium (research M02 R-19):
// `--use-file-for-fake-video-capture=<file>.y4m`. Chạy lại khi đổi nội dung mã: `node e2e/fixtures/make-qr-y4m.mjs`.
// Chỉ dùng `qrcode` đã có trong package.json; không thêm dependency.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const WIDTH = 320;
const HEIGHT = 240;
// Chromium phát lặp file; vài khung giống nhau đủ cho scanner đọc ở khung đầu tiên nó lấy
const FRAMES = 3;
const QUIET_ZONE_MODULES = 4;

const FIXTURES = [
  // Mã hợp lệ trên base của build preview E2E (.env.e2e: VITE_QR_PUBLIC_BASE_URL)
  { file: 'qr-q1a.y4m', text: 'http://localhost:4173/q/Q1a' },
  // Cùng path nhưng sai base: scanner phải từ chối (e2e/m02/scan-evil.spec.ts)
  { file: 'qr-evil.y4m', text: 'https://evil.example/q/Q1a' },
];

/** Mặt phẳng độ sáng: nền trắng, QR đen ở giữa, mỗi module là một ô vuông nguyên pixel. */
function lumaPlane(text) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const total = modules.size + QUIET_ZONE_MODULES * 2;
  const scale = Math.floor(Math.min(WIDTH, HEIGHT) / total);
  if (scale < 2) throw new Error(`QR quá lớn cho khung ${WIDTH}x${HEIGHT}: ${text}`);
  const left = Math.floor((WIDTH - total * scale) / 2);
  const top = Math.floor((HEIGHT - total * scale) / 2);
  const luma = Buffer.alloc(WIDTH * HEIGHT, 255);
  for (let row = 0; row < modules.size; row += 1) {
    for (let col = 0; col < modules.size; col += 1) {
      if (!modules.get(row, col)) continue;
      const x0 = left + (col + QUIET_ZONE_MODULES) * scale;
      const y0 = top + (row + QUIET_ZONE_MODULES) * scale;
      for (let y = y0; y < y0 + scale; y += 1) luma.fill(0, y * WIDTH + x0, y * WIDTH + x0 + scale);
    }
  }
  return luma;
}

function y4m(text) {
  const header = Buffer.from(`YUV4MPEG2 W${WIDTH} H${HEIGHT} F30:1 Ip A1:1 C420jpeg\n`, 'ascii');
  // 4:2:0 — hai mặt phẳng màu một phần tư kích thước, giá trị 128 là không màu (ảnh xám)
  const chroma = Buffer.alloc((WIDTH / 2) * (HEIGHT / 2) * 2, 128);
  const frame = Buffer.concat([Buffer.from('FRAME\n', 'ascii'), lumaPlane(text), chroma]);
  return Buffer.concat([header, ...Array.from({ length: FRAMES }, () => frame)]);
}

for (const { file, text } of FIXTURES) {
  writeFileSync(fileURLToPath(new URL(file, import.meta.url)), y4m(text));
}
