"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InviteUserIn, AdminUserOut } from "@/types/user";
import { inviteUser } from "@/services/user.api";

export default function useInviteAdminUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<AdminUserOut | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const invite = useCallback(async (payload: InviteUserIn) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inviteUser(payload);
      if (aliveRef.current) setResult(res);
      return res;
    } catch (err) {
      if (aliveRef.current) setError(err);
      throw err;
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  return { invite, loading, error, result };
}
