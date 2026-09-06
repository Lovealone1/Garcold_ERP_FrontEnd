/* eslint-disable no-restricted-globals */
/**
 * Service worker de Tienda Garcold.
 *
 * Reglas de oro (esto es un POS con datos por usuario):
 *   - NUNCA se cachea /api/* ni /auth/* ni nada que no sea GET.
 *   - NUNCA se cachea el HTML de navegación. El shell de (app) depende del
 *     usuario autenticado y guardarlo arriesga servirle a una persona la
 *     pantalla de otra en un dispositivo compartido.
 *   - Sí se cachean los estáticos versionados de Next, los iconos y las
 *     fuentes, que es de donde sale la ganancia real de arranque.
 *
 * Offline sirve /offline como pantalla de cortesía; no hay modo de venta
 * offline y no se finge que lo haya.
 */

const VERSION = "v1";
const STATIC_CACHE = `garcold-static-${VERSION}`;
const FONT_CACHE = `garcold-fonts-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, FONT_CACHE];

const OFFLINE_URL = "/offline";

const PRECACHE = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

const FONT_ORIGINS = [
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // addAll aborta entero si un recurso falla; los pedimos sueltos para que
      // un 404 puntual no deje al SW sin instalar.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {})
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith("garcold-") && !CURRENT_CACHES.includes(n))
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

/** Permite al registrar forzar la activación de una versión en espera. */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf|otf)$/i.test(url.pathname)
  );
}

/** CacheFirst: para recursos versionados/inmutables. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response && response.ok && response.type !== "opaque") {
    cache.put(request, response.clone());
  }
  return response;
}

/** StaleWhileRevalidate: para las hojas de estilo de Google Fonts. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return hit || (await network) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Fuentes de Google: valen la pena y no llevan datos del usuario.
  if (FONT_ORIGINS.includes(url.origin)) {
    event.respondWith(
      url.origin === "https://fonts.gstatic.com"
        ? cacheFirst(request, FONT_CACHE)
        : staleWhileRevalidate(request, FONT_CACHE)
    );
    return;
  }

  // Todo lo demás de otro origen se deja pasar sin tocar.
  if (url.origin !== self.location.origin) return;

  // Datos y sesión: jamás por caché.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/_next/image")
  ) {
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      cacheFirst(request, STATIC_CACHE).catch(() => fetch(request))
    );
    return;
  }

  // Navegaciones: siempre red. Si no hay red, pantalla de offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(STATIC_CACHE);
          const offline = await cache.match(OFFLINE_URL);
          return (
            offline ||
            new Response("Sin conexión", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })()
    );
  }
});
