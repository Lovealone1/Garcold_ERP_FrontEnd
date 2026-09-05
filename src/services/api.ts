"use client";

import axios from "axios";
import { supabase } from "@/lib/supabase/client"; // factory: supabase()

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  timeout: 15000,
});

// Upper bound for the token refresh itself. Without it a hung Supabase call
// would stall every request waiting on the shared refresh.
const REFRESH_TIMEOUT_MS = 15000;

// ---- Request: adjunta Bearer si hay sesión
api.interceptors.request.use(async (config) => {
  // A retry already carries the token the refresh just produced. Re-reading the
  // session here could hand back a stale cached value and clobber it, which
  // would turn the retry into a second 401.
  if ((config as any)._retry) return config;

  const { data: { session } } = await supabase().auth.getSession();
  const t = session?.access_token;
  if (t) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${t}`;
  }
  return config;
});

// ---- Response: refresh en 401 y reintenta una vez
//
// A single shared promise coordinates the refresh. Every 401 awaits the *same*
// promise, so the refresh runs once and no caller can register itself after the
// result was already published -- the race that used to leave requests pending
// forever while TanStack Query kept showing stale data.
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), REFRESH_TIMEOUT_MS);
      });
      const refresh = supabase()
        .auth.refreshSession()
        .then(({ data }) => data.session?.access_token ?? null)
        .catch(() => null);

      return await Promise.race([refresh, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
      // Release before the awaiting callers resume so a *later* 401 (a second
      // expiry, minutes on) can start a fresh cycle instead of reusing this one.
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const { response, config } = err ?? {};
    if (response?.status !== 401 || !config || (config as any)._retry) throw err;

    const freshToken = await refreshAccessToken();
    if (!freshToken) throw err;

    (config as any)._retry = true;
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${freshToken}`;
    return api(config);
  }
);

export default api;
