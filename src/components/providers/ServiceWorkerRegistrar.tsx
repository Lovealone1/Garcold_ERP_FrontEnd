"use client";

import { useEffect, useState } from "react";

/**
 * Registra el service worker y avisa cuando el dispositivo pierde la red.
 *
 * El registro solo corre en producción: en `next dev` un SW activo sirve
 * chunks viejos y convierte cualquier depuración en una cacería de fantasmas.
 * Si quedó uno registrado de una sesión de desarrollo previa, se desregistra.
 */
export default function ServiceWorkerRegistrar() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      return;
    }

    let cancelled = false;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (cancelled) return;
        // Si ya hay una versión esperando, actívala: no cacheamos HTML, así
        // que el cambio no puede dejar la pantalla en un estado inconsistente.
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              installing.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    const sync = () => setOffline(!navigator.onLine);
    sync();

    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[100] flex items-center justify-center gap-2
                 bg-[#7a1010] px-4 py-2 text-sm font-semibold text-white
                 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full bg-white/90"
      />
      Sin conexión — los cambios no se están guardando
    </div>
  );
}
