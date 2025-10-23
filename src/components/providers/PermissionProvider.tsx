// components/providers/PermissionContext.tsx
"use client";
import { createContext, useContext, useMemo, useRef, useState, useEffect, useCallback } from "react";
import { listRolePermissions } from "@/services/sales/role-permission.api";
import type { MeDTO } from "@/types/auth";

export type RolePermissionOut = { code: string; description?: string | null; active: boolean };

type Ctx = {
    ready: boolean;
    list: RolePermissionOut[];          // crudo
    has: (code: string) => boolean;     // solo activos
    reload: () => Promise<void>;
};

const PermissionContext = createContext<Ctx | null>(null);

export function PermissionProvider({
    me,
    children,
}: {
    me: MeDTO | null;                    // me.role?.id y me.permissions
    children: React.ReactNode;
}) {
    const [ready, setReady] = useState(false);
    const [list, setList] = useState<RolePermissionOut[]>([]);
    const abortRef = useRef<AbortController | null>(null);

    const seedFromMe = useCallback(() => {
        const perms = (me?.permissions ?? []).filter(Boolean).map(p => String(p).trim()).filter(p => p.length > 0);
        if (perms.length === 0) return false;
        setList(perms.map(code => ({ code, description: null, active: true })));
        setReady(true);
        return true;
    }, [me]);

    const fetchFromApi = useCallback(async () => {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        setReady(false);
        try {
            const roleId = me?.role?.id ?? null;
            if (!roleId) { setList([]); return; }
            const rows = await listRolePermissions(roleId, { nocacheToken: Date.now(), signal: ac.signal });
            const clean: RolePermissionOut[] = (rows ?? [])
                .filter((r: any) => typeof r?.code === "string" && typeof r?.active === "boolean")
                .map((r: any) => ({ code: String(r.code).trim(), description: r.description ?? null, active: !!r.active }));
            setList(clean);
        } catch (e: any) {
            if (e?.name !== "AbortError") setList([]);
        } finally {
            if (!ac.signal.aborted) setReady(true);
        }
    }, [me]);

    useEffect(() => {
        // 1) intenta semillar desde MeDTO
        const seeded = seedFromMe();
        // 2) si no hay permisos en MeDTO, cae al API por roleId
        if (!seeded) fetchFromApi();
        return () => abortRef.current?.abort();
    }, [seedFromMe, fetchFromApi]);

    const activeSet = useMemo(
        () => new Set(list.filter(p => p.active).map(p => p.code.trim().toLowerCase())),
        [list]
    );

    const has = useCallback((c: string) => activeSet.has((c ?? "").trim().toLowerCase()), [activeSet]);

    const reload = useCallback(async () => { await fetchFromApi(); }, [fetchFromApi]);

    return (
        <PermissionContext.Provider value={{ ready, list, has, reload }}>
            {children}
        </PermissionContext.Provider>
    );
}

export function usePermissions() {
    const ctx = useContext(PermissionContext);
    if (!ctx) throw new Error("PermissionProvider missing");
    return ctx;
}
