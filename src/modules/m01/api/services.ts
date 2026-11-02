// Nguồn dữ liệu của các màn M01: mặc định adapter thật (Data API + Storage của M03); test component bọc bằng
// adapter giả (src/modules/m01/api/fake/fakeSource.ts). E2E dùng adapter thật trên network mock.
import { createContext, useContext } from 'react';
import { mediaClient, type MediaClient } from './mediaClient';
import { sourceClient, type SourceClient } from './sourceClient';

export type M01Services = { source: SourceClient; media: MediaClient };

export const M01ServicesContext = createContext<M01Services>({ source: sourceClient, media: mediaClient });

export function useM01Services(): M01Services {
  return useContext(M01ServicesContext);
}
