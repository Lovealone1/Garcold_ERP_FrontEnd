"use client";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "./useRealtime";

function isPaymentCreated(m: unknown): m is {
    resource: "sale_payment"; action: "created"; payload: { id: number | string; sale_id: number | string };
} {
    if (!m || typeof m !== "object") return false;
    const r = m as Record<string, unknown>;
    if (r.resource !== "sale_payment" || r.action !== "created") return false;
    const p = r.payload as unknown;
    return !!p && typeof p === "object" && "sale_id" in (p as Record<string, unknown>);
}

function isPaymentDeleted(m: unknown): m is {
    resource: "sale_payment"; action: "deleted"; payload: { id: number | string; sale_id: number | string };
} {
    if (!m || typeof m !== "object") return false;
    const r = m as Record<string, unknown>;
    if (r.resource !== "sale_payment" || r.action !== "deleted") return false;
    const p = r.payload as unknown;
    return !!p && typeof p === "object" && "sale_id" in (p as Record<string, unknown>);
}

export function usePaymentsRealtime() {
    const qc = useQueryClient();

    const onMsg = useCallback((m: unknown) => {
        if (isPaymentCreated(m) || isPaymentDeleted(m)) {
            const saleId = Number((m.payload as any).sale_id);

            qc.invalidateQueries({ queryKey: ["sales"], refetchType: "active" });

            if (!Number.isNaN(saleId)) {
                qc.invalidateQueries({
                    queryKey: ["sale-payments", { saleId }],
                    refetchType: "active",
                });
            }
        }
    }, [qc]);

    useRealtime(onMsg);
}
