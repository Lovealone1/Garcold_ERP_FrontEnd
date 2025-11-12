"use client";
import { useCallback } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useRealtime } from "@/hooks/realtime/useRealtime";
import type { TransactionView } from "@/types/transaction";

type Page = { items: TransactionView[]; page: number; page_size: number; total?: number; total_pages?: number; has_next?: boolean };

function prependToFirstPage(data: InfiniteData<Page> | undefined, tx: TransactionView) {
    if (!data?.pages?.length) return data;
    const pages = data.pages.map((p, i) => {
        if (i !== 0) return p;
        const size = p.page_size ?? 10;
        const items = [tx, ...(p.items ?? [])]
            .filter((v, idx, arr) => arr.findIndex(x => x.id === v.id) === idx)
            .slice(0, size);
        const total = typeof p.total === "number" ? p.total + 1 : p.total;
        return { ...p, items, total };
    });
    return { ...data, pages, pageParams: data.pageParams };
}

function stripById(data: InfiniteData<Page> | undefined, id: number) {
    if (!data) return data;
    let changed = false;
    const pages = data.pages.map(p => {
        const items = (p.items ?? []).filter(x => Number(x.id) !== Number(id));
        if (items.length !== (p.items?.length ?? 0)) changed = true;
        return { ...p, items };
    });
    return changed ? { ...data, pages, pageParams: data.pageParams } : data;
}

function stripBySaleId(data: InfiniteData<Page> | undefined, saleId: number) {
    if (!data) return data;
    let changed = false;
    const pages = data.pages.map(p => {
        const items = (p.items ?? []).filter(x => Number(x.id) !== Number(saleId));
        if (items.length !== (p.items?.length ?? 0)) changed = true;
        return { ...p, items };
    });
    return changed ? { ...data, pages, pageParams: data.pageParams } : data;
}

const hits = {
    txCreated: (m: any) => m?.resource === "transaction" && m?.action === "created" && m?.payload?.id,
    txUpdated: (m: any) => m?.resource === "transaction" && m?.action === "updated" && m?.payload?.id,
    txDeleted: (m: any) => m?.resource === "transaction" && m?.action === "deleted" && m?.payload?.id,
    saleDeleted: (m: any) => m?.resource === "sale" && m?.action === "deleted" && m?.payload?.id,
    payChanged: (m: any) => m?.resource === "sale_payment" && (m?.action === "created" || m?.action === "deleted"),
};

export default function useTransactionsRealtime() {
    const qc = useQueryClient();

    const onMsg = useCallback(async (m: any) => {
        if (hits.txCreated(m) && m.payload && m.payload.bank && m.payload.type_str && m.payload.created_at) {
            qc.setQueriesData<InfiniteData<Page>>({ queryKey: ["transactions"] }, d => prependToFirstPage(d, m.payload as TransactionView));
            qc.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
            qc.invalidateQueries({ queryKey: ["transactions-head"], refetchType: "active" });
            return;
        }

        if (hits.txUpdated(m) && m.payload) {
            qc.setQueriesData<InfiniteData<Page>>({ queryKey: ["transactions"] }, d => {
                if (!d) return d;
                let touched = false;
                const pages = d.pages.map(p => {
                    const items = (p.items ?? []).map(x => x.id === m.payload.id ? (touched = true, { ...x, ...m.payload }) : x);
                    return { ...p, items };
                });
                return touched ? { ...d, pages, pageParams: d.pageParams } : d;
            });
            qc.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
            qc.invalidateQueries({ queryKey: ["transactions-head"], refetchType: "active" });
            return;
        }

        if (hits.txDeleted(m)) {
            const id = Number(m.payload.id);
            qc.setQueriesData<InfiniteData<Page>>({ queryKey: ["transactions"] }, d => stripById(d, id));
            qc.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
            qc.invalidateQueries({ queryKey: ["transactions-head"], refetchType: "active" });
            return;
        }

        if (hits.saleDeleted(m)) {
            const saleId = Number(m.payload.id);
            qc.setQueriesData<InfiniteData<Page>>({ queryKey: ["transactions"] }, d => stripBySaleId(d, saleId));
            qc.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
            qc.invalidateQueries({ queryKey: ["transactions-head"], refetchType: "active" });
            return;
        }

        if (hits.payChanged(m)) {
            qc.invalidateQueries({ queryKey: ["transactions"], refetchType: "all" });
            qc.invalidateQueries({ queryKey: ["transactions-head"], refetchType: "all" });
            return;
        }
    }, [qc]);

    useRealtime(onMsg, { channel: process.env.NEXT_PUBLIC_RT_GLOBAL ?? "global:transactions", log: false });
}
