// Publishable key của project trong Edge runtime. Tài liệu Supabase xếp SUPABASE_ANON_KEY vào nhóm legacy, biến mới là
// SUPABASE_PUBLISHABLE_KEYS (JSON, khóa `default`); đọc biến mới trước để project cloud không phụ thuộc biến legacy.
export function publishableKeyFromEnv(): string {
  const keys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (keys) {
    try {
      const parsed: unknown = JSON.parse(keys);
      const value = (parsed as { default?: unknown } | null)?.default;
      if (typeof value === 'string' && value) return value;
    } catch {
      // Sai định dạng: dùng biến legacy bên dưới
    }
  }
  return Deno.env.get('SUPABASE_ANON_KEY') ?? '';
}
