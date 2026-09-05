import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";

const getSession = vi.fn();
const refreshSession = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
    supabase: () => ({ auth: { getSession, refreshSession } }),
}));

function session(token: string | null) {
    return { data: { session: token ? { access_token: token } : null } };
}

/**
 * The interceptor keeps module-level refresh state, so every test needs a fresh
 * copy of the module to avoid leaking a pending refresh between cases.
 */
async function freshApi() {
    vi.resetModules();
    const mod = await import("../api");
    return mod.default;
}

/** Rejects if `p` has not settled once all pending timers/microtasks drained. */
function withTimeout<T>(p: Promise<T>, ms = 1000): Promise<T> {
    return Promise.race([
        p,
        new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error("TIMEOUT: request never settled")), ms)
        ),
    ]);
}

describe("api axios instance", () => {
    let mock: MockAdapter;
    let api: Awaited<ReturnType<typeof freshApi>>;

    beforeEach(async () => {
        getSession.mockReset();
        refreshSession.mockReset();
        getSession.mockResolvedValue(session("old-token"));
        api = await freshApi();
        mock = new MockAdapter(api);
    });

    afterEach(() => {
        mock.restore();
    });

    it("attaches the bearer token to outgoing requests", async () => {
        mock.onGet("/ping").reply(200, { ok: true });

        const res = await api.get("/ping");

        expect(res.status).toBe(200);
        expect(mock.history.get[0].headers?.Authorization).toBe("Bearer old-token");
    });

    it("does not attach a header when there is no session", async () => {
        getSession.mockResolvedValue(session(null));
        mock.onGet("/ping").reply(200, { ok: true });

        await api.get("/ping");

        expect(mock.history.get[0].headers?.Authorization).toBeUndefined();
    });

    // This is the regression that froze the UI: a single 401 used to register its
    // waiter *after* the refresh had already notified everyone, so the promise
    // never resolved and TanStack Query stayed on stale data forever.
    it("resolves a lone 401 by refreshing once and retrying", async () => {
        refreshSession.mockResolvedValue(session("new-token"));

        let calls = 0;
        mock.onGet("/protected").reply(() => {
            calls += 1;
            return calls === 1 ? [401, { detail: "expired" }] : [200, { ok: true }];
        });

        const res = await withTimeout(api.get("/protected"));

        expect(res.status).toBe(200);
        expect(refreshSession).toHaveBeenCalledTimes(1);
        expect(calls).toBe(2);
        expect(mock.history.get[1].headers?.Authorization).toBe("Bearer new-token");
    });

    it("refreshes only once for several concurrent 401s and retries them all", async () => {
        refreshSession.mockImplementation(async () => {
            await new Promise((r) => setTimeout(r, 10));
            return session("new-token");
        });

        const seen: Record<string, number> = {};
        for (const path of ["/a", "/b", "/c"]) {
            seen[path] = 0;
            mock.onGet(path).reply(() => {
                seen[path] += 1;
                return seen[path] === 1 ? [401, {}] : [200, { path }];
            });
        }

        const results = await withTimeout(
            Promise.all([api.get("/a"), api.get("/b"), api.get("/c")])
        );

        expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
        expect(refreshSession).toHaveBeenCalledTimes(1);
        for (const path of ["/a", "/b", "/c"]) expect(seen[path]).toBe(2);
    });

    it("rejects (never hangs) when the refresh yields no session", async () => {
        refreshSession.mockResolvedValue(session(null));
        mock.onGet("/protected").reply(401, { detail: "expired" });

        await expect(withTimeout(api.get("/protected"))).rejects.toMatchObject({
            response: { status: 401 },
        });
        expect(refreshSession).toHaveBeenCalledTimes(1);
    });

    it("rejects (never hangs) when the refresh call itself throws", async () => {
        refreshSession.mockRejectedValue(new Error("network down"));
        mock.onGet("/protected").reply(401, {});

        await expect(withTimeout(api.get("/protected"))).rejects.toBeDefined();
    });

    it("retries a 401 only once, then surfaces the error", async () => {
        refreshSession.mockResolvedValue(session("new-token"));
        mock.onGet("/protected").reply(401, {});

        await expect(withTimeout(api.get("/protected"))).rejects.toMatchObject({
            response: { status: 401 },
        });
        expect(mock.history.get.length).toBe(2);
    });

    it("allows a later 401 to refresh again after an earlier cycle finished", async () => {
        refreshSession.mockResolvedValue(session("new-token"));

        let first = 0;
        mock.onGet("/one").reply(() => (++first === 1 ? [401, {}] : [200, {}]));
        await withTimeout(api.get("/one"));

        let second = 0;
        mock.onGet("/two").reply(() => (++second === 1 ? [401, {}] : [200, {}]));
        await withTimeout(api.get("/two"));

        expect(refreshSession).toHaveBeenCalledTimes(2);
    });

    it("passes non-401 errors straight through", async () => {
        mock.onGet("/boom").reply(500, { detail: "server" });

        await expect(withTimeout(api.get("/boom"))).rejects.toMatchObject({
            response: { status: 500 },
        });
        expect(refreshSession).not.toHaveBeenCalled();
    });
});
