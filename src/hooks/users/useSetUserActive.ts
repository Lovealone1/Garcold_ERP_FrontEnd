"use client";
import { useCallback, useState } from "react";
import { setUserActiveBySub } from "@/services/user.api";
import type { SetUserActiveIn } from "@/types/user";

export function useSetUserActive() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const mutate = useCallback(async (sub: string, body: SetUserActiveIn) => {
    setLoading(true);
    setError(null);
    try {
      await setUserActiveBySub(sub, body);
      return true;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}