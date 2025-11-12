type Unsubscribe = () => void;

let ws: WebSocket | null = null;
const handlers = new Set<(m: any) => void>();

function ensure() {
  if (typeof window === "undefined") return;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  const url = process.env.NEXT_PUBLIC_RT_URL!;
  ws = new WebSocket(url);

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      handlers.forEach(h => h(msg));
    } catch {}
  };
  ws.onclose = () => { setTimeout(() => { ws = null; ensure(); }, 1200); };
  ws.onerror = () => { try { ws?.close(); } catch {} };
}

export function subscribeRealtime(handler: (m: any) => void): Unsubscribe {
  ensure();
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}