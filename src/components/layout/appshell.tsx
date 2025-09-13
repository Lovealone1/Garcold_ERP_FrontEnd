// components/layout/appshell.tsx
"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { MaterialIcon } from "@/components/ui/material-icon";
import Breadcrumbs from "@/components/ui/breadcrumbs";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-shell min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Cuando la sidebar está abierta, se ve borroso el resto */}
      <div className={`app-shell__frame ${isSidebarOpen ? "blur-[2px]" : ""}`}>
        <header className="app-shell__topbar">
          <div className="app-shell__topbar-left">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden"
              aria-label="Abrir menú lateral"
            >
              <MaterialIcon name="menu" size={28} className="text-muted" fill={0} weight={600} />
            </button>

          </div>

          <div className="app-shell__topbar-right">{/* acciones futuras */}</div>
        </header>

        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}
