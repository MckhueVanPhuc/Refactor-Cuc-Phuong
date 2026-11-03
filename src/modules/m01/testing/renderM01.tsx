// Render cây route M01 với adapter giả cho test component (ngôn ngữ đã chọn trước để qua LanguageGate).
import { render } from '@testing-library/react';
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from 'react-router';
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import { createFakeSource } from '../api/fake/fakeSource';
import { M01ServicesContext } from '../api/services';
import { m01Routes } from '../routes';
import { writeLanguagePreference } from '../storage/languageWriter';

export async function renderM01(
  path: string,
  options: { language?: LanguageCode | null; fake?: ReturnType<typeof createFakeSource> } = {},
) {
  const fake = options.fake ?? createFakeSource();
  // `language: null` → chưa chọn ngôn ngữ (LanguageGate hiện panel)
  if (options.language !== null) await writeLanguagePreference(options.language ?? 'vi');
  const router = createMemoryRouter(createRoutesFromElements(m01Routes), { initialEntries: [path] });
  const view = render(
    <M01ServicesContext.Provider value={{ source: fake.source, media: fake.media }}>
      <RouterProvider router={router} />
    </M01ServicesContext.Provider>,
  );
  return { ...view, fake, router };
}
