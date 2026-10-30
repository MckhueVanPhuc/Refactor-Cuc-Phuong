import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AdminApi } from './AdminApi';

// Chọn adapter cho M03: MODE `fake` → adapter giả (import() động để không vào bundle production),
// ngược lại adapter Supabase. Test truyền thẳng `api`. AuthService được thêm vào context ở T065 (US1).
const AdminApiContext = createContext<AdminApi | null>(null);

async function loadAdminApi(): Promise<AdminApi> {
  if (import.meta.env.MODE === 'fake') {
    const fake = await import('./fake/fakeAdminApi');
    const store = new fake.FakeStore();
    fake.registerFakeTestHooks(store);
    return fake.createFakeAdminApi(store);
  }
  const [{ createSupabaseAdminApi }, { createSupabaseClient }] = await Promise.all([
    import('./supabaseAdminApi'),
    import('../../../shared/supabase/client'),
  ]);
  return createSupabaseAdminApi(createSupabaseClient());
}

export function AdminApiProvider({ api, children }: { api?: AdminApi; children: ReactNode }) {
  const [loaded, setLoaded] = useState<AdminApi | null>(api ?? null);

  useEffect(() => {
    if (api) return;
    let cancelled = false;
    void loadAdminApi().then((adapter) => {
      if (!cancelled) setLoaded(adapter);
    });
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (!loaded) return null;
  return <AdminApiContext.Provider value={loaded}>{children}</AdminApiContext.Provider>;
}

export function useAdminApi(): AdminApi {
  const api = useContext(AdminApiContext);
  if (!api) throw new Error('useAdminApi phải nằm trong AdminApiProvider');
  return api;
}
