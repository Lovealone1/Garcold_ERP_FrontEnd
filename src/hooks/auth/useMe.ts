"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { MeDTO } from "@/types/auth";
import { getMe, syncSelf } from "@/services/auth.api";

type Opts = {
  refreshOnFocus?: boolean;
  syncIfNull?: boolean;
  minFocusMs?: number;
};

export function useMe(opts: Opts = {}) {
  const [data, setData] = useState<MeDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const did = useRef(false);
  const lastFocusAt = useRef(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let me = await getMe();
      if (!me && opts.syncIfNull) {
        await syncSelf();
        me = await getMe();
      }
      setData(me);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [opts.syncIfNull]);

  useEffect(() => {
    if (did.current) return;  
    did.current = true;
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!opts.refreshOnFocus) return;
    const minGap = opts.minFocusMs ?? 1500;
    const onFocus = () => {
      const now = Date.now();
      if (now - lastFocusAt.current < minGap) return;
      lastFocusAt.current = now;
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [opts.refreshOnFocus, opts.minFocusMs, refresh]);

  return {
    data,
    permissions: data?.permissions ?? [],
    role: data?.role ?? null,
    loading,
    error,
    refresh,
  };
}
