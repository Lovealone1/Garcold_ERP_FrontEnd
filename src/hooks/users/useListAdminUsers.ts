"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdminUserOut, AdminUsersPage } from "@/types/user";
import { listUsers } from "@/services/user.api";

export default function useListAdminUsers(opts?: {
  initialPage?: number;
  perPage?: number;
  email?: string;
  auto?: boolean;
}) {
  const [page, setPage] = useState<number>(opts?.initialPage ?? 1);
  const [perPage, setPerPage] = useState<number>(opts?.perPage ?? 50);
  const [email, setEmail] = useState<string>(opts?.email ?? "");
  const [data, setData] = useState<AdminUsersPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const aliveRef = useRef(true);

  const fetchPage = useCallback(
    async (p = page, pp = perPage, e = email) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listUsers(p, pp, e || undefined);
        if (aliveRef.current) setData(res);
      } catch (err) {
        if (aliveRef.current) setError(err);
      } finally {
        if (aliveRef.current) setLoading(false);
      }
    },
    [page, perPage, email]
  );

  useEffect(() => {
    aliveRef.current = true;
    if (opts?.auto !== false) fetchPage();
    return () => {
      aliveRef.current = false;
    };
  }, [fetchPage, opts?.auto]);

  const nextPage = useCallback(() => {
    if (data?.has_next) setPage((p) => p + 1);
  }, [data?.has_next]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const refresh = useCallback(() => fetchPage(), [fetchPage]);

  const items: AdminUserOut[] = useMemo(() => data?.items ?? [], [data]);

  return {
    items,
    page,
    perPage,
    email,
    setPage,
    setPerPage,
    setEmail,
    loading,
    error,
    hasNext: data?.has_next ?? false,
    data,
    fetchPage,
    nextPage,
    prevPage,
    refresh,
  };
}
