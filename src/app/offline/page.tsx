import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin conexión · Tienda Garcold",
};

/**
 * Fallback que sirve el service worker cuando una navegación se queda sin red.
 * Es estático a propósito: tiene que renderizar sin datos, sin sesión y sin JS.
 */
export default function OfflinePage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[var(--tg-bg)] px-6 text-[var(--tg-fg)]">
      <div className="w-full max-w-sm text-center">
        <div
          aria-hidden
          className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-tg text-3xl"
        >
          ⚡
        </div>

        <h1 className="text-xl font-extrabold">Sin conexión</h1>

        <p className="mt-2 text-sm text-tg-muted">
          No pudimos alcanzar el servidor. Revisa tu red y vuelve a intentarlo;
          las ventas y los movimientos necesitan conexión para registrarse.
        </p>

        <a
          href="/inicio"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md
                     bg-[var(--tg-primary)] px-6 text-sm font-bold text-[var(--tg-primary-fg)]"
        >
          Reintentar
        </a>
      </div>
    </div>
  );
}
