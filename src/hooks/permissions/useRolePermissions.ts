"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RolePermissionOut } from "@/types/permissions";
import {
  listRolePermissions,
  setPermissionState,
  bulkSetPermissions,
} from "@/services/sales/role-permission.api";

type State = {
  data: RolePermissionOut[] | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
};

export function useRolePermissions(roleId: number | null) {
  const [state, setState] = useState<State>({
    data: null,
    loading: false,
    saving: false,
    error: null,
  });
  const lastSnap = useRef<RolePermissionOut[] | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    if (roleId == null) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await listRolePermissions(roleId, {
        nocacheToken: Date.now(),
        signal: ac.signal,
      });
      lastSnap.current = res;
      setState(s => ({ ...s, data: res, loading: false }));
    } catch (e: any) {
      if (ac.signal.aborted) return;
      setState(s => ({ ...s, loading: false, error: e?.message ?? "load_failed" }));
    }
  }, [roleId]);

  useEffect(() => {
    void reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  const setOne = useCallback(
    async (code: string, active: boolean) => {
      if (roleId == null || !state.data) return;
      const prev = state.data;
      const next = prev.map(p => (p.code === code ? { ...p, active } : p));
      setState(s => ({ ...s, data: next, saving: true }));
      try {
        await setPermissionState(roleId, code, { active });
        setState(s => ({ ...s, saving: false }));
        lastSnap.current = next;
      } catch (e: any) {
        setState(s => ({
          ...s,
          data: prev,
          saving: false,
          error: e?.message ?? "update_failed",
        }));
        throw e;
      }
    },
    [roleId, state.data]
  );

  const setMany = useCallback(
    async (codes: string[], active = true) => {
      if (roleId == null || !state.data || codes.length === 0) return;
      const prev = state.data;
      const next = prev.map(p => (codes.includes(p.code) ? { ...p, active } : p));
      setState(s => ({ ...s, data: next, saving: true }));
      try {
        await bulkSetPermissions(roleId, { codes, active });
        setState(s => ({ ...s, saving: false }));
        lastSnap.current = next;
      } catch (e: any) {
        setState(s => ({
          ...s,
          data: prev,
          saving: false,
          error: e?.message ?? "bulk_failed",
        }));
        throw e;
      }
    },
    [roleId, state.data]
  );

  const activeCodes = useMemo(
    () => new Set((state.data ?? []).filter(p => p.active).map(p => p.code)),
    [state.data]
  );

  return {
    data: state.data,
    loading: state.loading,
    saving: state.saving,
    error: state.error,
    reload,
    setOne,
    setMany,
    activeCodes,
  };
}
