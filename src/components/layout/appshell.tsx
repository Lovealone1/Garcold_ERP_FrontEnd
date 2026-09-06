"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import { MaterialIcon } from "@/components/ui/material-icon";
import { NotificationsProvider } from "@/components/providers/NotificationsProvider";
import { PeriodProvider } from "@/components/providers/PeriodProvider";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PeriodSelector from "@/components/ui/PeriodSelector";
import { routeHasPeriod } from "@/lib/period/period";

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

  // Only the screens that actually report on a period get the selector; on the
  // rest it would be a control that changes nothing.
  const showPeriod = routeHasPeriod(pathname);

  return (
    <PeriodProvider>
    <NotificationsProvider>
      {/*
        Altura acotada al viewport en lugar de `min-h`. Es lo que convierte la
        app en una pantalla de aplicación —header fijo, una única región que
        hace scroll— en vez de un documento largo. También es lo que hace que
        el `flex-1 min-h-0 overflow-auto` que las listas ya traían por dentro
        funcione de verdad: antes su padre crecía sin límite, así que ese
        scroll interno nunca se activaba y acababa desplazándose la página.
      */}
      <div className="app-shell flex h-dvh overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/*
          Este contenedor NO puede llevar `filter`.

          Cualquier valor de `filter` distinto de `none` — incluido
          `blur(0px)` — convierte al elemento en containing block de todos sus
          descendientes `position: fixed`. Con el blur que había aquí, los ~25
          overlays `fixed inset-0` de la app se posicionaban contra este frame
          (de alto igual al documento) en vez de contra el viewport: en una
          lista larga el modal se centraba fuera de pantalla y había que hacer
          scroll para encontrarlo. El desenfoque del sidebar ahora lo hace un
          overlay con `backdrop-filter` dentro de Sidebar, que consigue el
          mismo efecto sin tocar el flujo de posicionamiento.
        */}
        <div className="app-shell__frame flex-1 min-w-0 flex flex-col min-h-0">
          {/* Topbar */}
          <header
            className="shrink-0 z-30 border-b border-tg py-1 sm:py-1.5
                       pt-[env(safe-area-inset-top)]"
            style={{ background: "var(--tg-bg)" }}
          >
            {/* Solo propiedades físicas (pl/pr). Mezclarlas con las lógicas
                (ps/pe) es una trampa: ambas resuelven a padding-left y gana la
                que Tailwind emita más tarde, no la que se escriba después. */}
            <div
              className="h-11 flex items-center gap-2 min-w-0
                         pl-[max(0.5rem,env(safe-area-inset-left))]
                         pr-[max(0.5rem,env(safe-area-inset-right))]
                         sm:pl-[max(0.75rem,env(safe-area-inset-left))]
                         sm:pr-[max(0.75rem,env(safe-area-inset-right))]
                         lg:pl-20"
            >
              {/* Hamburguesa móvil */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-md
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
                className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-md
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
              <h1 className="md:hidden min-w-0 text-lg font-extrabold text-tg-primary truncate">
                {mobileTitle}
              </h1>

              {/* Breadcrumbs desktop */}
              <div className="hidden md:flex items-center flex-1 min-w-0">
                <Breadcrumbs className="flex-1 min-w-0 truncate" />
              </div>

              {/* Periodo: a la derecha del header, junto a las breadcrumbs.
                  `ml-auto` lo empuja al borde en móvil, donde no hay
                  breadcrumbs que ocupen el espacio intermedio. */}
              {showPeriod && <PeriodSelector className="ml-auto md:ml-0 shrink-0" />}
            </div>
          </header>

          {/* Única región con scroll de la app. `overscroll-contain` evita que
              al llegar al final arrastre el scroll del documento (el rebote
              que en móvil se siente como que la pantalla “se va”). */}
          <main className="app-shell__content flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {children}
          </main>
        </div>
      </div>
    </NotificationsProvider>
    </PeriodProvider>
  );
}
