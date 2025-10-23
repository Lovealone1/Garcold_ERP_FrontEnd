"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { NavSection } from "@/types/navigation";
import { SettingsSections } from "./buildSettingsNav";
import { defaultSettingsRegistry } from "./registry.default";
import { MaterialIcon } from "@/components/ui/material-icon";

export function SettingsNav({
    sections,
    permissions = [],
    backFallback = "/",
}: {
    sections?: NavSection[];
    permissions?: string[];
    backFallback?: string; // a dónde ir si no hay historial local
}) {
    const pathname = usePathname();
    const router = useRouter();

    const computed: NavSection[] = useMemo(
        () => sections ?? SettingsSections(defaultSettingsRegistry, permissions),
        [sections, permissions]
    );

    const goBack = () => {
        const ss = typeof window !== "undefined" ? sessionStorage : null;
        const saved = ss?.getItem("tg:lastRoute"); // guardada por RouteMemory fuera de /settings
        if (saved) {
            router.push(saved);
            return;
        }

        // fallback: referrer del mismo origen, pero NO dentro de /settings
        if (typeof document !== "undefined" && document.referrer) {
            try {
                const r = new URL(document.referrer);
                if (r.origin === location.origin && !r.pathname.startsWith("/settings")) {
                    router.push(r.href);
                    return;
                }
            } catch { }
        }

        router.push(backFallback);
    };

    return (
        <aside className="w-72">
            {/* Botón volver */}
            <button
                type="button"
                onClick={goBack}
                className="mb-3 inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm
                   border border-tg hover:bg-[color-mix(in_srgb,var(--tg-muted)_10%,transparent)]"
            >
                <MaterialIcon name="arrow_back" set="rounded" className="text-base" />
                Volver
            </button>

            {computed.map((sec) => (
                <div key={sec.title} className="mb-3 rounded-xl border border-tg bg-tg-card text-tg-card">
                    {/* padding reducido */}
                    <div className="px-2.5 py-1.5 text-[11px] font-semibold text-tg-muted uppercase tracking-wide">
                        {sec.title}
                    </div>
                    <nav className="px-1.5 py-1">
                        {sec.items.map((it) => {
                            const active = pathname?.startsWith(it.href);
                            return (
                                <Link
                                    key={it.href}
                                    href={it.href}
                                    className={[
                                        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm",
                                        active
                                            ? "bg-[color-mix(in_srgb,var(--tg-primary)_18%,transparent)] text-tg-primary"
                                            : "hover:bg-[color-mix(in_srgb,var(--tg-muted)_10%,transparent)]",
                                    ].join(" ")}
                                >
                                    {it.iconName ? (
                                        <MaterialIcon name={it.iconName} set={it.iconSet ?? "rounded"} className="text-base" />
                                    ) : null}
                                    <span className="truncate">{it.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            ))}
        </aside>
    );
}
