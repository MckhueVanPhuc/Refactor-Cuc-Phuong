// CORS cho Edge Function gọi từ trình duyệt (tasks M03 T178, T195). Preflight `OPTIONS` được trả trước mọi kiểm tra.
export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}
