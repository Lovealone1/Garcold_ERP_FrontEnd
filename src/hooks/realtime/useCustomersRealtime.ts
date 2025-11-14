"use client";

import { useCallback } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useRealtime } from "./useRealtime";
import type { CustomerPage } from "@/types/customer";

type CustomerInfinite = InfiniteData<CustomerPage>;

function stripCustomerId(
    data: CustomerInfinite | undefined,
    id: number
): CustomerInfinite | undefined {
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

type CustomerEvent = {
    resource: "customer";
    action: "created" | "updated" | "deleted";
    payload: { id: number | string };
};

function isCustomerEvent(m: unknown): m is CustomerEvent {
    if (!m || typeof m !== "object") return false;
    const r = m as Record<string, unknown>;
    if (r.resource !== "customer") return false;
    if (r.action !== "created" && r.action !== "updated" && r.action !== "deleted") {
        return false;
    }
    const p = r.payload as unknown;
    if (!p || typeof p !== "object") return false;
    if (!("id" in (p as Record<string, unknown>))) return false;
    return true;
}

export function useCustomersRealtime() {
    const qc = useQueryClient();

    const onMsg = useCallback(
        (m: unknown) => {
            if (!isCustomerEvent(m)) return;

            const customerId = Number(m.payload.id);
            if (!customerId || Number.isNaN(customerId)) return;

            if (m.action === "deleted") {
                qc.setQueriesData<CustomerInfinite>(
                    { queryKey: ["customers"] },
                    (curr) => stripCustomerId(curr, customerId)
                );

                qc.invalidateQueries({
                    queryKey: ["customers"],
                    refetchType: "active",
                });
            } else {
                qc.invalidateQueries({
                    queryKey: ["customers"],
                    refetchType: "active",
                });
            }
        },
        [qc]
    );

    useRealtime(onMsg);
}
