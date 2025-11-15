"use client";

import { useCallback } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useRealtime } from "./useRealtime";
import type { SupplierPage } from "@/types/supplier";

type SupplierInfinite = InfiniteData<SupplierPage>;

function stripSupplierId(
    data: SupplierInfinite | undefined,
    id: number
): SupplierInfinite | undefined {
    if (!data) return data;
    let removed = false;

    const pages = data.pages.map((p) => {
        const filtered = (p.items ?? []).filter((x) => x.id !== id);
        if (filtered.length !== (p.items?.length ?? 0)) removed = true;
        return { ...p, items: filtered };
    });

    if (!removed) return data;
    return { ...data, pages };
}

type SupplierEvent = {
    resource: "supplier";
    action: "created" | "updated" | "deleted";
    payload: { id: number | string };
};

function isSupplierEvent(m: unknown): m is SupplierEvent {
    if (!m || typeof m !== "object") return false;
    const r = m as Record<string, unknown>;
    if (r.resource !== "supplier") return false;
    if (r.action !== "created" && r.action !== "updated" && r.action !== "deleted")
        return false;
    const p = r.payload as unknown;
    if (!p || typeof p !== "object") return false;
    if (!("id" in (p as Record<string, unknown>))) return false;
    return true;
}

export function useSuppliersRealtime() {
    const qc = useQueryClient();

    const onMsg = useCallback(
        (m: unknown) => {
            if (!isSupplierEvent(m)) return;

            const supplierId = Number(m.payload.id);
            if (!supplierId || Number.isNaN(supplierId)) return;

            if (m.action === "deleted") {
                qc.setQueriesData<SupplierInfinite>(
                    { queryKey: ["suppliers"] },
                    (curr) => stripSupplierId(curr, supplierId)
                );

                qc.invalidateQueries({
                    queryKey: ["suppliers"],
                    refetchType: "active",
                });
            } else {
                qc.invalidateQueries({
                    queryKey: ["suppliers"],
                    refetchType: "active",
                });
            }
        },
        [qc]
    );

    useRealtime(onMsg);
}
