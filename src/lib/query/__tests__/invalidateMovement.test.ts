import { describe, it, expect, beforeEach, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import {
    invalidateMovement,
    invalidateAllVolatile,
    rootsFor,
    MOVEMENT_INVALIDATIONS,
    type MovementKind,
} from "../invalidateMovement";

function fakeClient() {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    return {
        client: { invalidateQueries } as unknown as QueryClient,
        invalidateQueries,
    };
}

/** Root strings passed to invalidateQueries, in call order. */
function invalidatedRoots(fn: ReturnType<typeof vi.fn>): string[] {
    return fn.mock.calls.map((c) => String(c[0].queryKey[0]));
}

describe("invalidateMovement", () => {
    let ctx: ReturnType<typeof fakeClient>;
    beforeEach(() => {
        ctx = fakeClient();
    });

    // The core regression: the transactions page reads page 1 from
    // `transactions-head` and pages 2+ from `transactions`. Mutations used to
    // invalidate only `transactions`, so the newest rows stayed stale.
    const movesTransactions: MovementKind[] = [
        "sale",
        "sale_payment",
        "purchase",
        "purchase_payment",
        "expense",
        "transaction",
        "customer_payment",
        "investment",
        "loan",
    ];

    it.each(movesTransactions)("%s invalidates BOTH transaction roots", async (kind) => {
        await invalidateMovement(ctx.client, { kind });
        const roots = invalidatedRoots(ctx.invalidateQueries);
        expect(roots).toContain("transactions");
        expect(roots).toContain("transactions-head");
    });

    it.each(movesTransactions)("%s invalidates banks", async (kind) => {
        await invalidateMovement(ctx.client, { kind });
        expect(invalidatedRoots(ctx.invalidateQueries)).toContain("banks");
    });

    it("a sale invalidates every dependent domain", async () => {
        await invalidateMovement(ctx.client, { kind: "sale" });
        const roots = invalidatedRoots(ctx.invalidateQueries);
        for (const expected of [
            "sales",
            "transactions",
            "transactions-head",
            "products",
            "all-products",
            "profits",
            "banks",
            "customers",
            "dashboard",
        ]) {
            expect(roots, "sale should invalidate " + expected).toContain(expected);
        }
    });

    it("a purchase invalidates suppliers and stock but not profits", async () => {
        await invalidateMovement(ctx.client, { kind: "purchase" });
        const roots = invalidatedRoots(ctx.invalidateQueries);
        expect(roots).toContain("suppliers");
        expect(roots).toContain("all-products");
        expect(roots).not.toContain("profits");
    });

    it("an expense invalidates expenses, transactions, banks and dashboard", async () => {
        await invalidateMovement(ctx.client, { kind: "expense" });
        expect(invalidatedRoots(ctx.invalidateQueries).sort()).toEqual(
            ["banks", "dashboard", "expenses", "transactions", "transactions-head"].sort()
        );
    });

    it("reaches the sale-payments detail query when a saleId travels with the event", async () => {
        await invalidateMovement(ctx.client, {
            kind: "sale_payment",
            ids: { saleId: 42 },
        });
        const keys = ctx.invalidateQueries.mock.calls.map((c) => c[0].queryKey);
        expect(keys).toContainEqual(["sale-payments", { saleId: 42 }]);
    });

    it("reaches the purchase-payments and customer detail queries by id", async () => {
        await invalidateMovement(ctx.client, {
            kind: "purchase_payment",
            ids: { purchaseId: 7 },
        });
        expect(ctx.invalidateQueries.mock.calls.map((c) => c[0].queryKey)).toContainEqual([
            "purchase-payments",
            { purchaseId: 7 },
        ]);

        ctx = fakeClient();
        await invalidateMovement(ctx.client, {
            kind: "customer_payment",
            ids: { customerId: 9 },
        });
        expect(ctx.invalidateQueries.mock.calls.map((c) => c[0].queryKey)).toContainEqual([
            "customer",
            { id: 9 },
        ]);
    });

    it("ignores absent, null and non-finite ids", async () => {
        await invalidateMovement(ctx.client, {
            kind: "sale_payment",
            ids: { saleId: null, purchaseId: undefined, customerId: Number.NaN },
        });
        const keys = ctx.invalidateQueries.mock.calls.map((c) => c[0].queryKey);
        expect(keys.every((k) => k.length === 1)).toBe(true);
    });

    it("defaults to refetchType active so unmounted screens do not stampede", async () => {
        await invalidateMovement(ctx.client, { kind: "transaction" });
        for (const call of ctx.invalidateQueries.mock.calls) {
            expect(call[0].refetchType).toBe("active");
        }
    });

    it("honours an explicit refetchType", async () => {
        await invalidateMovement(ctx.client, { kind: "transaction" }, { refetchType: "all" });
        for (const call of ctx.invalidateQueries.mock.calls) {
            expect(call[0].refetchType).toBe("all");
        }
    });

    it("resolves only once the invalidations settle, so callers can await it", async () => {
        let release!: () => void;
        const gate = new Promise<void>((r) => {
            release = r;
        });
        const invalidateQueries = vi.fn().mockReturnValue(gate);
        const client = { invalidateQueries } as unknown as QueryClient;

        let settled = false;
        const p = invalidateMovement(client, { kind: "sale" }).then(() => {
            settled = true;
        });

        await Promise.resolve();
        expect(settled).toBe(false);
        release();
        await p;
        expect(settled).toBe(true);
    });

    it("merges server-reported affects with the static matrix", async () => {
        await invalidateMovement(ctx.client, {
            kind: "supplier",
            affects: ["banks", "dashboard"],
        });
        const roots = invalidatedRoots(ctx.invalidateQueries);
        expect(roots).toContain("suppliers");
        expect(roots).toContain("banks");
        expect(roots).toContain("dashboard");
    });

    it("never invalidates the same root twice for one event", async () => {
        await invalidateMovement(ctx.client, { kind: "sale", affects: ["sales", "banks"] });
        const roots = invalidatedRoots(ctx.invalidateQueries);
        expect(new Set(roots).size).toBe(roots.length);
    });
});

describe("MOVEMENT_INVALIDATIONS matrix", () => {
    it("never lists one transaction root without the other", () => {
        for (const [kind, roots] of Object.entries(MOVEMENT_INVALIDATIONS)) {
            const head = roots.includes("transactions-head");
            const tail = roots.includes("transactions");
            expect(head, kind + ": head/tail must be listed together").toBe(tail);
        }
    });

    it("invalidates the dashboard whenever money moves", () => {
        const moneyMoves: MovementKind[] = [
            "sale",
            "sale_payment",
            "purchase",
            "purchase_payment",
            "expense",
            "transaction",
            "customer_payment",
            "bank",
        ];
        for (const kind of moneyMoves) {
            expect(MOVEMENT_INVALIDATIONS[kind], kind).toContain("dashboard");
        }
    });

    it("has no duplicate roots in any row", () => {
        for (const [kind, roots] of Object.entries(MOVEMENT_INVALIDATIONS)) {
            expect(new Set(roots).size, kind + " has duplicates").toBe(roots.length);
        }
    });
});

describe("rootsFor", () => {
    it("returns the static matrix when the server reports nothing", () => {
        expect(rootsFor({ kind: "expense" })).toEqual(MOVEMENT_INVALIDATIONS.expense);
    });

    it("deduplicates when affects overlaps the matrix", () => {
        const roots = rootsFor({ kind: "expense", affects: ["banks", "audit-log"] });
        expect(new Set(roots).size).toBe(roots.length);
        expect(roots).toContain("audit-log");
    });
});

describe("invalidateAllVolatile", () => {
    it("covers the union of every movement row", async () => {
        const ctx = fakeClient();
        await invalidateAllVolatile(ctx.client);

        const roots = new Set(invalidatedRoots(ctx.invalidateQueries));
        const expected = new Set(Object.values(MOVEMENT_INVALIDATIONS).flat());
        expect(roots).toEqual(expected);
    });

    it("invalidates each root once", async () => {
        const ctx = fakeClient();
        await invalidateAllVolatile(ctx.client);
        const roots = invalidatedRoots(ctx.invalidateQueries);
        expect(new Set(roots).size).toBe(roots.length);
    });
});
