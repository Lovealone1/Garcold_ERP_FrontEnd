import { describe, it, expect } from "vitest";
import { queryKeys, QUERY_ROOTS } from "../queryKeys";

describe("queryKeys", () => {
    it("keeps the list shapes the hooks already used", () => {
        expect(queryKeys.purchases.list({ pageSize: 8 })).toEqual(["purchases", { pageSize: 8 }]);
        expect(queryKeys.customers.list({ pageSize: 8 })).toEqual(["customers", { pageSize: 8 }]);
        expect(queryKeys.suppliers.list({ pageSize: 8 })).toEqual(["suppliers", { pageSize: 8 }]);
        expect(queryKeys.customers.detail(7)).toEqual(["customer", { id: 7 }]);
        expect(queryKeys.salePayments.list(3)).toEqual(["sale-payments", { saleId: 3 }]);
        expect(queryKeys.purchasePayments.list(4)).toEqual(["purchase-payments", { purchaseId: 4 }]);
    });

    // Roots that gained sibling endpoints (filter-options, summary) nest their
    // pages under a "list" segment. A prefix invalidation on the root still
    // reaches all three, which is what the matrix relies on.
    it("nests paged lists under the root that owns sibling endpoints", () => {
        expect(queryKeys.sales.list({ pageSize: 8 })).toEqual([
            "sales",
            "list",
            { pageSize: 8 },
        ]);
        expect(queryKeys.sales.filterOptions()).toEqual(["sales", "filter-options"]);
        expect(queryKeys.sales.summary({})).toEqual(["sales", "summary", {}]);

        expect(queryKeys.transactions.list({ page: 1 })).toEqual([
            "transactions",
            "list",
            { page: 1 },
        ]);
        expect(queryKeys.transactions.filterOptions()).toEqual([
            "transactions",
            "filter-options",
        ]);
    });

    it("keeps every sibling under the invalidatable root", () => {
        for (const key of [
            queryKeys.sales.list({}),
            queryKeys.sales.filterOptions(),
            queryKeys.sales.summary({}),
        ]) {
            expect(key[0]).toBe("sales");
        }
        for (const key of [
            queryKeys.transactions.list({}),
            queryKeys.transactions.filterOptions(),
            queryKeys.transactions.summary({}),
        ]) {
            expect(key[0]).toBe("transactions");
        }
    });

    it("models head and tail as separate roots", () => {
        // They are genuinely different roots -- a prefix match on one cannot
        // reach the other. Every consumer must therefore handle both.
        expect(queryKeys.transactions.head({ pageSize: 8 })[0]).toBe("transactions-head");
        expect(queryKeys.transactions.tail({ pageSize: 8 })[0]).toBe("transactions");
        expect(queryKeys.transactions.headAll[0]).not.toBe(queryKeys.transactions.tailAll[0]);
    });

    it("exposes an `all` prefix for every root that has list variants", () => {
        expect(queryKeys.sales.all).toEqual(["sales"]);
        expect(queryKeys.products.all).toEqual(["products"]);
        expect(queryKeys.products.allItems).toEqual(["all-products"]);
        expect(queryKeys.banks.all).toEqual(["banks"]);
        expect(queryKeys.dashboard.all).toEqual(["dashboard"]);
    });

    it("produces equal keys for equal params so cache identity is stable", () => {
        expect(queryKeys.sales.list({ pageSize: 8 })).toEqual(queryKeys.sales.list({ pageSize: 8 }));
    });

    it("lists every root exactly once in QUERY_ROOTS", () => {
        expect(new Set(QUERY_ROOTS).size).toBe(QUERY_ROOTS.length);
    });

    it("has a QUERY_ROOTS entry for every key the catalog can produce", () => {
        const produced = new Set<string>();
        const walk = (node: unknown) => {
            if (Array.isArray(node)) {
                produced.add(String(node[0]));
                return;
            }
            if (typeof node === "function") {
                produced.add(String((node as (p: never) => readonly unknown[])({} as never)[0]));
                return;
            }
            if (node && typeof node === "object") Object.values(node).forEach(walk);
        };
        walk(queryKeys);

        for (const root of produced) {
            expect(QUERY_ROOTS, `root "${root}" missing from QUERY_ROOTS`).toContain(root);
        }
    });
});
