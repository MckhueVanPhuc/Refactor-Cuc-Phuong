import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findSecretPublicVars, findStyleLiterals } from './tokens.lint';

// Quét token thay cho linter (CLAUDE.md; tech-stack không chọn linter). Script `lint` chạy file này.
const root = process.cwd();
const srcDir = join(root, 'src');
const TOKENS_FILE = join('src', 'shared', 'ui', 'tokens.css');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const toRow = (file: string): [string, string] => [relative(root, file).split(sep).join('/'), file];

const styledFiles = walk(srcDir).filter((file) => {
  if (relative(root, file) === TOKENS_FILE) return false;
  if (/\.test\.tsx?$/.test(file)) return false;
  return file.endsWith('.css') || file.endsWith('.tsx');
});

const configFiles = [
  ...walk(srcDir).filter((f) => !/tokens\.lint(\.test)?\.ts$/.test(f)),
  ...['.env.example', '.env.fake', '.env.e2e', 'vite.config.ts'].map((f) => join(root, f)).filter((f) => existsSync(f)),
];

describe('findStyleLiterals', () => {
  it('bắt literal màu và px', () => {
    expect(findStyleLiterals('.a { color: #fff; }')).toEqual(['#fff']);
    expect(findStyleLiterals('.a { background: rgba(0, 0, 0, 0.1); }')).toEqual(['rgba(']);
    expect(findStyleLiterals('.a { color: hsl(1 2% 3%); }')).toEqual(['hsl(']);
    expect(findStyleLiterals('.a { padding: 12px 0; }')).toEqual(['12px']);
    expect(findStyleLiterals('<div style={{ width: "4.5px" }} />')).toEqual(['4.5px']);
  });

  it('bỏ qua token, 0px và ký tự # không phải màu', () => {
    expect(findStyleLiterals('.a { padding: var(--space-3); margin: 0px; }')).toEqual([]);
    expect(findStyleLiterals('<a href="#main">Bỏ qua</a>')).toEqual([]);
  });
});

describe('findSecretPublicVars', () => {
  it('bắt biến VITE_* chứa SECRET hoặc SERVICE', () => {
    expect(findSecretPublicVars('VITE_APP_BACKEND_SECRET_KEY=x\nVITE_SERVICE_ROLE=y\nVITE_APP_VERSION=1')).toEqual([
      'VITE_APP_BACKEND_SECRET_KEY',
      'VITE_SERVICE_ROLE',
    ]);
  });
});

describe('repo: chỉ tokens.css được chứa literal màu/px', () => {
  it.each(styledFiles.map(toRow))('%s', (_rel, file) => {
    expect(findStyleLiterals(readFileSync(file, 'utf-8'))).toEqual([]);
  });
});

describe('repo: không biến VITE_* nào mang SECRET/SERVICE', () => {
  it.each(configFiles.map(toRow))('%s', (_rel, file) => {
    expect(findSecretPublicVars(readFileSync(file, 'utf-8'))).toEqual([]);
  });
});
