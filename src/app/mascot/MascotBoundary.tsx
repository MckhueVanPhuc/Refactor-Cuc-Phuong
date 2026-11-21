// Lỗi khi render Mila không được làm hỏng màn (BR-MAS-16): Mila ẩn tới khi tải lại trang.
import { Component, type ReactNode } from 'react';

export class MascotBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}
