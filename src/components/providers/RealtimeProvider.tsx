// RealtimeProvider.tsx
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
            console.log("[RT] connecting to", url);

            ws = new WebSocket(url);

            ws.onopen = () => {
                console.log("[RT] websocket open");
            };

            ws.onmessage = async (event) => {
                console.log("[RT] raw message:", event.data);

                let msg: any;
                try {
                    msg = JSON.parse(event.data);
                } catch (e) {
                    console.log("[RT] invalid json", e);
                    return;
                }

                const { resource, action, type, payload } = msg;
                console.log("[RT] parsed message:", msg);

                const finalResource =
                    resource || (typeof type === "string" ? type.split(".")[0] : undefined);
                const finalAction =
                    action || (typeof type === "string" ? type.split(".")[1] : undefined);

                // Solo nos importa sale.created / updated / deleted
                if (finalResource !== "sale") return;

                // ==== CREATE: meter nueva venta en página 1 inmediatamente ====
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

                                // Evitar duplicado si ya vino por otro lado
                                const existing =
                                    first.items?.filter((s) => s.id !== newSale.id) ?? [];

                                const updatedFirst: SalePage = {
                                    ...first,
                                    items: [newSale, ...existing].slice(0, pageSize),
                                    // opcional, ajusta total si tu backend lo usa
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

                        // Si no había cache de sales, forzamos fetch normal
                        if (!touched) {
                            qc.invalidateQueries({
                                predicate: (q) =>
                                    Array.isArray(q.queryKey) && q.queryKey[0] === "sales",
                                // aquí puedes dejar que TanStack haga el fetch
                            });
                        }

                        console.log("[RT] sale.created applied to first page");
                    } catch (e) {
                        console.log("[RT] failed to hydrate new sale, fallback invalidate", e);
                        qc.invalidateQueries({
                            predicate: (q) =>
                                Array.isArray(q.queryKey) && q.queryKey[0] === "sales",
                        });
                    }

                    return;
                }

                // ==== UPDATE / DELETE: para ahora, invalidamos y listo ====
                if (finalAction === "updated" || finalAction === "deleted") {
                    qc.invalidateQueries({
                        predicate: (q) =>
                            Array.isArray(q.queryKey) && q.queryKey[0] === "sales",
                    });
                }
            };

            ws.onerror = (err) => {
                console.log("[RT] websocket error", err);
            };

            ws.onclose = (ev) => {
                console.log("[RT] websocket closed", ev.code, ev.reason);
                if (!closed) {
                    setTimeout(() => {
                        console.log("[RT] reconnecting...");
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
