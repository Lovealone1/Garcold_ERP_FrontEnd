"use client";
import { useEffect, useRef, useState } from "react";
import { listLocalUsers } from "@/services/user.api";
import type { UserDTO } from "@/types/user";

export function useListLocalUsers() {
  const [data, setData] = useState<UserDTO[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reload = async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const res = await listLocalUsers();
      if (!ac.signal.aborted) setData(res);
    } catch (e) {
      if (!ac.signal.aborted) setError(e);
    } finally {
      if (!abortRef.current?.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, []);

  return { data, loading, error, reload };
}