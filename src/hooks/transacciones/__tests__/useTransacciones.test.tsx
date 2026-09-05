import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { TransactionPageDTO } from "@/types/transaction";

const listTransactions = vi.fn();
const listTransactionFilterOptions = vi.fn();
const summarizeTransactions = vi.fn();

vi.mock("@/services/sales/transaction.api", () => ({
    listTransactions: (...a: unknown[]) => listTransactions(...a),
    listTransactionFilterOptions: (...a: unknown[]) => listTransactionFilterOptions(...a),
    summarizeTransactions: (...a: unknown[]) => summarizeTransactions(...a),
}));

import { useTransactions } from "../useTransacciones";
import { queryKeys } from "@/lib/query/queryKeys";
import { invalidateMovement } from "@/lib/query/invalidateMovement";
import { makeTestQueryClient, makeWrapper } from "@/test/queryWrapper";
import { todayInBogota } from "@/lib/period/period";

function page(overrides: Partial<TransactionPageDTO> = {}): TransactionPageDTO {
    return {
        items: [
            { id: 1, bank: "Nequi", amount: 100, type_str: "Ingreso", description: "a", created_at: "2026-01-01T00:00:00Z", is_auto: false },
        ],
        page: 1,
        page_size: 8,
        total: 40,
        total_pages: 5,
        has_next: true,
        has_prev: false,
        ...overrides,
    } as TransactionPageDTO;
}

/** Filter args of the Nth listTransactions call. */
function callArgs(n: number) {
    return listTransactions.mock.calls[n][1] as Record<string, unknown>;
}

describe("useTransactions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        listTransactions.mockResolvedValue(page());
        listTransactionFilterOptions.mockResolvedValue({
            banks: ["Nequi", "Bancolombia"],
            types: ["Ingreso", "Retiro"],
        });
        summarizeTransactions.mockResolvedValue({ Ingreso: 500, Retiro: 200 });
    });

    function mount(client = makeTestQueryClient()) {
        const r = renderHook(() => useTransactions(1, 8), { wrapper: makeWrapper(client) });
        return { ...r, client };
    }

    // The whole point of the rewrite: it used to walk every page at 120ms
    // intervals until it had a local copy of the entire table.
    it("fetches exactly one page", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(listTransactions).toHaveBeenCalledTimes(1);
        expect(listTransactions.mock.calls[0][0]).toBe(1);
        expect(result.current.items).toHaveLength(1);
    });

    it("does not keep fetching after the first page settles", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        await new Promise((r) => setTimeout(r, 400)); // longer than the old 120ms tick
        expect(listTransactions).toHaveBeenCalledTimes(1);
    });

    it("reports pagination from the server, not from a local copy", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.total).toBe(40);
        expect(result.current.total_pages).toBe(5);
        expect(result.current.page_size).toBe(8);
        expect(result.current.hasNextPage).toBe(true);
        expect(result.current.hasPrevPage).toBe(false);
    });

    it("requests the next page from the server", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.setPage(3));
        await waitFor(() => expect(listTransactions).toHaveBeenCalledTimes(2));

        expect(listTransactions.mock.calls[1][0]).toBe(3);
    });

    it("sends the page size to the server", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(callArgs(0).page_size).toBe(8);
    });

    describe("filters go to the server", () => {
        it("sends a trimmed search term", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => result.current.setFilters({ ...result.current.filters, q: "  pago  " }));
            await waitFor(() => expect(listTransactions).toHaveBeenCalledTimes(2));

            expect(callArgs(1).q).toBe("pago");
        });

        it("omits an empty search term", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(callArgs(0).q).toBeUndefined();
        });

        it("sends bank and type", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() =>
                result.current.setFilters({
                    ...result.current.filters,
                    bank: "Nequi",
                    type: "Ingreso",
                })
            );
            await waitFor(() => expect(listTransactions).toHaveBeenCalledTimes(2));

            expect(callArgs(1).bank).toBe("Nequi");
            expect(callArgs(1).type).toBe("Ingreso");
        });

        it("omits origin when it is 'all'", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(callArgs(0).origin).toBeUndefined();
        });

        it("sends a real origin", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() =>
                result.current.setFilters({ ...result.current.filters, origin: "manual" })
            );
            await waitFor(() => expect(listTransactions).toHaveBeenCalledTimes(2));

            expect(callArgs(1).origin).toBe("manual");
        });

        // It used to send .toISOString() bounds. The upper one landed at
        // midnight, so the last day of every range was silently dropped: a
        // transaction at 20:00 on the 30th fell outside the month it belongs
        // to. The range is now the shared period, sent as bare dates.
        it("always sends a period, defaulting to the current month", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            const today = todayInBogota();
            expect(callArgs(0).year).toBe(today.year);
            expect(callArgs(0).month).toBe(today.month);
            expect(callArgs(0).date_from).toBeUndefined();
            expect(callArgs(0).date_to).toBeUndefined();
        });

        // Page 4 of an unfiltered list is meaningless against a filtered one.
        it("returns to page 1 when a filter changes", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => result.current.setPage(4));
            await waitFor(() => expect(result.current.page).toBe(4));

            act(() => result.current.setFilters({ ...result.current.filters, bank: "Nequi" }));
            await waitFor(() => expect(result.current.page).toBe(1));
        });
    });

    describe("filter options", () => {
        // They used to be derived from the downloaded rows, which only worked
        // because everything was downloaded.
        it("come from the API", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.options.banks).toHaveLength(2));

            expect(result.current.options.banks).toEqual(["Nequi", "Bancolombia"]);
            expect(result.current.options.types).toEqual(["Ingreso", "Retiro"]);
        });

        it("are fetched once, not per page", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => result.current.setPage(2));
            await waitFor(() => expect(listTransactions).toHaveBeenCalledTimes(2));

            expect(listTransactionFilterOptions).toHaveBeenCalledTimes(1);
        });

        it("degrade to empty lists rather than throwing", async () => {
            listTransactionFilterOptions.mockRejectedValue(new Error("down"));
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.options.banks).toEqual([]);
        });
    });

    describe("extract totals", () => {
        it("are not requested until a bank is selected", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(summarizeTransactions).not.toHaveBeenCalled();
        });

        it("come from the API once a bank is selected", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => result.current.setFilters({ ...result.current.filters, bank: "Nequi" }));

            await waitFor(() => expect(result.current.summaryByType).toEqual({
                Ingreso: 500,
                Retiro: 200,
            }));
        });

        it("carry the active filters", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() =>
                result.current.setFilters({
                    ...result.current.filters,
                    bank: "Nequi",
                    origin: "manual",
                })
            );
            await waitFor(() => expect(summarizeTransactions).toHaveBeenCalled());

            const args = summarizeTransactions.mock.calls[0][0] as Record<string, unknown>;
            expect(args.bank).toBe("Nequi");
            expect(args.origin).toBe("manual");
        });
    });

    describe("cache integration", () => {
        it("lives under the transactions root so the matrix reaches it", async () => {
            const { result, client } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            const keys = client
                .getQueryCache()
                .getAll()
                .map((q) => q.queryKey[0]);
            expect(keys).toContain("transactions");
        });

        it("refetches when a movement invalidates transactions", async () => {
            const { result, client } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            await act(async () => {
                await invalidateMovement(client, { kind: "expense" });
            });

            await waitFor(() => expect(listTransactions).toHaveBeenCalledTimes(2));
        });

        it("refresh() invalidates the whole transactions root", async () => {
            const { result } = mount();
            await waitFor(() => expect(result.current.loading).toBe(false));

            await act(async () => {
                result.current.refresh();
            });

            await waitFor(() => expect(listTransactions).toHaveBeenCalledTimes(2));
        });

        it("uses distinct cache keys per page and filter", () => {
            const a = queryKeys.transactions.list({ page: 1, pageSize: 8 });
            const b = queryKeys.transactions.list({ page: 2, pageSize: 8 });
            expect(a).not.toEqual(b);
        });
    });

    it("surfaces an error instead of hanging", async () => {
        listTransactions.mockRejectedValue(new Error("boom"));
        const { result } = mount();

        await waitFor(() => expect(result.current.error).toBe("boom"));
        expect(result.current.items).toEqual([]);
    });
});
