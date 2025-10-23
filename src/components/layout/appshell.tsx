"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { MaterialIcon } from "@/components/ui/material-icon";
import { NotificationsProvider } from "@/components/providers/NotificationsProvider";
import Breadcrumbs from "@/components/ui/breadcrumbs";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <NotificationsProvider>
      <div className="app-shell min-h-screen flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div
          className="app-shell__frame flex-1"
          // Blur = desktop (via --app-blur) + móvil cuando sidebar abierta
          style={{
            // variable móvil controlada aquí
            // @ts-ignore
            "--app-blur-mobile": isSidebarOpen ? "6px" : "0px",
            filter: "blur(calc(var(--app-blur, 0px) + var(--app-blur-mobile, 0px)))",
            transition: "filter 10ms ease",
          }}
        >
          <header className="app-shell__topbar">
            <div className="app-shell__topbar-left flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden"
                aria-label="Abrir menú lateral"
              >
                <MaterialIcon name="menu" size={28} className="text-muted" fill={0} weight={600} />
              </button>
              <Breadcrumbs className="hidden md:flex my-1" />
            </div>
          </header>

          <main className="app-shell__content">{children}</main>
        </div>
      </div>
    </NotificationsProvider>
  );
}
