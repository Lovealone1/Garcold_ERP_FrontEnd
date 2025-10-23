"use client";

import axios from "axios";
import { supabase } from "@/lib/supabase/client"; // factory: supabase()

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  timeout: 15000,
});

// ---- Request: adjunta Bearer si hay sesión
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase().auth.getSession();
  const t = session?.access_token;
  if (t) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${t}`;
  }
  return config;
});

// ---- Response: refresh en 401 y reintenta una vez
let refreshing = false;
let waiters: Array<(t: string | null) => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const { response, config } = err ?? {};
    if (response?.status !== 401 || (config as any)?._retry) throw err;

    if (!refreshing) {
      refreshing = true;
      try {
        const { data } = await supabase().auth.refreshSession();
        const fresh = data.session?.access_token ?? null;
        waiters.forEach((w) => w(fresh));
        waiters = [];
      } finally {
        refreshing = false;
      }
    }

    const freshToken = await new Promise<string | null>((res) => waiters.push(res));
    if (!freshToken) throw err;

    (config as any)._retry = true;
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${freshToken}`;
    return api(config);
  }
);

export default api;
