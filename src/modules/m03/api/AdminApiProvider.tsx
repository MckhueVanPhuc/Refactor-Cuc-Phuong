import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthService } from '../auth/authService';
import type { AdminApi } from './AdminApi';

// Chọn adapter và AuthService cho M03 (tasks T044, T065): MODE `fake` → bản giả dùng chung một store
// (import() động để không vào bundle production), ngược lại Supabase dùng chung một client. Test truyền thẳng `services`.
export type AdminServices = { api: AdminApi; auth: AuthService };

const AdminServicesContext = createContext<AdminServices | null>(null);

// Một bộ dịch vụ cho mỗi lần tải trang: StrictMode chạy effect hai lần, không được tạo hai store/client
let servicesPromise: Promise<AdminServices> | null = null;

function loadServices(): Promise<AdminServices> {
  servicesPromise ??= createServices();
  return servicesPromise;
}

async function createServices(): Promise<AdminServices> {
  if (import.meta.env.MODE === 'fake') {
    const fake = await import('./fake/fakeAdminApi');
    const store = new fake.FakeStore();
    fake.registerFakeTestHooks(store);
    return fake.createFakeServices(store);
  }
  const [{ createSupabaseAdminApi }, { createSupabaseAuthService }, { createSupabaseClient }] = await Promise.all([
    import('./supabaseAdminApi'),
    import('../auth/session'),
    import('../../../shared/supabase/client'),
  ]);
  const client = createSupabaseClient();
  return { api: createSupabaseAdminApi(client), auth: createSupabaseAuthService(client) };
}

export function AdminServicesProvider({ services, children }: { services?: AdminServices; children: ReactNode }) {
  const [loaded, setLoaded] = useState<AdminServices | null>(services ?? null);

  useEffect(() => {
    if (services) return;
    let cancelled = false;
    void loadServices().then((result) => {
      if (!cancelled) setLoaded(result);
    });
    return () => {
      cancelled = true;
    };
  }, [services]);

  if (!loaded) return null;
  return <AdminServicesContext.Provider value={loaded}>{children}</AdminServicesContext.Provider>;
}

function useServices(): AdminServices {
  const services = useContext(AdminServicesContext);
  if (!services) throw new Error('Cần đặt trong AdminServicesProvider');
  return services;
}

export const useAdminApi = (): AdminApi => useServices().api;
export const useAuthService = (): AuthService => useServices().auth;
