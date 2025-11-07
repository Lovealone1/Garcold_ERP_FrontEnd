"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import { MaterialIcon } from "@/components/ui/material-icon";
import { NotificationsProvider } from "@/components/providers/NotificationsProvider";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

function titleFromPath(path: string): string {
  const map: Record<string, string> = {
    "/": "Dashboard",
    "/dashboard": "Dashboard",
    "/comercial/ventas": "Ventas",
    "/comercial/ventas/facturas": "Facturas",
    "/bancos": "Bancos",
    "/transacciones": "Transacciones",
    "/proveedores": "Proveedores",
    "/clientes": "Clientes",
  };
  if (map[path]) return map[path];
  const seg = path.split("?")[0].split("#")[0].split("/").filter(Boolean).pop() || "";
  return seg.replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const mobileTitle = useMemo(() => titleFromPath(pathname || "/"), [pathname]);

  return (
    <NotificationsProvider>
      <div className="app-shell min-h-screen flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div
          className="app-shell__frame flex-1"
          style={{
            // @ts-ignore
            "--app-blur-mobile": isSidebarOpen ? "6px" : "0px",
            filter: "blur(calc(var(--app-blur, 0px) + var(--app-blur-mobile, 0px)))",
            transition: "filter 10ms ease",
          }}
        >
          {/* Topbar */}
          <header
            className="sticky top-0 z-30 border-b border-tg py-1 sm:py-1.5 mb-1 sm:mb-2 md:mb-1"
            style={{ background: "var(--tg-bg)" }}
          >
            <div className="h-11 px-2 sm:px-3 lg:pl-20 flex items-center gap-2 min-w-0">
              {/* Hamburguesa móvil */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md
             bg-[rgba(255,255,255,0.04)]
             border border-[rgba(255,255,255,0.18)]
             hover:bg-[rgba(255,255,255,0.08)]
             focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg-primary)]"
                aria-label="Abrir menú lateral"
              >
                <MaterialIcon
                  name="menu"
                  size={22}
                  className="text-[rgba(255,255,255,0.9)]"
                  fill={0}
                  weight={600}
                />
              </button>

              {/* Back móvil */}
              <button
                onClick={() => (history.length > 1 ? history.back() : null)}
                className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md
             bg-transparent
             hover:bg-[rgba(255,255,255,0.06)]
             focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg-primary)]"
                aria-label="Volver"
              >
                <MaterialIcon
                  name="arrow_back"
                  size={22}
                  className="text-[rgba(255,255,255,0.85)]"
                />
              </button>

              {/* Título móvil */}
              <h1 className="md:hidden text-lg font-extrabold text-tg-primary truncate">
                {mobileTitle}
              </h1>

              {/* Breadcrumbs desktop */}
              <div className="hidden md:flex items-center flex-1 min-w-0">
                <Breadcrumbs className="flex-1 min-w-0 truncate" />
              </div>
            </div>
          </header>

          {/* Contenido: mismo safe-inset que el header en lg */}
          <main className="app-shell__content px-2 sm:px-4 lg:px-6 lg:pl-20 py-2 sm:py-3">
            {children}
          </main>
        </div>
      </div>
    </NotificationsProvider>
  );
}
