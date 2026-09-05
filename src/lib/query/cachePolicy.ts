import type { Query } from "@tanstack/react-query";

/**
 * How long each kind of data may be served from cache, and whether it may be
 * written to localStorage.
 *
 * The app previously applied one policy to everything: 30 minutes fresh, three
 * days retained, and the whole client persisted to localStorage. For financial
 * movements that is indefensible -- a sale recorded on the phone stayed
 * invisible on the laptop for half an hour, and a browser reopened two days
 * later presented two-day-old balances as current.
 *
 * Volatility, not convenience, decides the tier.
 */
export type CacheTier = "volatile" | "inventory" | "contacts" | "static";

export const TIER_STALE_TIME: Record<CacheTier, number> = {
    /** Money and anything derived from it. Never serve without revalidating. */
    volatile: 0,
    /** Stock counts: wrong for a moment is survivable, wrong for a minute is not. */
    inventory: 30_000,
    /** Directory data; changes rarely and is cheap to be slightly behind on. */
    contacts: 2 * 60_000,
    /** Lookup tables that change on a deploy, not during a shift. */
    static: 30 * 60_000,
};

/**
 * Only these tiers survive a page reload.
 *
 * Persisting a financial figure is what let stale money outlive the session:
 * restoring it paints a number that was true days ago with no visual
 * difference from a fresh one.
 */
export const TIER_PERSISTED: Record<CacheTier, boolean> = {
    volatile: false,
    inventory: false,
    contacts: true,
    static: true,
};

const ROOT_TIERS: Record<string, CacheTier> = {
    sales: "volatile",
    purchases: "volatile",
    expenses: "volatile",
    transactions: "volatile",
    "transactions-head": "volatile",
    banks: "volatile",
    profits: "volatile",
    dashboard: "volatile",
    "sale-payments": "volatile",
    "purchase-payments": "volatile",

    products: "inventory",
    "all-products": "inventory",

    customers: "contacts",
    customer: "contacts",
    suppliers: "contacts",
};

/** Unknown roots are treated as volatile: a wrong guess must fail safe. */
export const DEFAULT_TIER: CacheTier = "volatile";

export function tierForRoot(root: unknown): CacheTier {
    if (typeof root !== "string") return DEFAULT_TIER;
    return ROOT_TIERS[root] ?? DEFAULT_TIER;
}

export function tierForKey(queryKey: readonly unknown[] | undefined): CacheTier {
    if (!Array.isArray(queryKey) || queryKey.length === 0) return DEFAULT_TIER;
    return tierForRoot(queryKey[0]);
}

export function staleTimeForKey(queryKey: readonly unknown[] | undefined): number {
    return TIER_STALE_TIME[tierForKey(queryKey)];
}

/**
 * Whether a query may be written to localStorage.
 *
 * Also refuses to persist errored or still-pending queries: restoring a failure
 * as though it were data produces an empty screen with no way to recover short
 * of a manual refresh.
 */
export function shouldPersistQuery(query: Pick<Query, "queryKey" | "state">): boolean {
    if (query.state.status !== "success") return false;
    return TIER_PERSISTED[tierForKey(query.queryKey)];
}

/**
 * Storage key for the persisted cache.
 *
 * Scoped by user so a second account cannot restore the first one's data, and
 * by a schema version so a shape change invalidates old entries instead of
 * rehydrating something the code no longer understands.
 */
export const CACHE_SCHEMA_VERSION = "v12";

export function persistKeyForUser(userId: string | null | undefined): string {
    return "garcold-query-cache-" + CACHE_SCHEMA_VERSION + "-" + (userId ?? "anon");
}

/** Every persist key this build could have written, for cleanup on sign-out. */
export function isOwnPersistKey(key: string): boolean {
    return key.startsWith("garcold-query-cache-") || key === "transactions-cache-v11";
}
