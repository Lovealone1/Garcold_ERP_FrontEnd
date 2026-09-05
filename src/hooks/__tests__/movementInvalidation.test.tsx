import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import { makeTestQueryClient, makeWrapper } from "@/test/queryWrapper";

/**
 * The plan's minimum test matrix, executed end to end.
 *
 * For each movement we mount a real query on every root the UI reads, run the
 * real mutation hook against a mocked API, and assert those queries actually
 * refetched. Asserting on refetch rather than on invalidateQueries calls is
 * what catches a root that is invalidated under a key nothing subscribes to.
 */

// ---- API mocks -------------------------------------------------------------
const createSale = vi.fn();
const deleteSale = vi.fn();
const createSalePayment = vi.fn();
const deleteSalePayment = vi.fn();
vi.mock("@/services/sales/sale.api", () => ({
    createSale: (...a: unknown[]) => createSale(...a),
    deleteSale: (...a: unknown[]) => deleteSale(...a),
    createSalePayment: (...a: unknown[]) => createSalePayment(...a),
    deleteSalePayment: (...a: unknown[]) => deleteSalePayment(...a),
}));

const createPurchase = vi.fn();
const deletePurchase = vi.fn();
const createPurchasePayment = vi.fn();
const deletePurchasePayment = vi.fn();
vi.mock("@/services/sales/purchase.api", () => ({
    createPurchase: (...a: unknown[]) => createPurchase(...a),
    deletePurchase: (...a: unknown[]) => deletePurchase(...a),
    createPurchasePayment: (...a: unknown[]) => createPurchasePayment(...a),
    deletePurchasePayment: (...a: unknown[]) => deletePurchasePayment(...a),
}));

const createExpense = vi.fn();
const deleteExpense = vi.fn();
vi.mock("@/services/sales/expense.api", () => ({
    createExpense: (...a: unknown[]) => createExpense(...a),
    deleteExpense: (...a: unknown[]) => deleteExpense(...a),
}));

const createTransaction = vi.fn();
const deleteTransaction = vi.fn();
vi.mock("@/services/sales/transaction.api", () => ({
    createTransaction: (...a: unknown[]) => createTransaction(...a),
    deleteTransaction: (...a: unknown[]) => deleteTransaction(...a),
}));

// Notifications are UI-only noise here.
vi.mock("@/components/providers/NotificationsProvider", () => ({
    useNotifications: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

import { useCreateVenta } from "@/hooks/ventas/useCreateVenta";
import { useDeleteVenta } from "@/hooks/ventas/useDeleteVenta";
import { useCreatePagoVenta } from "@/hooks/ventas/useCreatePagoVenta";
import { useDeletePagoVenta } from "@/hooks/ventas/useDeletePagoVenta";
import { useCreatePurchase } from "@/hooks/compras/useCreatePurchase";
import { useDeletePurchase } from "@/hooks/compras/useDeletePurchase";
import { useCreatePurchasePayment } from "@/hooks/compras/useCreatePurchasePayment";
import { useDeletePurchasePayment } from "@/hooks/compras/useDeletePurchasePayment";
import { useCreateExpense } from "@/hooks/gastos/useCreateGasto";
import { useDeleteExpense } from "@/hooks/gastos/useDeleteGasto";
import { useCreateTransaction } from "@/hooks/transacciones/useCreateTransaccion";
import { useDeleteTransaction } from "@/hooks/transacciones/useDeleteTransaccion";

// ---- Observers -------------------------------------------------------------

/** Every root a screen can be subscribed to, with the key shape it really uses. */
const WATCHED: Record<string, readonly unknown[]> = {
    sales: ["sales", { pageSize: 8 }],
    purchases: ["purchases", { pageSize: 8 }],
    expenses: ["expenses", { pageSize: 8 }],
    transactionsTail: ["transactions", { pageSize: 8 }],
    transactionsHead: ["transactions-head", { pageSize: 8 }],
    banks: ["banks", "list"],
    products: ["products", { pageSize: 8 }],
    allProducts: ["all-products", { force: 0 }],
    profits: ["profits", { pageSize: 8 }],
    customers: ["customers", { pageSize: 8 }],
    suppliers: ["suppliers", { pageSize: 8 }],
    dashboard: ["dashboard", { params: null, topLimit: 10 }],
    salePayments: ["sale-payments", { saleId: 5 }],
    purchasePayments: ["purchase-payments", { purchaseId: 9 }],
};

type Counters = Record<string, number>;

/** Mounts one live query per watched root and counts its fetches. */
function useWatchAll(counters: Counters) {
    for (const [name, key] of Object.entries(WATCHED)) {
        // Fixed iteration order over a constant object keeps hook order stable.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useQuery({
            queryKey: key,
            queryFn: async () => {
                counters[name] = (counters[name] ?? 0) + 1;
                return { items: [] };
            },
            staleTime: 0,
        });
    }
}

async function mountWatchers(client: QueryClient) {
    const counters: Counters = {};
    const wrapper = makeWrapper(client);
    renderHook(() => useWatchAll(counters), { wrapper });
    await waitFor(() =>
        expect(Object.keys(counters).length).toBe(Object.keys(WATCHED).length)
    );
    await waitFor(() => expect(client.isFetching()).toBe(0));
    return counters;
}

function snapshot(counters: Counters): Counters {
    return { ...counters };
}

/** Roots whose fetch count grew between two snapshots. */
function refetched(before: Counters, after: Counters): string[] {
    return Object.keys(after).filter((k) => (after[k] ?? 0) > (before[k] ?? 0));
}

async function expectRefetched(
    client: QueryClient,
    before: Counters,
    counters: Counters,
    expected: string[]
) {
    await waitFor(() => expect(client.isFetching()).toBe(0));
    const got = refetched(before, counters);
    for (const name of expected) {
        expect(got, name + " should have refetched (got: " + got.join(", ") + ")").toContain(
            name
        );
    }
}

const TX = ["transactionsHead", "transactionsTail"];

describe("movement invalidation matrix (end to end)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        createSale.mockResolvedValue({ id: 1 });
        deleteSale.mockResolvedValue(undefined);
        createSalePayment.mockResolvedValue({ id: 1 });
        deleteSalePayment.mockResolvedValue(true);
        createPurchase.mockResolvedValue({ id: 1 });
        deletePurchase.mockResolvedValue(undefined);
        createPurchasePayment.mockResolvedValue({ id: 1 });
        deletePurchasePayment.mockResolvedValue(true);
        createExpense.mockResolvedValue({ id: 1 });
        deleteExpense.mockResolvedValue({ message: "ok" });
        createTransaction.mockResolvedValue({ id: 1 });
        deleteTransaction.mockResolvedValue({ message: "ok" });
    });

    it("creating a sale refreshes sales, both transaction roots, stock, profit, bank, customer and dashboard", async () => {
        const client = makeTestQueryClient();
        const counters = await mountWatchers(client);
        const before = snapshot(counters);

        const { result } = renderHook(() => useCreateVenta(), {
            wrapper: makeWrapper(client),
        });
        await act(async () => {
            await result.current.create({
                customer_id: 3,
                bank_id: 1,
                status_id: 1,
                cart: [],
            } as never);
        });

        await expectRefetched(client, before, counters, [
            "sales",
            ...TX,
            "products",
            "allProducts",
            "profits",
            "banks",
            "customers",
            "dashboard",
        ]);
    });

    it("deleting a sale reverts every dependent view", async () => {
        const client = makeTestQueryClient();
        const counters = await mountWatchers(client);
        const before = snapshot(counters);

        const { result } = renderHook(() => useDeleteVenta(), {
            wrapper: makeWrapper(client),
        });
        await act(async () => {
            await result.current.deleteVenta(1);
        });

        await expectRefetched(client, before, counters, [
            "sales",
            ...TX,
            "products",
            "allProducts",
            "profits",
            "banks",
            "dashboard",
        ]);
    });

    it("creating a sale payment refreshes the sale, its payments, transactions, bank and dashboard", async () => {
        const client = makeTestQueryClient();
        const counters = await mountWatchers(client);
        const before = snapshot(counters);

        const { result } = renderHook(() => useCreatePagoVenta(), {
            wrapper: makeWrapper(client),
        });
        await act(async () => {
            await result.current.create({ sale_id: 5, amount: 10, bank_id: 1 } as never);
        });

        await expectRefetched(client, before, counters, [
            "sales",
            "salePayments",
            ...TX,
            "banks",
            "customers",
            "dashboard",
        ]);
    });

    it("deleting a sale payment refreshes the same set", async () => {
        const client = makeTestQueryClient();
        const counters = await mountWatchers(client);
        const before = snapshot(counters);

        const { result } = renderHook(() => useDeletePagoVenta(), {
            wrapper: makeWrapper(client),
        });
        await act(async () => {
            await result.current.remove(1, 5);
        });

        await expectRefetched(client, before, counters, [
            "sales",
            "salePayments",
            ...TX,
            "banks",
            "dashboard",
        ]);
    });

    it("creating a purchase refreshes purchases, transactions, stock, bank, supplier and dashboard", async () => {
        const client = makeTestQueryClient();
        const counters = await mountWatchers(client);
        const before = snapshot(counters);

        const { result } = renderHook(() => useCreatePurchase(), {
            wrapper: makeWrapper(client),
        });
        await act(async () => {
            await result.current.create({ supplier_id: 1, bank_id: 1, cart: [] } as never);
        });

        await expectRefetched(client, before, counters, [
            "purchases",
            ...TX,
            "products",
            "allProducts",
            "banks",
            "suppliers",
            "dashboard",
        ]);
    });

    it("deleting a purchase reverts every dependent view", async () => {
        const client = makeTestQueryClient();
        const counters = await mountWatchers(client);
        const before = snapshot(counters);

        const { result } = renderHook(() => useDeletePurchase(), {
            wrapper: makeWrapper(client),
        });
        await act(async () => {
            await result.current.deleteCompra(1);
        });

        await expectRefetched(client, before, counters, [
            "purchases",
            ...TX,
            "products",
            "allProducts",
            "banks",
            "suppliers",
            "dashboard",
        ]);
    });

    it("creating a purchase payment refreshes the purchase, its payments, transactions, bank and dashboard", async () => {
        const client = makeTestQueryClient();
        const counters = await mountWatchers(client);
        const before = snapshot(counters);

        const { result } = renderHook(() => useCreatePurchasePayment(), {
            wrapper: makeWrapper(client),
        });
        await act(async () => {
            await result.current.create({
                purchase_id: 9,
                amount: 10,
                bank_id: 1,
            } as never);
        });

        await expectRefetched(client, before, counters, [
            "purchases",
            "purchasePayments",
            ...TX,
            "banks",
            "suppliers",
            "dashboard",
        ]);
    });

    it("deleting a purchase payment refreshes the same set", async () => {
        const client = makeTestQueryClient();
        const counters = await mountWatchers(client);
        const before = snapshot(counters);

        const { result } = renderHook(() => useDeletePurchasePayment(), {
            wrapper: makeWrapper(client),
        });
        await act(async () => {
            await result.current.remove(1, 9, 10);
        });

        await expectRefetched(client, before, counters, [
            "purchases",
            "purchasePayments",
            ...TX,
            "banks",
            "dashboard",
        ]);
    });

    // This hook previously invalidated nothing at all -- refreshing was left to
    // whatever callback the page passed in.
    it("creating an expense refreshes expenses, both transaction roots, bank and dashboard", async () => {
        const client = makeTestQueryClient();
        const counters = await mountWatchers(client);
        const before = snapshot(counters);

        const { result } = renderHook(() => useCreateExpense(), {
            wrapper: makeWrapper(client),
        });
        await act(async () => {
            await result.current.create({ amount: 10, bank_id: 1 } as never);
        });

        await expectRefetched(client, before, counters, [
            "expenses",
            ...TX,
            "banks",
            "dashboard",
        ]);
    });

    it("deleting an expense refreshes the same set", async () => {
        const client = makeTestQueryClient();
        const counters = await mountWatchers(client);
        const before = snapshot(counters);

        const { result } = renderHook(() => useDeleteExpense(), {
            wrapper: makeWrapper(client),
        });
        await act(async () => {
            await result.current.remove(1);
        });

        await expectRefetched(client, before, counters, [
            "expenses",
            ...TX,
            "banks",
            "dashboard",
        ]);
    });

    it("creating a manual transaction refreshes BOTH transaction roots, bank and dashboard", async () => {
        const client = makeTestQueryClient();
        const counters = await mountWatchers(client);
        const before = snapshot(counters);

        const { result } = renderHook(() => useCreateTransaction(), {
            wrapper: makeWrapper(client),
        });
        await act(async () => {
            await result.current.create({ bank_id: 1, amount: 10, type_id: 1 } as never);
        });

        await expectRefetched(client, before, counters, [...TX, "banks", "dashboard"]);
    });

    it("deleting a manual transaction refreshes BOTH transaction roots, bank and dashboard", async () => {
        const client = makeTestQueryClient();
        const counters = await mountWatchers(client);
        const before = snapshot(counters);

        const { result } = renderHook(() => useDeleteTransaction(), {
            wrapper: makeWrapper(client),
        });
        await act(async () => {
            await result.current.remove(1);
        });

        await expectRefetched(client, before, counters, [...TX, "banks", "dashboard"]);
    });

    it("a failed mutation invalidates nothing", async () => {
        createExpense.mockRejectedValue(new Error("boom"));
        const client = makeTestQueryClient();
        const counters = await mountWatchers(client);
        const before = snapshot(counters);

        const { result } = renderHook(() => useCreateExpense(), {
            wrapper: makeWrapper(client),
        });
        await act(async () => {
            await expect(result.current.create({} as never)).rejects.toThrow("boom");
        });

        await waitFor(() => expect(client.isFetching()).toBe(0));
        expect(refetched(before, counters)).toEqual([]);
    });
});
