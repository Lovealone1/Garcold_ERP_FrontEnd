"use client";
import { useEffect, useRef, useState } from "react";
import { getUserBySub } from "@/services/user.api";
import type { UserDTO } from "@/types/user";

export function useGetUser(sub: string | null | undefined) {
  const [data, setData] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!sub) { setData(null); setError(null); setLoading(false); return; }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getUserBySub(sub);
        if (!ac.signal.aborted) setData(res);
      } catch (e) {
        if (!ac.signal.aborted) setError(e);
      } finally {
        if (!abortRef.current?.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [sub]);

  const refresh = () => {
    if (sub) {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setError(null);
      getUserBySub(sub)
        .then((res) => { if (!ac.signal.aborted) setData(res); })
        .catch((e) => { if (!ac.signal.aborted) setError(e); })
        .finally(() => { if (!abortRef.current?.signal.aborted) setLoading(false); });
    }
  };

  return { data, loading, error, refresh };
}