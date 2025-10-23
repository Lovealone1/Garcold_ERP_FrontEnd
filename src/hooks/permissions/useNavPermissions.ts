"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listRolePermissions } from "@/services/sales/role-permission.api";
import type { RolePermissionOut } from "@/types/permissions";

type Options = { enabled?: boolean };

export type UseNavPermissions = {
  items: RolePermissionOut[];        // crudo del API
  activeItems: RolePermissionOut[];  // solo activos
  loading: boolean;
  error: unknown | null;
  reload: () => Promise<void>;
  has: (code: string) => boolean;    // true si activo
  hasAll: (codes: string[]) => boolean;
  hasAny: (codes: string[]) => boolean;
};

export function useNavPermissions(
  roleId: number | null | undefined,
  opts?: Options
): UseNavPermissions {
  const enabled = opts?.enabled ?? true;
  const [items, setItems] = useState<RolePermissionOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!roleId || !enabled) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const data = await listRolePermissions(roleId, {
        nocacheToken: Date.now(),
        signal: ac.signal,
      });
      setItems(data ?? []);
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e);
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [roleId, enabled]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const activeItems = useMemo(
    () => items.filter(p => p.active === true),
    [items]
  );

  const activeCodes = useMemo(
    () => new Set(activeItems.map(p => (p.code ?? "").trim().toLowerCase())),
    [activeItems]
  );

  const has = useCallback((c: string) => activeCodes.has((c ?? "").trim().toLowerCase()), [activeCodes]);
  const hasAll = useCallback((arr: string[]) => (arr ?? []).every(has), [has]);
  const hasAny = useCallback((arr: string[]) => (arr ?? []).some(has), [has]);

  return { items, activeItems, loading, error, reload: fetchData, has, hasAll, hasAny };
}
