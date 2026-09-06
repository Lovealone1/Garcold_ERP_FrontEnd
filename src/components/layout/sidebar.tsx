"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getNavSections } from "@/lib/navigation";
import type { NavSection } from "@/types/navigation";

import SidebarHeader from "@/components/sidebar/Header";
import NavCollapsed from "@/components/sidebar/NavCollapsed";
import NavExpanded from "@/components/sidebar/NavExpanded";
import UserModule from "../sidebar/UserModule";
import UserTile from "@/components/sidebar/UserTile";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";

interface SidebarProps { isOpen: boolean; onClose: () => void; }

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [animating, setAnimating] = useState(false);
  const TRANS_MS = 200;

  /**
   * El despliegue por hover solo tiene sentido con un ratón.
   *
   * Antes esto colgaba de onPointerEnter/onPointerLeave sin filtrar el tipo de
   * puntero. En una pantalla táctil `pointerenter` se dispara al tocar y
   * `pointerleave` a menudo no llega nunca, así que el sidebar se quedaba
   * abierto y —peor— dejaba la app entera desenfocada de forma permanente.
   * En táctil el menú se abre solo con el botón de hamburguesa.
   */
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const sections: NavSection[] = useMemo(() => getNavSections(), []);
  const expanded = (canHover && hovered) || isOpen;

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const nextIsDark = saved ? saved === "dark" : true;
    setIsDark(nextIsDark);
    document.documentElement.classList.toggle("dark", nextIsDark);
  }, []);

  // Si el dispositivo deja de admitir hover (p. ej. se desconecta el ratón de
  // una 2-en-1), no dejes el estado colgado en abierto.
  useEffect(() => {
    if (!canHover) setHovered(false);
  }, [canHover]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { }
    document.documentElement.classList.toggle("dark", next);
  };

  useEffect(() => {
    setAnimating(true);
    const id = setTimeout(() => setAnimating(false), TRANS_MS);
    return () => clearTimeout(id);
  }, [expanded]);

  useEffect(() => {
    if (!animating) return;
    const htmlPrev = document.documentElement.style.overflowX;
    const bodyPrev = document.body.style.overflowX;
    document.documentElement.style.overflowX = "clip";
    document.body.style.overflowX = "clip";
    return () => {
      document.documentElement.style.overflowX = htmlPrev;
      document.body.style.overflowX = bodyPrev;
    };
  }, [animating]);

  // Desenfoque de fondo: `backdrop-filter` sobre un overlay propio.
  // Se hacía con `filter` sobre .app-shell__frame, lo que convertía al frame en
  // containing block de todo `position: fixed` y descolocaba cada modal.
  const showScrim = isOpen || (canHover && expanded && !animating);

  return (
    <>
      {showScrim && (
        isOpen ? (
          <button
            type="button"
            aria-label="Cerrar menú lateral"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[10px]"
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") onClose(); }}
          />
        ) : (
          <div
            aria-hidden
            className="fixed inset-0 z-40 pointer-events-none backdrop-blur-[6px]"
          />
        )
      )}

      <aside
        data-role="app-sidebar"
        style={{ willChange: "width, transform", overflowX: "clip" }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-tg-sidebar text-tg-fg
                    border-r border-tg shadow-xl
                    transform-gpu overflow-hidden [contain:layout_paint]
                    pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
                    ps-[env(safe-area-inset-left)]
                    transition-[width,transform] duration-200 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
                    ${expanded ? "w-72" : "w-16"}`}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") setHovered(true); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") setHovered(false); }}
      >
        <SidebarHeader expanded={expanded} basePath={basePath} />

        <div
          data-silent-scroll
          className={`flex-1 min-h-0 min-w-0
                      ${(!expanded || animating) ? "overflow-y-hidden pointer-events-none" : "overflow-y-auto"}
                      overflow-x-hidden overscroll-contain`}
          style={{ overflowY: animating ? ("clip" as const) : undefined }}
        >
          {!expanded ? (
            <NavCollapsed sections={sections} pathname={pathname} />
          ) : (
            <NavExpanded sections={sections} pathname={pathname} accentPct={10} activePct={16} />
          )}
        </div>

        <div className="pt-2 bg-tg-sidebar">
          <div className="px-2">
            <UserModule expanded={expanded} isDark={isDark} onToggle={toggleTheme} />
          </div>
          <div className="px-2 pb-4">
            <UserTile collapsed={!expanded} />
          </div>
        </div>
      </aside>

      {/* Normaliza filas e íconos sin tocar NavCollapsed/NavExpanded */}
      <style jsx global>{`
  [data-silent-scroll]{ scrollbar-width:none; -ms-overflow-style:none; }
  [data-silent-scroll]::-webkit-scrollbar{ width:0; height:0; display:none; }

  /* Fila de navegación: solo links/botones de nav, NO el toggle */
  [data-role="app-sidebar"] a,
  [data-role="app-sidebar"] button:not([data-theme-switch]) {
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  /* Icono principal de ítems de nav */
  [data-role="app-sidebar"] a > :first-child,
  [data-role="app-sidebar"] button:not([data-theme-switch]) > :first-child {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  [data-role="app-sidebar"] .material-icons { font-size: 22px; line-height: 1; }
  [data-role="app-sidebar"] svg { width: 22px; height: 22px; display: block; }
`}</style>
    </>
  );
}
