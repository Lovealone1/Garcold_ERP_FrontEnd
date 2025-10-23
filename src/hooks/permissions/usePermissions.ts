"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PermissionDTO } from "@/types/permissions";
import { listPermissionsCatalog } from "@/services/sales/role-permission.api";

type State = { data: PermissionDTO[]; loading: boolean; error: string | null };

export function usePermissions() {
    const [state, set] = useState<State>({ data: [], loading: false, error: null });
    const abortRef = useRef<AbortController | null>(null);

    const reload = useCallback(async () => {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        set(s => ({ ...s, loading: true, error: null }));
        try {
            const rows = await listPermissionsCatalog({ nocacheToken: Date.now(), signal: ac.signal });
            set({ data: rows, loading: false, error: null });
        } catch (e: any) {
            if (ac.signal.aborted) return;
            set(s => ({ ...s, loading: false, error: e?.message ?? "load_failed" }));
        }
    }, []);

    useEffect(() => {
        void reload();
        return () => abortRef.current?.abort();
    }, [reload]);

    return { ...state, reload };
}
