"use client";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "./useRealtime";

type RTMessage = {
    resource?: string;
    action?: string;
    type?: string;
    payload?: {
        id?: number | string;
        sale_id?: number | string;
        [k: string]: unknown;
    };
};

export function usePaymentsRealtime() {
    const qc = useQueryClient();

    const onMsg = useCallback(
        (raw: unknown) => {
            if (!raw || typeof raw !== "object") return;

            const msg = raw as RTMessage;
            const resource = msg.resource ?? msg.type?.split(".")[0];
            const action = msg.action ?? msg.type?.split(".")[1];

            if (resource !== "sale_payment") return;
            if (action !== "created" && action !== "deleted") return;

            const saleId = Number(msg.payload?.sale_id);

            qc.invalidateQueries({
                predicate: ({ queryKey }) =>
                    Array.isArray(queryKey) && queryKey[0] === "sales",
                refetchType: "active",
            });

            if (!Number.isNaN(saleId)) {
                qc.invalidateQueries({
                    queryKey: ["sale-payments", { saleId }],
                    refetchType: "active",
                });
            }

            qc.invalidateQueries({
                predicate: ({ queryKey }) =>
                    Array.isArray(queryKey) && queryKey[0] === "transactions",
                refetchType: "active",
            });
        },
        [qc],
    );

    useRealtime(onMsg);
}
