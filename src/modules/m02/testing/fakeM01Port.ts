// Bản giả của src/modules/m02/m01Port.ts cho Vitest (tasks T016): cùng tên export, dữ liệu giữ trong bộ nhớ, không
// chạm store nào của M01. Dùng trong test:
//   vi.mock('../m01Port', () => import('../testing/fakeM01Port'));
//   beforeEach(() => fakeM01.reset());
// rồi đặt dữ liệu bằng `fakeM01.setContext(...)`, `fakeM01.setPackage(...)`… Tích hợp thật với M01 ở T102–T103.
import { createElement } from 'react';
import type { LanguagePreference } from '../../../shared/contracts/languagePreference';
import type { OfflinePackage, OfflineResource } from '../../../shared/contracts/offlinePackage';
import type { SelectedRouteContextV3 } from '../../../shared/contracts/selectedRouteContext';
import type * as Port from '../m01Port';

export type SelectedRouteContextReadResult = Port.SelectedRouteContextReadResult;

type State = {
  context: SelectedRouteContextReadResult;
  packages: Map<string, OfflinePackage>;
  images: Map<string, Blob>;
  language: LanguagePreference | null;
};

const imageKey = (routeId: string, contentVersion: number, sourceRef: string) => `${routeId}|${contentVersion}|${sourceRef}`;

function initialState(): State {
  return { context: { kind: 'NONE' }, packages: new Map(), images: new Map(), language: null };
}

let state = initialState();

export const fakeM01 = {
  reset(): void {
    state = initialState();
  },
  /** `null` → `NONE`; `'INVALID'` → context có dòng nhưng không qua schema v3 (gồm version 2, D-01). */
  setContext(context: SelectedRouteContextV3 | 'INVALID' | null): void {
    state.context =
      context === null ? { kind: 'NONE' } : context === 'INVALID' ? { kind: 'INVALID' } : { kind: 'OK', value: structuredClone(context) };
  },
  /** Gói `SAN_SANG` active của tuyến; ảnh khai báo trong `staticImages` có byte mặc định trừ khi `withImages: false`. */
  setPackage(pkg: OfflinePackage | null, routeId = pkg?.routeId, { withImages = true } = {}): void {
    if (!routeId) return;
    if (!pkg) {
      state.packages.delete(routeId);
      return;
    }
    state.packages.set(routeId, structuredClone(pkg));
    if (!withImages) return;
    for (const resource of pkg.resources) {
      for (const sourceRef of resource.staticImages) {
        state.images.set(imageKey(pkg.routeId, pkg.contentVersion, sourceRef), new Blob([sourceRef], { type: 'image/png' }));
      }
    }
  },
  setLanguage(language: LanguagePreference | null): void {
    state.language = language;
  },
};

// Bề mặt giống m01Port.ts

export const M01_HANDOFF_TABLES = ['selectedRouteContext'] as const satisfies typeof Port.M01_HANDOFF_TABLES;

export async function readSelectedRouteContext(): Promise<SelectedRouteContextReadResult> {
  return structuredClone(state.context);
}

export async function readActiveOfflinePackage(routeId: string): Promise<OfflinePackage | null> {
  const pkg = state.packages.get(routeId);
  return pkg ? structuredClone(pkg) : null;
}

export async function findOfflineResource(routeId: string, qrIdentifier: string): Promise<OfflineResource | null> {
  const pkg = state.packages.get(routeId);
  const resource = pkg?.resources.find((r) => r.qrIdentifier === qrIdentifier);
  return resource ? structuredClone(resource) : null;
}

export async function readPackageImage(routeId: string, contentVersion: number, sourceRef: string): Promise<Blob | null> {
  if (state.packages.get(routeId)?.contentVersion !== contentVersion) return null;
  return state.images.get(imageKey(routeId, contentVersion, sourceRef)) ?? null;
}

export const resolveDisplayLanguage: typeof Port.resolveDisplayLanguage = (stored, deviceLanguage) => {
  if (stored) return stored.languageCode;
  return deviceLanguage?.toLowerCase().startsWith('vi') ? 'vi' : 'en';
};

export const useLanguagePreference: typeof Port.useLanguagePreference = () => state.language;

/** Chỗ giữ chỗ của nút VI/EN của M01 (bản thật ghi LanguagePreference; bản giả không ghi gì). */
export const LanguageControl: typeof Port.LanguageControl = ({ tone = 'onLight' }) =>
  createElement('div', { 'data-testid': 'm01-language-control', 'data-tone': tone });
