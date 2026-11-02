// Dựng SelectedRouteContext v3 (tasks T056; SC-M01-005; DAC-M01-002…007; BR-M01-009, 015).
import { describe, expect, it } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { selectedRouteContextV3Schema } from '../../../shared/contracts/selectedRouteContext';
import { manifestOf, packageFromPublication } from '../testing/packageFixture';
import { buildContext } from './buildContext';

const NOW = new Date('2026-11-03T02:30:00.123Z');

describe('buildContext', () => {
  it('contractVersion 3, AUTHORIZED, authorizedAt UTC, expiresAt đúng +86 400 000 ms', () => {
    const manifest = manifestOf(publicationFixture().snapshots.B);
    const context = buildContext(manifest, { now: NOW });
    expect(context).toMatchObject({
      contractVersion: 3,
      routeId: 'route-b',
      authorizedAt: '2026-11-03T02:30:00.123Z',
      expiresAt: '2026-11-04T02:30:00.123Z',
      authorizationStatus: 'AUTHORIZED',
    });
    expect(Date.parse(context.expiresAt) - Date.parse(context.authorizedAt)).toBe(86_400_000);
    expect(selectedRouteContextV3Schema.safeParse(context).success).toBe(true);
  });

  it('handoffId từ crypto.randomUUID, mới mỗi lần', () => {
    const manifest = manifestOf(publicationFixture().snapshots.B);
    const a = buildContext(manifest);
    const b = buildContext(manifest);
    expect(a.handoffId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a.handoffId).not.toBe(b.handoffId);
  });

  it('routeJourneyManifest là bản sao giá trị của snapshot (online), không chứa resources/text/ảnh', () => {
    const snapshot = publicationFixture().snapshots.A;
    const manifest = manifestOf(snapshot);
    const context = buildContext(manifest, { now: NOW });
    expect(context.routeJourneyManifest).toEqual(manifest);
    expect(context.routeJourneyManifest).not.toBe(manifest);
    expect(JSON.stringify(context)).not.toMatch(/offlineResources|introductionText|staticImages|resources/);
  });

  it('offline: manifest của gói, giữ version của gói', () => {
    const { routes, snapshots } = publicationFixture();
    const pkg = packageFromPublication(routes.A, snapshots.A, { versionStatus: 'OUTDATED' });
    const context = buildContext(pkg.manifest, { now: NOW });
    expect(context.routeJourneyManifest).toEqual(pkg.manifest);
    expect(context.routeJourneyManifest.contentVersion).toBe(1);
  });
});
