// Ghi SelectedRouteContext v3 (tasks T058; FR-M01-012; DAC-M01-003).
import { describe, expect, it } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { visitorDb } from '../../../shared/db/visitorDb';
import { buildContext } from '../start/buildContext';
import { manifestOf } from '../testing/packageFixture';
import { writeSelectedRouteContext } from './contextWriter';
import { failNextContextWrite } from './faultInjection';
import { readSelectedRouteContext } from './readers';

const contextB = () => buildContext(manifestOf(publicationFixture().snapshots.B));
const contextA = () => buildContext(manifestOf(publicationFixture().snapshots.A));

describe('writeSelectedRouteContext', () => {
  it('một transaction put vào slot current', async () => {
    const context = contextB();
    await writeSelectedRouteContext(context);
    expect(await readSelectedRouteContext()).toEqual({ kind: 'OK', value: context });
    expect(await visitorDb.table('selectedRouteContext').count()).toBe(1);
  });

  it('Start mới thay toàn bộ context trước (BR-M01-009)', async () => {
    await writeSelectedRouteContext(contextB());
    const next = contextA();
    await writeSelectedRouteContext(next);
    expect(await readSelectedRouteContext()).toEqual({ kind: 'OK', value: next });
    expect(await visitorDb.table('selectedRouteContext').count()).toBe(1);
  });

  it('transaction abort → context trước nguyên vẹn', async () => {
    const previous = contextB();
    await writeSelectedRouteContext(previous);
    failNextContextWrite();
    await expect(writeSelectedRouteContext(contextA())).rejects.toThrow();
    expect(await readSelectedRouteContext()).toEqual({ kind: 'OK', value: previous });
  });

  it('context không qua schema bị từ chối, không ghi', async () => {
    await expect(writeSelectedRouteContext({ ...contextB(), contractVersion: 2 } as never)).rejects.toThrow();
    expect(await readSelectedRouteContext()).toEqual({ kind: 'NONE' });
  });

  it('handoffId là unique index của store', async () => {
    const context = contextB();
    await writeSelectedRouteContext(context);
    await expect(
      visitorDb.table('selectedRouteContext').add({ ...context, slot: 'other' }),
    ).rejects.toMatchObject({ name: 'ConstraintError' });
  });
});
