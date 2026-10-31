import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AdminApi } from '../../api/AdminApi';
import { AdminServicesProvider } from '../../api/AdminApiProvider';
import { createFakeServices } from '../../api/fake/fakeAdminApi';
import { formatMessage } from '../../messages/catalog';
import { VisitorPreview, type VisitorPreviewProps } from './VisitorPreview';

/** Ghi lại mọi method AdminApi được gọi */
function recordingServices() {
  const services = createFakeServices();
  const calls: string[] = [];
  const api = new Proxy(services.api, {
    get(target, property: string) {
      const value = target[property as keyof AdminApi];
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) => {
        calls.push(property);
        return property === 'getMediaUrl' ? Promise.resolve(`fake-media:${String(args[0])}`) : (value as (...a: unknown[]) => unknown)(...args);
      };
    },
  });
  return { services: { ...services, api }, calls };
}

const props: VisitorPreviewProps = {
  checkpointName: { vi: 'Rừng chò', en: 'Cho forest' },
  connectivityMode: 'ONLINE_AVAILABLE',
  objectName: { vi: 'Cây chò', en: 'Cho tree' },
  introductionText: { vi: 'Cây chò ngàn năm cao 45 mét.', en: 'A thousand-year-old cho tree, 45 m tall.' },
  media: [
    { mediaId: 'i1', type: 'IMAGE', sourceRef: 'uploads/CHECKPOINT/c/i1' },
    { mediaId: 'a1', type: 'AUDIO', sourceRef: 'uploads/CHECKPOINT/c/a1', spokenLanguage: 'vi' },
    { mediaId: 'a2', type: 'AUDIO', sourceRef: 'uploads/CHECKPOINT/c/a2', spokenLanguage: 'en' },
    { mediaId: 'v1', type: 'VIDEO', sourceRef: 'uploads/CHECKPOINT/c/v1', spokenLanguage: 'NONE' },
  ],
};

function renderPreview(override: Partial<VisitorPreviewProps> = {}) {
  const recorded = recordingServices();
  render(
    <AdminServicesProvider services={recorded.services}>
      <VisitorPreview {...props} {...override} />
    </AdminServicesProvider>,
  );
  return recorded;
}

const avSources = () =>
  Array.from(document.querySelectorAll('audio, video')).map((element) => element.getAttribute('src'));

describe('xem trước như du khách (BR-M03-F12; SC-M03-032)', () => {
  it('nhãn cố định MSG-PREVIEW-DRAFT; mặc định tiếng Việt', async () => {
    renderPreview();
    expect(screen.getByText(formatMessage('MSG-PREVIEW-DRAFT'))).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Cây chò' })).toBeTruthy();
    expect(screen.getByText('Rừng chò')).toBeTruthy();
    expect(screen.getByText('Cây chò ngàn năm cao 45 mét.')).toBeTruthy();
  });

  it('chuyển Tiếng Việt / English đổi chữ và chỉ hiện âm thanh/video của ngôn ngữ đang chọn + "Không lời"', async () => {
    renderPreview();
    await waitFor(() => expect(avSources()).toEqual(['fake-media:uploads/CHECKPOINT/c/a1', 'fake-media:uploads/CHECKPOINT/c/v1']));
    await userEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByRole('heading', { name: 'Cho tree' })).toBeTruthy();
    expect(screen.getByText('A thousand-year-old cho tree, 45 m tall.')).toBeTruthy();
    await waitFor(() => expect(avSources()).toEqual(['fake-media:uploads/CHECKPOINT/c/a2', 'fake-media:uploads/CHECKPOINT/c/v1']));
    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Không lời')).toBeTruthy();
  });

  it('điểm dừng "Cần tải trước": không có âm thanh/video', async () => {
    renderPreview({ connectivityMode: 'OFFLINE_REQUIRED' });
    await waitFor(() => expect(document.querySelectorAll('img')).toHaveLength(1));
    expect(avSources()).toEqual([]);
  });

  it('không phát request ghi nào và không gọi lookup: chỉ đọc URL media', async () => {
    const { calls } = renderPreview();
    await userEvent.click(screen.getByRole('button', { name: 'English' }));
    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    expect(new Set(calls)).toEqual(new Set(['getMediaUrl']));
  });
});
