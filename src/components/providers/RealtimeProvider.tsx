"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
    createRealtimeClient,
    parseEventKind,
    type RealtimeClient,
    type RealtimeEvent,
    type RealtimeStatus,
} from "@/lib/realtime/realtimeClient";
import {
    invalidateMovement,
    invalidateAllVolatile,
    type MovementKind,
} from "@/lib/query/invalidateMovement";

/**
 * The app's only realtime consumer.
 *
 * It used to hand-roll a separate invalidation branch per resource, which is
 * why four of the twelve resources the API publishes (expense, bank,
 * investment, loan) were silently dropped, and why a `sale.created` refreshed
 * the sales list but not the bank balance or stock it had just changed.
 *
 * Now every event maps to a MovementKind and goes through the same matrix the
 * mutations use, so a device watching a movement converges on exactly the same
 * state as the device that made it.
 */

/** API `resource` values that map onto a movement. */
const RESOURCE_TO_MOVEMENT: Record<string, MovementKind> = {
    sale: "sale",
    sale_payment: "sale_payment",
    purchase: "purchase",
    purchase_payment: "purchase_payment",
    expense: "expense",
    transaction: "transaction",
    customer: "customer",
    customer_payment: "customer_payment",
    supplier: "supplier",
    product: "product",
    bank: "bank",
    investment: "investment",
    loan: "loan",
};

function numeric(value: unknown): number | null {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/** Ids the matrix needs to reach detail queries. */
function idsFrom(resource: string, payload: RealtimeEvent["payload"]) {
    const p = (payload ?? {}) as Record<string, unknown>;
    return {
        saleId: numeric(p.sale_id) ?? (resource === "sale" ? numeric(p.id) : null),
        purchaseId:
            numeric(p.purchase_id) ?? (resource === "purchase" ? numeric(p.id) : null),
        customerId:
            numeric(p.customer_id) ?? (resource === "customer" ? numeric(p.id) : null),
    };
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const qc = useQueryClient();
    const [status, setStatus] = useState<RealtimeStatus>("idle");
    const clientRef = useRef<RealtimeClient | null>(null);

    useEffect(() => {
        const client = createRealtimeClient({
            url: process.env.NEXT_PUBLIC_WS_URL,

            getToken: async () => {
                const { data } = await supabase().auth.getSession();
                return data.session?.access_token ?? null;
            },

            onEvent: (event) => {
                const kind = parseEventKind(event);
                if (!kind) return;

                const movement = RESOURCE_TO_MOVEMENT[kind.resource];
                if (!movement) return;

                void invalidateMovement(qc, {
                    kind: movement,
                    ids: idsFrom(kind.resource, event.payload),
                    affects: event.affects,
                });
            },

            // Events published while the socket was down are not replayed, so
            // after a reconnect nothing in the cache can be trusted.
            onResync: () => {
                void invalidateAllVolatile(qc);
            },

            onStatus: (next, detail) => {
                setStatus(next);
                if (process.env.NODE_ENV !== "production") {
                    console.info("[realtime]", next, detail ?? "");
                }
            },
        });

        clientRef.current = client;
        client.start();

        return () => {
            client.stop();
            clientRef.current = null;
        };
    }, [qc]);

    return (
        <div data-realtime-status={status} style={{ display: "contents" }}>
            {children}
        </div>
    );
}

export default RealtimeProvider;
