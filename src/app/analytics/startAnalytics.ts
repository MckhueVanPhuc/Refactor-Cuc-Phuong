// Nạp Vercel Web Analytics và Speed Insights (tasks M03 T210; CHG-M03-2026-11-05-01 §6). Chỉ App.tsx gọi, ở build Production.
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { redactEvent } from './redactEvent';

export function startAnalytics(): void {
  inject({ mode: 'production', beforeSend: redactEvent });
  injectSpeedInsights({ beforeSend: redactEvent });
}
