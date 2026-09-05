import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const listPurchases = vi.fn();
const listPurchaseFilterOptions = vi.fn();
const summarizePurchases = vi.fn();
vi.mock("@/services/sales/purchase.api", () => ({
    listPurchases: (...a: unknown[]) => listPurchases(...a),
    listPurchaseFilterOptions: (...a: unknown[]) => listPurchaseFilterOptions(...a),
    summarizePurchases: (...a: unknown[]) => summarizePurchases(...a),
}));

const listExpenses = vi.fn();
const listExpenseFilterOptions = vi.fn();
const summarizeExpenses = vi.fn();
vi.mock("@/services/sales/expense.api", () => ({
    listExpenses: (...a: unknown[]) => listExpenses(...a),
    listExpenseFilterOptions: (...a: unknown[]) => listExpenseFilterOptions(...a),
    summarizeExpenses: (...a: unknown[]) => summarizeExpenses(...a),
}));

import { usePurchases } from "@/hooks/compras/usePurchases";
import { useExpenses } from "@/hooks/gastos/useGastos";
import { invalidateMovement } from "@/lib/query/invalidateMovement";
import { makeTestQueryClient, makeWrapper } from "@/test/queryWrapper";

function pageOf(items: unknown[]) {
    return {
        items,
        page: 1,
        page_size: 8,
        total: 40,
        total_pages: 5,
        has_next: true,
        has_prev: false,
    };
}

describe("usePurchases", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        listPurchases.mockResolvedValue(pageOf([{ id: 1, supplier: "Acme" }]));
        listPurchaseFilterOptions.mockResolvedValue({
            banks: ["Nequi"],
            statuses: ["Credito"],
            suppliers: ["Acme"],
        });
        summarizePurchases.mockResolvedValue({ total: 800, balance: 200, count: 4 });
    });

    function mount(client = makeTestQueryClient()) {
        const r = renderHook(() => usePurchases({}, 8), { wrapper: makeWrapper(client) });
        return { ...r, client };
    }

    // It used to pump every page into memory before showing anything.
    it("fetches exactly one page and stops", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        await new Promise((r) => setTimeout(r, 400));
        expect(listPurchases).toHaveBeenCalledTimes(1);
    });

    it("takes pagination from the server", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.total).toBe(40);
        expect(result.current.totalPages).toBe(5);
    });

    it("sends filters with the API's parameter names", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() =>
            result.current.setFilters({
                q: "  acme  ",
                status: "Credito",
                bank: "Nequi",
                supplier: "Acme",
                from: "2026-01-01",
                to: "2026-02-01",
            })
        );
        await waitFor(() => expect(listPurchases).toHaveBeenCalledTimes(2));

        const args = listPurchases.mock.calls[1][1] as Record<string, unknown>;
        expect(args.q).toBe("acme");
        expect(args.status).toBe("Credito");
        expect(args.supplier).toBe("Acme");
        expect(args.date_from).toBe("2026-01-01");
        expect(args.date_to).toBe("2026-02-01");
    });

    it("returns to page 1 when a filter changes", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.setPage(3));
        await waitFor(() => expect(result.current.page).toBe(3));

        act(() => result.current.setFilters({ bank: "Nequi" }));
        await waitFor(() => expect(result.current.page).toBe(1));
    });

    it("exposes dropdown options and filtered totals from the API", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.options.suppliers).toEqual(["Acme"]));
        await waitFor(() => expect(result.current.totalFiltrado).toBe(800));
        expect(result.current.balanceFiltrado).toBe(200);
    });

    it("refetches when a movement invalidates purchases", async () => {
        const { result, client } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await invalidateMovement(client, { kind: "purchase" });
        });

        await waitFor(() => expect(listPurchases).toHaveBeenCalledTimes(2));
    });

    it("surfaces an error instead of hanging", async () => {
        listPurchases.mockRejectedValue(new Error("boom"));
        const { result } = mount();
        await waitFor(() => expect(result.current.error).toBe("boom"));
    });
});

describe("useExpenses", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        listExpenses.mockResolvedValue(
            pageOf([{ id: 1, category_name: "Arriendo", bank_name: "Nequi" }])
        );
        listExpenseFilterOptions.mockResolvedValue({
            categories: ["Arriendo", "Servicios"],
            banks: ["Nequi", "Bancolombia"],
        });
        summarizeExpenses.mockResolvedValue({ total: 250, count: 3 });
    });

    function mount(client = makeTestQueryClient()) {
        const r = renderHook(() => useExpenses({}, 8), { wrapper: makeWrapper(client) });
        return { ...r, client };
    }

    it("fetches exactly one page and stops", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        await new Promise((r) => setTimeout(r, 400));
        expect(listExpenses).toHaveBeenCalledTimes(1);
    });

    // The client sent these, the endpoint ignored them, and the hook did not
    // filter locally either -- so they did nothing at all.
    it("sends filters that the server now honours", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() =>
            result.current.setFilters({
                q: " arri ",
                category: "Arriendo",
                bank: "Nequi",
                from: "2026-01-01",
                to: "2026-02-01",
            })
        );
        await waitFor(() => expect(listExpenses).toHaveBeenCalledTimes(2));

        const args = listExpenses.mock.calls[1][1] as Record<string, unknown>;
        expect(args.q).toBe("arri");
        expect(args.category).toBe("Arriendo");
        expect(args.bank).toBe("Nequi");
        expect(args.date_from).toBe("2026-01-01");
    });

    it("omits blank filters entirely", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        const args = listExpenses.mock.calls[0][1] as Record<string, unknown>;
        expect(args.q).toBeUndefined();
        expect(args.category).toBeUndefined();
        expect(args.bank).toBeUndefined();
    });

    // The bank list was built from the rows on the current page, so the
    // available options changed as you paged.
    it("gets dropdown options from the API, not from the current page", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.options.banks).toHaveLength(2));
        expect(result.current.options.categories).toEqual(["Arriendo", "Servicios"]);
    });

    it("exposes the filtered total", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.totalFiltrado).toBe(250));
    });

    it("returns to page 1 when a filter changes", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.setPage(2));
        await waitFor(() => expect(result.current.page).toBe(2));

        act(() => result.current.setFilters({ category: "Arriendo" }));
        await waitFor(() => expect(result.current.page).toBe(1));
    });

    it("refetches when a movement invalidates expenses", async () => {
        const { result, client } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await invalidateMovement(client, { kind: "expense" });
        });

        await waitFor(() => expect(listExpenses).toHaveBeenCalledTimes(2));
    });

    it("surfaces an error instead of hanging", async () => {
        listExpenses.mockRejectedValue(new Error("boom"));
        const { result } = mount();
        await waitFor(() => expect(result.current.error).toBe("boom"));
    });
});
