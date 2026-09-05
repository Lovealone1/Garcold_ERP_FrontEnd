import type { QueryClient } from "@tanstack/react-query";
import { queryKeys, type QueryRoot } from "./queryKeys";

/**
 * Every domain event that can move money, stock or balances.
 *
 * Names mirror the `resource` field the API publishes over the WebSocket
 * (app/core/realtime.py), so a realtime message maps to a movement without a
 * translation table.
 */
export type MovementKind =
    | "sale"
    | "sale_payment"
    | "purchase"
    | "purchase_payment"
    | "expense"
    | "transaction"
    | "customer"
    | "customer_payment"
    | "supplier"
    | "product"
    | "bank"
    | "investment"
    | "loan";

/** Entity ids a movement carries, used to reach detail queries. */
export type MovementIds = {
    saleId?: number | null;
    purchaseId?: number | null;
    customerId?: number | null;
};

export type MovementEvent = {
    kind: MovementKind;
    ids?: MovementIds;
    /**
     * Roots the API reported as actually touched (the `affects` field on the
     * realtime envelope). When present these are merged with the static matrix,
     * so the server can widen the fan-out without a frontend release.
     */
    affects?: readonly string[];
};

/** Both transaction roots. Listing one without the other is the bug this file exists to prevent. */
const TRANSACTIONS: readonly QueryRoot[] = ["transactions", "transactions-head"];

/** Both product roots: the paginated grid and the unpaginated cart catalogue. */
const PRODUCTS: readonly QueryRoot[] = ["products", "all-products"];

/**
 * What each movement invalidates.
 *
 * A sale, for instance, does not only change the sales list: it writes a
 * transaction, moves a bank balance, decrements stock, records a profit and --
 * on credit -- moves the customer balance. The API publishes only `sale.created`,
 * so this table is what turns one event into a consistent screen.
 */
export const MOVEMENT_INVALIDATIONS: Record<MovementKind, readonly QueryRoot[]> = {
    sale: ["sales", ...TRANSACTIONS, ...PRODUCTS, "profits", "banks", "customers", "customer", "dashboard"],
    sale_payment: ["sales", "sale-payments", ...TRANSACTIONS, "banks", "customers", "customer", "dashboard"],
    purchase: ["purchases", ...TRANSACTIONS, ...PRODUCTS, "banks", "suppliers", "dashboard"],
    purchase_payment: ["purchases", "purchase-payments", ...TRANSACTIONS, "banks", "suppliers", "dashboard"],
    expense: ["expenses", ...TRANSACTIONS, "banks", "dashboard"],
    transaction: [...TRANSACTIONS, "banks", "dashboard"],
    customer: ["customers", "customer"],
    customer_payment: ["customers", "customer", ...TRANSACTIONS, "banks", "dashboard"],
    supplier: ["suppliers"],
    product: [...PRODUCTS],
    bank: ["banks", "dashboard"],
    investment: ["banks", ...TRANSACTIONS, "dashboard"],
    loan: ["banks", ...TRANSACTIONS, "dashboard"],
};

/** Detail keys that depend on an id travelling with the event. */
function detailKeys(event: MovementEvent): readonly (readonly unknown[])[] {
    const { saleId, purchaseId, customerId } = event.ids ?? {};
    const keys: (readonly unknown[])[] = [];

    if (typeof saleId === "number" && Number.isFinite(saleId)) {
        keys.push(queryKeys.salePayments.list(saleId));
    }
    if (typeof purchaseId === "number" && Number.isFinite(purchaseId)) {
        keys.push(queryKeys.purchasePayments.list(purchaseId));
    }
    if (typeof customerId === "number" && Number.isFinite(customerId)) {
        keys.push(queryKeys.customers.detail(customerId));
    }
    return keys;
}

/** Roots for an event: the static matrix plus anything the server flagged. */
export function rootsFor(event: MovementEvent): readonly string[] {
    const base = MOVEMENT_INVALIDATIONS[event.kind] ?? [];
    if (!event.affects?.length) return base;
    return Array.from(new Set<string>([...base, ...event.affects]));
}

/**
 * Invalidate everything a movement touches.
 *
 * Awaiting the returned promise waits for the *active* queries to refetch, so a
 * caller can hold a modal open (or delay a redirect) until the list behind it
 * actually shows the new row. `refetchType: "active"` keeps unmounted screens
 * from stampeding the API; they refetch on mount.
 */
export function invalidateMovement(
    queryClient: QueryClient,
    event: MovementEvent,
    options: { refetchType?: "active" | "all" | "none" } = {}
): Promise<void> {
    const refetchType = options.refetchType ?? "active";

    const jobs = rootsFor(event).map((rootKey) =>
        queryClient.invalidateQueries({ queryKey: [rootKey], refetchType })
    );

    for (const key of detailKeys(event)) {
        jobs.push(queryClient.invalidateQueries({ queryKey: key, refetchType }));
    }

    return Promise.all(jobs).then(() => undefined);
}

/**
 * Refetch every volatile root at once.
 *
 * Used after a realtime reconnect, where events may have been missed while the
 * socket was down and the only safe assumption is that anything could be stale.
 */
export function invalidateAllVolatile(
    queryClient: QueryClient,
    options: { refetchType?: "active" | "all" | "none" } = {}
): Promise<void> {
    const refetchType = options.refetchType ?? "active";
    const roots = new Set<string>();
    for (const kind of Object.keys(MOVEMENT_INVALIDATIONS) as MovementKind[]) {
        for (const r of MOVEMENT_INVALIDATIONS[kind]) roots.add(r);
    }
    return Promise.all(
        Array.from(roots).map((rootKey) =>
            queryClient.invalidateQueries({ queryKey: [rootKey], refetchType })
        )
    ).then(() => undefined);
}
