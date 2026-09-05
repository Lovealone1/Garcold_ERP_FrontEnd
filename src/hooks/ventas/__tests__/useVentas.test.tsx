import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { SalePage } from "@/types/sale";

const listSales = vi.fn();
const listSaleFilterOptions = vi.fn();
const summarizeSales = vi.fn();

vi.mock("@/services/sales/sale.api", () => ({
    listSales: (...a: unknown[]) => listSales(...a),
    listSaleFilterOptions: (...a: unknown[]) => listSaleFilterOptions(...a),
    summarizeSales: (...a: unknown[]) => summarizeSales(...a),
}));

import { useVentas } from "../useVentas";
import { invalidateMovement } from "@/lib/query/invalidateMovement";
import { makeTestQueryClient, makeWrapper } from "@/test/queryWrapper";

function salePage(overrides: Partial<SalePage> = {}): SalePage {
    return {
        items: [
            {
                id: 1,
                customer: "Perez",
                bank: "Nequi",
                status: "Cancelada",
                total: 100,
                remaining_balance: 0,
                created_at: "2026-01-01T00:00:00Z",
            },
        ],
        page: 1,
        page_size: 8,
        total: 40,
        total_pages: 5,
        has_next: true,
        has_prev: false,
        ...overrides,
    } as SalePage;
}

function callArgs(n: number) {
    return listSales.mock.calls[n][1] as Record<string, unknown>;
}

describe("useVentas", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        listSales.mockResolvedValue(salePage());
        listSaleFilterOptions.mockResolvedValue({
            banks: ["Nequi", "Bancolombia"],
            statuses: ["Cancelada", "Credito"],
        });
        summarizeSales.mockResolvedValue({
            total: 12345,
            remaining_balance: 500,
            count: 40,
        });
    });

    function mount(client = makeTestQueryClient()) {
        const r = renderHook(() => useVentas({}, 8), { wrapper: makeWrapper(client) });
        return { ...r, client };
    }

    // The hook used to run a pump() loop calling fetchNextPage until the whole
    // table was in memory.
    it("fetches exactly one page", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(listSales).toHaveBeenCalledTimes(1);
        expect(listSales.mock.calls[0][0]).toBe(1);
    });

    it("does not keep pumping pages afterwards", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        await new Promise((r) => setTimeout(r, 400));
        expect(listSales).toHaveBeenCalledTimes(1);
    });

    it("takes pagination from the server", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.total).toBe(40);
        expect(result.current.totalPages).toBe(5);
        expect(result.current.hasNext).toBe(true);
        expect(result.current.hasPrev).toBe(false);
    });

    it("requests the requested page", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.setPage(3));
        await waitFor(() => expect(listSales).toHaveBeenCalledTimes(2));
        expect(listSales.mock.calls[1][0]).toBe(3);
    });

    describe("filters", () => {
        it("maps estado and banco onto the API's names", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() =>
                result.current.setFilters({ estado: "Cancelada", banco: "Nequi" })
            );
            await waitFor(() => expect(listSales).toHaveBeenCalledTimes(2));

            expect(callArgs(1).status).toBe("Cancelada");
            expect(callArgs(1).bank).toBe("Nequi");
        });

        it("maps from/to onto date_from/date_to", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => result.current.setFilters({ from: "2026-01-01", to: "2026-02-01" }));
            await waitFor(() => expect(listSales).toHaveBeenCalledTimes(2));

            expect(callArgs(1).date_from).toBe("2026-01-01");
            expect(callArgs(1).date_to).toBe("2026-02-01");
        });

        it("trims the search term and omits it when empty", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(callArgs(0).q).toBeUndefined();

            act(() => result.current.setFilters({ q: "  perez  " }));
            await waitFor(() => expect(listSales).toHaveBeenCalledTimes(2));
            expect(callArgs(1).q).toBe("perez");
        });

        it("returns to page 1 when a filter changes", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => result.current.setPage(4));
            await waitFor(() => expect(result.current.page).toBe(4));

            act(() => result.current.setFilters({ banco: "Nequi" }));
            await waitFor(() => expect(result.current.page).toBe(1));
        });
    });

    describe("options and totals", () => {
        it("gets dropdown options from the API", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.options.banks).toHaveLength(2));
            expect(result.current.options.statuses).toEqual(["Cancelada", "Credito"]);
        });

        // It used to be summed from the downloaded rows.
        it("gets the filtered total from the API", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.totalFiltrado).toBe(12345));
            expect(result.current.remainingFiltrado).toBe(500);
        });

        it("recomputes the total when filters change", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.totalFiltrado).toBe(12345));

            summarizeSales.mockResolvedValue({
                total: 99,
                remaining_balance: 0,
                count: 1,
            });
            act(() => result.current.setFilters({ banco: "Nequi" }));

            await waitFor(() => expect(result.current.totalFiltrado).toBe(99));
        });

        it("does not refetch options per page", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => result.current.setPage(2));
            await waitFor(() => expect(listSales).toHaveBeenCalledTimes(2));

            expect(listSaleFilterOptions).toHaveBeenCalledTimes(1);
        });
    });

    describe("cache integration", () => {
        it("refetches when a movement invalidates sales", async () => {
            const { result, client } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            await act(async () => {
                await invalidateMovement(client, { kind: "sale" });
            });

            await waitFor(() => expect(listSales).toHaveBeenCalledTimes(2));
        });

        it("reload() invalidates the sales root", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            await act(async () => {
                await result.current.reload();
            });

            await waitFor(() => expect(listSales).toHaveBeenCalledTimes(2));
        });
    });

    it("surfaces an error instead of hanging", async () => {
        listSales.mockRejectedValue(new Error("boom"));
        const { result } = mount();

        await waitFor(() => expect(result.current.error).toBe("boom"));
        expect(result.current.items).toEqual([]);
    });
});
