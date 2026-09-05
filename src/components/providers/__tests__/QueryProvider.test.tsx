import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";

const useSupabaseSession = vi.fn();
vi.mock("@/app/auth/useSupabaseAuth", () => ({
    useSupabaseSession: () => useSupabaseSession(),
}));

import QueryProvider, { createAppQueryClient } from "../QueryProvider";
import { persistKeyForUser } from "@/lib/query/cachePolicy";

function session(userId: string | null, loading = false) {
    return { user: userId ? { id: userId } : null, session: null, loading };
}

describe("createAppQueryClient", () => {
    // staleTime as a function is what makes the per-tier policy real rather
    // than merely declared; verify the installed version honours it.
    it("applies a per-tier staleTime at runtime", async () => {
        const client = createAppQueryClient();
        const defaults = client.getDefaultOptions().queries;

        const resolve = (key: readonly unknown[]) => {
            const st = defaults?.staleTime;
            return typeof st === "function"
                ? (st as (q: unknown) => number)({ queryKey: key })
                : st;
        };

        expect(resolve(["transactions-head", {}])).toBe(0);
        expect(resolve(["banks", "list"])).toBe(0);
        expect(resolve(["customers", {}])).toBeGreaterThan(0);
    });

    it("refetches on focus and reconnect", () => {
        const defaults = createAppQueryClient().getDefaultOptions().queries;
        // Both were disabled, so a tab left open or a laptop resumed on another
        // network kept serving whatever it already had.
        expect(defaults?.refetchOnWindowFocus).toBe(true);
        expect(defaults?.refetchOnReconnect).toBe(true);
    });

    it("does not retain data for days", () => {
        const defaults = createAppQueryClient().getDefaultOptions().queries;
        const THREE_DAYS = 1000 * 60 * 60 * 24 * 3;
        expect(defaults?.gcTime).toBeLessThan(THREE_DAYS);
    });
});

function Probe() {
    const q = useQuery({ queryKey: ["customers", { pageSize: 8 }], queryFn: async () => ["x"] });
    return <div data-testid="probe">{q.isSuccess ? "ready" : "loading"}</div>;
}

describe("QueryProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        useSupabaseSession.mockReturnValue(session("user-a"));
    });

    it("renders children and serves a working query client", async () => {
        const { getByTestId } = render(
            <QueryProvider>
                <Probe />
            </QueryProvider>
        );

        await waitFor(() => expect(getByTestId("probe")).toHaveTextContent("ready"));
    });

    it("renders children while the session is still loading", () => {
        useSupabaseSession.mockReturnValue(session(null, true));
        const { getByTestId } = render(
            <QueryProvider>
                <div data-testid="child">hi</div>
            </QueryProvider>
        );
        expect(getByTestId("child")).toBeInTheDocument();
    });

    it("writes under a user-scoped key", async () => {
        render(
            <QueryProvider>
                <Probe />
            </QueryProvider>
        );

        await waitFor(
            () => {
                expect(window.localStorage.getItem(persistKeyForUser("user-a"))).not.toBeNull();
            },
            { timeout: 4000 }
        );
    });

    // Two accounts on one machine used to share a single key, so signing in as
    // someone else restored the previous person's figures.
    it("purges persisted caches when the user changes", async () => {
        window.localStorage.setItem(persistKeyForUser("user-a"), '{"stale":true}');
        window.localStorage.setItem("transactions-cache-v11", '{"legacy":true}');
        window.localStorage.setItem("theme", "dark");

        const { rerender } = render(
            <QueryProvider>
                <div>child</div>
            </QueryProvider>
        );

        useSupabaseSession.mockReturnValue(session("user-b"));
        await act(async () => {
            rerender(
                <QueryProvider>
                    <div>child</div>
                </QueryProvider>
            );
        });

        expect(window.localStorage.getItem(persistKeyForUser("user-a"))).toBeNull();
        expect(window.localStorage.getItem("transactions-cache-v11")).toBeNull();
        // Unrelated preferences must survive.
        expect(window.localStorage.getItem("theme")).toBe("dark");
    });

    it("purges on sign-out", async () => {
        window.localStorage.setItem(persistKeyForUser("user-a"), '{"stale":true}');

        const { rerender } = render(
            <QueryProvider>
                <div>child</div>
            </QueryProvider>
        );

        useSupabaseSession.mockReturnValue(session(null));
        await act(async () => {
            rerender(
                <QueryProvider>
                    <div>child</div>
                </QueryProvider>
            );
        });

        expect(window.localStorage.getItem(persistKeyForUser("user-a"))).toBeNull();
    });

    it("does not purge on an unrelated re-render", async () => {
        const { rerender } = render(
            <QueryProvider>
                <Probe />
            </QueryProvider>
        );
        await waitFor(
            () => expect(window.localStorage.getItem(persistKeyForUser("user-a"))).not.toBeNull(),
            { timeout: 4000 }
        );

        await act(async () => {
            rerender(
                <QueryProvider>
                    <Probe />
                </QueryProvider>
            );
        });

        expect(window.localStorage.getItem(persistKeyForUser("user-a"))).not.toBeNull();
    });

    // A full disk, a private window or a browser blocking site data must not
    // take the app down; in-memory caching is still perfectly correct.
    it("keeps working when localStorage throws", async () => {
        const setItem = vi
            .spyOn(Storage.prototype, "setItem")
            .mockImplementation(() => {
                throw new Error("QuotaExceededError");
            });

        const { getByTestId } = render(
            <QueryProvider>
                <Probe />
            </QueryProvider>
        );

        await waitFor(() => expect(getByTestId("probe")).toHaveTextContent("ready"));
        setItem.mockRestore();
    });

    it("keeps working when reading localStorage throws", async () => {
        const getItem = vi
            .spyOn(Storage.prototype, "getItem")
            .mockImplementation(() => {
                throw new Error("SecurityError");
            });

        const { getByTestId } = render(
            <QueryProvider>
                <Probe />
            </QueryProvider>
        );

        await waitFor(() => expect(getByTestId("probe")).toHaveTextContent("ready"));
        getItem.mockRestore();
    });
});
