import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { FinalReportDTO, RequestMetaDTO } from "@/types/reporte-general";

const fetchFinalDashboard = vi.fn();
vi.mock("@/services/sales/dashboard.api", () => ({
    fetchFinalDashboard: (...args: unknown[]) => fetchFinalDashboard(...args),
}));

import { useFinalDashboard } from "../useFinalDashboard";
import { invalidateMovement } from "@/lib/query/invalidateMovement";
import { makeTestQueryClient, makeWrapper } from "@/test/queryWrapper";

function report(total: number): FinalReportDTO {
    return { sales: { total_sales: total } } as unknown as FinalReportDTO;
}

const YEAR_PARAMS: RequestMetaDTO = { bucket: "year", year: 2026 };

describe("useFinalDashboard", () => {
    beforeEach(() => {
        fetchFinalDashboard.mockReset();
        fetchFinalDashboard.mockResolvedValue(report(100));
    });

    it("fetches the report for the given params", async () => {
        const client = makeTestQueryClient();
        const { result } = renderHook(() => useFinalDashboard(YEAR_PARAMS), {
            wrapper: makeWrapper(client),
        });

        await waitFor(() => expect(result.current.data).not.toBeNull());
        expect(result.current.data?.sales.total_sales).toBe(100);
        expect(fetchFinalDashboard).toHaveBeenCalledWith(
            YEAR_PARAMS,
            expect.objectContaining({ topLimit: 10 })
        );
    });

    // Before the migration the dashboard was a hand-rolled fetcher outside the
    // cache, so invalidating "dashboard" did nothing and the KPIs stayed at
    // their mount-time values after every movement.
    it("refetches when a movement invalidates the dashboard", async () => {
        const client = makeTestQueryClient();
        const { result } = renderHook(() => useFinalDashboard(YEAR_PARAMS), {
            wrapper: makeWrapper(client),
        });
        await waitFor(() => expect(result.current.data?.sales.total_sales).toBe(100));

        fetchFinalDashboard.mockResolvedValue(report(250));
        await act(async () => {
            await invalidateMovement(client, { kind: "expense" });
        });

        await waitFor(() => expect(result.current.data?.sales.total_sales).toBe(250));
    });

    it("does not fetch while auto is false", async () => {
        const client = makeTestQueryClient();
        renderHook(() => useFinalDashboard(YEAR_PARAMS, { auto: false }), {
            wrapper: makeWrapper(client),
        });

        await new Promise((r) => setTimeout(r, 20));
        expect(fetchFinalDashboard).not.toHaveBeenCalled();
    });

    it("does not fetch without params", async () => {
        const client = makeTestQueryClient();
        renderHook(() => useFinalDashboard(undefined), { wrapper: makeWrapper(client) });

        await new Promise((r) => setTimeout(r, 20));
        expect(fetchFinalDashboard).not.toHaveBeenCalled();
    });

    it("setParams switches the reported period", async () => {
        const client = makeTestQueryClient();
        const { result } = renderHook(() => useFinalDashboard(YEAR_PARAMS), {
            wrapper: makeWrapper(client),
        });
        await waitFor(() => expect(result.current.data).not.toBeNull());

        const next: RequestMetaDTO = { bucket: "month", year: 2026, month: 3 };
        fetchFinalDashboard.mockResolvedValue(report(7));
        act(() => result.current.setParams(next));

        await waitFor(() => expect(result.current.data?.sales.total_sales).toBe(7));
        expect(fetchFinalDashboard).toHaveBeenLastCalledWith(next, expect.anything());
    });

    it("refetch(override) switches params, refetch() re-runs the current one", async () => {
        const client = makeTestQueryClient();
        const { result } = renderHook(() => useFinalDashboard(YEAR_PARAMS), {
            wrapper: makeWrapper(client),
        });
        await waitFor(() => expect(result.current.data).not.toBeNull());
        const callsAfterLoad = fetchFinalDashboard.mock.calls.length;

        await act(async () => {
            await result.current.refetch();
        });
        await waitFor(() =>
            expect(fetchFinalDashboard.mock.calls.length).toBeGreaterThan(callsAfterLoad)
        );

        const override: RequestMetaDTO = { bucket: "year", year: 2024 };
        await act(async () => {
            await result.current.refetch(override);
        });
        await waitFor(() =>
            expect(fetchFinalDashboard).toHaveBeenLastCalledWith(override, expect.anything())
        );
    });

    it("passes topLimit through", async () => {
        const client = makeTestQueryClient();
        renderHook(() => useFinalDashboard(YEAR_PARAMS, { topLimit: 3 }), {
            wrapper: makeWrapper(client),
        });

        await waitFor(() =>
            expect(fetchFinalDashboard).toHaveBeenCalledWith(
                YEAR_PARAMS,
                expect.objectContaining({ topLimit: 3 })
            )
        );
    });

    it("surfaces an error instead of hanging on loading", async () => {
        fetchFinalDashboard.mockRejectedValue(new Error("boom"));
        const client = makeTestQueryClient();
        const { result } = renderHook(() => useFinalDashboard(YEAR_PARAMS), {
            wrapper: makeWrapper(client),
        });

        await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBeNull();
    });
});
