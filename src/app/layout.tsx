import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
    title: "Tienda Garcold",
    description: "Inicio de sesión",
    icons: {
        icon: "/garcold.png",        // favicon principal
        apple: "/garcold.png",       // icono iOS
        shortcut: "/garcold.png",    // atajo
    },
    // opcional:
    // themeColor: "#16a34a",
    // manifest: "/manifest.webmanifest",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className="dark" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                {/* Material Symbols */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-25..200&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-25..200&family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-25..200"
                    rel="stylesheet"
                />
            </head>
            <body className={inter.variable}>{children}</body>
        </html>
    );
}
