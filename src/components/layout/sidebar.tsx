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

interface SidebarProps { isOpen: boolean; onClose: () => void; }

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [animating, setAnimating] = useState(false);
  const TRANS_MS = 200;

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const sections: NavSection[] = useMemo(() => getNavSections(), []);
  const expanded = hovered || isOpen;

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const nextIsDark = saved ? saved === "dark" : true;
    setIsDark(nextIsDark);
    document.documentElement.classList.toggle("dark", nextIsDark);
  }, []);

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

  useEffect(() => {
    const enable = !isOpen && expanded && !animating;
    document.documentElement.style.setProperty("--app-blur", enable ? "6px" : "0px");
    return () => { document.documentElement.style.removeProperty("--app-blur"); };
  }, [isOpen, expanded, animating]);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú lateral"
          className="fixed inset-0 bg-black/50 backdrop-blur-[10px] z-40"
          onClick={onClose}
          onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") onClose(); }}
        />
      )}

      <aside
        data-role="app-sidebar"
        style={{ willChange: "width, transform", overflowX: "clip" }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-tg-sidebar text-tg-fg
                    border-r border-tg shadow-xl
                    transform-gpu overflow-hidden [contain:layout_paint]
                    transition-[width,transform] duration-200 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
                    ${expanded ? "w-72" : "w-16"}`}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
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
