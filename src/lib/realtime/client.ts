// lib/realtime/client.ts
let ws: WebSocket | null = null;
let open = false;
let reconnecting = false;
let backoff = 500; // ms, exponencial simple hasta 5s
const MAX_BACKOFF = 5000;

const channels = new Set<string>();                      // canales a los que estamos suscritos
const handlers: Record<string, Set<(msg: any) => void>> = {};

let heartbeatTimer: any = null;
const HEARTBEAT_MS = 25000;

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    try { ws?.readyState === WebSocket.OPEN && ws?.send(JSON.stringify({ type: "ping" })); } catch { }
  }, HEARTBEAT_MS);
}
function stopHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

function sendOrQueueSub(ch: string) {
  if (!channels.has(ch)) channels.add(ch);
  if (open && ws?.readyState === WebSocket.OPEN) {
    try { ws.send(JSON.stringify({ type: "subscribe", channel: ch })); } catch { }
  }
}

function resubscribeAll() {
  for (const ch of channels) sendOrQueueSub(ch);
}

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  const url = `${process.env.NEXT_PUBLIC_API_WS_URL}/api/v1/ws/realtime`;
  ws = new WebSocket(url);
  open = false;

  ws.onopen = () => {
    open = true;
    reconnecting = false;
    backoff = 500;
    startHeartbeat();
    resubscribeAll();
    if (process.env.NODE_ENV !== "production") console.log("[RT] OPEN", url);
  };

  ws.onmessage = (e) => {
    let data: any;
    try { data = JSON.parse(e.data); } catch { return; }
    if (data?.type === "pong") return;
    const ch = data?.channel || "global:transactions";   // default global
    const set = handlers[ch];
    if (set && set.size) {
      for (const h of Array.from(set)) {
        try { h(data); } catch { }
      }
    }
  };

  ws.onerror = (err) => {
    if (process.env.NODE_ENV !== "production") console.warn("[RT] ERROR", err);
  };

  ws.onclose = () => {
    open = false;
    stopHeartbeat();
    if (!hasAnyHandler()) {
      // no hay subs activas, no reconectes
      if (process.env.NODE_ENV !== "production") console.log("[RT] CLOSED (no handlers)");
      return;
    }
    if (!reconnecting) {
      reconnecting = true;
      const delay = backoff;
      backoff = Math.min(MAX_BACKOFF, backoff * 2);
      if (process.env.NODE_ENV !== "production") console.log(`[RT] RECONNECT in ${delay}ms`);
      setTimeout(connect, delay);
    }
  };
}

function hasAnyHandler() {
  return Object.values(handlers).some((s) => s && s.size > 0);
}

/**
 * Suscribe a un canal. Devuelve un unsubscribe.
 * Publica {type:"subscribe", channel} al abrir o reconectar.
 */
export function subscribeRealtime(channel: string, handler: (msg: any) => void, { log = false }: { log?: boolean } = {}) {
  if (!handlers[channel]) handlers[channel] = new Set();
  handlers[channel].add(handler);
  sendOrQueueSub(channel);
  connect();

  if (log && process.env.NODE_ENV !== "production") {
    console.log("[RT] SUB", channel);
  }

  return () => {
    try {
      handlers[channel]?.delete(handler);
      if (handlers[channel]?.size === 0) {
        delete handlers[channel];
        channels.delete(channel);
      }
      if (!hasAnyHandler()) {
        // no quedan subs → cierra socket
        stopHeartbeat();
        ws?.close();
        ws = null;
        if (process.env.NODE_ENV !== "production") console.log("[RT] WS CLOSED (idle)");
      }
    } catch { }
  };
}
