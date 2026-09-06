import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import MuiProvider from "@/components/providers/MuiProvider";
import ServiceWorkerRegistrar from "@/components/providers/ServiceWorkerRegistrar";

export const metadata: Metadata = {
    title: "Tienda Garcold",
    description: "Punto de venta y gestión comercial de Tienda Garcold",
    applicationName: "Tienda Garcold",
    manifest: "/manifest.webmanifest",
    icons: {
        icon: [
            { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
            { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
            { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        ],
        apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
        shortcut: "/icons/favicon-32.png",
    },
    appleWebApp: {
        capable: true,
        title: "Garcold",
        statusBarStyle: "black-translucent",
    },
    formatDetection: { telephone: false },
    other: {
        // Next emite el nombre moderno `mobile-web-app-capable`, que iOS
        // entiende desde Safari 17. El alias con prefijo apple sigue haciendo
        // falta para que se abra en modo standalone en iPads y iPhones más
        // antiguos, que es parte del parque de un punto de venta.
        "apple-mobile-web-app-capable": "yes",
    },
};

export const viewport: Viewport = {
    themeColor: "#131313",
    width: "device-width",
    initialScale: 1,
    // `cover` es lo que habilita env(safe-area-inset-*): sin esto el header
    // sticky y la paginación quedan debajo del notch y de la barra de gestos.
    viewportFit: "cover",
    // Con el teclado abierto, redimensiona el layout en vez de desplazarlo.
    // Es la diferencia entre que el formulario se reacomode y que el usuario
    // pierda de vista el botón de guardar.
    interactiveWidget: "resizes-content",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

/**
 * Fija la clase de tema antes del primer paint.
 *
 * Antes, <html> salía siempre con `dark` y el sidebar corregía en un efecto:
 * quien tuviera el tema claro veía un fogonazo oscuro en cada carga.
 */
const THEME_INIT = `
try {
  var t = localStorage.getItem("theme");
  document.documentElement.classList.toggle("dark", t ? t === "dark" : true);
} catch (e) {}
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className="dark" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                {/* Material Symbols */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-25..200&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-25..200&family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-25..200"
                    rel="stylesheet"
                />
            </head>
            <body className={inter.variable}>
                <MuiProvider>{children}</MuiProvider>
                <ServiceWorkerRegistrar />
            </body>
        </html>
    );
}
