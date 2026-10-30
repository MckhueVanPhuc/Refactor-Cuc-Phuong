// Theo dõi request đang chạy để đăng xuất hủy được tất cả (auth-account §2.6; tasks T042).
const controllers = new Set<AbortController>();

/** Chạy `run` với một AbortSignal được đăng ký; tự gỡ khi xong. */
export async function trackRequest<T>(run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  controllers.add(controller);
  try {
    return await run(controller.signal);
  } finally {
    controllers.delete(controller);
  }
}

/** Hủy mọi request đang chạy (gọi khi đăng xuất). */
export function abortAll(): void {
  for (const controller of controllers) controller.abort();
  controllers.clear();
}

export function inflightCount(): number {
  return controllers.size;
}
