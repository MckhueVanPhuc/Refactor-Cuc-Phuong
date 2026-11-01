// Auth provider giả cho MODE fake và test (tasks T065): người dùng synthetic, link mời/khôi phục giả
// dạng `?fake_token=…` (thư nằm trong `store.auth.outbox`), phiên bị hủy sau đăng xuất.
import type { FakeStore } from '../api/fake/store';
import { AuthError, type AuthService, type LinkKind } from './authService';

// Quy tắc độ mạnh là của provider (OQ-SCR-M03-007-002); bản giả chỉ cần một ngưỡng để test MSG-PASSWORD-REJECTED
const FAKE_MIN_PASSWORD_LENGTH = 8;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

function tokenFrom(urlPart: string): string | null {
  const query = urlPart.includes('?') ? urlPart.slice(urlPart.indexOf('?')) : '';
  return new URLSearchParams(query.split('#')[0]).get('fake_token');
}

/** Provider "gửi thư": tạo token một lần và ghi vào hộp thư giả */
export function sendFakeMail(store: FakeStore, email: string, kind: LinkKind): void {
  const token = store.newId(24);
  store.auth.linkTokens.set(token, { email, kind });
  const path = kind === 'invite' ? '/admin/invitation' : '/admin/recovery';
  store.auth.outbox.push({ email, kind, link: `${path}?fake_token=${token}` });
}

export function createFakeAuthService(store: FakeStore): AuthService {
  return {
    async signInWithPassword(email, password) {
      const user = store.auth.users.get(normalizeEmail(email));
      if (!user || user.password !== password) throw new AuthError('INVALID_CREDENTIALS');
      store.signIn(user.userId);
    },

    async signOut() {
      store.signIn(null);
    },

    async requestPasswordRecovery(email) {
      const normalized = normalizeEmail(email);
      if (store.auth.users.has(normalized)) sendFakeMail(store, normalized, 'recovery');
    },

    hasLinkInUrl: (urlPart) => tokenFrom(urlPart) !== null,

    async consumeLink(kind, urlPart) {
      const token = tokenFrom(urlPart);
      const link = token ? store.auth.linkTokens.get(token) : undefined;
      const user = link && store.auth.users.get(link.email);
      if (!token || !link || link.kind !== kind || !user) return 'INVALID';
      store.auth.linkTokens.delete(token);
      store.signIn(user.userId);
      return 'OK';
    },

    async updatePassword(password) {
      const user = store.providerUser(store.currentUserId);
      if (!user) throw new AuthError('LINK_INVALID');
      if (password.length < FAKE_MIN_PASSWORD_LENGTH) throw new AuthError('PASSWORD_REJECTED');
      user.password = password;
    },

    async hasSession() {
      return store.currentUserId !== null;
    },

    onAuthChange: (listener) => store.onAuthChange(listener),
  };
}
