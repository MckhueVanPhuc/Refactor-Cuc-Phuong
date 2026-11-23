// Lỗi khi render Mila không được làm hỏng màn (BR-MAS-16): Mila ẩn tới khi tải lại trang.
import { Component, type ReactNode } from 'react';
import { markMascotFailed } from '../../shared/mascot/visitConfirm';

export class MascotBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(): void {
    // Màn nội dung quay về toast xác nhận lượt ghé (BR-MAS-24)
    markMascotFailed();
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}
