/**
 * Single source of truth for every TanStack Query key in the app.
 *
 * Keys used to be written inline at each call site, which is how
 * `transactions-head` drifted away from `transactions`: mutations invalidated
 * one root and the page read from both, so the query holding the newest rows
 * kept serving stale data.
 *
 * Two rules keep that from coming back:
 *   1. Nothing outside this file writes a key string.
 *   2. Every root exposes `all`, so a prefix invalidation reaches every
 *      variant regardless of the filter object appended to it.
 *
 * Shapes match what the hooks already produced, so this is a refactor with no
 * behavioural change to cache identity.
 */

/** Filters that participate in a list query's cache identity. */
export type ListParams = Record<string, unknown>;

const root = <T extends string>(name: T) => [name] as const;

export const queryKeys = {
    sales: {
        all: root("sales"),
        list: (params: ListParams) => ["sales", "list", params] as const,
        filterOptions: () => ["sales", "filter-options"] as const,
        summary: (params: ListParams) => ["sales", "summary", params] as const,
    },

    purchases: {
        all: root("purchases"),
        list: (params: ListParams) => ["purchases", "list", params] as const,
        filterOptions: () => ["purchases", "filter-options"] as const,
        summary: (params: ListParams) => ["purchases", "summary", params] as const,
    },

    expenses: {
        all: root("expenses"),
        list: (params: ListParams) => ["expenses", "list", params] as const,
        filterOptions: () => ["expenses", "filter-options"] as const,
        summary: (params: ListParams) => ["expenses", "summary", params] as const,
    },

    /**
     * The screen now reads one page at a time from a single root.
     *
     * It used to be split across `transactions-head` (page 1) and
     * `transactions` (pages 2+), which is how invalidation kept missing the
     * newest rows. `head`/`tail` are retained so the invalidation matrix still
     * covers the old root on clients running a cached bundle.
     */
    transactions: {
        all: root("transactions"),
        list: (params: ListParams) => ["transactions", "list", params] as const,
        filterOptions: () => ["transactions", "filter-options"] as const,
        summary: (params: ListParams) => ["transactions", "summary", params] as const,
        head: (params: ListParams) => ["transactions-head", params] as const,
        headAll: root("transactions-head"),
        tail: (params: ListParams) => ["transactions", params] as const,
        tailAll: root("transactions"),
    },

    banks: {
        all: root("banks"),
        list: () => ["banks", "list"] as const,
    },

    products: {
        all: root("products"),
        list: (params: ListParams) => ["products", params] as const,
        /** Unpaginated catalogue used by the cart pickers; a separate root. */
        allItems: root("all-products"),
        allItemsList: (params: ListParams) => ["all-products", params] as const,
    },

    customers: {
        all: root("customers"),
        list: (params: ListParams) => ["customers", params] as const,
        options: (params: ListParams) => ["customers", "all", params] as const,
        detail: (id: number) => ["customer", { id }] as const,
        detailAll: root("customer"),
    },

    suppliers: {
        all: root("suppliers"),
        list: (params: ListParams) => ["suppliers", params] as const,
        options: (params: ListParams) => ["suppliers", "all", params] as const,
    },

    profits: {
        all: root("profits"),
        list: (params: ListParams) => ["profits", params] as const,
        options: (params: ListParams) => ["profits", "all", params] as const,
    },

    salePayments: {
        all: root("sale-payments"),
        list: (saleId: number) => ["sale-payments", { saleId }] as const,
    },

    purchasePayments: {
        all: root("purchase-payments"),
        list: (purchaseId: number) => ["purchase-payments", { purchaseId }] as const,
    },

    dashboard: {
        all: root("dashboard"),
        detail: (params: ListParams) => ["dashboard", params] as const,
    },
} as const;

/** Every root the app owns. Used by cache-policy and logout cleanup. */
export const QUERY_ROOTS = [
    "sales",
    "purchases",
    "expenses",
    "transactions",
    "transactions-head",
    "banks",
    "products",
    "all-products",
    "customers",
    "customer",
    "suppliers",
    "profits",
    "sale-payments",
    "purchase-payments",
    "dashboard",
] as const;

export type QueryRoot = (typeof QUERY_ROOTS)[number];
