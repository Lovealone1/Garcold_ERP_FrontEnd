"use client";

import { useEffect } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { getSaleById } from "@/services/sales/sale.api";
import type { SalePage } from "@/types/sale";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL!;

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const qc = useQueryClient();

    useEffect(() => {
        let ws: WebSocket | null = null;
        let closed = false;

        const connect = async () => {
            const { data } = await supabase().auth.getSession();
            const token = data.session?.access_token;
            if (!token || closed) return;

            const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
            ws = new WebSocket(url);

            ws.onmessage = async (event) => {
                let msg: any;
                try {
                    msg = JSON.parse(event.data);
                } catch {
                    return;
                }

                const { resource, action, type, payload } = msg;

                const finalResource =
                    resource || (typeof type === "string" ? type.split(".")[0] : undefined);
                const finalAction =
                    action || (typeof type === "string" ? type.split(".")[1] : undefined);

                if (!finalResource || !finalAction) return;

                if (finalResource === "sale") {
                    if (finalAction === "created" && payload?.id) {
                        const saleId = payload.id;

                        try {
                            const newSale = await getSaleById(saleId);

                            let touched = false;

                            qc.setQueriesData<InfiniteData<SalePage>>(
                                {
                                    predicate: (q) =>
                                        Array.isArray(q.queryKey) && q.queryKey[0] === "sales",
                                },
                                (old) => {
                                    if (!old) return old;

                                    const [first, ...rest] = old.pages;
                                    if (!first) return old;

                                    const pageSize = first.page_size ?? 8;

                                    const existing =
                                        first.items?.filter((s) => s.id !== newSale.id) ?? [];

                                    const updatedFirst: SalePage = {
                                        ...first,
                                        items: [newSale, ...existing].slice(0, pageSize),
                                        total:
                                            typeof first.total === "number"
                                                ? first.total + 1
                                                : first.total,
                                    };

                                    touched = true;

                                    return {
                                        ...old,
                                        pages: [updatedFirst, ...rest],
                                    };
                                }
                            );

                            if (!touched) {
                                qc.invalidateQueries({
                                    predicate: (q) =>
                                        Array.isArray(q.queryKey) && q.queryKey[0] === "sales",
                                });
                            }
                        } catch {
                            qc.invalidateQueries({
                                predicate: (q) =>
                                    Array.isArray(q.queryKey) && q.queryKey[0] === "sales",
                            });
                        }

                        return;
                    }

                    if (finalAction === "updated" || finalAction === "deleted") {
                        qc.invalidateQueries({
                            predicate: (q) =>
                                Array.isArray(q.queryKey) && q.queryKey[0] === "sales",
                            refetchType: "active",
                        });
                    }

                    return;
                }

                if (finalResource === "purchase") {
                    if (
                        finalAction === "created" ||
                        finalAction === "updated" ||
                        finalAction === "deleted"
                    ) {
                        qc.invalidateQueries({
                            predicate: ({ queryKey }) =>
                                Array.isArray(queryKey) && queryKey[0] === "purchases",
                            refetchType: "active",
                        });

                        qc.invalidateQueries({
                            predicate: ({ queryKey }) =>
                                Array.isArray(queryKey) && queryKey[0] === "transactions",
                            refetchType: "active",
                        });
                    }

                    return;
                }

                if (finalResource === "transaction") {
                    if (
                        finalAction === "created" ||
                        finalAction === "updated" ||
                        finalAction === "deleted"
                    ) {
                        qc.invalidateQueries({
                            predicate: ({ queryKey }) =>
                                Array.isArray(queryKey) && queryKey[0] === "transactions",
                            refetchType: "active",
                        });
                    }

                    return;
                }

                if (finalResource === "sale_payment") {
                    if (
                        finalAction === "created" ||
                        finalAction === "deleted" ||
                        finalAction === "updated"
                    ) {
                        const saleId = Number(payload?.sale_id);

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
                    }

                    return;
                }

                if (finalResource === "purchase_payment") {
                    if (
                        finalAction === "created" ||
                        finalAction === "deleted" ||
                        finalAction === "updated"
                    ) {
                        const purchaseId = Number(payload?.purchase_id);

                        qc.invalidateQueries({
                            predicate: ({ queryKey }) =>
                                Array.isArray(queryKey) && queryKey[0] === "purchases",
                            refetchType: "active",
                        });

                        if (!Number.isNaN(purchaseId)) {
                            qc.invalidateQueries({
                                queryKey: ["purchase-payments", { purchaseId }],
                                refetchType: "active",
                            });
                        }

                        qc.invalidateQueries({
                            predicate: ({ queryKey }) =>
                                Array.isArray(queryKey) && queryKey[0] === "transactions",
                            refetchType: "active",
                        });
                    }

                    return;
                }

                if (finalResource === "supplier") {
                    if (
                        finalAction === "created" ||
                        finalAction === "updated" ||
                        finalAction === "deleted"
                    ) {
                        qc.invalidateQueries({
                            predicate: ({ queryKey }) =>
                                Array.isArray(queryKey) && queryKey[0] === "suppliers",
                            refetchType: "active",
                        });
                    }

                    return;
                }

                if (finalResource === "customer") {
                    if (
                        finalAction === "created" ||
                        finalAction === "updated" ||
                        finalAction === "deleted"
                    ) {
                        const customerId = Number(payload?.id);

                        qc.invalidateQueries({
                            predicate: ({ queryKey }) =>
                                Array.isArray(queryKey) && queryKey[0] === "customers",
                            refetchType: "active",
                        });

                        if (!Number.isNaN(customerId)) {
                            qc.invalidateQueries({
                                queryKey: ["customer", { id: customerId }],
                                refetchType: "active",
                            });
                        }
                    }

                    return;
                }

                if (finalResource === "customer_payment") {
                    if (finalAction === "created") {
                        const customerId = Number(payload?.customer_id);

                        qc.invalidateQueries({
                            predicate: ({ queryKey }) =>
                                Array.isArray(queryKey) && queryKey[0] === "customers",
                            refetchType: "active",
                        });

                        if (!Number.isNaN(customerId)) {
                            qc.invalidateQueries({
                                queryKey: ["customer", { id: customerId }],
                                refetchType: "active",
                            });
                        }

                        qc.invalidateQueries({
                            predicate: ({ queryKey }) =>
                                Array.isArray(queryKey) && queryKey[0] === "transactions",
                            refetchType: "active",
                        });

                        qc.invalidateQueries({
                            predicate: ({ queryKey }) =>
                                Array.isArray(queryKey) && queryKey[0] === "banks",
                            refetchType: "active",
                        });
                    }

                    return;
                }

                if (finalResource === "product") {
                    if (
                        finalAction === "created" ||
                        finalAction === "updated" ||
                        finalAction === "deleted"
                    ) {
                        qc.invalidateQueries({
                            predicate: ({ queryKey }) =>
                                Array.isArray(queryKey) && queryKey[0] === "products",
                            refetchType: "active",
                        });

                        qc.invalidateQueries({
                            predicate: ({ queryKey }) =>
                                Array.isArray(queryKey) && queryKey[0] === "all-products",
                            refetchType: "active",
                        });
                    }

                    return;
                }
            };

            ws.onclose = () => {
                if (!closed) {
                    setTimeout(() => {
                        connect();
                    }, 2000);
                }
            };
        };

        connect();

        return () => {
            closed = true;
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [qc]);

    return <>{children}</>;
}
