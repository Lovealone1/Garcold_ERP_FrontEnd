/**
 * The app's single WebSocket client.
 *
 * It replaces two incompatible implementations that ran at the same time:
 * a global provider whose socket died silently in several cases, and a
 * per-screen client that connected without a token -- the API closed it with
 * 1008 and it retried forever, so five screens each kept a permanent failed
 * reconnect loop against an endpoint that would never accept them.
 *
 * Properties this one guarantees, each of which was a real failure before:
 *
 *  - A missing token or a malformed URL schedules a retry instead of leaving
 *    the connection permanently dead with no error path.
 *  - The token is read at every connect, so a rotated session reconnects with
 *    a fresh credential rather than looping on a rejected one.
 *  - Exponential backoff with jitter, so a server restart does not get a
 *    synchronised stampede.
 *  - Heartbeat with zombie detection: a socket that is open but no longer
 *    delivering is torn down and replaced.
 *  - Reconnects when the tab becomes visible or the network returns.
 *  - Signals a resync after any reconnect, because events published while the
 *    socket was down are gone for good.
 *  - close() also closes a CONNECTING socket, which is what leaked connections
 *    on every navigation and under StrictMode's double effect.
 */

export type RealtimeStatus = "idle" | "connecting" | "open" | "reconnecting" | "closed";

/** Envelope published by app/core/realtime.py. */
export type RealtimeEvent = {
    type?: string;
    resource?: string;
    action?: string;
    payload?: Record<string, unknown> | null;
    /** Roots the API reports as touched; widens the fan-out without a release. */
    affects?: string[];
    event_id?: string;
    occurred_at?: string;
};

export type RealtimeClientOptions = {
    /** Base WebSocket URL, without the token query parameter. */
    url: string | undefined;
    /** Resolves the current access token, or null when there is no session. */
    getToken: () => Promise<string | null>;
    onEvent: (event: RealtimeEvent) => void;
    onStatus?: (status: RealtimeStatus, detail?: string) => void;
    /** Called after a reconnect, never after the first connect. */
    onResync?: () => void;
    heartbeatMs?: number;
    /** Silence after which an open socket is treated as dead. */
    zombieMs?: number;
    minBackoffMs?: number;
    maxBackoffMs?: number;
    /** Injectable for tests. */
    socketFactory?: (url: string) => WebSocket;
};

export type RealtimeClient = {
    start: () => void;
    stop: () => void;
    getStatus: () => RealtimeStatus;
};

const DEFAULTS = {
    heartbeatMs: 25_000,
    zombieMs: 60_000,
    minBackoffMs: 1_000,
    maxBackoffMs: 30_000,
};

function isUsableUrl(url: string | undefined): url is string {
    if (!url) return false;
    return /^wss?:\/\/.+/i.test(url);
}

export function createRealtimeClient(options: RealtimeClientOptions): RealtimeClient {
    const {
        url,
        getToken,
        onEvent,
        onStatus,
        onResync,
        heartbeatMs = DEFAULTS.heartbeatMs,
        zombieMs = DEFAULTS.zombieMs,
        minBackoffMs = DEFAULTS.minBackoffMs,
        maxBackoffMs = DEFAULTS.maxBackoffMs,
        socketFactory = (u: string) => new WebSocket(u),
    } = options;

    let ws: WebSocket | null = null;
    let status: RealtimeStatus = "idle";
    let stopped = true;
    let attempts = 0;
    /** True once a connection has succeeded, so the next open is a *re*connect. */
    let hasConnected = false;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let lastInboundAt = 0;

    function setStatus(next: RealtimeStatus, detail?: string) {
        if (status === next) return;
        status = next;
        onStatus?.(next, detail);
    }

    function clearTimers() {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
        }
    }

    /** Exponential backoff with full jitter. */
    function nextDelay(): number {
        const exponential = Math.min(maxBackoffMs, minBackoffMs * 2 ** attempts);
        return Math.round(Math.random() * (exponential - minBackoffMs) + minBackoffMs);
    }

    function scheduleReconnect(reason: string) {
        if (stopped || reconnectTimer) return;
        const delay = nextDelay();
        attempts += 1;
        setStatus("reconnecting", reason + " (retry in " + delay + "ms)");
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            void connect();
        }, delay);
    }

    /** Detach handlers before closing so a teardown cannot trigger a reconnect. */
    function teardownSocket() {
        if (!ws) return;
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        // CONNECTING sockets must be closed too. Skipping them is what leaked a
        // connection on every navigation and on StrictMode's second effect.
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            try {
                ws.close();
            } catch {
                /* already gone */
            }
        }
        ws = null;
    }

    function startHeartbeat() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        lastInboundAt = Date.now();
        heartbeatTimer = setInterval(() => {
            if (!ws || ws.readyState !== WebSocket.OPEN) return;

            // An open socket that has gone quiet past the zombie window is a
            // half-dead connection (suspended tab, silently dropped NAT entry).
            // Nothing will ever arrive on it, so replace it.
            if (Date.now() - lastInboundAt > zombieMs) {
                teardownSocket();
                scheduleReconnect("heartbeat timeout");
                return;
            }
            try {
                ws.send(JSON.stringify({ type: "ping" }));
            } catch {
                teardownSocket();
                scheduleReconnect("ping failed");
            }
        }, heartbeatMs);
    }

    async function connect(): Promise<void> {
        if (stopped) return;
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        if (!isUsableUrl(url)) {
            // Previously this threw synchronously inside an async function, so
            // the rejection was unhandled, onclose never ran, and realtime was
            // dead for the rest of the session with nothing in the console.
            scheduleReconnect("realtime URL missing or malformed");
            return;
        }

        setStatus("connecting");

        let token: string | null = null;
        try {
            token = await getToken();
        } catch {
            token = null;
        }
        if (stopped) return;

        if (!token) {
            // The old provider returned here without wiring onclose, so a race
            // at startup (effect before session hydration) killed realtime for
            // the whole session.
            scheduleReconnect("no session token yet");
            return;
        }

        let socket: WebSocket;
        try {
            socket = socketFactory(url + "?token=" + encodeURIComponent(token));
        } catch (e) {
            scheduleReconnect("socket constructor failed: " + String(e));
            return;
        }
        ws = socket;

        socket.onopen = () => {
            if (stopped) {
                teardownSocket();
                return;
            }
            attempts = 0;
            setStatus("open");
            startHeartbeat();
            if (hasConnected) {
                // Events published while we were down are not replayed, so the
                // only safe assumption is that anything could be stale.
                onResync?.();
            }
            hasConnected = true;
        };

        socket.onmessage = (event: MessageEvent) => {
            lastInboundAt = Date.now();
            let parsed: RealtimeEvent;
            try {
                parsed = JSON.parse(String(event.data));
            } catch {
                return;
            }
            if (!parsed || typeof parsed !== "object") return;
            if (parsed.type === "pong") return;
            onEvent(parsed);
        };

        socket.onerror = () => {
            // onclose always follows; reconnecting is handled there.
        };

        socket.onclose = () => {
            if (heartbeatTimer) {
                clearInterval(heartbeatTimer);
                heartbeatTimer = null;
            }
            ws = null;
            if (stopped) {
                setStatus("closed");
                return;
            }
            scheduleReconnect("socket closed");
        };
    }

    function onOnline() {
        attempts = 0;
        if (!stopped && !ws) void connect();
    }

    function onVisibility() {
        if (typeof document === "undefined") return;
        if (document.visibilityState !== "visible") return;
        attempts = 0;
        if (!stopped && !ws) void connect();
    }

    return {
        start() {
            if (!stopped) return;
            stopped = false;
            attempts = 0;
            if (typeof window !== "undefined") {
                window.addEventListener("online", onOnline);
                document.addEventListener("visibilitychange", onVisibility);
            }
            void connect();
        },

        stop() {
            stopped = true;
            clearTimers();
            teardownSocket();
            if (typeof window !== "undefined") {
                window.removeEventListener("online", onOnline);
                document.removeEventListener("visibilitychange", onVisibility);
            }
            setStatus("closed");
        },

        getStatus: () => status,
    };
}

/**
 * Normalise an envelope into `resource` and `action`.
 *
 * The API sends both the split fields and a combined `type` ("sale.created").
 * Older payloads only carried `type`, so accept either.
 */
export function parseEventKind(
    event: RealtimeEvent
): { resource: string; action: string } | null {
    const [typeResource, typeAction] =
        typeof event.type === "string" ? event.type.split(".") : [undefined, undefined];

    const resource = event.resource || typeResource;
    const action = event.action || typeAction;
    if (!resource || !action) return null;
    return { resource, action };
}
