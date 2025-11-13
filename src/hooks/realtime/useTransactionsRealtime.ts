"use client";
import { useCallback } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useRealtime } from "@/hooks/realtime/useRealtime";
import type { TransactionView } from "@/types/transaction";

type Page = {
    items: TransactionView[];
    page: number;
    page_size: number;
    total?: number;
    total_pages?: number;
    has_next?: boolean;
};

function prependToFirstPage(
    data: InfiniteData<Page> | undefined,
    tx: TransactionView
): InfiniteData<Page> | undefined {
    if (!data?.pages?.length) return data;

    const pages = data.pages.map((p, i) => {
        if (i !== 0) return p;

        const size = p.page_size ?? 10;
        const already = (p.items ?? []).some(x => x.id === tx.id);

        const items = already
            ? (p.items ?? []).map(x => (x.id === tx.id ? tx : x))
            : [tx, ...(p.items ?? [])].slice(0, size);

        const total =
            typeof p.total === "number" && !already ? p.total + 1 : p.total;

        return { ...p, items, total };
    });

    return { ...data, pages, pageParams: data.pageParams };
}

function stripById(
    data: InfiniteData<Page> | undefined,
    id: number
): InfiniteData<Page> | undefined {
    if (!data) return data;
    let changed = false;

    const pages = data.pages.map(p => {
        const items = (p.items ?? []).filter(x => Number(x.id) !== id);
        if (items.length !== (p.items?.length ?? 0)) changed = true;
        return { ...p, items };
    });

    return changed ? { ...data, pages, pageParams: data.pageParams } : data;
}

function stripBySaleId(
    data: InfiniteData<Page> | undefined,
    saleId: number
): InfiniteData<Page> | undefined {
    if (!data) return data;
    let changed = false;

    const pages = data.pages.map(p => {
        const items = (p.items ?? []).filter(
            x => Number((x as any).sale_id) !== saleId
        );
        if (items.length !== (p.items?.length ?? 0)) changed = true;
        return { ...p, items };
    });

    return changed ? { ...data, pages, pageParams: data.pageParams } : data;
}

type RTMessage = {
    resource?: string;
    action?: string;
    type?: string;
    payload?: any;
};

export default function useTransactionsRealtime() {
    const qc = useQueryClient();

    const invalidateTx = useCallback(
        (refetchType: "active" | "all" = "active") => {
            qc.invalidateQueries({
                predicate: ({ queryKey }) =>
                    Array.isArray(queryKey) && queryKey[0] === "transactions",
                refetchType,
            });
            qc.invalidateQueries({
                queryKey: ["transactions-head"],
                refetchType,
            });
        },
        [qc]
    );

    const onMsg = useCallback(
        async (raw: unknown) => {
            if (!raw || typeof raw !== "object") return;
            const m = raw as RTMessage;
            const resource = m.resource ?? m.type?.split(".")[0];
            const action = m.action ?? m.type?.split(".")[1];
            const payload = m.payload;

            if (!resource || !action) return;

            if (resource === "transaction") {
                if (
                    action === "created" &&
                    payload &&
                    payload.id &&
                    payload.bank &&
                    payload.type_str &&
                    payload.created_at
                ) {
                    qc.setQueriesData<InfiniteData<Page>>(
                        { queryKey: ["transactions"] },
                        d => prependToFirstPage(d, payload as TransactionView)
                    );
                    invalidateTx("active");
                    return;
                }

                if (action === "updated" && payload && payload.id) {
                    qc.setQueriesData<InfiniteData<Page>>(
                        { queryKey: ["transactions"] },
                        d => {
                            if (!d) return d;
                            let touched = false;

                            const pages = d.pages.map(p => {
                                const items = (p.items ?? []).map(x =>
                                    x.id === payload.id
                                        ? ((touched = true), { ...x, ...payload })
                                        : x
                                );
                                return { ...p, items };
                            });

                            return touched
                                ? { ...d, pages, pageParams: d.pageParams }
                                : d;
                        }
                    );
                    invalidateTx("active");
                    return;
                }

                if (action === "deleted" && payload?.id != null) {
                    const id = Number(payload.id);
                    qc.setQueriesData<InfiniteData<Page>>(
                        { queryKey: ["transactions"] },
                        d => stripById(d, id)
                    );
                    invalidateTx("active");
                    return;
                }

                return;
            }

            if (resource === "sale" && action === "deleted" && payload?.id != null) {
                const saleId = Number(payload.id);
                qc.setQueriesData<InfiniteData<Page>>(
                    { queryKey: ["transactions"] },
                    d => stripBySaleId(d, saleId)
                );
                invalidateTx("active");
                return;
            }

            if (
                (resource === "sale_payment" || resource === "purchase_payment") &&
                (action === "created" || action === "deleted")
            ) {
                invalidateTx("all");
                return;
            }
        },
        [qc, invalidateTx]
    );

    useRealtime(onMsg, {
        channel: process.env.NEXT_PUBLIC_RT_GLOBAL ?? "global:transactions",
        log: false,
    });
}
