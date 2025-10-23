"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CreateUserIn, AdminUserOut } from "@/types/user";
import { createUser } from "@/services/user.api";

export default function useCreateAdminUser() {
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

  const create = useCallback(async (payload: CreateUserIn) => {
    setLoading(true);
    setError(null);
    try {
      const res = await createUser(payload);
      if (aliveRef.current) setResult(res);
      return res;
    } catch (err) {
      if (aliveRef.current) setError(err);
      throw err;
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  return { create, loading, error, result };
}