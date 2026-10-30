import { Button } from '../../../shared/ui/Button';
import type { CurrentAdmin } from '../contracts/adminDtos';
import { DISPLAY_NAMES } from '../messages/displayNames';
import { useSignOut } from './useSignOut';
import styles from './SignOutButton.module.css';

export function SignOutButton() {
  const signOut = useSignOut();
  return <Button onClick={signOut}>Đăng xuất</Button>;
}

/** Header của mọi màn đã đăng nhập: email, vai trò (tên hiển thị) và "Đăng xuất" (SCR-M03-001…009 E-01) */
export function CurrentUserInfo({ admin }: { admin: CurrentAdmin }) {
  return (
    <div className={styles.user}>
      <span className={styles.identity}>
        <span className={styles.email}>{admin.email}</span>
        <span className={styles.role}>{DISPLAY_NAMES.role[admin.role]}</span>
      </span>
      <SignOutButton />
    </div>
  );
}
