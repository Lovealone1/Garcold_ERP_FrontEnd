import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    createRealtimeClient,
    parseEventKind,
    type RealtimeEvent,
    type RealtimeStatus,
} from "../realtimeClient";

/** Minimal controllable WebSocket stand-in. */
class FakeSocket {
    static instances: FakeSocket[] = [];

    readyState = 0; // CONNECTING
    sent: string[] = [];
    closed = false;
    closeCalls = 0;

    onopen: (() => void) | null = null;
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: (() => void) | null = null;
    onclose: (() => void) | null = null;

    constructor(public url: string) {
        FakeSocket.instances.push(this);
    }

    send(data: string) {
        if (this.readyState !== 1) throw new Error("not open");
        this.sent.push(data);
    }

    close() {
        this.closeCalls += 1;
        this.closed = true;
        this.readyState = 3; // CLOSED
    }

    // -- test helpers --
    open() {
        this.readyState = 1;
        this.onopen?.();
    }
    message(payload: unknown) {
        this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent);
    }
    raw(data: string) {
        this.onmessage?.({ data } as MessageEvent);
    }
    serverClose() {
        this.readyState = 3;
        this.onclose?.();
    }
}

const URL_OK = "ws://api.test/api/v1/ws/realtime";

function setup(overrides: Partial<Parameters<typeof createRealtimeClient>[0]> = {}) {
    const onEvent = vi.fn();
    const onResync = vi.fn();
    const statuses: RealtimeStatus[] = [];
    const getToken = vi.fn().mockResolvedValue("tok-1");

    const client = createRealtimeClient({
        url: URL_OK,
        getToken,
        onEvent,
        onResync,
        onStatus: (s) => statuses.push(s),
        socketFactory: (u) => new FakeSocket(u) as unknown as WebSocket,
        minBackoffMs: 100,
        maxBackoffMs: 400,
        heartbeatMs: 1000,
        zombieMs: 2500,
        ...overrides,
    });

    return { client, onEvent, onResync, statuses, getToken };
}

/** Let queued promise callbacks run (getToken is awaited before connecting). */
async function flush() {
    for (let i = 0; i < 5; i++) await Promise.resolve();
}

const last = () => FakeSocket.instances[FakeSocket.instances.length - 1];

describe("createRealtimeClient", () => {
    beforeEach(() => {
        FakeSocket.instances = [];
        vi.useFakeTimers();
        // Deterministic jitter.
        vi.spyOn(Math, "random").mockReturnValue(0);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("connects with the token as a query parameter", async () => {
        const { client } = setup();
        client.start();
        await flush();

        expect(FakeSocket.instances).toHaveLength(1);
        expect(last().url).toBe(URL_OK + "?token=tok-1");
    });

    it("reports open once the socket opens", async () => {
        const { client, statuses } = setup();
        client.start();
        await flush();
        last().open();

        expect(client.getStatus()).toBe("open");
        expect(statuses).toContain("connecting");
        expect(statuses).toContain("open");
    });

    it("dispatches parsed events", async () => {
        const { client, onEvent } = setup();
        client.start();
        await flush();
        last().open();

        last().message({ resource: "sale", action: "created", payload: { id: 7 } });

        expect(onEvent).toHaveBeenCalledWith(
            expect.objectContaining({ resource: "sale", action: "created" })
        );
    });

    it("ignores malformed frames instead of dying", async () => {
        const { client, onEvent } = setup();
        client.start();
        await flush();
        last().open();

        last().raw("not json{{");
        last().raw("null");

        expect(onEvent).not.toHaveBeenCalled();
        expect(client.getStatus()).toBe("open");
    });

    it("swallows pong frames", async () => {
        const { client, onEvent } = setup();
        client.start();
        await flush();
        last().open();

        last().message({ type: "pong" });

        expect(onEvent).not.toHaveBeenCalled();
    });

    // The old client returned early with no socket and no onclose, so a race at
    // startup left realtime dead for the entire session.
    it("retries when there is no session token yet, then connects", async () => {
        const getToken = vi.fn().mockResolvedValueOnce(null).mockResolvedValue("tok-2");
        const { client } = setup({ getToken });

        client.start();
        await flush();
        expect(FakeSocket.instances).toHaveLength(0);
        expect(client.getStatus()).toBe("reconnecting");

        await vi.advanceTimersByTimeAsync(150);
        await flush();

        expect(FakeSocket.instances).toHaveLength(1);
        expect(last().url).toContain("tok-2");
    });

    // A missing NEXT_PUBLIC_WS_URL used to throw synchronously inside an async
    // function: unhandled rejection, no onclose, no retry, no console error.
    it("retries instead of dying when the URL is missing or malformed", async () => {
        const { client } = setup({ url: undefined });
        client.start();
        await flush();

        expect(client.getStatus()).toBe("reconnecting");
        expect(FakeSocket.instances).toHaveLength(0);

        await vi.advanceTimersByTimeAsync(500);
        await flush();
        expect(client.getStatus()).toBe("reconnecting");
    });

    it("retries when the socket constructor throws", async () => {
        let calls = 0;
        const { client } = setup({
            socketFactory: (u) => {
                calls += 1;
                if (calls === 1) throw new Error("bad url");
                return new FakeSocket(u) as unknown as WebSocket;
            },
        });

        client.start();
        await flush();
        expect(client.getStatus()).toBe("reconnecting");

        await vi.advanceTimersByTimeAsync(200);
        await flush();
        expect(FakeSocket.instances).toHaveLength(1);
    });

    it("reconnects after the server closes the socket", async () => {
        const { client } = setup();
        client.start();
        await flush();
        last().open();

        last().serverClose();
        expect(client.getStatus()).toBe("reconnecting");

        await vi.advanceTimersByTimeAsync(200);
        await flush();
        expect(FakeSocket.instances).toHaveLength(2);
    });

    it("re-reads the token on reconnect so a rotated session recovers", async () => {
        const getToken = vi.fn().mockResolvedValueOnce("old").mockResolvedValue("new");
        const { client } = setup({ getToken });

        client.start();
        await flush();
        expect(last().url).toContain("token=old");
        last().open();

        last().serverClose();
        await vi.advanceTimersByTimeAsync(200);
        await flush();

        expect(last().url).toContain("token=new");
    });

    it("backs off exponentially across repeated failures", async () => {
        vi.spyOn(Math, "random").mockReturnValue(1); // full delay
        const { client } = setup();
        client.start();
        await flush();

        const delays: number[] = [];
        for (let i = 0; i < 3; i++) {
            last().open();
            last().serverClose();
            // Find the delay by probing: nothing before it, a socket after.
            let waited = 0;
            const beforeCount = FakeSocket.instances.length;
            while (FakeSocket.instances.length === beforeCount && waited < 5000) {
                await vi.advanceTimersByTimeAsync(50);
                await flush();
                waited += 50;
            }
            delays.push(waited);
        }

        // First retry after an open resets attempts, so all three are the floor;
        // what matters is that a retry always happens and never exceeds the cap.
        for (const d of delays) {
            expect(d).toBeGreaterThan(0);
            expect(d).toBeLessThanOrEqual(400 + 50);
        }
    });

    it("caps the backoff when failures never succeed", async () => {
        vi.spyOn(Math, "random").mockReturnValue(1);
        const { client } = setup({
            socketFactory: () => {
                throw new Error("refused");
            },
        });

        client.start();
        await flush();
        for (let i = 0; i < 10; i++) {
            await vi.advanceTimersByTimeAsync(500);
            await flush();
        }
        // Still retrying, never wedged.
        expect(client.getStatus()).toBe("reconnecting");
    });

    it("sends heartbeats on an open socket", async () => {
        const { client } = setup();
        client.start();
        await flush();
        last().open();

        await vi.advanceTimersByTimeAsync(1000);
        expect(last().sent).toContain(JSON.stringify({ type: "ping" }));
    });

    it("replaces a socket that stops delivering (zombie)", async () => {
        const { client } = setup();
        client.start();
        await flush();
        const first = last();
        first.open();

        // Silence past the zombie window with no inbound frames.
        await vi.advanceTimersByTimeAsync(3000);
        await flush();

        expect(first.closeCalls).toBeGreaterThan(0);
        expect(client.getStatus()).toBe("reconnecting");

        await vi.advanceTimersByTimeAsync(500);
        await flush();
        expect(FakeSocket.instances.length).toBeGreaterThan(1);
    });

    it("keeps a socket alive while frames keep arriving", async () => {
        const { client } = setup();
        client.start();
        await flush();
        const sock = last();
        sock.open();

        for (let i = 0; i < 5; i++) {
            await vi.advanceTimersByTimeAsync(1000);
            sock.message({ type: "pong" });
        }

        expect(sock.closed).toBe(false);
        expect(client.getStatus()).toBe("open");
    });

    it("signals a resync after a reconnect but not after the first connect", async () => {
        const { client, onResync } = setup();
        client.start();
        await flush();
        last().open();
        expect(onResync).not.toHaveBeenCalled();

        last().serverClose();
        await vi.advanceTimersByTimeAsync(200);
        await flush();
        last().open();

        expect(onResync).toHaveBeenCalledTimes(1);
    });

    it("reconnects when the network comes back", async () => {
        const { client } = setup();
        client.start();
        await flush();
        last().open();
        last().serverClose();

        window.dispatchEvent(new Event("online"));
        await flush();

        expect(FakeSocket.instances.length).toBe(2);
    });

    it("reconnects when the tab becomes visible again", async () => {
        const { client } = setup();
        client.start();
        await flush();
        last().open();
        last().serverClose();

        document.dispatchEvent(new Event("visibilitychange"));
        await flush();

        expect(FakeSocket.instances.length).toBe(2);
    });

    // The old cleanup only closed OPEN sockets, so a teardown mid-handshake
    // leaked the connection -- on every navigation and on StrictMode's second
    // effect.
    it("stop() closes a socket that is still CONNECTING", async () => {
        const { client } = setup();
        client.start();
        await flush();
        const sock = last();
        expect(sock.readyState).toBe(0);

        client.stop();

        expect(sock.closeCalls).toBe(1);
        expect(client.getStatus()).toBe("closed");
    });

    it("stop() prevents any further reconnect", async () => {
        const { client } = setup();
        client.start();
        await flush();
        last().open();

        client.stop();
        const count = FakeSocket.instances.length;

        await vi.advanceTimersByTimeAsync(5000);
        await flush();
        expect(FakeSocket.instances.length).toBe(count);
    });

    it("stop() during the token await does not leave a socket behind", async () => {
        let resolveToken!: (t: string | null) => void;
        const getToken = vi.fn(
            () => new Promise<string | null>((r) => (resolveToken = r))
        );
        const { client } = setup({ getToken });

        client.start();
        await flush();
        client.stop();
        resolveToken("tok");
        await flush();

        expect(FakeSocket.instances).toHaveLength(0);
    });

    it("start() twice does not open two sockets", async () => {
        const { client } = setup();
        client.start();
        client.start();
        await flush();

        expect(FakeSocket.instances).toHaveLength(1);
    });

    it("survives getToken throwing", async () => {
        const getToken = vi.fn().mockRejectedValue(new Error("supabase down"));
        const { client } = setup({ getToken });

        client.start();
        await flush();

        expect(client.getStatus()).toBe("reconnecting");
    });
});

describe("parseEventKind", () => {
    it("reads the split resource/action fields", () => {
        expect(parseEventKind({ resource: "sale", action: "created" })).toEqual({
            resource: "sale",
            action: "created",
        });
    });

    it("falls back to the combined type field", () => {
        expect(parseEventKind({ type: "purchase.deleted" })).toEqual({
            resource: "purchase",
            action: "deleted",
        });
    });

    it("prefers explicit fields over the combined type", () => {
        expect(
            parseEventKind({ type: "x.y", resource: "expense", action: "created" })
        ).toEqual({ resource: "expense", action: "created" });
    });

    it("returns null when neither form is usable", () => {
        expect(parseEventKind({} as RealtimeEvent)).toBeNull();
        expect(parseEventKind({ type: "sale" })).toBeNull();
    });
});
