import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { Bank } from "@/types/bank";

const listBanks = vi.fn();
vi.mock("@/services/sales/bank.api", () => ({
    listBanks: (...args: unknown[]) => listBanks(...args),
}));

import { useBancos } from "../useBancos";
import { queryKeys } from "@/lib/query/queryKeys";
import { invalidateMovement } from "@/lib/query/invalidateMovement";
import { makeTestQueryClient, makeWrapper } from "@/test/queryWrapper";

function bank(id: number, name: string, balance: number): Bank {
    return { id, name, balance } as Bank;
}

/**
 * Wait until nothing is in flight. `refetchOnMount: "always"` can leave a
 * second fetch pending after the first data arrives, and it would overwrite an
 * optimistic write mid-assertion.
 */
async function settled(client: ReturnType<typeof makeTestQueryClient>) {
    await waitFor(() => expect(client.isFetching()).toBe(0));
}

describe("useBancos", () => {
    beforeEach(() => {
        listBanks.mockReset();
        listBanks.mockResolvedValue([
            bank(1, "Bancolombia", 1000),
            bank(2, "Efectivo", 0),
            bank(3, "Nequi", 250),
        ]);
    });

    it("loads banks through the query cache", async () => {
        const client = makeTestQueryClient();
        const { result } = renderHook(() => useBancos(), { wrapper: makeWrapper(client) });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.items).toHaveLength(3);
        // Living in the cache is the whole point: it is what makes the hook
        // reachable from invalidateMovement.
        expect(client.getQueryData(queryKeys.banks.list())).toHaveLength(3);
    });

    // Before the migration this hook was a useState/useEffect fetcher, so
    // invalidating "banks" did nothing and balances stayed frozen after a sale.
    it("refetches when a movement invalidates banks", async () => {
        const client = makeTestQueryClient();
        const { result } = renderHook(() => useBancos(), { wrapper: makeWrapper(client) });
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(listBanks).toHaveBeenCalledTimes(1);

        listBanks.mockResolvedValue([bank(1, "Bancolombia", 4321)]);
        await act(async () => {
            await invalidateMovement(client, { kind: "sale" });
        });

        await waitFor(() => expect(result.current.items[0].balance).toBe(4321));
        expect(listBanks).toHaveBeenCalledTimes(2);
    });

    it("reload() invalidates the banks root", async () => {
        const client = makeTestQueryClient();
        const { result } = renderHook(() => useBancos(), { wrapper: makeWrapper(client) });
        await waitFor(() => expect(result.current.loading).toBe(false));

        listBanks.mockResolvedValue([bank(1, "Bancolombia", 77)]);
        await act(async () => {
            result.current.reload();
        });

        await waitFor(() => expect(result.current.items[0].balance).toBe(77));
    });

    it("upsertOne patches a single bank in the cache", async () => {
        const client = makeTestQueryClient();
        const { result } = renderHook(() => useBancos(), { wrapper: makeWrapper(client) });
        await waitFor(() => expect(result.current.loading).toBe(false));
        await settled(client);

        await act(async () => {
            result.current.upsertOne({ id: 2, balance: 999 });
        });

        expect(client.getQueryData(queryKeys.banks.list())).toContainEqual(
            expect.objectContaining({ id: 2, balance: 999 })
        );
        await waitFor(() =>
            expect(result.current.items.find((b) => b.id === 2)?.balance).toBe(999)
        );
        expect(result.current.items.find((b) => b.id === 1)?.balance).toBe(1000);
    });

    it("upsertOne ignores an unknown id", async () => {
        const client = makeTestQueryClient();
        const { result } = renderHook(() => useBancos(), { wrapper: makeWrapper(client) });
        await waitFor(() => expect(result.current.loading).toBe(false));
        await settled(client);

        await act(async () => {
            result.current.upsertOne({ id: 999, balance: 1 });
        });

        expect(result.current.items).toHaveLength(3);
    });

    it("filters by name and by balance bucket", async () => {
        const client = makeTestQueryClient();
        const { result } = renderHook(() => useBancos(), { wrapper: makeWrapper(client) });
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.setFilters({ q: "nequi", saldoFiltro: "todos" }));
        await waitFor(() => expect(result.current.items).toHaveLength(1));
        expect(result.current.items[0].name).toBe("Nequi");

        act(() => result.current.setFilters({ q: "", saldoFiltro: "positivos" }));
        await waitFor(() => expect(result.current.items).toHaveLength(2));

        act(() => result.current.setFilters({ q: "", saldoFiltro: "cero" }));
        await waitFor(() => expect(result.current.items).toHaveLength(1));
        expect(result.current.items[0].name).toBe("Efectivo");
    });

    it("reports total from the filtered set", async () => {
        const client = makeTestQueryClient();
        const { result } = renderHook(() => useBancos(), { wrapper: makeWrapper(client) });
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.setFilters({ q: "", saldoFiltro: "positivos" }));
        await waitFor(() => expect(result.current.total).toBe(2));
    });

    it("two mounted consumers share one fetch", async () => {
        const client = makeTestQueryClient();
        const wrapper = makeWrapper(client);
        const a = renderHook(() => useBancos(), { wrapper });
        const b = renderHook(() => useBancos(), { wrapper });

        await waitFor(() => expect(a.result.current.loading).toBe(false));
        await waitFor(() => expect(b.result.current.loading).toBe(false));

        expect(listBanks).toHaveBeenCalledTimes(1);
        expect(b.result.current.items).toHaveLength(3);
    });
});
